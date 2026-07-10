import { describe, expect, it } from 'vitest'
import {
  REALTIME_DAYS_PER_SECOND,
  SECONDS_PER_DAY,
  advanceSimulationDays,
  rotationDeltaRadians,
} from './simulationTime'

describe('simulation time', () => {
  it('advances one real day after 86,400 real seconds at real-time speed', () => {
    expect(advanceSimulationDays(0, SECONDS_PER_DAY, REALTIME_DAYS_PER_SECOND)).toBeCloseTo(1, 10)
  })

  it('rotates a synchronous moon once per orbital period', () => {
    expect(rotationDeltaRadians(27.3217, 27.3217)).toBeCloseTo(Math.PI * 2, 10)
  })

  it('preserves retrograde rotation direction', () => {
    expect(rotationDeltaRadians(1, -4)).toBeCloseTo(-Math.PI / 2, 10)
  })
})
