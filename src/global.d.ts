interface ScreenDetailed extends Screen {
  availLeft: number
  availTop: number
  left: number
  top: number
  isPrimary: boolean
  isInternal: boolean
  devicePixelRatio: number
  label: string
}

interface ScreenDetails extends EventTarget {
  screens: ScreenDetailed[]
  currentScreen: ScreenDetailed
}

interface Window {
  getScreenDetails?: () => Promise<ScreenDetails>
}
