import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js'
import type { ExoplanetSystem } from '../data/exoplanets'
import { DAY_MS, J2000_MS } from '../data/solarCatalog'
import type { CameraPose, DisplayRole, NavigationMode, QualityPreset, ScaleMode, SceneMode } from '../types'
import { getViewConfiguration } from '../utils/display'
import { advanceSimulationDays } from '../utils/simulationTime'
import { createBlackHole } from './materials'
import {
  CAMERA_FAR,
  buildGalaxyScene,
  buildSolarScene,
  createMilkyWay,
  createSkyDome,
  createStarField,
  disposeObject,
  rebuildExoplanetDetail,
  tuple,
  updateSolarLabels,
  updateSolarScene,
} from './scenes'

interface SpaceCanvasProps {
  role: DisplayRole
  navigationMode: NavigationMode
  quality: QualityPreset
  sceneMode: SceneMode
  scaleMode: ScaleMode
  selectedTargetId: string
  timeScale: number
  timePaused: boolean
  labelsVisible: boolean
  simResetToken: number
  bezelPixels: number
  cameraPose: CameraPose
  isController: boolean
  paused: boolean
  exoplanetSystems: ExoplanetSystem[]
  onCameraPose: (pose: CameraPose) => void
  onFps: (fps: number) => void
  onSimDays: (days: number) => void
  onSelectTarget: (targetId: string) => void
}

export function SpaceCanvas({
  role,
  navigationMode,
  quality,
  sceneMode,
  scaleMode,
  selectedTargetId,
  timeScale,
  timePaused,
  labelsVisible,
  simResetToken,
  bezelPixels,
  cameraPose,
  isController,
  paused,
  exoplanetSystems,
  onCameraPose,
  onFps,
  onSimDays,
  onSelectTarget,
}: SpaceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cameraPoseRef = useRef(cameraPose)
  const roleRef = useRef(role)
  const qualityRef = useRef(quality)
  const sceneModeRef = useRef(sceneMode)
  const scaleModeRef = useRef(scaleMode)
  const selectedTargetRef = useRef(selectedTargetId)
  const timeScaleRef = useRef(timeScale)
  const timePausedRef = useRef(timePaused)
  const labelsVisibleRef = useRef(labelsVisible)
  const simResetTokenRef = useRef(simResetToken)
  const bezelRef = useRef(bezelPixels)
  const navigationModeRef = useRef(navigationMode)
  const pausedRef = useRef(paused)
  const isControllerRef = useRef(isController)
  const onPoseRef = useRef(onCameraPose)
  const onFpsRef = useRef(onFps)
  const onSimDaysRef = useRef(onSimDays)
  const onSelectTargetRef = useRef(onSelectTarget)

  cameraPoseRef.current = cameraPose
  roleRef.current = role
  qualityRef.current = quality
  sceneModeRef.current = sceneMode
  scaleModeRef.current = scaleMode
  selectedTargetRef.current = selectedTargetId
  timeScaleRef.current = timeScale
  timePausedRef.current = timePaused
  labelsVisibleRef.current = labelsVisible
  simResetTokenRef.current = simResetToken
  bezelRef.current = bezelPixels
  navigationModeRef.current = navigationMode
  pausedRef.current = paused
  isControllerRef.current = isController
  onPoseRef.current = onCameraPose
  onFpsRef.current = onFps
  onSimDaysRef.current = onSimDays
  onSelectTargetRef.current = onSelectTarget

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x010205)
    scene.fog = new THREE.FogExp2(0x010205, 0.00005)
    const camera = new THREE.PerspectiveCamera(47, 1, 0.02, CAMERA_FAR)
    camera.position.fromArray(cameraPoseRef.current.position)
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.shadowMap.enabled = false
    container.appendChild(renderer.domElement)

    const renderPass = new RenderPass(scene, camera)
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.55, 0.88)
    const fxaaPass = new ShaderPass(FXAAShader)
    const composer = new EffectComposer(renderer)
    composer.addPass(renderPass)
    composer.addPass(bloomPass)
    composer.addPass(new OutputPass())
    composer.addPass(fxaaPass)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.fromArray(cameraPoseRef.current.target)
    controls.enableDamping = true
    controls.dampingFactor = 0.045
    controls.minDistance = 0.7
    controls.maxDistance = 7000
    controls.screenSpacePanning = true

    const starCount = qualityRef.current === 'quality' ? 34_000 : qualityRef.current === 'balanced' ? 20_000 : 9_000
    const stars = createStarField(starCount)
    scene.add(stars.points)
    const skyDome = createSkyDome()
    scene.add(skyDome)
    scene.add(new THREE.AmbientLight(0x24384c, 0.16))

    const anisotropy = renderer.capabilities.getMaxAnisotropy()
    let solar = buildSolarScene(anisotropy, scaleModeRef.current)
    scene.add(solar.group)
    const galaxy = buildGalaxyScene(exoplanetSystems)
    scene.add(galaxy.group)
    const blackHole = createBlackHole()
    const blackHoleGroup = blackHole.group
    blackHoleGroup.scale.setScalar(1.25)
    scene.add(blackHoleGroup)
    const galacticCenterDust = createMilkyWay(30_000)
    galacticCenterDust.scale.setScalar(0.33)
    blackHoleGroup.add(galacticCenterDust)

    const keyState = new Set<string>()
    let previousTime = performance.now()
    let lastPoseSent = 0
    let lastSimDaysSent = 0
    let frameCount = 0
    let fpsWindowStart = performance.now()
    let animationFrame = 0
    let simulationDays = (Date.now() - J2000_MS) / DAY_MS
    let activeScaleMode = scaleModeRef.current
    let activeSimResetToken = simResetTokenRef.current
    let elapsedSeconds = 0

    const applyQuality = () => {
      const cap = qualityRef.current === 'quality' ? 1.6 : qualityRef.current === 'balanced' ? 1.1 : 0.75
      const ratio = Math.min(window.devicePixelRatio || 1, cap)
      renderer.setPixelRatio(ratio)
      bloomPass.strength = qualityRef.current === 'quality' ? 0.6 : qualityRef.current === 'balanced' ? 0.5 : 0.34
      stars.uniforms.dpr.value = ratio
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)
      const fxaaResolution = fxaaPass.material.uniforms['resolution'].value as THREE.Vector2
      fxaaResolution.set(1 / (width * ratio), 1 / (height * ratio))
    }

    const resize = () => {
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)
      applyQuality()
      renderer.setSize(width, height, false)
      composer.setSize(width, height)
      const view = getViewConfiguration(roleRef.current, width, height, bezelRef.current)
      camera.clearViewOffset()
      if (view) {
        camera.aspect = view.fullWidth / view.fullHeight
        camera.setViewOffset(view.fullWidth, view.fullHeight, view.offsetX, view.offsetY, view.width, view.height)
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
      onPoseRef.current({ position: tuple(camera.position), target: tuple(controls.target) })
    }

    const publishSimDays = (now: number) => {
      if (now - lastSimDaysSent < 500) return
      lastSimDaysSent = now
      onSimDaysRef.current(simulationDays)
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
      const distance = camera.position.distanceTo(controls.target)
      const baseSpeed = Math.max(3, distance * 0.36)
      const speed = keyState.has('ShiftLeft') || keyState.has('ShiftRight') ? baseSpeed * 5 : baseSpeed
      move.normalize().multiplyScalar(speed * deltaSeconds)
      camera.position.add(move)
      controls.target.add(move)
    }

    const rebuildSolarForScale = () => {
      if (activeScaleMode === scaleModeRef.current) return
      scene.remove(solar.group)
      disposeObject(solar.group)
      solar = buildSolarScene(anisotropy, scaleModeRef.current)
      scene.add(solar.group)
      activeScaleMode = scaleModeRef.current
    }

    const selectedSolarPosition = (): { position: THREE.Vector3; radius: number } => {
      const visual = solar.visuals.get(selectedTargetRef.current) ?? solar.visuals.get('earth')!
      return {
        position: solar.positions.get(visual.body.id)?.clone() ?? new THREE.Vector3(),
        radius: visual.radius,
      }
    }

    const updateVisibility = () => {
      solar.group.visible = sceneModeRef.current === 'solar'
      galaxy.group.visible = sceneModeRef.current === 'galaxy'
      blackHoleGroup.visible = sceneModeRef.current === 'sagittarius'
    }

    // Fly-to easing: converge fast right after a target switch, settle gently after.
    let flyBoost = 0
    let lastTargetId = selectedTargetRef.current
    const updateCinematicCamera = (now: number, deltaSeconds: number) => {
      if (!isControllerRef.current || navigationModeRef.current !== 'cinematic') return
      if (lastTargetId !== selectedTargetRef.current) {
        lastTargetId = selectedTargetRef.current
        flyBoost = 1
      }
      flyBoost = Math.max(0, flyBoost - deltaSeconds / 3.4)
      const ease = 1 - Math.exp(-deltaSeconds * (2.2 + flyBoost * 2.6))
      const targetEase = 1 - Math.exp(-deltaSeconds * (3.4 + flyBoost * 3.2))
      const orbitAngle = now * 0.000035
      if (sceneModeRef.current === 'solar') {
        const selected = selectedSolarPosition()
        const distance = Math.max(6.5, selected.radius * 4.9)
        const desired = selected.position.clone().add(new THREE.Vector3(
          Math.cos(orbitAngle) * distance,
          selected.radius * 1.15 + Math.sin(orbitAngle * 0.67) * distance * 0.16,
          Math.sin(orbitAngle) * distance,
        ))
        camera.position.lerp(desired, ease)
        controls.target.lerp(selected.position, targetEase)
        return
      }
      if (sceneModeRef.current === 'galaxy') {
        rebuildExoplanetDetail(galaxy, selectedTargetRef.current)
        const target = galaxy.positions.get(selectedTargetRef.current) ?? new THREE.Vector3()
        const hasDetail = galaxy.systems.has(selectedTargetRef.current)
        const distance = hasDetail ? 19 : 330
        const desired = target.clone().add(new THREE.Vector3(Math.cos(orbitAngle) * distance, distance * 0.24, Math.sin(orbitAngle) * distance))
        camera.position.lerp(desired, ease * 0.75)
        controls.target.lerp(target, targetEase * 0.8)
        return
      }
      const distance = 33 + Math.sin(now * 0.00011) * 4
      const desired = new THREE.Vector3(
        Math.cos(orbitAngle * 0.62) * distance,
        4.2 + Math.sin(orbitAngle) * 2.4,
        Math.sin(orbitAngle * 0.62) * distance,
      )
      camera.position.lerp(desired, ease * 0.7)
      controls.target.lerp(new THREE.Vector3(), targetEase * 0.8)
    }

    // Click-to-select raycasting (ignores drags).
    const raycaster = new THREE.Raycaster()
    raycaster.params.Points.threshold = 3.4
    const pointer = new THREE.Vector2()
    let downAt: { x: number; y: number; time: number } | null = null
    const pickAt = (clientX: number, clientY: number) => {
      const bounds = renderer.domElement.getBoundingClientRect()
      pointer.set(
        ((clientX - bounds.left) / bounds.width) * 2 - 1,
        -((clientY - bounds.top) / bounds.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
      if (sceneModeRef.current === 'solar') {
        const hits = raycaster.intersectObjects(solar.pickables, false)
        const bodyId = hits[0]?.object.userData.bodyId as string | undefined
        if (bodyId) onSelectTargetRef.current(bodyId)
        return
      }
      if (sceneModeRef.current === 'galaxy') {
        const hits = raycaster.intersectObject(galaxy.starPoints, false)
        const first = hits[0]
        if (first?.index === undefined) return
        const systems = [...galaxy.systems.values()]
        const system = systems[first.index]
        if (system) onSelectTargetRef.current(system.id)
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      downAt = { x: event.clientX, y: event.clientY, time: performance.now() }
    }
    const onPointerUp = (event: PointerEvent) => {
      if (!downAt || !isControllerRef.current) return
      const moved = Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y)
      const heldMs = performance.now() - downAt.time
      downAt = null
      if (moved < 6 && heldMs < 400) pickAt(event.clientX, event.clientY)
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)

    const render = (now: number) => {
      animationFrame = requestAnimationFrame(render)
      // Clamp both ways: the first rAF timestamp can predate scene setup,
      // and a negative delta would turn the easing lerps into extrapolation.
      const deltaSeconds = THREE.MathUtils.clamp((now - previousTime) / 1000, 0, 0.05)
      previousTime = now
      elapsedSeconds += deltaSeconds
      controls.enabled = isControllerRef.current && navigationModeRef.current === 'free'
      if (!isControllerRef.current) {
        camera.position.fromArray(cameraPoseRef.current.position)
        controls.target.fromArray(cameraPoseRef.current.target)
      }
      rebuildSolarForScale()
      updateVisibility()

      if (activeSimResetToken !== simResetTokenRef.current) {
        activeSimResetToken = simResetTokenRef.current
        simulationDays = (Date.now() - J2000_MS) / DAY_MS
      }

      const timeFrozen = pausedRef.current || timePausedRef.current
      if (!pausedRef.current) {
        if (!timeFrozen) simulationDays = advanceSimulationDays(simulationDays, deltaSeconds, timeScaleRef.current)
        updateSolarScene(solar, scaleModeRef.current, simulationDays, timeFrozen ? 0 : deltaSeconds, selectedTargetRef.current)
        solar.sunUniforms.time.value += deltaSeconds
        stars.uniforms.time.value = elapsedSeconds
        if (galaxy.detailSunUniforms) galaxy.detailSunUniforms.time.value += deltaSeconds
        blackHole.uniforms.time.value += deltaSeconds
        blackHoleGroup.rotation.y += deltaSeconds * 0.012
        galacticCenterDust.rotation.y -= deltaSeconds * 0.018
      }
      if (sceneModeRef.current === 'sagittarius') blackHole.faceCamera(camera.position)
      if (sceneModeRef.current === 'galaxy') rebuildExoplanetDetail(galaxy, selectedTargetRef.current)
      updateCinematicCamera(now, deltaSeconds)
      moveFreeCamera(deltaSeconds)
      controls.update()
      publishPose(now)
      publishSimDays(now)
      updateSolarLabels(solar, camera, labelsVisibleRef.current && sceneModeRef.current === 'solar')
      composer.render()
      frameCount += 1
      if (now - fpsWindowStart >= 1000) {
        onFpsRef.current(Math.round((frameCount * 1000) / (now - fpsWindowStart)))
        frameCount = 0
        fpsWindowStart = now
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight'].includes(event.code)) keyState.add(event.code)
    }
    const onKeyUp = (event: KeyboardEvent) => keyState.delete(event.code)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    animationFrame = requestAnimationFrame((now) => {
      previousTime = now
      render(now)
    })

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      controls.dispose()
      disposeObject(scene)
      composer.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [exoplanetSystems])

  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [role, bezelPixels, quality])

  return <div className="space-canvas" ref={containerRef} aria-label="Interactive space simulation" />
}
