export const SECONDS_PER_DAY = 86_400
export const REALTIME_DAYS_PER_SECOND = 1 / SECONDS_PER_DAY

export interface TimeRatePreset {
  value: number
  label: string
  detail: string
}

export const TIME_RATE_PRESETS: TimeRatePreset[] = [
  { value: 0, label: 'Paused', detail: 'Simulation clock stopped' },
  { value: REALTIME_DAYS_PER_SECOND, label: 'Real time', detail: '1 simulation second per real second' },
  { value: 60 / SECONDS_PER_DAY, label: '60×', detail: '1 simulation minute per real second' },
  { value: 3_600 / SECONDS_PER_DAY, label: '3,600×', detail: '1 simulation hour per real second' },
  { value: 1, label: '1 day / second', detail: 'Fast orbital overview' },
  { value: 10, label: '10 days / second', detail: 'Long-range orbital overview' },
]

export function advanceSimulationDays(currentDays: number, deltaSeconds: number, daysPerSecond: number): number {
  if (!Number.isFinite(currentDays) || !Number.isFinite(deltaSeconds) || !Number.isFinite(daysPerSecond)) return currentDays
  return currentDays + Math.max(0, deltaSeconds) * Math.max(0, daysPerSecond)
}

export function rotationDeltaRadians(deltaDays: number, rotationPeriodDays: number | undefined): number {
  if (!rotationPeriodDays || !Number.isFinite(rotationPeriodDays)) return 0
  return (deltaDays / rotationPeriodDays) * Math.PI * 2
}

export function formatTimeRate(daysPerSecond: number): string {
  const preset = TIME_RATE_PRESETS.find((candidate) => Math.abs(candidate.value - daysPerSecond) < 1e-10)
  if (preset) return preset.label.toUpperCase()
  return `${daysPerSecond.toLocaleString()} DAYS / SECOND`
}
