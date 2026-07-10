import * as THREE from 'three'
import type { SolarBody } from '../data/solarCatalog'

const THREE_PLANET_ROOT = 'https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/textures/planets'
const NASA_ROOT =
  'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/Images%20and%20Textures'

const NASA_TEXTURES: Record<string, string> = {
  venus: `${NASA_ROOT}/Venus/Venus.jpg`,
  mars: `${NASA_ROOT}/Mars/Mars.jpg`,
  jupiter: `${NASA_ROOT}/Jupiter/Jupiter.jpg`,
  saturn: `${NASA_ROOT}/Saturn/Saturn.jpg`,
  uranus: `${NASA_ROOT}/Uranus/Uranus.jpg`,
  neptune: `${NASA_ROOT}/Neptune/Neptune.jpg`,
  pluto: `${NASA_ROOT}/Pluto/Pluto.jpg`,
  moon: `${THREE_PLANET_ROOT}/moon_1024.jpg`,
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

const EARTH_TEXTURES = {
  day: `${THREE_PLANET_ROOT}/earth_day_4096.jpg`,
  night: `${THREE_PLANET_ROOT}/earth_night_4096.jpg`,
  packed: `${THREE_PLANET_ROOT}/earth_bump_roughness_clouds_4096.jpg`,
}

export function seededRandom(seedText: string): () => number {
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

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context unavailable')
  return [canvas, context]
}

/**
 * Fast fBM-style noise: random low-resolution grids bilinearly upscaled by the
 * canvas rasterizer and stacked with halving amplitude. Orders of magnitude
 * faster than per-pixel JS noise and looks smooth at planet-texture scales.
 */
function fbmCanvas(
  width: number,
  height: number,
  random: () => number,
  octaves = 5,
  baseCellsX = 6,
  baseCellsY = 4,
): HTMLCanvasElement {
  const [canvas, context] = makeCanvas(width, height)
  context.fillStyle = '#808080'
  context.fillRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  let amplitude = 0.5
  for (let octave = 0; octave < octaves; octave += 1) {
    const cellsX = Math.min(width, baseCellsX * 2 ** octave)
    const cellsY = Math.min(height, baseCellsY * 2 ** octave)
    const [small, smallContext] = makeCanvas(cellsX, cellsY)
    const image = smallContext.createImageData(cellsX, cellsY)
    for (let cellY = 0; cellY < cellsY; cellY += 1) {
      for (let cellX = 0; cellX < cellsX; cellX += 1) {
        // Copy the first column into the last so horizontal wrap seams stay soft.
        const sourceX = cellX === cellsX - 1 ? 0 : cellX
        const index = (cellY * cellsX + cellX) * 4
        let shade: number
        if (sourceX !== cellX) {
          const sourceIndex = (cellY * cellsX + sourceX) * 4
          shade = image.data[sourceIndex]
        } else {
          shade = Math.floor(random() * 256)
        }
        image.data[index] = shade
        image.data[index + 1] = shade
        image.data[index + 2] = shade
        image.data[index + 3] = Math.floor(amplitude * 255)
      }
    }
    smallContext.putImageData(image, 0, 0)
    context.drawImage(small, 0, 0, width, height)
    amplitude *= 0.55
  }
  return canvas
}

function fbmColumn(fbm: HTMLCanvasElement, x: number): Float32Array {
  const context = fbm.getContext('2d')!
  const data = context.getImageData(x, 0, 1, fbm.height).data
  const column = new Float32Array(fbm.height)
  for (let y = 0; y < fbm.height; y += 1) column[y] = data[y * 4] / 255
  return column
}

/** Blends the left and right edges together so equirectangular wraps cleanly. */
function blendSeam(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, blend = 24): void {
  const { width, height } = canvas
  const strip = context.getImageData(0, 0, blend, height)
  const [overlay, overlayContext] = makeCanvas(blend, height)
  overlayContext.putImageData(strip, 0, 0)
  for (let step = 0; step < blend; step += 1) {
    context.globalAlpha = (1 - step / blend) * 0.9
    context.drawImage(overlay, step, 0, 1, height, width - blend + step, 0, 1, height)
  }
  context.globalAlpha = 1
}

interface SurfaceRecipe {
  color: THREE.CanvasTexture
  bump: THREE.CanvasTexture
}

function surfaceSize(body: SolarBody): [number, number] {
  if (body.kind === 'planet') return [1024, 512]
  if (body.kind === 'dwarf' || body.kind === 'candidate') return [512, 256]
  return body.radiusKm > 500 ? [512, 256] : [256, 128]
}

function paintCraters(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  random: () => number,
  count: number,
  tint: THREE.Color,
): void {
  for (let index = 0; index < count; index += 1) {
    const x = random() * width
    const y = height * (0.08 + random() * 0.84)
    const radius = 1.5 + Math.pow(random(), 2.6) * (width / 34)
    const floor = tint.clone().offsetHSL(0, -0.02, -0.1 - random() * 0.14)
    const rim = tint.clone().offsetHSL(0, -0.01, 0.1 + random() * 0.12)
    context.globalAlpha = 0.28 + random() * 0.3
    const gradient = context.createRadialGradient(x, y, radius * 0.1, x, y, radius)
    gradient.addColorStop(0, `#${floor.getHexString()}`)
    gradient.addColorStop(0.72, `#${floor.getHexString()}`)
    gradient.addColorStop(0.86, `#${rim.getHexString()}`)
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    context.fillStyle = gradient
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
    // Sun-side rim highlight for relief.
    context.globalAlpha = 0.16 + random() * 0.18
    context.strokeStyle = `#${rim.getHexString()}`
    context.lineWidth = Math.max(1, radius * 0.14)
    context.beginPath()
    context.arc(x, y, radius * 0.82, Math.PI * 0.85, Math.PI * 1.65)
    context.stroke()
  }
  context.globalAlpha = 1
}

function paintBandedGiant(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  body: SolarBody,
  random: () => number,
): void {
  const base = new THREE.Color(body.color)
  const softness = body.style === 'ice' ? 0.05 : body.style === 'saturn' ? 0.1 : 0.2
  const bandNoise = fbmColumn(fbmCanvas(4, height, random, 4, 1, 6), 0)
  // Horizontal latitude bands whose lightness follows 1D noise.
  for (let y = 0; y < height; y += 1) {
    const drift = bandNoise[y] - 0.5
    const pole = Math.abs(y / height - 0.5) * 2
    const band = base
      .clone()
      .offsetHSL(drift * 0.035, drift * 0.05, drift * softness - pole * pole * 0.075)
    context.fillStyle = `#${band.getHexString()}`
    context.fillRect(0, y, width, 1)
  }
  // Domain-warp rows sideways with a second noise channel for flow.
  const warpNoise = fbmColumn(fbmCanvas(8, height, random, 4, 2, 8), 2)
  const snapshot = document.createElement('canvas')
  snapshot.width = width
  snapshot.height = height
  snapshot.getContext('2d')!.drawImage(context.canvas, 0, 0)
  const warpAmp = body.style === 'ice' ? width * 0.015 : width * 0.05
  for (let y = 0; y < height; y += 1) {
    const shift = Math.round((warpNoise[y] - 0.5) * warpAmp * (1 + Math.sin(y * 0.05) * 0.4))
    context.drawImage(snapshot, 0, y, width, 1, shift, y, width, 1)
    if (shift > 0) context.drawImage(snapshot, width - shift, y, shift, 1, 0, y, shift, 1)
    else if (shift < 0) context.drawImage(snapshot, 0, y, -shift, 1, width + shift, y, -shift, 1)
  }
  // Fine turbulence overlay.
  const turbulence = fbmCanvas(width / 2, height / 2, random, 5, 12, 5)
  context.globalAlpha = body.style === 'ice' ? 0.08 : 0.16
  context.globalCompositeOperation = 'overlay'
  context.drawImage(turbulence, 0, 0, width, height)
  context.globalCompositeOperation = 'source-over'
  context.globalAlpha = 1
  // Storm ovals.
  const storms = body.style === 'ice' ? 2 : 7
  for (let index = 0; index < storms; index += 1) {
    const x = random() * width
    const y = height * (0.22 + random() * 0.56)
    const stormWidth = width * (0.012 + random() * 0.03)
    const storm = base.clone().offsetHSL((random() - 0.5) * 0.04, 0.05, random() > 0.5 ? 0.12 : -0.1)
    context.globalAlpha = 0.35 + random() * 0.3
    context.fillStyle = `#${storm.getHexString()}`
    context.beginPath()
    context.ellipse(x, y, stormWidth, stormWidth * (0.4 + random() * 0.2), 0, 0, Math.PI * 2)
    context.fill()
  }
  if (body.id === 'jupiter') {
    const grsX = width * 0.31
    const grsY = height * 0.62
    const gradient = context.createRadialGradient(grsX, grsY, 2, grsX, grsY, width * 0.045)
    gradient.addColorStop(0, '#c95f38')
    gradient.addColorStop(0.55, '#b34f31')
    gradient.addColorStop(0.8, '#c9805c')
    gradient.addColorStop(1, 'rgba(201,128,92,0)')
    context.globalAlpha = 0.92
    context.fillStyle = gradient
    context.beginPath()
    context.ellipse(grsX, grsY, width * 0.045, width * 0.022, -0.1, 0, Math.PI * 2)
    context.fill()
  }
  context.globalAlpha = 1
}

function paintIceCracks(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  random: () => number,
  tint: THREE.Color,
): void {
  const lineColor = tint.clone().offsetHSL(-0.02, 0.22, -0.18)
  for (let index = 0; index < 42; index += 1) {
    context.globalAlpha = 0.1 + random() * 0.22
    context.strokeStyle = `#${lineColor.getHexString()}`
    context.lineWidth = 0.6 + random() * 1.3
    context.beginPath()
    let x = random() * width
    let y = random() * height
    context.moveTo(x, y)
    const drift = (random() - 0.5) * 10
    for (let segment = 0; segment < 9; segment += 1) {
      x += width * (0.03 + random() * 0.06)
      y += drift + (random() - 0.5) * 16
      context.lineTo(x, y)
    }
    context.stroke()
  }
  context.globalAlpha = 1
}

function proceduralSurface(body: SolarBody): SurfaceRecipe {
  const [width, height] = surfaceSize(body)
  const [colorCanvas, context] = makeCanvas(width, height)
  const random = seededRandom(body.id)
  const base = new THREE.Color(body.color)

  const gradient = context.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, `#${base.clone().offsetHSL(0.01, 0.02, 0.1).getHexString()}`)
  gradient.addColorStop(0.5, `#${base.getHexString()}`)
  gradient.addColorStop(1, `#${base.clone().offsetHSL(-0.01, 0.02, -0.12).getHexString()}`)
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)

  const isBanded = body.style === 'gas' || body.style === 'saturn' || body.style === 'ice' || body.style === 'venus'
  if (isBanded) {
    paintBandedGiant(context, width, height, body, random)
  } else {
    // Large-scale albedo mottling.
    const mottle = fbmCanvas(width, height, random, 5, 5, 3)
    context.globalAlpha = 0.5
    context.globalCompositeOperation = 'multiply'
    context.drawImage(mottle, 0, 0)
    context.globalCompositeOperation = 'screen'
    context.globalAlpha = 0.16
    context.drawImage(mottle, -width * 0.3, 0, width * 1.6, height)
    context.globalCompositeOperation = 'source-over'
    context.globalAlpha = 1

    if (body.style === 'earth') {
      // Placeholder continents while the 4K NASA map streams in.
      const landData = fbmCanvas(width, height, random, 6, 7, 4)
        .getContext('2d')!
        .getImageData(0, 0, width, height).data
      const image = context.getImageData(0, 0, width, height)
      const ocean = new THREE.Color('#0d2f52')
      const shore = new THREE.Color('#1f4d38')
      const inland = new THREE.Color('#3d5c33')
      for (let index = 0; index < width * height; index += 1) {
        const sample = landData[index * 4] / 255
        const target = sample < 0.52 ? ocean : sample < 0.56 ? shore : inland
        image.data[index * 4] = target.r * 255
        image.data[index * 4 + 1] = target.g * 255
        image.data[index * 4 + 2] = target.b * 255
      }
      context.putImageData(image, 0, 0)
    } else if (body.style === 'mars') {
      paintCraters(context, width, height, random, 240, base)
      // Polar caps.
      for (const pole of [0, 1]) {
        const capHeight = height * (0.05 + random() * 0.02)
        const capGradient = context.createLinearGradient(0, pole === 0 ? 0 : height, 0, pole === 0 ? capHeight * 1.8 : height - capHeight * 1.8)
        capGradient.addColorStop(0, 'rgba(245, 240, 232, 0.95)')
        capGradient.addColorStop(1, 'rgba(245, 240, 232, 0)')
        context.fillStyle = capGradient
        context.fillRect(0, pole === 0 ? 0 : height - capHeight * 1.8, width, capHeight * 1.8)
      }
    } else if (body.style === 'io') {
      // Volcanic patches over sulfur plains.
      for (let index = 0; index < 60; index += 1) {
        const x = random() * width
        const y = random() * height
        const radius = 2 + random() * 12
        const volcanic = random() > 0.5
        context.globalAlpha = 0.3 + random() * 0.35
        context.fillStyle = volcanic ? '#3d2318' : '#f5f0dc'
        context.beginPath()
        context.arc(x, y, radius, 0, Math.PI * 2)
        context.fill()
        if (volcanic) {
          context.globalAlpha = 0.5
          context.fillStyle = '#c1441f'
          context.beginPath()
          context.arc(x, y, radius * 0.35, 0, Math.PI * 2)
          context.fill()
        }
      }
      context.globalAlpha = 1
    } else if (body.style === 'triton') {
      paintIceCracks(context, width, height, random, base)
      paintCraters(context, width, height, random, 40, base)
    } else if (body.id === 'europa' || body.id === 'enceladus') {
      paintIceCracks(context, width, height, random, base)
    } else {
      paintCraters(context, width, height, random, body.kind === 'moon' ? 190 : 130, base)
    }
  }
  blendSeam(colorCanvas, context)

  // Height map: reuse fBM so relief matches albedo scale.
  const bumpCanvas = fbmCanvas(width / 2, height / 2, seededRandom(`${body.id}-relief`), isBanded ? 3 : 6, 6, 3)

  const colorTexture = new THREE.CanvasTexture(colorCanvas)
  colorTexture.colorSpace = THREE.SRGBColorSpace
  colorTexture.wrapS = THREE.RepeatWrapping
  const bumpTexture = new THREE.CanvasTexture(bumpCanvas)
  bumpTexture.wrapS = THREE.RepeatWrapping
  return { color: colorTexture, bump: bumpTexture }
}

const textureLoader = new THREE.TextureLoader()
textureLoader.setCrossOrigin('anonymous')

function loadColorTexture(
  url: string,
  anisotropy: number,
  onReady: (texture: THREE.Texture) => void,
  linear = false,
): void {
  textureLoader.load(url, (texture) => {
    texture.colorSpace = linear ? THREE.NoColorSpace : THREE.SRGBColorSpace
    texture.anisotropy = anisotropy
    texture.wrapS = THREE.RepeatWrapping
    onReady(texture)
  }, undefined, () => {
    // Procedural surfaces remain active when a remote texture is unavailable.
  })
}

export interface SurfaceHandle {
  material: THREE.Material
  /** Present on shader-driven surfaces that track the sun each frame. */
  sunDirection?: THREE.Vector3
  tick?: (deltaSeconds: number) => void
}

/* ------------------------------------------------------------------ */
/* Earth: day/night terminator blend, city lights, ocean glint,       */
/* drifting clouds with ground shadows — the EarthVR treatment.       */
/* ------------------------------------------------------------------ */

const EARTH_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 posW = modelMatrix * vec4(position, 1.0);
    vPosW = posW.xyz;
    gl_Position = projectionMatrix * viewMatrix * posW;
  }
`

const EARTH_FRAGMENT = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D surfaceMap; // r: height, g: roughness, b: clouds
  uniform vec3 sunDirection;
  uniform float cloudShift;
  uniform float nightBoost;
  uniform float texelWidth;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    vec3 l = normalize(sunDirection);
    float ndl = dot(n, l);
    float dayFactor = smoothstep(-0.14, 0.24, ndl);

    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb;
    vec3 surface = texture2D(surfaceMap, vUv).rgb;
    vec2 cloudUv = vec2(vUv.x - cloudShift, vUv.y);
    float clouds = texture2D(surfaceMap, cloudUv).b;
    float cloudShadow = texture2D(surfaceMap, cloudUv + vec2(0.004, 0.0016)).b;

    // Terrain relief from the height channel.
    float h0 = surface.r;
    float hx = texture2D(surfaceMap, vUv + vec2(texelWidth, 0.0)).r;
    float hy = texture2D(surfaceMap, vUv + vec2(0.0, texelWidth * 2.0)).r;
    vec3 tangent = normalize(cross(vec3(0.0, 1.0, 0.0), n));
    vec3 bitangent = normalize(cross(n, tangent));
    vec3 bumpN = normalize(n + (tangent * (h0 - hx) + bitangent * (h0 - hy)) * 5.0);

    float diffuse = clamp(dot(bumpN, l), 0.0, 1.0);

    // Ocean sun glint — smooth (low roughness) pixels reflect the sun.
    float gloss = 1.0 - surface.g;
    vec3 h = normalize(l + v);
    float spec = pow(clamp(dot(bumpN, h), 0.0, 1.0), 48.0) * gloss * (1.0 - clouds) * dayFactor;

    vec3 lit = day * (diffuse * 1.25 + 0.02);
    lit *= 1.0 - cloudShadow * 0.42 * (1.0 - clouds);
    lit = mix(lit, vec3(1.06) * (diffuse * 1.05 + 0.05), clouds * 0.96);
    lit += vec3(1.0, 0.9, 0.72) * spec * 0.85;

    vec3 cityLights = night * nightBoost * (1.0 - clouds * 0.9);
    vec3 nightSide = cityLights + day * 0.012;

    vec3 color = mix(nightSide, lit, dayFactor);

    // Warm scattering band along the terminator.
    float twilight = (1.0 - smoothstep(0.0, 0.34, abs(ndl))) * (0.25 + dayFactor * 0.75);
    color += vec3(0.24, 0.07, 0.005) * twilight * 0.45;

    // Rayleigh-ish blue in-scatter at grazing view angles.
    float fresnel = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.6);
    color += vec3(0.17, 0.38, 0.9) * fresnel * (0.5 * dayFactor + 0.03);

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function proceduralEarthFallback(): THREE.CanvasTexture {
  const surface = proceduralSurface({
    id: 'earth', name: 'Earth', kind: 'planet', radiusKm: 6371, style: 'earth', color: '#2c5c8f',
  } as SolarBody)
  surface.bump.dispose()
  return surface.color
}

function createEarthSurface(anisotropy: number): SurfaceHandle {
  const black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1)
  black.needsUpdate = true
  const flatSurface = new THREE.DataTexture(new Uint8Array([128, 235, 0, 255]), 1, 1)
  flatSurface.needsUpdate = true

  const uniforms = {
    dayMap: { value: proceduralEarthFallback() as THREE.Texture },
    nightMap: { value: black as THREE.Texture },
    surfaceMap: { value: flatSurface as THREE.Texture },
    sunDirection: { value: new THREE.Vector3(1, 0, 0) },
    cloudShift: { value: 0 },
    nightBoost: { value: 2.7 },
    texelWidth: { value: 1 / 2048 },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: EARTH_VERTEX,
    fragmentShader: EARTH_FRAGMENT,
  })
  loadColorTexture(EARTH_TEXTURES.day, anisotropy, (texture) => {
    uniforms.dayMap.value.dispose()
    uniforms.dayMap.value = texture
  })
  loadColorTexture(EARTH_TEXTURES.night, anisotropy, (texture) => {
    uniforms.nightMap.value = texture
  })
  loadColorTexture(EARTH_TEXTURES.packed, anisotropy, (texture) => {
    uniforms.surfaceMap.value = texture
    uniforms.texelWidth.value = 1 / 4096
  }, true)

  return {
    material,
    sunDirection: uniforms.sunDirection.value,
    tick: (deltaSeconds) => {
      uniforms.cloudShift.value = (uniforms.cloudShift.value + deltaSeconds * 0.0022) % 1
    },
  }
}

export function createSurface(body: SolarBody, anisotropy: number): SurfaceHandle {
  if (body.id === 'earth') return createEarthSurface(anisotropy)
  const maps = proceduralSurface(body)
  maps.color.anisotropy = anisotropy
  maps.bump.anisotropy = anisotropy
  const isBanded = body.style === 'gas' || body.style === 'saturn' || body.style === 'ice' || body.style === 'venus'
  const material = new THREE.MeshStandardMaterial({
    map: maps.color,
    bumpMap: maps.bump,
    bumpScale: isBanded ? 0.012 : body.kind === 'moon' ? 0.09 : 0.055,
    roughness: isBanded ? 0.82 : 0.96,
    metalness: 0,
  })
  const url = NASA_TEXTURES[body.id]
  if (url) {
    loadColorTexture(url, anisotropy, (texture) => {
      const fallback = material.map
      material.map = texture
      material.needsUpdate = true
      fallback?.dispose()
    })
  }
  return { material }
}

/* ------------------------------------------------------------------ */
/* Atmosphere shells: sun-aware limb scattering.                      */
/* ------------------------------------------------------------------ */

export interface AtmosphereHandle {
  mesh: THREE.Mesh
  sunDirection: THREE.Vector3
}

export function createAtmosphere(body: SolarBody, radius: number): AtmosphereHandle | null {
  if (!body.atmosphereColor) return null
  const isEarth = body.id === 'earth'
  const shellScale = isEarth ? 1.07 : 1.055
  const edgeMax = Math.sqrt(1 - 1 / (shellScale * shellScale))
  const baseColor = new THREE.Color(body.atmosphereColor)
  const duskColor = isEarth ? new THREE.Color('#ff7a30') : baseColor.clone().offsetHSL(-0.045, 0.1, -0.06)
  const uniforms = {
    baseColor: { value: baseColor },
    duskColor: { value: duskColor },
    sunDirection: { value: new THREE.Vector3(1, 0, 0) },
    intensity: { value: isEarth ? 2.4 : body.id === 'venus' || body.id === 'titan' ? 1.3 : 0.75 },
    falloff: { value: isEarth ? 1.1 : 1.45 },
    edgeMax: { value: edgeMax },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: EARTH_VERTEX,
    fragmentShader: /* glsl */ `
      uniform vec3 baseColor;
      uniform vec3 duskColor;
      uniform vec3 sunDirection;
      uniform float intensity;
      uniform float falloff;
      uniform float edgeMax;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vec3 n = normalize(vNormalW);
        vec3 v = normalize(cameraPosition - vPosW);
        float ndv = dot(n, v);
        // Back-face shell: silhouette at ndv≈0, planet limb at ndv≈-edgeMax.
        float ring = clamp(-ndv / edgeMax, 0.0, 1.0);
        float glow = pow(ring, falloff);
        float sunLit = clamp(dot(n, normalize(sunDirection)) * 1.6 + 0.62, 0.0, 1.0);
        // Blue day glow almost everywhere the sun reaches; warm tint only in
        // the narrow twilight ring near the terminator.
        float dusk = smoothstep(0.42, 0.18, sunLit) * smoothstep(0.02, 0.14, sunLit);
        vec3 color = mix(baseColor, duskColor, dusk * 0.85);
        float alpha = glow * intensity * (0.04 + 0.96 * sunLit);
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius * shellScale, 64, 48), material)
  return { mesh, sunDirection: uniforms.sunDirection.value }
}

/* ------------------------------------------------------------------ */
/* Ring systems with analytic planet shadows.                         */
/* ------------------------------------------------------------------ */

export interface RingHandle {
  mesh: THREE.Mesh
  sunDirection: THREE.Vector3
  planetCenter: THREE.Vector3
}

function ringProfileTexture(body: SolarBody): THREE.CanvasTexture {
  const width = 1024
  const [canvas, context] = makeCanvas(width, 16)
  const random = seededRandom(`${body.id}-rings`)
  const base = new THREE.Color(body.rings!.color)
  const image = context.createImageData(width, 1)
  const isSaturn = body.id === 'saturn'
  for (let x = 0; x < width; x += 1) {
    const u = x / (width - 1)
    let alpha = 0.35 + 0.4 * Math.sin(u * Math.PI)
    // Fine ringlets.
    alpha *= 0.62 + 0.38 * Math.abs(Math.sin(u * 210 + random() * 4)) * (0.5 + random() * 0.5)
    if (isSaturn) {
      if (u < 0.14) alpha *= 0.28 // C ring — translucent
      if (u >= 0.14 && u < 0.56) alpha *= 1.28 // B ring — dense
      if (u >= 0.56 && u < 0.64) alpha *= 0.06 // Cassini division
      if (u >= 0.64) alpha *= 0.85 // A ring
      if (u > 0.9 && u < 0.925) alpha *= 0.12 // Encke gap
      if (u > 0.98) alpha *= 0.4
    } else {
      if (u < 0.08 || u > 0.92) alpha *= 0.3
      if (u > 0.42 && u < 0.5) alpha *= 0.24
    }
    const shade = 0.78 + random() * 0.4
    const index = x * 4
    image.data[index] = Math.min(255, base.r * 255 * shade)
    image.data[index + 1] = Math.min(255, base.g * 255 * shade)
    image.data[index + 2] = Math.min(255, base.b * 255 * shade)
    image.data[index + 3] = Math.max(0, Math.min(255, alpha * body.rings!.opacity * 335))
  }
  for (let y = 0; y < 16; y += 1) context.putImageData(image, 0, y)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createRing(body: SolarBody, radius: number): RingHandle | null {
  if (!body.rings) return null
  const inner = radius * body.rings.inner
  const outer = radius * body.rings.outer
  const geometry = new THREE.RingGeometry(inner, outer, 256, 2)
  // Re-map UVs radially: u = 0 at inner edge, 1 at outer edge.
  const position = geometry.attributes.position
  const uv = geometry.attributes.uv as THREE.BufferAttribute
  const vertex = new THREE.Vector3()
  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position as THREE.BufferAttribute, index)
    const radial = (vertex.length() - inner) / (outer - inner)
    uv.setXY(index, radial, 0.5)
  }
  const uniforms = {
    map: { value: ringProfileTexture(body) },
    sunDirection: { value: new THREE.Vector3(1, 0, 0) },
    planetCenter: { value: new THREE.Vector3() },
    planetRadius: { value: radius },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vPosW;
      void main() {
        vUv = uv;
        vec4 posW = modelMatrix * vec4(position, 1.0);
        vPosW = posW.xyz;
        gl_Position = projectionMatrix * viewMatrix * posW;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform vec3 sunDirection;
      uniform vec3 planetCenter;
      uniform float planetRadius;
      varying vec2 vUv;
      varying vec3 vPosW;
      void main() {
        vec4 tex = texture2D(map, vUv);
        if (tex.a < 0.01) discard;
        vec3 l = normalize(sunDirection);
        vec3 toFragment = vPosW - planetCenter;
        float along = dot(toFragment, l);
        vec3 perp = toFragment - along * l;
        // Cylindrical planet shadow across the ring plane.
        float shadow = along < 0.0
          ? mix(0.13, 1.0, smoothstep(planetRadius * 0.9, planetRadius * 1.06, length(perp)))
          : 1.0;
        gl_FragColor = vec4(tex.rgb * shadow, tex.a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = Math.PI / 2
  return { mesh, sunDirection: uniforms.sunDirection.value, planetCenter: uniforms.planetCenter.value }
}

/* ------------------------------------------------------------------ */
/* The Sun: granulation shader, limb darkening, corona, streamers.    */
/* ------------------------------------------------------------------ */

export interface SunHandle {
  group: THREE.Group
  mesh: THREE.Mesh
  uniforms: { time: { value: number } }
}

export interface StarPalette {
  cool: string
  mid: string
  hot: string
  rim: string
}

export function starPaletteForTemperature(temperatureK: number): StarPalette {
  if (temperatureK > 7500) return { cool: '#4f7dff', mid: '#9db9ff', hot: '#eef4ff', rim: '#8fb4ff' }
  if (temperatureK > 5200) return { cool: '#ff7817', mid: '#ffb741', hot: '#fff6d8', rim: '#ff8c2e' }
  if (temperatureK > 3700) return { cool: '#d43c00', mid: '#ff8b3d', hot: '#ffe0b0', rim: '#ff7a26' }
  return { cool: '#7d1000', mid: '#e5431a', hot: '#ffb480', rim: '#ff5a22' }
}

function coronaSprite(radius: number, tint = new THREE.Color('#ffb741')): THREE.Sprite {
  const size = 512
  const [canvas, context] = makeCanvas(size, size)
  const center = size / 2
  const rgb = `${Math.round(tint.r * 255)}, ${Math.round(tint.g * 255)}, ${Math.round(tint.b * 255)}`
  const glow = context.createRadialGradient(center, center, 0, center, center, center)
  glow.addColorStop(0, 'rgba(255, 245, 225, 0.9)')
  glow.addColorStop(0.16, `rgba(${rgb}, 0.4)`)
  glow.addColorStop(0.34, `rgba(${rgb}, 0.11)`)
  glow.addColorStop(0.62, `rgba(${rgb}, 0.03)`)
  glow.addColorStop(1, `rgba(${rgb}, 0)`)
  context.fillStyle = glow
  context.fillRect(0, 0, size, size)
  // Coronal streamers.
  const random = seededRandom('corona-rays')
  context.translate(center, center)
  for (let index = 0; index < 130; index += 1) {
    const angle = random() * Math.PI * 2
    const length = center * (0.26 + Math.pow(random(), 1.9) * 0.6)
    const width = 0.003 + random() * 0.008
    const ray = context.createLinearGradient(0, 0, Math.cos(angle) * length, Math.sin(angle) * length)
    ray.addColorStop(0, 'rgba(255, 224, 170, 0.1)')
    ray.addColorStop(1, 'rgba(255, 190, 120, 0)')
    context.fillStyle = ray
    context.beginPath()
    context.moveTo(0, 0)
    context.arc(0, 0, length, angle - width, angle + width)
    context.closePath()
    context.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }))
  sprite.scale.setScalar(radius * 3.7)
  return sprite
}

export function createSun(radius: number, palette?: StarPalette): SunHandle {
  const colors = palette ?? starPaletteForTemperature(5772)
  const uniforms = {
    time: { value: 0 },
    colorCool: { value: new THREE.Color(colors.cool) },
    colorMid: { value: new THREE.Color(colors.mid) },
    colorHot: { value: new THREE.Color(colors.hot) },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vPosition;
      varying vec3 vNormalV;
      void main() {
        vPosition = position;
        vNormalV = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float time;
      uniform vec3 colorCool;
      uniform vec3 colorMid;
      uniform vec3 colorHot;
      varying vec3 vPosition;
      varying vec3 vNormalV;
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
        float amplitude = 0.52;
        for (int octave = 0; octave < 5; octave += 1) {
          value += noise(p) * amplitude;
          p *= 2.04;
          amplitude *= 0.5;
        }
        return value;
      }
      void main() {
        vec3 p = normalize(vPosition);
        // Domain-warped granulation.
        vec3 warp = vec3(
          fbm(p * 3.0 + vec3(0.0, time * 0.05, 0.0)),
          fbm(p * 3.0 + vec3(5.2, time * 0.04, 1.3)),
          fbm(p * 3.0 + vec3(2.8, 9.1, time * 0.045))
        );
        float granules = fbm(p * 8.5 + warp * 2.2 + vec3(time * 0.02));
        float cells = fbm(p * 24.0 + warp * 3.0 - vec3(time * 0.035));
        float heat = granules * 0.66 + cells * 0.52;
        vec3 color = mix(colorCool, colorMid, smoothstep(0.28, 0.6, heat));
        color = mix(color, colorHot, smoothstep(0.6, 0.99, heat));
        // Limb darkening.
        float limb = pow(max(dot(normalize(vNormalV), vec3(0.0, 0.0, 1.0)), 0.0), 0.5);
        color *= 0.36 + 0.72 * limb;
        // Emissive headroom for bloom.
        color *= 1.22;
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), material)
  const group = new THREE.Group()
  group.add(mesh)
  // Chromosphere rim.
  const rimColor = new THREE.Color(colors.rim)
  const rim = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.02, 64, 48),
    new THREE.ShaderMaterial({
      uniforms: {
        edgeMax: { value: Math.sqrt(1 - 1 / (1.02 * 1.02)) },
        rimColor: { value: rimColor },
      },
      vertexShader: EARTH_VERTEX,
      fragmentShader: /* glsl */ `
        uniform float edgeMax;
        uniform vec3 rimColor;
        varying vec3 vNormalW;
        varying vec3 vPosW;
        void main() {
          vec3 n = normalize(vNormalW);
          vec3 v = normalize(cameraPosition - vPosW);
          float ring = clamp(-dot(n, v) / edgeMax, 0.0, 1.0);
          gl_FragColor = vec4(rimColor * 1.4, pow(ring, 1.7) * 0.85);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  group.add(rim)
  group.add(coronaSprite(radius, new THREE.Color(colors.mid)))
  return { group, mesh, uniforms }
}

/* ------------------------------------------------------------------ */
/* Sagittarius A*: doppler-beamed accretion disk and lensing arcs.    */
/* ------------------------------------------------------------------ */

export interface BlackHoleHandle {
  group: THREE.Group
  uniforms: { time: { value: number } }
  /** Keeps the lensed-image arcs perpendicular to the viewer. */
  faceCamera: (cameraPosition: THREE.Vector3) => void
}

const DISK_FRAGMENT = /* glsl */ `
  uniform float time;
  uniform float beamStrength;
  varying vec2 vUv;
  varying vec3 vPosW;
  varying vec3 vCenterW;
  varying vec3 vDiskNormalW;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0 || r < 0.28) discard;
    float angle = atan(p.y, p.x);

    // Orbital shear: inner material circles faster.
    float speed = 2.6 / (r * r + 0.09);
    float swirl = angle * 2.0 - time * speed;
    float streaks =
      0.55 + 0.45 * sin(swirl * 3.0 + r * 34.0)
      + 0.3 * sin(swirl * 7.0 - r * 61.0 + 1.7)
      + 0.22 * sin(swirl * 13.0 + r * 90.0 + hash21(vec2(floor(r * 60.0), 0.0)) * 6.28);
    streaks = clamp(streaks * 0.5, 0.0, 1.2);

    // Temperature falls with radius: white-hot ISCO to deep red rim.
    vec3 hot = vec3(1.18, 1.08, 0.94);
    vec3 warm = vec3(1.05, 0.55, 0.2);
    vec3 cool = vec3(0.42, 0.1, 0.03);
    float t = smoothstep(0.28, 1.0, r);
    vec3 color = mix(hot, warm, smoothstep(0.02, 0.4, t));
    color = mix(color, cool, smoothstep(0.38, 1.0, t));

    // Relativistic beaming: the approaching limb brightens and blue-shifts.
    vec3 radial = normalize(vPosW - vCenterW);
    vec3 tangential = normalize(cross(normalize(vDiskNormalW), radial));
    vec3 view = normalize(cameraPosition - vPosW);
    float doppler = dot(tangential, view);
    float beam = pow(clamp(1.0 + doppler * 0.9, 0.1, 2.0), 2.8) * beamStrength;
    color = mix(color, color * vec3(0.82, 0.92, 1.3), clamp(doppler * 0.55, 0.0, 1.0));

    float edgeFade = smoothstep(1.0, 0.82, r) * smoothstep(0.28, 0.37, r);
    float innerGlow = smoothstep(0.42, 0.285, r) * 0.8;
    float alpha = edgeFade * (0.3 + streaks * 0.5) * clamp(beam, 0.35, 1.6);
    vec3 finalColor = color * (0.34 + streaks * 0.52 + innerGlow) * beam;

    gl_FragColor = vec4(finalColor, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const DISK_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPosW;
  varying vec3 vCenterW;
  varying vec3 vDiskNormalW;
  void main() {
    vUv = uv;
    vec4 posW = modelMatrix * vec4(position, 1.0);
    vPosW = posW.xyz;
    vCenterW = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vDiskNormalW = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0));
    gl_Position = projectionMatrix * viewMatrix * posW;
  }
`

export function createBlackHole(): BlackHoleHandle {
  const group = new THREE.Group()
  const uniforms = { time: { value: 0 }, beamStrength: { value: 1 } }

  // Event horizon.
  group.add(new THREE.Mesh(new THREE.SphereGeometry(5.4, 96, 64), new THREE.MeshBasicMaterial({ color: 0x000000 })))

  const diskMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: DISK_VERTEX,
    fragmentShader: DISK_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })
  const disk = new THREE.Mesh(new THREE.PlaneGeometry(52, 52), diskMaterial)
  disk.rotation.x = Math.PI / 2 - 0.16
  group.add(disk)

  // Lensed image of the far side of the disk: arcs hugging the shadow,
  // billboarded so they always face the viewer.
  const lensedGroup = new THREE.Group()
  group.add(lensedGroup)
  const arcMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: DISK_VERTEX,
    fragmentShader: /* glsl */ `
      uniform float time;
      varying vec2 vUv;
      void main() {
        float band = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
        float flow = 0.62 + 0.38 * sin(vUv.x * 46.0 - time * 2.2);
        vec3 color = mix(vec3(1.0, 0.6, 0.24), vec3(1.12, 1.0, 0.82), vUv.y);
        gl_FragColor = vec4(color * flow * 0.85, band * 0.55);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })
  const upperArc = new THREE.Mesh(new THREE.TorusGeometry(6.6, 0.5, 20, 180, Math.PI), arcMaterial)
  upperArc.scale.set(1, 0.86, 1)
  lensedGroup.add(upperArc)
  const lowerArc = new THREE.Mesh(new THREE.TorusGeometry(6.6, 0.34, 20, 180, Math.PI * 0.9), arcMaterial)
  lowerArc.rotation.z = Math.PI + 0.16
  lowerArc.scale.set(0.94, 0.78, 1)
  lensedGroup.add(lowerArc)

  // Photon ring: razor-thin, brilliant, also view-facing.
  const photonRing = new THREE.Mesh(
    new THREE.TorusGeometry(5.9, 0.07, 16, 220),
    new THREE.MeshBasicMaterial({ color: 0xffdfae, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }),
  )
  lensedGroup.add(photonRing)

  // Ambient halo.
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(8.4, 64, 48),
    new THREE.MeshBasicMaterial({
      color: 0xff9c58, transparent: true, opacity: 0.038, side: THREE.BackSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  ))

  const faceCamera = (cameraPosition: THREE.Vector3) => {
    lensedGroup.lookAt(cameraPosition)
  }
  return { group, uniforms, faceCamera }
}
