export type DisplayRole = 'single' | 'left' | 'right'
export type NavigationMode = 'cinematic' | 'free'
export type QualityPreset = 'balanced' | 'quality' | 'performance'
export type SceneMode = 'solar' | 'galaxy' | 'sagittarius'
export type ScaleMode = 'cinematic' | 'scientific'
export type Vec3Tuple = [number, number, number]

export interface CameraPose {
  position: Vec3Tuple
  target: Vec3Tuple
}

export interface AwayState {
  active: boolean
  message: string
  returnTime: string
  showClock: boolean
  dimScene: boolean
}

export interface SharedSimulationState {
  sessionId: string
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
  away: AwayState
  camera: CameraPose
  revision: number
}

export const DEFAULT_CAMERA: CameraPose = {
  position: [0, 18, 95],
  target: [0, 0, 0],
}

export function createInitialState(sessionId: string): SharedSimulationState {
  return {
    sessionId,
    navigationMode: 'cinematic',
    quality: 'balanced',
    sceneMode: 'solar',
    scaleMode: 'cinematic',
    selectedTargetId: 'earth',
    timeScale: 1,
    timePaused: false,
    labelsVisible: true,
    simResetToken: 0,
    bezelPixels: 0,
    away: {
      active: false,
      message: 'Out of the office',
      returnTime: '',
      showClock: true,
      dimScene: true,
    },
    camera: DEFAULT_CAMERA,
    revision: 0,
  }
}
