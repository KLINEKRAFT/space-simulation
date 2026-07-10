import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type {
  CameraPose,
  DisplayRole,
  NavigationMode,
  QualityPreset,
  Vec3Tuple,
} from '../types'
import { getViewConfiguration } from '../utils/display'

interface SpaceCanvasProps {
  role: DisplayRole
  navigationMode: NavigationMode
  quality: QualityPreset
  bezelPixels: number
  cameraPose: CameraPose
  isController: boolean
  paused: boolean
  onCameraPose: (pose: CameraPose) => void
  onFps: (fps: number) => void
}

interface SolarObjects {
  earthOrbit: THREE.Group
  earth: THREE.Mesh
  moonOrbit: THREE.Group
  moon: THREE.Mesh
}

const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0)
const DAY_MS = 86_400_000

function tuple(vector: THREE.Vector3): Vec3Tuple {
  return [vector.x, vector.y, vector.z]
}

function createSeededRandom(seed = 1): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

function createEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context unavailable')

  const ocean = context.createLinearGradient(0, 0, 0, canvas.height)
  ocean.addColorStop(0, '#0d3047')
  ocean.addColorStop(0.52, '#1d6079')
  ocean.addColorStop(1, '#09283f')
  context.fillStyle = ocean
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.fillStyle = '#697b51'
  const continents: Array<Array<[number, number]>> = [
    [[75, 120], [150, 75], [235, 95], [260, 155], [220, 210], [135, 218], [92, 180]],
    [[250, 225], [320, 240], [350, 320], [322, 418], [280, 385], [255, 305]],
    [[470, 105], [590, 75], [680, 115], [650, 175], [560, 190], [500, 160]],
    [[560, 195], [625, 205], [650, 290], [610, 390], [555, 315], [530, 245]],
    [[680, 120], [830, 95], [930, 150], [890, 230], [765, 220], [700, 175]],
    [[835, 330], [930, 315], [975, 365], [925, 415], [850, 395]],
  ]

  for (const polygon of continents) {
    context.beginPath()
    polygon.forEach(([x, y], index) => {
      if (index === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    })
    context.closePath()
    context.fill()
  }

  const random = createSeededRandom(42)
  context.globalAlpha = 0.22
  for (let i = 0; i < 2400; i += 1) {
    const x = random() * canvas.width
    const y = random() * canvas.height
    const size = random() * 2.2 + 0.2
    context.fillStyle = random() > 0.45 ? '#f5f2df' : '#182c1f'
    context.fillRect(x, y, size, size)
  }

  context.globalAlpha = 0.38
  context.strokeStyle = '#ffffff'
  context.lineWidth = 2
  for (let i = 0; i < 34; i += 1) {
    const y = random() * canvas.height
    context.beginPath()
    context.moveTo(-20, y)
    for (let x = 0; x <= canvas.width + 20; x += 40) {
      context.lineTo(x, y + Math.sin(x * 0.025 + i) * 13)
    }
    context.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function createMoonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context unavailable')

  context.fillStyle = '#8d908f'
  context.fillRect(0, 0, canvas.width, canvas.height)
  const random = createSeededRandom(19)
  for (let i = 0; i < 500; i += 1) {
    const x = random() * canvas.width
    const y = random() * canvas.height
    const radius = random() * 7 + 0.8
    const shade = Math.round(85 + random() * 80)
    context.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${0.15 + random() * 0.35})`
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createOrbit(radius: number, opacity: number): THREE.LineLoop {
  const points: THREE.Vector3[] = []
  for (let i = 0; i < 256; i += 1) {
    const angle = (i / 256) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({ color: 0x5b7686, transparent: true, opacity })
  return new THREE.LineLoop(geometry, material)
}

function createStarField(count: number): THREE.Points {
  const random = createSeededRandom(2026)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const color = new THREE.Color()

  for (let i = 0; i < count; i += 1) {
    const radius = 350 + random() * 1150
    const theta = random() * Math.PI * 2
    const phi = Math.acos(2 * random() - 1)
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.cos(phi)
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)

    const temperature = random()
    if (temperature < 0.17) color.set('#9eb9ff')
    else if (temperature < 0.76) color.set('#f7f5e8')
    else color.set('#ffd1a2')
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const material = new THREE.PointsMaterial({
    size: 1.25,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  })
  return new THREE.Points(geometry, material)
}

function createMilkyWayBand(count: number): THREE.Points {
  const random = createSeededRandom(311)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const color = new THREE.Color()

  for (let i = 0; i < count; i += 1) {
    const longitude = random() * Math.PI * 2
    const latitude = (random() + random() + random() - 1.5) * 0.18
    const radius = 700 + random() * 550
    positions[i * 3] = Math.cos(longitude) * Math.cos(latitude) * radius
    positions[i * 3 + 1] = Math.sin(latitude) * radius
    positions[i * 3 + 2] = Math.sin(longitude) * Math.cos(latitude) * radius

    color.set(random() > 0.82 ? '#b9d5ff' : '#dce2e5')
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const material = new THREE.PointsMaterial({
    size: 0.75,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  })
  const points = new THREE.Points(geometry, material)
  points.rotation.z = THREE.MathUtils.degToRad(-23)
  return points
}

function createSolarScene(scene: THREE.Scene): SolarObjects {
  const earthTexture = createEarthTexture()
  const moonTexture = createMoonTexture()

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(7, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0xffe0a3 }),
  )
  scene.add(sun)

  const sunGlow = new THREE.PointLight(0xffd49a, 7200, 520, 1.15)
  scene.add(sunGlow)
  scene.add(new THREE.AmbientLight(0x173046, 0.35))

  const earthOrbit = new THREE.Group()
  scene.add(earthOrbit)
  scene.add(createOrbit(60, 0.28))

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(2.7, 64, 64),
    new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.72,
      metalness: 0,
    }),
  )
  earth.rotation.z = THREE.MathUtils.degToRad(23.44)
  earth.position.x = 60
  earthOrbit.add(earth)

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.82, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x6db9e6,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    }),
  )
  earth.add(atmosphere)

  const moonOrbit = new THREE.Group()
  moonOrbit.position.copy(earth.position)
  earthOrbit.add(moonOrbit)
  moonOrbit.add(createOrbit(7, 0.22))

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 40, 40),
    new THREE.MeshStandardMaterial({ map: moonTexture, roughness: 1 }),
  )
  moon.position.x = 7
  moonOrbit.add(moon)

  return { earthOrbit, earth, moonOrbit, moon }
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line)) return
    child.geometry.dispose()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    for (const material of materials) {
      if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose()
      material.dispose()
    }
  })
}

export function SpaceCanvas({
  role,
  navigationMode,
  quality,
  bezelPixels,
  cameraPose,
  isController,
  paused,
  onCameraPose,
  onFps,
}: SpaceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cameraPoseRef = useRef(cameraPose)
  const roleRef = useRef(role)
  const qualityRef = useRef(quality)
  const bezelRef = useRef(bezelPixels)
  const navigationModeRef = useRef(navigationMode)
  const pausedRef = useRef(paused)
  const isControllerRef = useRef(isController)
  const onPoseRef = useRef(onCameraPose)
  const onFpsRef = useRef(onFps)

  cameraPoseRef.current = cameraPose
  roleRef.current = role
  qualityRef.current = quality
  bezelRef.current = bezelPixels
  navigationModeRef.current = navigationMode
  pausedRef.current = paused
  isControllerRef.current = isController
  onPoseRef.current = onCameraPose
  onFpsRef.current = onFps

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x010307)

    const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 2600)
    camera.position.fromArray(cameraPoseRef.current.position)

    const renderer = new THREE.WebGLRenderer({
      antialias: qualityRef.current !== 'performance',
      powerPreference: 'high-performance',
      alpha: false,
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.fromArray(cameraPoseRef.current.target)
    controls.enableDamping = true
    controls.dampingFactor = 0.045
    controls.minDistance = 3.5
    controls.maxDistance = 1800
    controls.screenSpacePanning = true

    const starCount = qualityRef.current === 'quality' ? 18_000 : qualityRef.current === 'balanced' ? 10_000 : 5_000
    const stars = createStarField(starCount)
    const milkyWay = createMilkyWayBand(Math.round(starCount * 0.72))
    scene.add(stars, milkyWay)
    const solar = createSolarScene(scene)

    const keyState = new Set<string>()
    let previousTime = performance.now()
    let lastPoseSent = 0
    let frameCount = 0
    let fpsWindowStart = performance.now()
    let animationFrame = 0

    const applyQuality = () => {
      const cap = qualityRef.current === 'quality' ? 1.5 : qualityRef.current === 'balanced' ? 1.1 : 0.8
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap))
    }

    const resize = () => {
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)
      renderer.setSize(width, height, false)
      applyQuality()

      const view = getViewConfiguration(roleRef.current, width, height, bezelRef.current)
      camera.clearViewOffset()
      if (view) {
        camera.aspect = view.fullWidth / view.fullHeight
        camera.setViewOffset(
          view.fullWidth,
          view.fullHeight,
          view.offsetX,
          view.offsetY,
          view.width,
          view.height,
        )
      } else {
        camera.aspect = width / height
      }
      camera.updateProjectionMatrix()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    window.addEventListener('resize', resize)
    resize()

    const publishPose = (now: number) => {
      if (!isControllerRef.current || now - lastPoseSent < 90) return
      lastPoseSent = now
      onPoseRef.current({
        position: tuple(camera.position),
        target: tuple(controls.target),
      })
    }

    const moveFreeCamera = (deltaSeconds: number) => {
      if (!isControllerRef.current || navigationModeRef.current !== 'free') return
      const forward = controls.target.clone().sub(camera.position).normalize()
      const right = forward.clone().cross(camera.up).normalize()
      const up = camera.up.clone().normalize()
      const move = new THREE.Vector3()
      if (keyState.has('KeyW')) move.add(forward)
      if (keyState.has('KeyS')) move.sub(forward)
      if (keyState.has('KeyD')) move.add(right)
      if (keyState.has('KeyA')) move.sub(right)
      if (keyState.has('KeyE')) move.add(up)
      if (keyState.has('KeyQ')) move.sub(up)
      if (move.lengthSq() === 0) return

      const speed = keyState.has('ShiftLeft') || keyState.has('ShiftRight') ? 62 : 18
      move.normalize().multiplyScalar(speed * deltaSeconds)
      camera.position.add(move)
      controls.target.add(move)
    }

    const animateSolarSystem = (nowMs: number) => {
      const days = (Date.now() - J2000_MS) / DAY_MS
      const earthLongitude = THREE.MathUtils.degToRad((100.46435 + 0.985609101 * days) % 360)
      const moonLongitude = THREE.MathUtils.degToRad((218.316 + 13.176396 * days) % 360)
      solar.earthOrbit.rotation.y = -earthLongitude
      solar.moonOrbit.rotation.y = -moonLongitude + earthLongitude
      solar.earth.rotation.y = ((Date.now() % DAY_MS) / DAY_MS) * Math.PI * 2
      solar.moon.rotation.y = moonLongitude

      if (isControllerRef.current && navigationModeRef.current === 'cinematic') {
        const angle = nowMs * 0.000035
        const radius = 112 + Math.sin(nowMs * 0.00013) * 12
        camera.position.set(
          Math.cos(angle) * radius,
          26 + Math.sin(angle * 0.72) * 18,
          Math.sin(angle) * radius,
        )
        controls.target.set(0, 0, 0)
      }
    }

    const render = (now: number) => {
      animationFrame = requestAnimationFrame(render)
      const deltaSeconds = Math.min(0.05, (now - previousTime) / 1000)
      previousTime = now

      controls.enabled = isControllerRef.current && navigationModeRef.current === 'free'

      if (!isControllerRef.current) {
        camera.position.fromArray(cameraPoseRef.current.position)
        controls.target.fromArray(cameraPoseRef.current.target)
      }

      if (!pausedRef.current) animateSolarSystem(now)
      moveFreeCamera(deltaSeconds)
      controls.update()
      publishPose(now)

      stars.rotation.y += deltaSeconds * 0.002
      milkyWay.rotation.y -= deltaSeconds * 0.0006
      renderer.render(scene, camera)

      frameCount += 1
      if (now - fpsWindowStart >= 1000) {
        onFpsRef.current(Math.round((frameCount * 1000) / (now - fpsWindowStart)))
        frameCount = 0
        fpsWindowStart = now
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
        keyState.add(event.code)
      }
    }
    const onKeyUp = (event: KeyboardEvent) => keyState.delete(event.code)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    animationFrame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      controls.dispose()
      disposeObject(scene)
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [role, bezelPixels, quality])

  return <div className="space-canvas" ref={containerRef} aria-label="Interactive space simulation" />
}
