import type { DisplayRole } from '../types'

export interface ViewConfiguration {
  fullWidth: number
  fullHeight: number
  offsetX: number
  offsetY: number
  width: number
  height: number
}

export function getDisplayRole(search = window.location.search): DisplayRole {
  const role = new URLSearchParams(search).get('display')
  return role === 'left' || role === 'right' ? role : 'single'
}

export function getOrCreateSessionId(search = window.location.search): string {
  const params = new URLSearchParams(search)
  const existing = params.get('session')
  if (existing) return existing

  const stored = sessionStorage.getItem('space-simulation-session')
  if (stored) return stored

  const id = crypto.randomUUID()
  sessionStorage.setItem('space-simulation-session', id)
  return id
}

export function getViewConfiguration(
  role: DisplayRole,
  width: number,
  height: number,
  bezelPixels: number,
): ViewConfiguration | null {
  if (role === 'single') return null

  const gap = Math.max(0, Math.round(bezelPixels))
  return {
    fullWidth: width * 2 + gap,
    fullHeight: height,
    offsetX: role === 'right' ? width + gap : 0,
    offsetY: 0,
    width,
    height,
  }
}

export function buildDisplayUrl(role: DisplayRole, sessionId: string): string {
  const url = new URL(window.location.href)
  url.searchParams.set('display', role)
  url.searchParams.set('session', sessionId)
  return url.toString()
}
