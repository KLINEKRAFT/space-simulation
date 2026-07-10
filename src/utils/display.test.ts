import { describe, expect, it } from 'vitest'
import { getViewConfiguration } from './display'

describe('getViewConfiguration', () => {
  it('returns no view offset for a single display', () => {
    expect(getViewConfiguration('single', 3840, 2160, 0)).toBeNull()
  })

  it('creates adjacent 4K viewports', () => {
    expect(getViewConfiguration('left', 3840, 2160, 0)).toEqual({
      fullWidth: 7680,
      fullHeight: 2160,
      offsetX: 0,
      offsetY: 0,
      width: 3840,
      height: 2160,
    })
    expect(getViewConfiguration('right', 3840, 2160, 0)?.offsetX).toBe(3840)
  })

  it('adds a hidden slice for bezel correction', () => {
    expect(getViewConfiguration('right', 3840, 2160, 96)).toMatchObject({
      fullWidth: 7776,
      offsetX: 3936,
    })
  })
})
