import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import type { ExoplanetSystem } from '../data/exoplanets'
import { DAY_MS, J2000_MS } from '../data/solarCatalog'
import type { CameraPose, DisplayRole, NavigationMode, QualityPreset, ScaleMode, SceneMode } from '../types'
import { getViewConfiguration } from '../utils/display'
import { createBlackHole } from './materials'
import { CAMERA_FAR, buildGalaxyScene, buildSolarScene, createMilkyWay, createStarField, disposeObject, rebuildExoplanetDetail, tuple, updateSolarScene } from './scenes'

interface SpaceCanvasProps {
  role: DisplayRole
  navigationMode: NavigationMode
  quality: QualityPreset
  sceneMode: SceneMode
  scaleMode: ScaleMode
  selectedTargetId: string
  timeScale: number
  bezelPixels: number
  cameraPose: CameraPose
  isController: boolean
  paused: boolean
  exoplanetSystems: ExoplanetSystem[]
  onCameraPose: (pose: CameraPose) => void
  onFps: (fps: number) => void
}

export function SpaceCanvas({
  role,
  navigationMode,
  quality,
  sceneMode,
  scaleMode,
  selectedTargetId,
  timeScale,
  bezelPixels,
  cameraPose,
  isController,
  paused,
  exoplanetSystems,
  onCameraPose,
  onFps,
}: SpaceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cameraPoseRef = useRef(cameraPose)
  const roleRef = useRef(role)
  const qualityRef = useRef(quality)
  const sceneModeRef = useRef(sceneMode)
  const scaleModeRef = useRef(scaleMode)
  const selectedTargetRef = useRef(selectedTargetId)
  const timeScaleRef = useRef(timeScale)
  const bezelRef = useRef(bezelPixels)
  const navigationModeRef = useRef(navigationMode)
  const pausedRef = useRef(paused)
  const isControllerRef = useRef(isController)
  const onPoseRef = useRef(onCameraPose)
  const onFpsRef = useRef(onFps)

  cameraPoseRef.current = cameraPose
  roleRef.current = role
  qualityRef.current = quality
  sceneModeRef.current = sceneMode
  scaleModeRef.current = scaleMode
  selectedTargetRef.current = selectedTargetId
  timeScaleRef.current = timeScale
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
    scene.background = new THREE.Color(0x010205)
    scene.fog = new THREE.FogExp2(0x010205, 0.000055)
    const camera = new THREE.PerspectiveCamera(47, 1, 0.02, CAMERA_FAR)
    camera.position.fromArray(cameraPoseRef.current.position)
    const renderer = new THREE.WebGLRenderer({
      antialias: qualityRef.current !== 'performance',
      powerPreference: 'high-performance',
      alpha: false,
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = qualityRef.current === 'quality' ? 1.18 : 1.08
    renderer.shadowMap.enabled = false
    container.appendChild(renderer.domElement)

    const renderPass = new RenderPass(scene, camera)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      qualityRef.current === 'quality' ? 0.72 : qualityRef.current === 'balanced' ? 0.48 : 0.22,
      0.82,
      0.72,
    )
    const composer = new EffectComposer(renderer)
    composer.addPass(renderPass)
    composer.addPass(bloomPass)
    composer.addPass(new OutputPass())

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.fromArray(cameraPoseRef.current.target)
    controls.enableDamping = true
    controls.dampingFactor = 0.045
    controls.minDistance = 0.7
    controls.maxDistance = 7000
    controls.screenSpacePanning = true

    const starCount = qualityRef.current === 'quality' ? 36_000 : qualityRef.current === 'balanced' ? 20_000 : 9_000
    const stars = createStarField(starCount)
    scene.add(stars)
    scene.add(new THREE.AmbientLight(0x122638, 0.055))

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
    let frameCount = 0
    let fpsWindowStart = performance.now()
    let animationFrame = 0
    let simulationDays = (Date.now() - J2000_MS) / DAY_MS
    let activeScaleMode = scaleModeRef.current

    const applyQuality = () => {
      const cap = qualityRef.current === 'quality' ? 1.45 : qualityRef.current === 'balanced' ? 1.05 : 0.72
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap))
      bloomPass.strength = qualityRef.current === 'quality' ? 0.72 : qualityRef.current === 'balanced' ? 0.48 : 0.22
      renderer.toneMappingExposure = qualityRef.current === 'quality' ? 1.18 : 1.08
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

    const updateCinematicCamera = (now: number) => {
      if (!isControllerRef.current || navigationModeRef.current !== 'cinematic') return
      const orbitAngle = now * 0.000035
      if (sceneModeRef.current === 'solar') {
        const selected = selectedSolarPosition()
        const distance = Math.max(7, selected.radius * 5.3)
        const desired = selected.position.clone().add(new THREE.Vector3(
          Math.cos(orbitAngle) * distance,
          selected.radius * 1.25 + Math.sin(orbitAngle * 0.67) * distance * 0.18,
          Math.sin(orbitAngle) * distance,
        ))
        camera.position.lerp(desired, 0.045)
        controls.target.lerp(selected.position, 0.075)
        return
      }
      if (sceneModeRef.current === 'galaxy') {
        rebuildExoplanetDetail(galaxy, selectedTargetRef.current)
        const target = galaxy.positions.get(selectedTargetRef.current) ?? new THREE.Vector3()
        const hasDetail = galaxy.systems.has(selectedTargetRef.current)
        const distance = hasDetail ? 19 : 330
        const desired = target.clone().add(new THREE.Vector3(Math.cos(orbitAngle) * distance, distance * 0.24, Math.sin(orbitAngle) * distance))
        camera.position.lerp(desired, hasDetail ? 0.04 : 0.018)
        controls.target.lerp(target, 0.055)
        return
      }
      const distance = 34 + Math.sin(now * 0.00011) * 4
      const desired = new THREE.Vector3(
        Math.cos(orbitAngle * 0.62) * distance,
        9 + Math.sin(orbitAngle) * 5,
        Math.sin(orbitAngle * 0.62) * distance,
      )
      camera.position.lerp(desired, 0.035)
      controls.target.lerp(new THREE.Vector3(), 0.06)
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
      rebuildSolarForScale()
      updateVisibility()
      if (!pausedRef.current) {
        simulationDays += deltaSeconds * timeScaleRef.current
        updateSolarScene(solar, scaleModeRef.current, simulationDays, deltaSeconds)
        solar.sunUniforms.time.value += deltaSeconds
        blackHole.uniforms.time.value += deltaSeconds
        blackHoleGroup.rotation.y += deltaSeconds * 0.012
        galacticCenterDust.rotation.y -= deltaSeconds * 0.018
      }
      if (sceneModeRef.current === 'galaxy') rebuildExoplanetDetail(galaxy, selectedTargetRef.current)
      updateCinematicCamera(now)
      moveFreeCamera(deltaSeconds)
      controls.update()
      publishPose(now)
      stars.rotation.y += deltaSeconds * 0.00035
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
    animationFrame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
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
