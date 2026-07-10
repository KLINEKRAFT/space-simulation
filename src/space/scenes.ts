import * as THREE from 'three'
import type { ExoplanetSystem } from '../data/exoplanets'
import { DAY_MS, SOLAR_BODIES, SOLAR_BODY_MAP, type SolarBody } from '../data/solarCatalog'
import type { ScaleMode, Vec3Tuple } from '../types'
import {
  createAtmosphere,
  createBlackHole,
  createRing,
  createSun,
  createSurface,
  seededRandom,
  starPaletteForTemperature,
  type AtmosphereHandle,
  type RingHandle,
  type SurfaceHandle,
} from './materials'

export { createBlackHole }

export interface BodyVisual {
  body: SolarBody
  mesh: THREE.Mesh
  orbit?: THREE.LineLoop
  label?: THREE.Sprite
  surface: SurfaceHandle
  atmosphere?: AtmosphereHandle
  ring?: RingHandle
  radius: number
}
export interface SolarScene {
  group: THREE.Group
  visuals: Map<string, BodyVisual>
  positions: Map<string, THREE.Vector3>
  sunUniforms: { time: { value: number } }
  light: THREE.PointLight
  pickables: THREE.Object3D[]
}
export interface GalaxyScene {
  group: THREE.Group
  positions: Map<string, THREE.Vector3>
  systems: Map<string, ExoplanetSystem>
  starPoints: THREE.Points
  detailGroup: THREE.Group
  currentDetailId: string
  detailSunUniforms?: { time: { value: number } }
}
export interface StarFieldHandle {
  points: THREE.Points
  uniforms: { time: { value: number }; dpr: { value: number } }
}

export const CAMERA_FAR = 12_000
export function tuple(vector: THREE.Vector3): Vec3Tuple { return [vector.x, vector.y, vector.z] }

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context unavailable')
  return [canvas, context]
}

/* ------------------------------------------------------------------ */
/* Soft round point sprites with optional twinkle.                    */
/* ------------------------------------------------------------------ */

function softPointsMaterial(twinkle: number, opacity: number, maxPx = 15): {
  material: THREE.ShaderMaterial
  uniforms: { time: { value: number }; dpr: { value: number } }
} {
  const uniforms = {
    time: { value: 0 },
    dpr: { value: 1 },
    twinkleAmp: { value: twinkle },
    masterOpacity: { value: opacity },
    maxPx: { value: maxPx },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute float size;
      attribute float phase;
      uniform float time;
      uniform float dpr;
      uniform float twinkleAmp;
      uniform float maxPx;
      varying vec3 vColor;
      varying float vTwinkle;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float speed = 0.5 + fract(phase * 13.7) * 1.7;
        vTwinkle = 1.0 - twinkleAmp * 0.5 + twinkleAmp * 0.5 * sin(time * speed + phase * 6.2831);
        float pointSize = size * (1500.0 / max(1.0, -mv.z)) * dpr;
        gl_PointSize = clamp(pointSize, 0.75 * dpr, maxPx * dpr);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float masterOpacity;
      varying vec3 vColor;
      varying float vTwinkle;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float falloff = smoothstep(0.5, 0.04, d);
        falloff *= falloff;
        gl_FragColor = vec4(vColor * vTwinkle, falloff * masterOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  return { material, uniforms }
}

export function createStarField(count: number): StarFieldHandle {
  const random = seededRandom('starfield-2026')
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  const color = new THREE.Color()
  for (let index = 0; index < count; index += 1) {
    const radius = 1600 + random() * 4600
    const theta = random() * Math.PI * 2
    const phi = Math.acos(2 * random() - 1)
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[index * 3 + 1] = radius * Math.cos(phi)
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
    const temperature = random()
    if (temperature < 0.1) color.set('#a8c2ff')
    else if (temperature < 0.24) color.set('#cfdcff')
    else if (temperature < 0.78) color.set('#f6f1e4')
    else if (temperature < 0.94) color.set('#ffd9a6')
    else color.set('#ff9f76')
    const brightness = 0.5 + Math.pow(random(), 2.2) * 0.6
    colors[index * 3] = color.r * brightness
    colors[index * 3 + 1] = color.g * brightness
    colors[index * 3 + 2] = color.b * brightness
    sizes[index] = 0.7 + Math.pow(random(), 3.4) * 4.2
    phases[index] = random()
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
  const { material, uniforms } = softPointsMaterial(0.55, 0.95)
  const points = new THREE.Points(geometry, material)
  return { points, uniforms }
}

/* ------------------------------------------------------------------ */
/* Deep-sky dome: procedural Milky Way band on an equirect canvas.    */
/* ------------------------------------------------------------------ */

export function createSkyDome(): THREE.Mesh {
  const width = 2048
  const height = 1024
  const [canvas, context] = makeCanvas(width, height)
  context.fillStyle = '#020409'
  context.fillRect(0, 0, width, height)

  const random = seededRandom('deep-sky')
  // Sample two fBM fields at low resolution for the band and its dust lanes.
  const detail = 256
  const glowField = new Float32Array(detail * detail)
  const dustField = new Float32Array(detail * detail)
  for (let index = 0; index < detail * detail; index += 1) {
    glowField[index] = random()
    dustField[index] = random()
  }
  const smooth = (field: Float32Array, x: number, y: number): number => {
    const fx = (x % 1 + 1) % 1 * (detail - 1)
    const fy = Math.min(detail - 1, Math.max(0, y * (detail - 1)))
    const x0 = Math.floor(fx); const y0 = Math.floor(fy)
    const x1 = (x0 + 1) % detail; const y1 = Math.min(detail - 1, y0 + 1)
    const tx = fx - x0; const ty = fy - y0
    const a = field[y0 * detail + x0] * (1 - tx) + field[y0 * detail + x1] * tx
    const b = field[y1 * detail + x0] * (1 - tx) + field[y1 * detail + x1] * tx
    return a * (1 - ty) + b * ty
  }
  const fbm = (field: Float32Array, x: number, y: number): number =>
    smooth(field, x, y) * 0.5
    + smooth(field, x * 2.7 + 0.31, y * 2.7 + 0.17) * 0.28
    + smooth(field, x * 6.1 + 0.73, y * 6.1 + 0.49) * 0.22

  const image = context.getImageData(0, 0, width, height)
  const warmCore = { r: 255, g: 224, b: 178 }
  const coolBand = { r: 168, g: 190, b: 235 }
  for (let y = 0; y < height; y += 1) {
    const v = y / height
    for (let x = 0; x < width; x += 1) {
      const u = x / width
      // Band waviness.
      const drift = (fbm(glowField, u * 1.6, 0.5) - 0.5) * 0.11
      const bandDistance = Math.abs(v - 0.5 - drift)
      const bandEnvelope = Math.exp(-Math.pow(bandDistance / 0.085, 2))
      const wideGlow = Math.exp(-Math.pow(bandDistance / 0.24, 2)) * 0.24
      if (bandEnvelope < 0.004 && wideGlow < 0.004) continue
      const cloud = Math.pow(fbm(glowField, u * 4.2, v * 4.2), 1.6) * 1.7
      const dust = Math.pow(fbm(dustField, u * 5.4, v * 5.4), 2.1)
      const coreProximity = Math.exp(-Math.pow((u - 0.5) / 0.2, 2)) * Math.exp(-Math.pow(bandDistance / 0.1, 2))
      let strength = (bandEnvelope * (0.32 + cloud * 0.66) + wideGlow * 0.5) * 40
      strength *= 1 - Math.min(0.8, dust * bandEnvelope * 1.9)
      strength += coreProximity * 34 * (0.7 + cloud * 0.4)
      if (strength <= 0.5) continue
      const warm = Math.min(1, coreProximity * 2.2 + cloud * 0.12)
      const index = (y * width + x) * 4
      image.data[index] = Math.min(255, image.data[index] + strength * ((coolBand.r * (1 - warm) + warmCore.r * warm) / 255))
      image.data[index + 1] = Math.min(255, image.data[index + 1] + strength * ((coolBand.g * (1 - warm) + warmCore.g * warm) / 255))
      image.data[index + 2] = Math.min(255, image.data[index + 2] + strength * ((coolBand.b * (1 - warm) + warmCore.b * warm) / 255))
    }
  }
  context.putImageData(image, 0, 0)
  // No per-pixel stars here: at planetary distances dome texels magnify into
  // blobs, so pointillism belongs to the 3D starfield alone. A gentle blur
  // keeps the nebular bands smooth under extreme magnification.
  context.globalAlpha = 0.6
  context.filter = 'blur(3px)'
  context.drawImage(canvas, 0, 0)
  context.filter = 'none'
  context.globalAlpha = 1

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.mapping = THREE.EquirectangularReflectionMapping
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  })
  const dome = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 32), material)
  dome.rotation.z = THREE.MathUtils.degToRad(-60.2)
  dome.rotation.x = THREE.MathUtils.degToRad(12)
  dome.renderOrder = -10
  return dome
}

export function createMilkyWay(count: number): THREE.Points {
  const random = seededRandom('galaxy-804')
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  const color = new THREE.Color()
  for (let index = 0; index < count; index += 1) {
    const arm = index % 4
    const radial = Math.pow(random(), 0.58) * 540
    const angle = radial * 0.018 + arm * (Math.PI / 2) + (random() - 0.5) * 0.65
    const height = (random() + random() + random() - 1.5) * (10 + radial * 0.035)
    positions[index * 3] = Math.cos(angle) * radial
    positions[index * 3 + 1] = height
    positions[index * 3 + 2] = Math.sin(angle) * radial
    const coreGlow = Math.max(0, 1 - radial / 190)
    color.set(random() > 0.8 ? '#a9c9ff' : random() > 0.32 ? '#e6e0d5' : '#ffd1a3')
    color.lerp(new THREE.Color('#ffe4b8'), coreGlow * 0.55)
    const brightness = 0.4 + random() * 0.55 + coreGlow * 0.5
    colors[index * 3] = color.r * brightness
    colors[index * 3 + 1] = color.g * brightness
    colors[index * 3 + 2] = color.b * brightness
    sizes[index] = 0.5 + Math.pow(random(), 2) * 2.4 + coreGlow * 1.1
    phases[index] = random()
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
  const { material } = softPointsMaterial(0, 0.55, 7)
  const points = new THREE.Points(geometry, material)
  points.rotation.x = THREE.MathUtils.degToRad(12)
  points.rotation.z = THREE.MathUtils.degToRad(-18)
  return points
}

/* ------------------------------------------------------------------ */
/* Floating body labels.                                              */
/* ------------------------------------------------------------------ */

function createLabelSprite(name: string): THREE.Sprite {
  const [canvas, context] = makeCanvas(512, 128)
  context.font = '500 44px "IBM Plex Mono", ui-monospace, monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  const text = name.toUpperCase()
  context.shadowColor = 'rgba(126, 205, 255, 0.75)'
  context.shadowBlur = 18
  context.fillStyle = 'rgba(228, 243, 252, 0.94)'
  context.fillText(text, 256, 52)
  context.shadowBlur = 0
  const textWidth = Math.min(470, context.measureText(text).width)
  context.strokeStyle = 'rgba(148, 210, 240, 0.4)'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(256 - textWidth / 2, 92)
  context.lineTo(256 + textWidth / 2, 92)
  context.stroke()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
  }))
  sprite.center.set(0.5, -0.42)
  sprite.renderOrder = 20
  return sprite
}

const MAJOR_MOONS = new Set([
  'moon', 'io', 'europa', 'ganymede', 'callisto', 'titan', 'enceladus', 'rhea',
  'iapetus', 'mimas', 'dione', 'tethys', 'miranda', 'ariel', 'titania', 'oberon',
  'umbriel', 'triton', 'charon', 'phobos', 'deimos',
])

export function updateSolarLabels(
  solar: SolarScene,
  camera: THREE.Camera,
  visible: boolean,
): void {
  const cameraPosition = camera.position
  for (const visual of solar.visuals.values()) {
    const label = visual.label
    if (!label) continue
    const position = solar.positions.get(visual.body.id)
    if (!position) continue
    const distance = cameraPosition.distanceTo(position)
    let target = 0
    if (visible) {
      const isMoon = visual.body.kind === 'moon'
      const near = visual.radius * 5.5
      const far = isMoon ? 40 : visual.body.id === 'sun' ? 1500 : 1200
      if (distance > near && distance < far) {
        target = Math.min(1, (distance - near) / near) * Math.min(1, (far - distance) / (far * 0.25))
      }
    }
    const material = label.material as THREE.SpriteMaterial
    material.opacity += (target * 0.92 - material.opacity) * 0.14
    label.visible = material.opacity > 0.015
    if (label.visible) {
      const scale = Math.max(distance * 0.05, visual.radius * 0.72)
      label.position.set(position.x, position.y + visual.radius * 1.18 + scale * 0.05, position.z)
      label.scale.set(scale, scale * 0.25, 1)
    }
  }
}

/* ------------------------------------------------------------------ */
/* Solar system scene.                                                */
/* ------------------------------------------------------------------ */

function bodyRadius(body: SolarBody, scaleMode: ScaleMode): number {
  if (body.kind === 'star') return scaleMode === 'scientific' ? 8.5 : 9.2
  if (scaleMode === 'scientific') {
    const factor = body.kind === 'moon' ? 0.7 : 0.82
    return Math.max(body.kind === 'moon' ? 0.09 : 0.16, (body.radiusKm / 6371) * factor)
  }
  const factor = body.kind === 'moon' ? 1.2 : 2.35
  return Math.max(body.kind === 'moon' ? 0.2 : 0.42, Math.pow(body.radiusKm / 6371, 0.57) * factor)
}
function primaryOrbitRadius(body: SolarBody, scaleMode: ScaleMode): number {
  const au = body.semiMajorAxisAu ?? 0
  if (scaleMode === 'scientific') return Math.max(13, au * 8.4)
  return 17 + Math.log10(1 + au * 6.4) * 55
}
function moonOrbitRadius(body: SolarBody, parentRadius: number, scaleMode: ScaleMode): number {
  const orbitKm = body.orbitKm ?? 0
  if (scaleMode === 'scientific') return Math.max(parentRadius + 1.1, (orbitKm / 6371) * 0.38)
  return parentRadius + 1.55 + Math.log10(1 + orbitKm / 1000) * 1.65
}
function solveEccentricAnomaly(meanAnomaly: number, eccentricity: number): number {
  let eccentricAnomaly = meanAnomaly
  for (let iteration = 0; iteration < 7; iteration += 1) {
    eccentricAnomaly -= (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
      (1 - eccentricity * Math.cos(eccentricAnomaly))
  }
  return eccentricAnomaly
}
function orbitalPosition(body: SolarBody, orbitRadius: number, elapsedDays: number): THREE.Vector3 {
  if (!body.orbitalPeriodDays || orbitRadius === 0) return new THREE.Vector3()
  const period = Math.abs(body.orbitalPeriodDays)
  const direction = body.orbitalPeriodDays < 0 ? -1 : 1
  const meanLongitude = THREE.MathUtils.degToRad(body.meanLongitudeDeg ?? 0)
  const meanAnomaly = meanLongitude + direction * ((elapsedDays % period) / period) * Math.PI * 2
  const eccentricity = Math.min(0.92, Math.max(0, body.eccentricity ?? 0))
  const eccentricAnomaly = solveEccentricAnomaly(meanAnomaly, eccentricity)
  const x = orbitRadius * (Math.cos(eccentricAnomaly) - eccentricity)
  const z = orbitRadius * Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(eccentricAnomaly)
  return new THREE.Vector3(x, 0, z).applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(body.inclinationDeg ?? 0))
}
function createOrbitLine(radius: number, eccentricity: number, inclinationDeg: number, color: number, opacity: number): THREE.LineLoop {
  const points: THREE.Vector3[] = []
  const e = Math.min(0.92, Math.max(0, eccentricity))
  for (let index = 0; index < 256; index += 1) {
    const angle = (index / 256) * Math.PI * 2
    points.push(new THREE.Vector3(radius * (Math.cos(angle) - e), 0, radius * Math.sqrt(1 - e * e) * Math.sin(angle)))
  }
  const line = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
  )
  line.rotation.x = THREE.MathUtils.degToRad(inclinationDeg)
  return line
}

export function buildSolarScene(anisotropy: number, scaleMode: ScaleMode): SolarScene {
  const group = new THREE.Group()
  const visuals = new Map<string, BodyVisual>()
  const positions = new Map<string, THREE.Vector3>()
  const pickables: THREE.Object3D[] = []
  const labels = new THREE.Group()
  group.add(labels)

  const sunBody = SOLAR_BODY_MAP.get('sun')!
  const sunRadius = bodyRadius(sunBody, scaleMode)
  const sun = createSun(sunRadius)
  group.add(sun.group)
  const light = new THREE.PointLight(0xfff0dd, scaleMode === 'scientific' ? 30_000 : 42_000, 0, 2)
  group.add(light)

  for (const body of SOLAR_BODIES) {
    if (body.id === 'sun') {
      const sunLabel = createLabelSprite(body.name)
      labels.add(sunLabel)
      sun.mesh.userData.bodyId = body.id
      pickables.push(sun.mesh)
      visuals.set(body.id, {
        body,
        mesh: sun.mesh,
        radius: sunRadius,
        label: sunLabel,
        surface: { material: sun.mesh.material as THREE.Material },
      })
      positions.set(body.id, new THREE.Vector3())
      continue
    }
    const radius = bodyRadius(body, scaleMode)
    const segments = body.kind === 'moon' && body.radiusKm < 100 ? 24 : body.kind === 'moon' ? 48 : 96
    const surface = createSurface(body, anisotropy)
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, Math.max(16, Math.round(segments * 0.68))),
      surface.material,
    )
    mesh.rotation.order = 'ZYX'
    mesh.rotation.z = THREE.MathUtils.degToRad(body.axialTiltDeg ?? 0)
    mesh.userData.bodyId = body.id
    group.add(mesh)
    pickables.push(mesh)
    const atmosphere = createAtmosphere(body, radius) ?? undefined
    if (atmosphere) mesh.add(atmosphere.mesh)
    const ring = createRing(body, radius) ?? undefined
    if (ring) mesh.add(ring.mesh)
    const parent = body.parentId ? SOLAR_BODY_MAP.get(body.parentId) : undefined
    const parentRadius = parent ? bodyRadius(parent, scaleMode) : 0
    const orbitRadius = body.kind === 'moon'
      ? moonOrbitRadius(body, parentRadius, scaleMode)
      : primaryOrbitRadius(body, scaleMode)
    const orbit = createOrbitLine(
      orbitRadius,
      body.kind === 'moon' ? 0 : body.eccentricity ?? 0,
      body.kind === 'moon' ? 0 : body.inclinationDeg ?? 0,
      body.kind === 'moon' ? 0x3e5a6b : 0x4d6f84,
      body.kind === 'moon' ? 0.12 : 0.24,
    )
    group.add(orbit)
    const label = body.kind !== 'moon' || MAJOR_MOONS.has(body.id) ? createLabelSprite(body.name) : undefined
    if (label) labels.add(label)
    visuals.set(body.id, { body, mesh, orbit, label, surface, atmosphere, ring, radius })
    positions.set(body.id, new THREE.Vector3())
  }
  return { group, visuals, positions, sunUniforms: sun.uniforms, light, pickables }
}

/* ------------------------------------------------------------------ */
/* Galaxy / exoplanet scene.                                          */
/* ------------------------------------------------------------------ */

function galaxyPosition(system: ExoplanetSystem): THREE.Vector3 {
  const ra = THREE.MathUtils.degToRad(system.raDeg)
  const dec = THREE.MathUtils.degToRad(system.decDeg)
  const radial = 28 + Math.log10(1 + Math.max(0.1, system.distancePc ?? 1000)) * 74
  return new THREE.Vector3(Math.cos(dec) * Math.cos(ra) * radial, Math.sin(dec) * radial, Math.cos(dec) * Math.sin(ra) * radial)
}

export function buildGalaxyScene(systems: ExoplanetSystem[]): GalaxyScene {
  const group = new THREE.Group()
  const positions = new Map<string, THREE.Vector3>()
  const systemMap = new Map<string, ExoplanetSystem>()
  const pointPositions = new Float32Array(systems.length * 3)
  const pointColors = new Float32Array(systems.length * 3)
  const pointSizes = new Float32Array(systems.length)
  const pointPhases = new Float32Array(systems.length)
  const color = new THREE.Color()
  const random = seededRandom('exoplanet-field')
  systems.forEach((system, index) => {
    const position = galaxyPosition(system)
    positions.set(system.id, position)
    systemMap.set(system.id, system)
    pointPositions[index * 3] = position.x
    pointPositions[index * 3 + 1] = position.y
    pointPositions[index * 3 + 2] = position.z
    const temperature = system.stellarTemperatureK ?? 5200
    if (temperature > 7500) color.set('#a9c7ff')
    else if (temperature > 5200) color.set('#fff1d4')
    else if (temperature > 3700) color.set('#ffd0a3')
    else color.set('#ff997a')
    pointColors[index * 3] = color.r
    pointColors[index * 3 + 1] = color.g
    pointColors[index * 3 + 2] = color.b
    pointSizes[index] = 1.6 + random() * 2.2
    pointPhases[index] = random()
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(pointColors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(pointSizes, 1))
  geometry.setAttribute('phase', new THREE.BufferAttribute(pointPhases, 1))
  const { material } = softPointsMaterial(0.4, 1)
  const starPoints = new THREE.Points(geometry, material)
  group.add(starPoints)
  group.add(createMilkyWay(64_000))
  const detailGroup = new THREE.Group()
  group.add(detailGroup)
  return { group, positions, systems: systemMap, starPoints, detailGroup, currentDetailId: '' }
}

function clearGroup(group: THREE.Group): void {
  while (group.children.length > 0) {
    const child = group.children.pop()
    if (!child) continue
    disposeObject(child)
  }
}

export function rebuildExoplanetDetail(galaxy: GalaxyScene, targetId: string): void {
  if (galaxy.currentDetailId === targetId) return
  clearGroup(galaxy.detailGroup)
  galaxy.detailSunUniforms = undefined
  galaxy.currentDetailId = targetId
  const system = galaxy.systems.get(targetId)
  const origin = galaxy.positions.get(targetId)
  if (!system || !origin) return
  galaxy.detailGroup.position.copy(origin)
  const stellarRadius = Math.max(0.85, Math.min(4.2, (system.stellarRadiusSolar ?? 0.9) * 1.7))
  const temperature = system.stellarTemperatureK ?? 5200
  const palette = starPaletteForTemperature(temperature)
  const starColor = new THREE.Color(palette.mid)
  const star = createSun(stellarRadius, palette)
  galaxy.detailGroup.add(star.group)
  galaxy.detailSunUniforms = star.uniforms
  galaxy.detailGroup.add(new THREE.PointLight(starColor, 620, 0, 1.7))
  system.planets.forEach((planet, index) => {
    const semiMajorAxis = planet.semiMajorAxisAu ?? 0.04 + index * 0.08
    const orbitRadius = 4.5 + Math.log10(1 + semiMajorAxis * 24) * 6.8 + index * 0.75
    const radiusEarth = planet.radiusEarth ?? Math.pow(Math.max(0.15, planet.massEarth ?? 1), 0.28)
    const planetRadius = Math.max(0.22, Math.min(1.6, Math.pow(radiusEarth, 0.55) * 0.46))
    const syntheticBody: SolarBody = {
      id: `${targetId}:${index}`,
      name: planet.name,
      kind: 'planet',
      parentId: 'exo-star',
      radiusKm: radiusEarth * 6371,
      orbitalPeriodDays: planet.orbitalPeriodDays ?? 40 + index * 55,
      style: (planet.equilibriumTempK ?? 300) > 900 ? 'venus' : radiusEarth > 7 ? 'gas' : radiusEarth > 3 ? 'ice' : 'rocky',
      color: (planet.equilibriumTempK ?? 300) > 900 ? '#b96f47' : radiusEarth > 7 ? '#c49a77' : radiusEarth > 3 ? '#6f9eb2' : '#786e66',
    }
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(planetRadius, 32, 24),
      createSurface(syntheticBody, 4).material,
    )
    const angle = ((Date.now() / DAY_MS) / (planet.orbitalPeriodDays ?? 40 + index * 55)) * Math.PI * 2
    mesh.position.set(Math.cos(angle) * orbitRadius, Math.sin(index * 2.1) * 0.35, Math.sin(angle) * orbitRadius)
    galaxy.detailGroup.add(createOrbitLine(orbitRadius, planet.eccentricity ?? 0, index * 1.6, 0x536779, 0.16))
    galaxy.detailGroup.add(mesh)
  })
}

/* ------------------------------------------------------------------ */
/* Per-frame updates.                                                 */
/* ------------------------------------------------------------------ */

const SUN_DIRECTION = new THREE.Vector3()

export function updateSolarScene(
  solar: SolarScene,
  scaleMode: ScaleMode,
  elapsedDays: number,
  deltaSeconds: number,
  selectedTargetId?: string,
): void {
  for (const body of SOLAR_BODIES) {
    const visual = solar.visuals.get(body.id)
    if (!visual) continue
    if (body.id === 'sun') {
      solar.positions.get(body.id)?.set(0, 0, 0)
      continue
    }
    const parentPosition = body.parentId ? solar.positions.get(body.parentId) ?? new THREE.Vector3() : new THREE.Vector3()
    const parent = body.parentId ? SOLAR_BODY_MAP.get(body.parentId) : undefined
    const parentRadius = parent ? bodyRadius(parent, scaleMode) : 0
    const orbitRadius = body.kind === 'moon'
      ? moonOrbitRadius(body, parentRadius, scaleMode)
      : primaryOrbitRadius(body, scaleMode)
    const worldPosition = orbitalPosition(body, orbitRadius, elapsedDays).add(parentPosition)
    visual.mesh.position.copy(worldPosition)
    visual.orbit?.position.copy(parentPosition)
    solar.positions.get(body.id)?.copy(worldPosition)
    const rotationPeriod = body.rotationPeriodDays ?? 1
    visual.mesh.rotation.y += deltaSeconds * (0.28 / Math.max(0.06, Math.abs(rotationPeriod))) * Math.sign(rotationPeriod)

    // Track the sun for shader-driven surfaces, shells, and rings.
    SUN_DIRECTION.copy(worldPosition).negate().normalize()
    visual.surface.sunDirection?.copy(SUN_DIRECTION)
    visual.surface.tick?.(deltaSeconds)
    visual.atmosphere?.sunDirection.copy(SUN_DIRECTION)
    if (visual.ring) {
      visual.ring.sunDirection.copy(SUN_DIRECTION)
      visual.ring.planetCenter.copy(worldPosition)
    }

    if (visual.orbit) {
      const material = visual.orbit.material as THREE.LineBasicMaterial
      const isSelected = selectedTargetId === body.id
      const baseOpacity = body.kind === 'moon' ? 0.12 : 0.24
      material.opacity += ((isSelected ? 0.62 : baseOpacity) - material.opacity) * 0.08
      material.color.set(isSelected ? 0x86d2f2 : body.kind === 'moon' ? 0x3e5a6b : 0x4d6f84)
    }
  }
}

export function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line || child instanceof THREE.Sprite)) return
    // Sprites share one static geometry across all instances — never dispose it.
    if (!(child instanceof THREE.Sprite)) child.geometry.dispose()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    for (const material of materials) {
      if (!material) continue
      if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose()
      if ('bumpMap' in material && material.bumpMap instanceof THREE.Texture) material.bumpMap.dispose()
      if (material instanceof THREE.ShaderMaterial) {
        for (const uniform of Object.values(material.uniforms)) {
          if (uniform.value instanceof THREE.Texture) uniform.value.dispose()
        }
      }
      material.dispose()
    }
  })
}
