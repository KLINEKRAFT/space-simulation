import * as THREE from 'three'
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js'
import type { SolarBody } from '../data/solarCatalog'

const NASA_ROOT =
  'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/Images%20and%20Textures'
const EARTHVR_ROOT =
  'https://raw.githubusercontent.com/celestialphineas/EarthVR/master/res'

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

const EARTHVR_TEXTURES = {
  earthDiffuse: `${EARTHVR_ROOT}/earth/diffuse.jpg`,
  earthSpecular: `${EARTHVR_ROOT}/earth/spec.jpg`,
  earthBump: `${EARTHVR_ROOT}/earth/bump.jpg`,
  earthNight: `${EARTHVR_ROOT}/earth/night.png`,
  earthClouds: `${EARTHVR_ROOT}/earth/clouds.png`,
  moonDiffuse: `${EARTHVR_ROOT}/moon/diffuse.jpg`,
  moonBump: `${EARTHVR_ROOT}/moon/bump.jpg`,
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

function makeCanvas(width = 1024, height = 512): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context unavailable')
  return [canvas, context]
}

function configureColorTexture(texture: THREE.Texture, anisotropy: number): void {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = anisotropy
  texture.wrapS = THREE.RepeatWrapping
}

function configureDataTexture(texture: THREE.Texture, anisotropy: number): void {
  texture.anisotropy = anisotropy
  texture.wrapS = THREE.RepeatWrapping
}

function loadTexture(
  url: string,
  anisotropy: number,
  isColor: boolean,
  onLoad: (texture: THREE.Texture) => void,
): void {
  const loader = new THREE.TextureLoader()
  loader.setCrossOrigin('anonymous')
  loader.load(
    url,
    (texture) => {
      if (isColor) configureColorTexture(texture, anisotropy)
      else configureDataTexture(texture, anisotropy)
      onLoad(texture)
    },
    undefined,
    () => {
      // The deterministic procedural layer remains visible when a remote asset is unavailable.
    },
  )
}

function proceduralSurface(body: SolarBody): { color: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const [colorCanvas, context] = makeCanvas()
  const [bumpCanvas, bumpContext] = makeCanvas()
  const random = seededRandom(body.id)
  const base = new THREE.Color(body.color)
  const top = base.clone().offsetHSL(0.02, 0.03, 0.14)
  const bottom = base.clone().offsetHSL(-0.02, 0.02, -0.17)
  const gradient = context.createLinearGradient(0, 0, 0, colorCanvas.height)
  gradient.addColorStop(0, `#${top.getHexString()}`)
  gradient.addColorStop(0.5, `#${base.getHexString()}`)
  gradient.addColorStop(1, `#${bottom.getHexString()}`)
  context.fillStyle = gradient
  context.fillRect(0, 0, colorCanvas.width, colorCanvas.height)
  bumpContext.fillStyle = '#777'
  bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height)

  if (body.style === 'gas' || body.style === 'saturn' || body.style === 'ice' || body.style === 'venus') {
    const bands = body.style === 'ice' ? 24 : 58
    for (let band = 0; band < bands; band += 1) {
      const y = (band / bands) * colorCanvas.height
      const height = colorCanvas.height / bands + 5
      const lightness = (random() - 0.5) * (body.style === 'ice' ? 0.1 : 0.22)
      const bandColor = base.clone().offsetHSL((random() - 0.5) * 0.025, (random() - 0.5) * 0.07, lightness)
      context.globalAlpha = 0.38 + random() * 0.32
      context.fillStyle = `#${bandColor.getHexString()}`
      context.fillRect(0, y, colorCanvas.width, height)
      context.globalAlpha = 0.11
      context.fillStyle = '#ffffff'
      for (let x = -100; x < colorCanvas.width + 100; x += 86) {
        context.fillRect(x + Math.sin(band * 1.9) * 35, y + random() * height, 58 + random() * 130, 1 + random() * 2.5)
      }
    }
    if (body.id === 'jupiter') {
      context.globalAlpha = 0.82
      context.fillStyle = '#a64e34'
      context.beginPath()
      context.ellipse(700, 330, 70, 31, -0.13, 0, Math.PI * 2)
      context.fill()
      context.globalAlpha = 0.23
      context.strokeStyle = '#f4c9a6'
      context.lineWidth = 10
      context.stroke()
    }
  } else {
    const features = body.style === 'earth' ? 420 : 1650
    for (let index = 0; index < features; index += 1) {
      const x = random() * colorCanvas.width
      const y = random() * colorCanvas.height
      const radius = 1 + random() * (body.style === 'earth' ? 22 : 10)
      const featureColor = base.clone().offsetHSL((random() - 0.5) * 0.08, (random() - 0.5) * 0.18, (random() - 0.5) * 0.34)
      context.globalAlpha = body.style === 'earth' ? 0.18 : 0.2 + random() * 0.35
      context.fillStyle = `#${featureColor.getHexString()}`
      context.beginPath()
      context.ellipse(x, y, radius * (0.8 + random() * 2.1), radius, random() * Math.PI, 0, Math.PI * 2)
      context.fill()
      const shade = Math.round(70 + random() * 150)
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

export type PlanetSurfaceMaterial = THREE.MeshPhysicalMaterial | THREE.MeshPhongMaterial

export function createPlanetMaterial(body: SolarBody, anisotropy: number): PlanetSurfaceMaterial {
  const maps = proceduralSurface(body)
  maps.color.anisotropy = anisotropy
  maps.bump.anisotropy = anisotropy

  if (body.id === 'earth') {
    const material = new THREE.MeshPhongMaterial({
      map: maps.color,
      bumpMap: maps.bump,
      bumpScale: 0.052,
      color: 0xffffff,
      specular: new THREE.Color('#5e7892'),
      shininess: 24,
    })
    loadTexture(EARTHVR_TEXTURES.earthDiffuse, anisotropy, true, (texture) => {
      material.map?.dispose()
      material.map = texture
      material.needsUpdate = true
    })
    loadTexture(EARTHVR_TEXTURES.earthBump, anisotropy, false, (texture) => {
      material.bumpMap?.dispose()
      material.bumpMap = texture
      material.needsUpdate = true
    })
    loadTexture(EARTHVR_TEXTURES.earthSpecular, anisotropy, false, (texture) => {
      material.specularMap = texture
      material.needsUpdate = true
    })
    return material
  }

  const isGas = body.style === 'gas' || body.style === 'saturn' || body.style === 'ice' || body.style === 'venus'
  const material = new THREE.MeshPhysicalMaterial({
    map: maps.color,
    bumpMap: maps.bump,
    bumpScale: isGas ? 0.01 : body.kind === 'moon' ? 0.09 : 0.06,
    roughness: isGas ? 0.76 : body.style === 'ice' ? 0.68 : 0.92,
    metalness: 0,
    clearcoat: body.style === 'ice' ? 0.08 : 0,
    clearcoatRoughness: 0.82,
  })

  const nasaUrl = NASA_TEXTURES[body.id]
  if (nasaUrl) {
    loadTexture(nasaUrl, anisotropy, true, (texture) => {
      material.map?.dispose()
      material.map = texture
      material.needsUpdate = true
    })
  }
  if (body.id === 'moon') {
    loadTexture(EARTHVR_TEXTURES.moonDiffuse, anisotropy, true, (texture) => {
      material.map?.dispose()
      material.map = texture
      material.needsUpdate = true
    })
    loadTexture(EARTHVR_TEXTURES.moonBump, anisotropy, false, (texture) => {
      material.bumpMap?.dispose()
      material.bumpMap = texture
      material.needsUpdate = true
    })
  }
  return material
}

function createFallbackNightTexture(): THREE.CanvasTexture {
  const [canvas, context] = makeCanvas(1024, 512)
  const random = seededRandom('earth-night-lights')
  context.fillStyle = '#000000'
  context.fillRect(0, 0, canvas.width, canvas.height)
  for (let cluster = 0; cluster < 72; cluster += 1) {
    const cx = random() * canvas.width
    const cy = 80 + random() * (canvas.height - 160)
    for (let dot = 0; dot < 45; dot += 1) {
      const x = cx + (random() - 0.5) * 90
      const y = cy + (random() - 0.5) * 44
      const brightness = Math.round(130 + random() * 125)
      context.globalAlpha = 0.18 + random() * 0.72
      context.fillStyle = `rgb(${brightness},${Math.round(brightness * 0.72)},${Math.round(brightness * 0.35)})`
      context.fillRect(x, y, 0.6 + random() * 2.2, 0.6 + random() * 2.2)
    }
  }
  context.globalAlpha = 1
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

export function createEarthNightLayer(radius: number, anisotropy: number): THREE.Mesh {
  const fallback = createFallbackNightTexture()
  fallback.anisotropy = anisotropy
  const uniforms = {
    nightMap: { value: fallback as THREE.Texture },
    intensity: { value: 1.35 },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D nightMap;
      uniform float intensity;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 normalDirection = normalize(vWorldNormal);
        vec3 sunDirection = normalize(-vWorldPosition);
        float sunlight = dot(normalDirection, sunDirection);
        float nightMask = smoothstep(0.16, -0.22, sunlight);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float horizon = pow(1.0 - max(dot(normalDirection, viewDirection), 0.0), 2.0);
        vec3 city = texture2D(nightMap, vUv).rgb;
        float cityLuma = dot(city, vec3(0.2126, 0.7152, 0.0722));
        float alpha = nightMask * smoothstep(0.025, 0.18, cityLuma) * 0.92;
        gl_FragColor = vec4(city * intensity * (1.0 + horizon * 0.2), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const layer = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.0025, 96, 64), material)
  loadTexture(EARTHVR_TEXTURES.earthNight, anisotropy, true, (texture) => {
    uniforms.nightMap.value.dispose()
    uniforms.nightMap.value = texture
  })
  return layer
}

export function createAtmosphere(body: SolarBody, radius: number): THREE.Group | null {
  if (!body.atmosphereColor) return null
  const group = new THREE.Group()
  const isEarth = body.id === 'earth'
  const isThick = body.style === 'venus' || body.style === 'titan'
  const atmosphereColor = new THREE.Color(body.atmosphereColor)
  const sunsetColor = new THREE.Color(isEarth ? '#ff9b61' : isThick ? '#ffb45e' : body.atmosphereColor)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      atmosphereColor: { value: atmosphereColor },
      sunsetColor: { value: sunsetColor },
      strength: { value: isEarth ? 1.2 : isThick ? 0.86 : 0.62 },
      power: { value: isEarth ? 2.25 : 2.7 },
    },
    vertexShader: `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 atmosphereColor;
      uniform vec3 sunsetColor;
      uniform float strength;
      uniform float power;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 normalDirection = normalize(vWorldNormal);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        vec3 sunDirection = normalize(-vWorldPosition);
        float viewDot = abs(dot(normalDirection, viewDirection));
        float rim = pow(1.0 - clamp(viewDot, 0.0, 1.0), power);
        float sunDot = dot(normalDirection, sunDirection);
        float daylight = smoothstep(-0.42, 0.3, sunDot);
        float sunset = exp(-pow((sunDot + 0.07) * 5.5, 2.0)) * rim;
        vec3 color = mix(sunsetColor, atmosphereColor, daylight);
        color += sunsetColor * sunset * 0.7;
        float alpha = rim * strength * mix(0.26, 1.0, daylight) + sunset * 0.32;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  group.add(new THREE.Mesh(new THREE.SphereGeometry(radius * (isEarth ? 1.065 : 1.05), 96, 64), material))

  if (isEarth || isThick) {
    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.018, 96, 64),
      new THREE.MeshBasicMaterial({
        color: atmosphereColor,
        transparent: true,
        opacity: isEarth ? 0.035 : 0.075,
        side: THREE.FrontSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ))
  }
  return group
}

function createFallbackCloudTexture(): THREE.CanvasTexture {
  const [canvas, context] = makeCanvas(1024, 512)
  const random = seededRandom('earth-clouds')
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#ffffff'
  for (let index = 0; index < 850; index += 1) {
    const x = random() * canvas.width
    const y = random() * canvas.height
    const width = 8 + random() * 95
    const height = 2 + random() * 16
    context.globalAlpha = 0.035 + random() * 0.3
    context.beginPath()
    context.ellipse(x, y, width, height, (random() - 0.5) * 0.45, 0, Math.PI * 2)
    context.fill()
  }
  context.globalAlpha = 1
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

export function createCloudLayer(radius: number, anisotropy: number): THREE.Mesh {
  const fallback = createFallbackCloudTexture()
  fallback.anisotropy = anisotropy
  const material = new THREE.MeshPhongMaterial({
    map: fallback,
    color: 0xffffff,
    transparent: true,
    opacity: 0.74,
    alphaTest: 0.018,
    depthWrite: false,
    blending: THREE.NormalBlending,
  })
  loadTexture(EARTHVR_TEXTURES.earthClouds, anisotropy, true, (texture) => {
    material.map?.dispose()
    material.map = texture
    material.needsUpdate = true
  })
  return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.014, 96, 64), material)
}

export function createRing(body: SolarBody, radius: number): THREE.Mesh | null {
  if (!body.rings) return null
  const innerRadius = radius * body.rings.inner
  const outerRadius = radius * body.rings.outer
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 256, 8)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ringColor: { value: new THREE.Color(body.rings.color) },
      innerRadius: { value: innerRadius },
      outerRadius: { value: outerRadius },
      opacity: { value: body.rings.opacity },
    },
    vertexShader: `
      varying float vRadius;
      varying vec2 vUv;
      void main() {
        vRadius = length(position.xy);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 ringColor;
      uniform float innerRadius;
      uniform float outerRadius;
      uniform float opacity;
      varying float vRadius;
      varying vec2 vUv;
      void main() {
        float radial = clamp((vRadius - innerRadius) / max(outerRadius - innerRadius, 0.0001), 0.0, 1.0);
        float bands = 0.56 + 0.24 * sin(radial * 210.0) + 0.13 * sin(radial * 563.0 + 1.7);
        float gaps = smoothstep(0.08, 0.22, abs(sin(radial * 51.0 + 0.8)));
        float edge = smoothstep(0.0, 0.045, radial) * smoothstep(1.0, 0.94, radial);
        float alpha = clamp(bands * gaps, 0.0, 1.0) * opacity * edge;
        vec3 color = ringColor * (0.75 + radial * 0.28 + bands * 0.22);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const ring = new THREE.Mesh(geometry, material)
  ring.rotation.x = Math.PI / 2
  return ring
}

function radialTexture(inner: string, middle: string, outer = 'rgba(0,0,0,0)', size = 256): THREE.CanvasTexture {
  const [canvas, context] = makeCanvas(size, size)
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, inner)
  gradient.addColorStop(0.18, middle)
  gradient.addColorStop(1, outer)
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createSoftParticleTexture(): THREE.CanvasTexture {
  return radialTexture('rgba(255,255,255,1)', 'rgba(255,255,255,.45)')
}

export function createSunLensflare(): Lensflare {
  const core = radialTexture('rgba(255,255,255,1)', 'rgba(255,190,95,.72)')
  const halo = radialTexture('rgba(255,228,175,.55)', 'rgba(255,129,54,.13)')
  const blue = radialTexture('rgba(170,218,255,.38)', 'rgba(93,143,208,.07)')
  const flare = new Lensflare()
  flare.addElement(new LensflareElement(core, 360, 0, new THREE.Color(0xffe0aa)))
  flare.addElement(new LensflareElement(halo, 92, 0.32, new THREE.Color(0xffb76b)))
  flare.addElement(new LensflareElement(blue, 46, 0.56, new THREE.Color(0x9bc9ff)))
  flare.addElement(new LensflareElement(halo, 142, 0.83, new THREE.Color(0xff9f5c)))
  flare.addElement(new LensflareElement(blue, 30, 1, new THREE.Color(0xc6e0ff)))
  return flare
}

export function createSun(radius: number): { mesh: THREE.Mesh; uniforms: { time: { value: number } } } {
  const uniforms = {
    time: { value: 0 },
    colorA: { value: new THREE.Color('#ff8a2c') },
    colorB: { value: new THREE.Color('#fff2b2') },
    colorC: { value: new THREE.Color('#ffcb63') },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform vec3 colorC;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
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
      float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.56;
        for (int i = 0; i < 4; i++) {
          value += noise(p) * amplitude;
          p = p * 2.03 + vec3(0.17, 0.31, 0.23);
          amplitude *= 0.48;
        }
        return value;
      }
      void main() {
        vec3 p = normalize(vPosition) * 4.8;
        float primary = fbm(p + vec3(time * 0.055, time * 0.023, -time * 0.035));
        float filaments = fbm(p * 2.4 - vec3(time * 0.032, 0.0, time * 0.048));
        float granulation = smoothstep(0.35, 0.82, primary * 0.72 + filaments * 0.58);
        float viewDot = max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0);
        float limb = pow(viewDot, 0.28);
        vec3 color = mix(colorA, colorC, primary);
        color = mix(color, colorB, granulation * 0.82);
        color *= 0.82 + limb * 0.46;
        gl_FragColor = vec4(color * 1.45, 1.0);
      }
    `,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 128, 96), material)
  const glowTexture = radialTexture('rgba(255,255,230,.98)', 'rgba(255,143,45,.23)')
  const coronaTexture = radialTexture('rgba(255,225,170,.32)', 'rgba(255,92,25,.055)')
  const innerGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }))
  innerGlow.scale.setScalar(radius * 4.2)
  const corona = new THREE.Sprite(new THREE.SpriteMaterial({
    map: coronaTexture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }))
  corona.scale.setScalar(radius * 7.4)
  mesh.add(corona, innerGlow)
  return { mesh, uniforms }
}

export function createBlackHole(): { group: THREE.Group; uniforms: { time: { value: number } } } {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(new THREE.SphereGeometry(5.4, 128, 96), new THREE.MeshBasicMaterial({ color: 0x000000 })))
  const uniforms = {
    time: { value: 0 },
    innerColor: { value: new THREE.Color('#fff4d4') },
    outerColor: { value: new THREE.Color('#dd4c20') },
  }
  const diskMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float time; uniform vec3 innerColor; uniform vec3 outerColor; varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0; float r = length(p); float angle = atan(p.y, p.x);
        float spiral = sin(angle * 13.0 - time * 3.1 + r * 47.0) * 0.5 + 0.5;
        float turbulence = sin(angle * 27.0 + time * 1.55 - r * 88.0) * 0.5 + 0.5;
        float band = smoothstep(1.0, 0.25, r) * smoothstep(0.15, 0.31, r);
        vec3 color = mix(outerColor, innerColor, pow(1.0 - r, 2.4));
        float alpha = band * (0.32 + spiral * 0.54 + turbulence * 0.2);
        gl_FragColor = vec4(color * (1.3 + spiral), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })
  const disk = new THREE.Mesh(new THREE.PlaneGeometry(42, 42), diskMaterial)
  disk.rotation.x = Math.PI / 2.24
  group.add(disk)
  const photonRing = new THREE.Mesh(
    new THREE.TorusGeometry(6.35, 0.16, 28, 256),
    new THREE.MeshBasicMaterial({ color: 0xffe1a6, transparent: true, opacity: 0.96, toneMapped: false }),
  )
  photonRing.rotation.x = Math.PI / 2.24
  group.add(photonRing)
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(7.3, 96, 64),
    new THREE.MeshBasicMaterial({ color: 0xff9c55, transparent: true, opacity: 0.07, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }),
  ))
  return { group, uniforms }
}
