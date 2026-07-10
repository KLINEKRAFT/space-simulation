import type { SolarBody } from './solarCatalog'

/**
 * A small set of notable robotic missions, shown as selectable markers.
 *
 * Positions are *illustrative*: low-Earth-orbit craft use a representative
 * circular orbit at their real inclination and period, L2 observatories sit in
 * the anti-sunward direction, and the interstellar/outbound probes are placed
 * along their true escape direction (RA/Dec) at their current heliocentric
 * distance. This is a visualization, not a live TLE/ephemeris propagation.
 */

export type SpacecraftMotion = 'earth-orbit' | 'earth-l2' | 'heliocentric' | 'outbound'

export interface Spacecraft {
  id: string
  motion: SpacecraftMotion
  // earth-orbit
  altitudeFactor?: number
  periodMinutes?: number
  inclinationDeg?: number
  // heliocentric (Kepler)
  semiMajorAxisAu?: number
  eccentricity?: number
  meanLongitudeDeg?: number
  helioInclinationDeg?: number
  // earth-l2 / outbound (direction + distance)
  raDeg?: number
  decDeg?: number
  distanceAu?: number
  body: SolarBody
}

function craftBody(id: string, name: string, blurb: string, semiMajorAxisAu?: number): SolarBody {
  return {
    id,
    name,
    kind: 'spacecraft',
    parentId: 'sun',
    radiusKm: 0.02,
    semiMajorAxisAu,
    style: 'dwarf',
    color: '#d8e6ee',
    blurb,
  }
}

export const SPACECRAFT: Spacecraft[] = [
  {
    id: 'sc:iss', motion: 'earth-orbit', altitudeFactor: 1.32, periodMinutes: 92.7, inclinationDeg: 51.6,
    body: craftBody('sc:iss', 'ISS', 'The International Space Station, orbiting ~420 km up every 93 minutes since 1998 — the largest crewed structure in space.'),
  },
  {
    id: 'sc:hubble', motion: 'earth-orbit', altitudeFactor: 1.30, periodMinutes: 95.4, inclinationDeg: 28.5,
    body: craftBody('sc:hubble', 'Hubble', 'The Hubble Space Telescope, imaging the universe from low Earth orbit since 1990.'),
  },
  {
    id: 'sc:tiangong', motion: 'earth-orbit', altitudeFactor: 1.33, periodMinutes: 92.2, inclinationDeg: 41.5,
    body: craftBody('sc:tiangong', 'Tiangong', 'China’s modular space station, permanently crewed since 2022.'),
  },
  {
    id: 'sc:jwst', motion: 'earth-l2', distanceAu: 0.01,
    body: craftBody('sc:jwst', 'JWST', 'The James Webb Space Telescope, observing in the infrared from the Sun–Earth L2 point, 1.5 million km beyond Earth.'),
  },
  {
    id: 'sc:parker', motion: 'heliocentric', semiMajorAxisAu: 0.388, eccentricity: 0.84, helioInclinationDeg: 3.4, meanLongitudeDeg: 120,
    body: craftBody('sc:parker', 'Parker Solar Probe', 'NASA’s Parker Solar Probe, the fastest object ever built, repeatedly diving through the Sun’s corona.', 0.388),
  },
  {
    id: 'sc:voyager1', motion: 'outbound', raDeg: 262, decDeg: 12.4, distanceAu: 165,
    body: craftBody('sc:voyager1', 'Voyager 1', 'The most distant human-made object, in interstellar space over 160 AU from the Sun and still transmitting.', 165),
  },
  {
    id: 'sc:voyager2', motion: 'outbound', raDeg: 296, decDeg: -55, distanceAu: 137,
    body: craftBody('sc:voyager2', 'Voyager 2', 'The only spacecraft to fly by all four giant planets, now in interstellar space.', 137),
  },
  {
    id: 'sc:pioneer10', motion: 'outbound', raDeg: 82, decDeg: 26, distanceAu: 136,
    body: craftBody('sc:pioneer10', 'Pioneer 10', 'The first probe to cross the asteroid belt and fly by Jupiter, now silent and coasting toward Aldebaran.', 136),
  },
  {
    id: 'sc:newhorizons', motion: 'outbound', raDeg: 287, decDeg: -20, distanceAu: 59,
    body: craftBody('sc:newhorizons', 'New Horizons', 'Flew past Pluto in 2015 and the Kuiper Belt object Arrokoth in 2019; still exploring the outer system.', 59),
  },
]

export const SPACECRAFT_BODIES: SolarBody[] = SPACECRAFT.map((craft) => craft.body)
export const SPACECRAFT_MAP = new Map(SPACECRAFT.map((craft) => [craft.id, craft]))
