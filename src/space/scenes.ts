import * as THREE from 'three'
import type { ExoplanetSystem } from '../data/exoplanets'
import { DAY_MS, SOLAR_BODIES, SOLAR_BODY_MAP, type SolarBody } from '../data/solarCatalog'
import type { ScaleMode, Vec3Tuple } from '../types'
import { createAtmosphere, createCloudLayer, createPlanetMaterial, createRing, createSun } from './materials'

export interface BodyVisual {
  body: SolarBody
  mesh: THREE.Mesh
  orbit?: THREE.LineLoop
  cloud?: THREE.Mesh
  radius: number
}
export interface SolarScene {
  group: THREE.Group
  visuals: Map<string, BodyVisual>
  positions: Map<string, THREE.Vector3>
  sunUniforms: { time: { value: number } }
  light: THREE.PointLight
}
export interface GalaxyScene {
  group: THREE.Group
  positions: Map<string, THREE.Vector3>
  systems: Map<string, ExoplanetSystem>
  detailGroup: THREE.Group
  currentDetailId: string
}
export const CAMERA_FAR = 12_000
export function tuple(vector: THREE.Vector3): Vec3Tuple { return [vector.x, vector.y, vector.z] }
function createSeededRandom(seed = 1): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

export function createStarField(count: number): THREE.Points {
  const random = createSeededRandom(2026)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const color = new THREE.Color()
  for (let index = 0; index < count; index += 1) {
    const radius = 650 + random() * 4200
    const theta = random() * Math.PI * 2
    const phi = Math.acos(2 * random() - 1)
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[index * 3 + 1] = radius * Math.cos(phi)
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
    const temperature = random()
    if (temperature < 0.16) color.set('#9eb9ff')
    else if (temperature < 0.76) color.set('#f8f5e8')
    else color.set('#ffd0a0')
    colors[index * 3] = color.r
    colors[index * 3 + 1] = color.g
    colors[index * 3 + 2] = color.b
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 1.4, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false,
  }))
}

export function createMilkyWay(count: number): THREE.Points {
  const random = createSeededRandom(804)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const color = new THREE.Color()
  for (let index = 0; index < count; index += 1) {
    const arm = index % 4
    const radial = Math.pow(random(), 0.58) * 540
    const angle = radial * 0.018 + arm * (Math.PI / 2) + (random() - 0.5) * 0.65
    const height = (random() + random() + random() - 1.5) * (10 + radial * 0.035)
    positions[index * 3] = Math.cos(angle) * radial
    positions[index * 3 + 1] = height
    positions[index * 3 + 2] = Math.sin(angle) * radial
    color.set(random() > 0.8 ? '#a9c9ff' : random() > 0.32 ? '#e6e0d5' : '#ffd1a3')
    const brightness = 0.55 + random() * 0.68
    colors[index * 3] = color.r * brightness
    colors[index * 3 + 1] = color.g * brightness
    colors[index * 3 + 2] = color.b * brightness
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 0.85, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.58,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }))
  points.rotation.x = THREE.MathUtils.degToRad(12)
  points.rotation.z = THREE.MathUtils.degToRad(-18)
  return points
}

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
  const sunRadius = bodyRadius(SOLAR_BODY_MAP.get('sun')!, scaleMode)
  const sun = createSun(sunRadius)
  group.add(sun.mesh)
  const light = new THREE.PointLight(0xffd6a1, scaleMode === 'scientific' ? 18_000 : 32_000, 0, 1.45)
  group.add(light)
  for (const body of SOLAR_BODIES) {
    if (body.id === 'sun') {
      visuals.set(body.id, { body, mesh: sun.mesh, radius: sunRadius })
      positions.set(body.id, new THREE.Vector3())
      continue
    }
    const radius = bodyRadius(body, scaleMode)
    const segments = body.kind === 'moon' && body.radiusKm < 100 ? 24 : body.kind === 'moon' ? 40 : 64
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, Math.max(16, Math.round(segments * 0.68))),
      createPlanetMaterial(body, anisotropy),
    )
    mesh.rotation.z = THREE.MathUtils.degToRad(body.axialTiltDeg ?? 0)
    group.add(mesh)
    const atmosphere = createAtmosphere(body, radius)
    if (atmosphere) mesh.add(atmosphere)
    const ring = createRing(body, radius)
    if (ring) mesh.add(ring)
    const cloud = body.id === 'earth' ? createCloudLayer(radius) : undefined
    if (cloud) mesh.add(cloud)
    const parent = body.parentId ? SOLAR_BODY_MAP.get(body.parentId) : undefined
    const parentRadius = parent ? bodyRadius(parent, scaleMode) : 0
    const orbitRadius = body.kind === 'moon'
      ? moonOrbitRadius(body, parentRadius, scaleMode)
      : primaryOrbitRadius(body, scaleMode)
    const orbit = createOrbitLine(
      orbitRadius,
      body.kind === 'moon' ? 0 : body.eccentricity ?? 0,
      body.kind === 'moon' ? 0 : body.inclinationDeg ?? 0,
      body.kind === 'moon' ? 0x436171 : 0x537385,
      body.kind === 'moon' ? 0.1 : 0.2,
    )
    group.add(orbit)
    visuals.set(body.id, { body, mesh, orbit, cloud, radius })
    positions.set(body.id, new THREE.Vector3())
  }
  return { group, visuals, positions, sunUniforms: sun.uniforms, light }
}

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
  const color = new THREE.Color()
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
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(pointColors, 3))
  group.add(new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 1.65, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false,
  })))
  group.add(createMilkyWay(64_000))
  const detailGroup = new THREE.Group()
  group.add(detailGroup)
  return { group, positions, systems: systemMap, detailGroup, currentDetailId: '' }
}

function clearGroup(group: THREE.Group): void {
  while (group.children.length > 0) {
    const child = group.children.pop()
    if (!child) continue
    child.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose()
        material.dispose()
      })
    })
  }
}

export function rebuildExoplanetDetail(galaxy: GalaxyScene, targetId: string): void {
  if (galaxy.currentDetailId === targetId) return
  clearGroup(galaxy.detailGroup)
  galaxy.currentDetailId = targetId
  const system = galaxy.systems.get(targetId)
  const origin = galaxy.positions.get(targetId)
  if (!system || !origin) return
  galaxy.detailGroup.position.copy(origin)
  const stellarRadius = Math.max(0.85, Math.min(4.2, (system.stellarRadiusSolar ?? 0.9) * 1.7))
  const temperature = system.stellarTemperatureK ?? 5200
  const starColor = temperature > 7500 ? 0xaecbff : temperature > 5200 ? 0xffedc7 : temperature > 3700 ? 0xffc58d : 0xff886e
  galaxy.detailGroup.add(new THREE.Mesh(new THREE.SphereGeometry(stellarRadius, 48, 32), new THREE.MeshBasicMaterial({ color: starColor })))
  galaxy.detailGroup.add(new THREE.PointLight(starColor, 2600, 90, 1.45))
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
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(planetRadius, 32, 24), createPlanetMaterial(syntheticBody, 4))
    const angle = ((Date.now() / DAY_MS) / (planet.orbitalPeriodDays ?? 40 + index * 55)) * Math.PI * 2
    mesh.position.set(Math.cos(angle) * orbitRadius, Math.sin(index * 2.1) * 0.35, Math.sin(angle) * orbitRadius)
    galaxy.detailGroup.add(createOrbitLine(orbitRadius, planet.eccentricity ?? 0, index * 1.6, 0x536779, 0.16))
    galaxy.detailGroup.add(mesh)
  })
}

export function updateSolarScene(solar: SolarScene, scaleMode: ScaleMode, elapsedDays: number, deltaSeconds: number): void {
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
    visual.mesh.rotation.y += deltaSeconds * (0.28 / Math.max(0.06, Math.abs(rotationPeriod)))
    if (visual.cloud) visual.cloud.rotation.y += deltaSeconds * 0.035
  }
}

export function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line)) return
    child.geometry.dispose()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    for (const material of materials) {
      if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose()
      if ('bumpMap' in material && material.bumpMap instanceof THREE.Texture) material.bumpMap.dispose()
      material.dispose()
    }
  })
}
