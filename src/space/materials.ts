import * as THREE from 'three'
import type { SolarBody } from '../data/solarCatalog'

const NASA_ROOT =
  'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/Images%20and%20Textures'

const NASA_TEXTURES: Record<string, string> = {
  earth: `${NASA_ROOT}/Earth%20(A)/Earth%20(A).jpg`,
  venus: `${NASA_ROOT}/Venus/Venus.jpg`,
  mars: `${NASA_ROOT}/Mars/Mars.jpg`,
  jupiter: `${NASA_ROOT}/Jupiter/Jupiter.jpg`,
  saturn: `${NASA_ROOT}/Saturn/Saturn.jpg`,
  uranus: `${NASA_ROOT}/Uranus/Uranus.jpg`,
  neptune: `${NASA_ROOT}/Neptune/Neptune.jpg`,
  pluto: `${NASA_ROOT}/Pluto/Pluto.jpg`,
  moon: `${NASA_ROOT}/Moon/Moon.jpg`,
  io: `${NASA_ROOT}/Jupiter%20-%20Io%20(A)/Jupiter%20-%20Io%20(A).jpg`,
  europa: `${NASA_ROOT}/Jupiter%20-%20Europa/Jupiter%20-%20Europa.jpg`,
  ganymede: `${NASA_ROOT}/Jupiter%20-%20Ganymede/Jupiter%20-%20Ganymede.jpg`,
  callisto: `${NASA_ROOT}/Jupiter%20-%20Callisto/Jupiter%20-%20Callisto.jpg`,
  phobos: `${NASA_ROOT}/Mars%20-%20Phobos/Mars%20-%20Phobos.jpg`,
  deimos: `${NASA_ROOT}/Mars%20-%20Deimos/Mars%20-%20Deimos.jpg`,
  enceladus: `${NASA_ROOT}/Saturn%20-%20Enceladus/Saturn%20-%20Enceladus.jpg`,
  dione: `${NASA_ROOT}/Saturn%20-%20Dione/Saturn%20-%20Dione.jpg`,
  iapetus: `${NASA_ROOT}/Saturn%20-%20Iapetus/Saturn%20-%20Iapetus.jpg`,
  mimas: `${NASA_ROOT}/Saturn%20-%20Mimas/Saturn%20-%20Mimas.jpg`,
  rhea: `${NASA_ROOT}/Saturn%20-%20Rhea/Saturn%20-%20Rhea.jpg`,
  tethys: `${NASA_ROOT}/Saturn%20-%20Tethys/Saturn%20-%20Tethys.jpg`,
  titan: `${NASA_ROOT}/Saturn%20-%20Titan/Saturn%20-%20Titan.jpg`,
  ariel: `${NASA_ROOT}/Uranus%20-%20Ariel/Uranus%20-%20Ariel.jpg`,
  miranda: `${NASA_ROOT}/Uranus%20-%20Miranda/Uranus%20-%20Miranda.jpg`,
  oberon: `${NASA_ROOT}/Uranus%20-%20Oberon/Uranus%20-%20Oberon.jpg`,
  titania: `${NASA_ROOT}/Uranus%20-%20Titania/Uranus%20-%20Titania.jpg`,
  umbriel: `${NASA_ROOT}/Uranus%20-%20Umbriel/Uranus%20-%20Umbriel.jpg`,
  triton: `${NASA_ROOT}/Neptune%20-%20Triton/Neptune%20-%20Triton.jpg`,
  charon: `${NASA_ROOT}/Pluto%20-%20Charon/Pluto%20-%20Charon.jpg`,
}

function seededRandom(seedText: string): () => number {
  let state = 2166136261
  for (let index = 0; index < seedText.length; index += 1) {
    state ^= seedText.charCodeAt(index)
    state = Math.imul(state, 16777619)
  }
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function makeCanvas(width = 768, height = 384): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context unavailable')
  return [canvas, context]
}

function proceduralSurface(body: SolarBody): { color: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const [colorCanvas, context] = makeCanvas()
  const [bumpCanvas, bumpContext] = makeCanvas()
  const random = seededRandom(body.id)
  const base = new THREE.Color(body.color)
  const top = base.clone().offsetHSL(0.02, 0.03, 0.14)
  const bottom = base.clone().offsetHSL(-0.02, 0.02, -0.16)
  const gradient = context.createLinearGradient(0, 0, 0, colorCanvas.height)
  gradient.addColorStop(0, `#${top.getHexString()}`)
  gradient.addColorStop(0.5, `#${base.getHexString()}`)
  gradient.addColorStop(1, `#${bottom.getHexString()}`)
  context.fillStyle = gradient
  context.fillRect(0, 0, colorCanvas.width, colorCanvas.height)
  bumpContext.fillStyle = '#777'
  bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height)

  if (body.style === 'gas' || body.style === 'saturn' || body.style === 'ice' || body.style === 'venus') {
    const bands = body.style === 'ice' ? 18 : 42
    for (let band = 0; band < bands; band += 1) {
      const y = (band / bands) * colorCanvas.height
      const height = colorCanvas.height / bands + 4
      const lightness = (random() - 0.5) * (body.style === 'ice' ? 0.12 : 0.26)
      const bandColor = base.clone().offsetHSL((random() - 0.5) * 0.025, (random() - 0.5) * 0.08, lightness)
      context.globalAlpha = 0.45 + random() * 0.28
      context.fillStyle = `#${bandColor.getHexString()}`
      context.fillRect(0, y, colorCanvas.width, height)
      context.globalAlpha = 0.1
      context.fillStyle = '#ffffff'
      for (let x = -80; x < colorCanvas.width + 80; x += 80) {
        context.fillRect(x + Math.sin(band * 1.9) * 34, y + random() * height, 52 + random() * 100, 1 + random() * 3)
      }
    }
    if (body.id === 'jupiter') {
      context.globalAlpha = 0.8
      context.fillStyle = '#a84f35'
      context.beginPath()
      context.ellipse(525, 245, 54, 24, -0.13, 0, Math.PI * 2)
      context.fill()
      context.globalAlpha = 0.25
      context.strokeStyle = '#f2c5a0'
      context.lineWidth = 8
      context.stroke()
    }
  } else {
    const features = body.style === 'earth' ? 240 : 1100
    for (let index = 0; index < features; index += 1) {
      const x = random() * colorCanvas.width
      const y = random() * colorCanvas.height
      const radius = 1 + random() * (body.style === 'earth' ? 19 : 8)
      const featureColor = base.clone().offsetHSL((random() - 0.5) * 0.08, (random() - 0.5) * 0.2, (random() - 0.5) * 0.34)
      context.globalAlpha = body.style === 'earth' ? 0.2 : 0.22 + random() * 0.34
      context.fillStyle = `#${featureColor.getHexString()}`
      context.beginPath()
      context.ellipse(x, y, radius * (0.8 + random() * 2), radius, random() * Math.PI, 0, Math.PI * 2)
      context.fill()
      const shade = Math.round(75 + random() * 145)
      bumpContext.globalAlpha = 0.18 + random() * 0.5
      bumpContext.fillStyle = `rgb(${shade},${shade},${shade})`
      bumpContext.beginPath()
      bumpContext.arc(x, y, radius, 0, Math.PI * 2)
      bumpContext.fill()
    }
  }

  context.globalAlpha = 1
  bumpContext.globalAlpha = 1
  const colorTexture = new THREE.CanvasTexture(colorCanvas)
  colorTexture.colorSpace = THREE.SRGBColorSpace
  colorTexture.wrapS = THREE.RepeatWrapping
  const bumpTexture = new THREE.CanvasTexture(bumpCanvas)
  bumpTexture.wrapS = THREE.RepeatWrapping
  return { color: colorTexture, bump: bumpTexture }
}

function loadNasaTexture(body: SolarBody, material: THREE.MeshPhysicalMaterial, anisotropy: number): void {
  const url = NASA_TEXTURES[body.id]
  if (!url) return
  const loader = new THREE.TextureLoader()
  loader.setCrossOrigin('anonymous')
  loader.load(url, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = anisotropy
    texture.wrapS = THREE.RepeatWrapping
    const fallback = material.map
    material.map = texture
    material.needsUpdate = true
    fallback?.dispose()
  }, undefined, () => {
    // The procedural texture remains active when an external NASA asset is unavailable.
  })
}

export function createPlanetMaterial(body: SolarBody, anisotropy: number): THREE.MeshPhysicalMaterial {
  const maps = proceduralSurface(body)
  maps.color.anisotropy = anisotropy
  maps.bump.anisotropy = anisotropy
  const isGas = body.style === 'gas' || body.style === 'saturn' || body.style === 'ice' || body.style === 'venus'
  const material = new THREE.MeshPhysicalMaterial({
    map: maps.color,
    bumpMap: maps.bump,
    bumpScale: isGas ? 0.015 : body.kind === 'moon' ? 0.085 : 0.055,
    roughness: isGas ? 0.72 : body.style === 'earth' ? 0.58 : 0.92,
    metalness: 0,
    clearcoat: body.style === 'earth' ? 0.18 : body.style === 'ice' ? 0.1 : 0,
    clearcoatRoughness: 0.72,
  })
  loadNasaTexture(body, material, anisotropy)
  return material
}

export function createAtmosphere(body: SolarBody, radius: number): THREE.Mesh | null {
  if (!body.atmosphereColor) return null
  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(body.atmosphereColor) },
      intensity: { value: body.id === 'earth' ? 0.82 : 0.58 },
      power: { value: body.id === 'earth' ? 3.8 : 2.6 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float intensity;
      uniform float power;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float rim = pow(1.0 - max(dot(vNormal, viewDirection), 0.0), power);
        gl_FragColor = vec4(glowColor, rim * intensity);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.055, 64, 48), atmosphereMaterial)
}

export function createCloudLayer(radius: number): THREE.Mesh {
  const [canvas, context] = makeCanvas(1024, 512)
  const random = seededRandom('earth-clouds')
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#ffffff'
  for (let index = 0; index < 550; index += 1) {
    const x = random() * canvas.width
    const y = random() * canvas.height
    const width = 8 + random() * 80
    const height = 2 + random() * 14
    context.globalAlpha = 0.06 + random() * 0.34
    context.beginPath()
    context.ellipse(x, y, width, height, (random() - 0.5) * 0.45, 0, Math.PI * 2)
    context.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  const material = new THREE.MeshPhysicalMaterial({
    map: texture,
    transparent: true,
    opacity: 0.52,
    alphaTest: 0.08,
    depthWrite: false,
    roughness: 1,
  })
  return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.018, 64, 48), material)
}

export function createRing(body: SolarBody, radius: number): THREE.Mesh | null {
  if (!body.rings) return null
  const geometry = new THREE.RingGeometry(radius * body.rings.inner, radius * body.rings.outer, 192, 6)
  const positions = geometry.attributes.position
  const colors = new Float32Array(positions.count * 3)
  const base = new THREE.Color(body.rings.color)
  const random = seededRandom(`${body.id}-rings`)
  for (let index = 0; index < positions.count; index += 1) {
    const shade = 0.72 + random() * 0.46
    colors[index * 3] = base.r * shade
    colors[index * 3 + 1] = base.g * shade
    colors[index * 3 + 2] = base.b * shade
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const material = new THREE.MeshPhysicalMaterial({
    color: body.rings.color,
    vertexColors: true,
    transparent: true,
    opacity: body.rings.opacity,
    roughness: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const ring = new THREE.Mesh(geometry, material)
  ring.rotation.x = Math.PI / 2
  return ring
}

export function createSun(radius: number): { mesh: THREE.Mesh; uniforms: { time: { value: number } } } {
  const uniforms = {
    time: { value: 0 },
    colorA: { value: new THREE.Color('#ffb33f') },
    colorB: { value: new THREE.Color('#fff4c6') },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 colorA;
      uniform vec3 colorB;
      varying vec3 vPosition;
      varying vec3 vNormal;
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
          f.z
        );
      }
      void main() {
        vec3 p = normalize(vPosition) * 7.0;
        float n = noise(p + vec3(time * 0.08, time * 0.035, 0.0));
        n += noise(p * 2.15 - vec3(time * 0.04, 0.0, time * 0.06)) * 0.48;
        float limb = pow(max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 0.18);
        vec3 color = mix(colorA, colorB, smoothstep(0.15, 1.15, n));
        color *= 1.0 + limb * 0.28;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  })
  return { mesh: new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), material), uniforms }
}

export function createBlackHole(): { group: THREE.Group; uniforms: { time: { value: number } } } {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(new THREE.SphereGeometry(5.4, 96, 64), new THREE.MeshBasicMaterial({ color: 0x000000 })))
  const uniforms = {
    time: { value: 0 },
    innerColor: { value: new THREE.Color('#fff2c7') },
    outerColor: { value: new THREE.Color('#e35b2e') },
  }
  const diskMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float time; uniform vec3 innerColor; uniform vec3 outerColor; varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0; float r = length(p); float angle = atan(p.y, p.x);
        float spiral = sin(angle * 11.0 - time * 3.4 + r * 44.0) * 0.5 + 0.5;
        float turbulence = sin(angle * 23.0 + time * 1.7 - r * 81.0) * 0.5 + 0.5;
        float band = smoothstep(1.0, 0.28, r) * smoothstep(0.16, 0.33, r);
        vec3 color = mix(outerColor, innerColor, pow(1.0 - r, 2.2));
        float alpha = band * (0.38 + spiral * 0.5 + turbulence * 0.18);
        gl_FragColor = vec4(color * (1.2 + spiral), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })
  const disk = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), diskMaterial)
  disk.rotation.x = Math.PI / 2.24
  group.add(disk)
  const photonRing = new THREE.Mesh(
    new THREE.TorusGeometry(6.35, 0.18, 24, 192),
    new THREE.MeshBasicMaterial({ color: 0xffd89a, transparent: true, opacity: 0.92 }),
  )
  photonRing.rotation.x = Math.PI / 2.24
  group.add(photonRing)
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(7.2, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0xffa968, transparent: true, opacity: 0.075, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }),
  ))
  return { group, uniforms }
}
