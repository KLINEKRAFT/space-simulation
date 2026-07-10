export type BodyKind = 'star' | 'planet' | 'dwarf' | 'candidate' | 'moon'
export type SurfaceStyle = 'sun' | 'rocky' | 'venus' | 'earth' | 'mars' | 'gas' | 'saturn' | 'ice' | 'dwarf' | 'pluto' | 'moon' | 'io' | 'titan' | 'triton'

export interface RingDefinition {
  inner: number
  outer: number
  color: string
  opacity: number
}

export interface SolarBody {
  id: string
  name: string
  kind: BodyKind
  parentId?: string
  radiusKm: number
  semiMajorAxisAu?: number
  orbitKm?: number
  orbitalPeriodDays?: number
  eccentricity?: number
  inclinationDeg?: number
  meanLongitudeDeg?: number
  rotationPeriodDays?: number
  axialTiltDeg?: number
  style: SurfaceStyle
  color: string
  atmosphereColor?: string
  rings?: RingDefinition
  blurb?: string
}

export const BODY_BLURBS: Record<string, string> = {
  sun: 'A G-type main-sequence star holding 99.86% of the system’s mass. Its churning photosphere sits at 5,772 K.',
  mercury: 'The smallest planet — a cratered world of temperature extremes, swinging 600 °C between day and night.',
  venus: 'A runaway greenhouse wrapped in sulfuric-acid clouds. Its surface glows at 465 °C under crushing pressure.',
  earth: 'The only known living world. Watch city lights trace the continents as the terminator sweeps across the Pacific.',
  mars: 'The rust-red desert planet, home to Olympus Mons and the ancient river valleys targeted by sample-return missions.',
  jupiter: 'A gas giant with 2.5× the mass of every other planet combined. The Great Red Spot has raged for centuries.',
  saturn: 'Ringed in ice and rubble spanning 280,000 km yet averaging just 10 m thick — the jewel of the system.',
  uranus: 'An ice giant rolled onto its side, orbiting the Sun at a 98° tilt with rings almost perpendicular to its path.',
  neptune: 'The windiest world known: supersonic methane jet streams top 2,000 km/h across its deep-blue clouds.',
  ceres: 'The largest object in the asteroid belt, with bright salt flats gleaming inside Occator crater.',
  pluto: 'A geologically alive dwarf planet with nitrogen glaciers flowing across its heart-shaped Sputnik Planitia.',
  moon: 'Earth’s companion, locked in synchronous rotation — the same ancient face always turned toward us.',
  io: 'The most volcanically active body in the solar system, resurfaced continuously by tidal heating.',
  europa: 'A cracked ice shell over a saltwater ocean holding twice the water of all Earth’s seas.',
  ganymede: 'The largest moon anywhere — bigger than Mercury — and the only one with its own magnetic field.',
  titan: 'A hazy orange world with methane rain, rivers, and seas: the only moon with a dense atmosphere.',
  enceladus: 'Geysers at its south pole vent ocean water into space, feeding Saturn’s E ring.',
  triton: 'Neptune’s captured Kuiper Belt object, orbiting backwards with nitrogen geysers on a frozen surface.',
  haumea: 'A dwarf planet spun into an egg shape by its 4-hour day, with its own ring and two moons.',
  makemake: 'A bright, methane-frosted dwarf planet in the classical Kuiper Belt.',
  eris: 'The most massive dwarf planet — its discovery triggered the redefinition that reclassified Pluto.',
  sedna: 'A distant red world on an 11,400-year orbit reaching deep toward the inner Oort cloud.',
}

const body = (definition: SolarBody): SolarBody => definition

export const SOLAR_BODIES: SolarBody[] = [
  body({ id: 'sun', name: 'Sun', kind: 'star', radiusKm: 696340, rotationPeriodDays: 25.38, axialTiltDeg: 7.25, style: 'sun', color: '#fff0b3' }),
  body({ id: 'mercury', name: 'Mercury', kind: 'planet', parentId: 'sun', radiusKm: 2439.7, semiMajorAxisAu: 0.387098, orbitalPeriodDays: 87.969, eccentricity: 0.2056, inclinationDeg: 7.005, meanLongitudeDeg: 252.251, rotationPeriodDays: 58.646, axialTiltDeg: 0.034, style: 'rocky', color: '#8c8378' }),
  body({ id: 'venus', name: 'Venus', kind: 'planet', parentId: 'sun', radiusKm: 6051.8, semiMajorAxisAu: 0.723332, orbitalPeriodDays: 224.701, eccentricity: 0.0068, inclinationDeg: 3.3947, meanLongitudeDeg: 181.979, rotationPeriodDays: -243.025, axialTiltDeg: 177.36, style: 'venus', color: '#d8b275', atmosphereColor: '#d7a85f' }),
  body({ id: 'earth', name: 'Earth', kind: 'planet', parentId: 'sun', radiusKm: 6371, semiMajorAxisAu: 1, orbitalPeriodDays: 365.256, eccentricity: 0.0167, meanLongitudeDeg: 100.464, rotationPeriodDays: 0.99727, axialTiltDeg: 23.44, style: 'earth', color: '#4f8fb7', atmosphereColor: '#69b8ff' }),
  body({ id: 'mars', name: 'Mars', kind: 'planet', parentId: 'sun', radiusKm: 3389.5, semiMajorAxisAu: 1.523679, orbitalPeriodDays: 686.98, eccentricity: 0.0934, inclinationDeg: 1.85, meanLongitudeDeg: 355.453, rotationPeriodDays: 1.02596, axialTiltDeg: 25.19, style: 'mars', color: '#b75b3c', atmosphereColor: '#d69c76' }),
  body({ id: 'jupiter', name: 'Jupiter', kind: 'planet', parentId: 'sun', radiusKm: 69911, semiMajorAxisAu: 5.2044, orbitalPeriodDays: 4332.59, eccentricity: 0.0489, inclinationDeg: 1.303, meanLongitudeDeg: 34.404, rotationPeriodDays: 0.41354, axialTiltDeg: 3.13, style: 'gas', color: '#d7b08a', rings: { inner: 1.35, outer: 1.55, color: '#a98d73', opacity: 0.14 } }),
  body({ id: 'saturn', name: 'Saturn', kind: 'planet', parentId: 'sun', radiusKm: 58232, semiMajorAxisAu: 9.5826, orbitalPeriodDays: 10759.22, eccentricity: 0.0565, inclinationDeg: 2.485, meanLongitudeDeg: 49.944, rotationPeriodDays: 0.444, axialTiltDeg: 26.73, style: 'saturn', color: '#d8c28e', rings: { inner: 1.25, outer: 2.35, color: '#d8c7a5', opacity: 0.68 } }),
  body({ id: 'uranus', name: 'Uranus', kind: 'planet', parentId: 'sun', radiusKm: 25362, semiMajorAxisAu: 19.2184, orbitalPeriodDays: 30688.5, eccentricity: 0.0463, inclinationDeg: 0.773, meanLongitudeDeg: 313.232, rotationPeriodDays: -0.718, axialTiltDeg: 97.77, style: 'ice', color: '#99d8df', atmosphereColor: '#9ad9df', rings: { inner: 1.5, outer: 2.0, color: '#a8c9c9', opacity: 0.24 } }),
  body({ id: 'neptune', name: 'Neptune', kind: 'planet', parentId: 'sun', radiusKm: 24622, semiMajorAxisAu: 30.11, orbitalPeriodDays: 60182, eccentricity: 0.0095, inclinationDeg: 1.77, meanLongitudeDeg: 304.88, rotationPeriodDays: 0.671, axialTiltDeg: 28.32, style: 'ice', color: '#406fbd', atmosphereColor: '#557fc3', rings: { inner: 1.5, outer: 1.95, color: '#7090a4', opacity: 0.18 } }),
  body({ id: 'ceres', name: 'Ceres', kind: 'dwarf', parentId: 'sun', radiusKm: 473, semiMajorAxisAu: 2.7675, orbitalPeriodDays: 1680.5, eccentricity: 0.0758, inclinationDeg: 10.59, meanLongitudeDeg: 80.3, rotationPeriodDays: 0.378, axialTiltDeg: 4, style: 'dwarf', color: '#77736f' }),
  body({ id: 'pluto', name: 'Pluto', kind: 'dwarf', parentId: 'sun', radiusKm: 1188.3, semiMajorAxisAu: 39.482, orbitalPeriodDays: 90560, eccentricity: 0.2488, inclinationDeg: 17.16, meanLongitudeDeg: 238.93, rotationPeriodDays: 6.387, axialTiltDeg: 122.53, style: 'pluto', color: '#c7aa8d' }),
  body({ id: 'haumea', name: 'Haumea', kind: 'dwarf', parentId: 'sun', radiusKm: 816, semiMajorAxisAu: 43.13, orbitalPeriodDays: 103774, eccentricity: 0.191, inclinationDeg: 28.2, meanLongitudeDeg: 122.2, rotationPeriodDays: 0.163, axialTiltDeg: 126, style: 'ice', color: '#d9e3e7', rings: { inner: 1.6, outer: 2.1, color: '#c5d5dc', opacity: 0.2 } }),
  body({ id: 'makemake', name: 'Makemake', kind: 'dwarf', parentId: 'sun', radiusKm: 715, semiMajorAxisAu: 45.79, orbitalPeriodDays: 112897, eccentricity: 0.159, inclinationDeg: 29.0, meanLongitudeDeg: 165.5, rotationPeriodDays: 0.323, style: 'dwarf', color: '#ad785f' }),
  body({ id: 'eris', name: 'Eris', kind: 'dwarf', parentId: 'sun', radiusKm: 1163, semiMajorAxisAu: 67.78, orbitalPeriodDays: 203830, eccentricity: 0.44, inclinationDeg: 44.0, meanLongitudeDeg: 35.9, rotationPeriodDays: 1.079, axialTiltDeg: 78, style: 'ice', color: '#dedbd3' }),
  body({ id: 'gonggong', name: 'Gonggong', kind: 'candidate', parentId: 'sun', radiusKm: 615, semiMajorAxisAu: 67.5, orbitalPeriodDays: 201000, eccentricity: 0.5, inclinationDeg: 30.7, meanLongitudeDeg: 207.0, rotationPeriodDays: 0.933, style: 'dwarf', color: '#9e6657' }),
  body({ id: 'quaoar', name: 'Quaoar', kind: 'candidate', parentId: 'sun', radiusKm: 555, semiMajorAxisAu: 43.69, orbitalPeriodDays: 104200, eccentricity: 0.039, inclinationDeg: 8.0, meanLongitudeDeg: 188.8, rotationPeriodDays: 0.736, style: 'dwarf', color: '#9f7563', rings: { inner: 3.5, outer: 4.2, color: '#b69a86', opacity: 0.18 } }),
  body({ id: 'sedna', name: 'Sedna', kind: 'candidate', parentId: 'sun', radiusKm: 498, semiMajorAxisAu: 506, orbitalPeriodDays: 4150000, eccentricity: 0.855, inclinationDeg: 11.9, meanLongitudeDeg: 358.1, rotationPeriodDays: 0.43, style: 'dwarf', color: '#a3412f' }),
  body({ id: 'orcus', name: 'Orcus', kind: 'candidate', parentId: 'sun', radiusKm: 455, semiMajorAxisAu: 39.17, orbitalPeriodDays: 90400, eccentricity: 0.22, inclinationDeg: 20.6, meanLongitudeDeg: 268.7, rotationPeriodDays: 0.445, style: 'dwarf', color: '#a6a9a9' }),
  body({ id: 'salacia', name: 'Salacia', kind: 'candidate', parentId: 'sun', radiusKm: 423, semiMajorAxisAu: 42.2, orbitalPeriodDays: 100800, eccentricity: 0.106, inclinationDeg: 23.9, rotationPeriodDays: 0.25, style: 'dwarf', color: '#777b7f' }),
  body({ id: 'varda', name: 'Varda', kind: 'candidate', parentId: 'sun', radiusKm: 370, semiMajorAxisAu: 45.5, orbitalPeriodDays: 112000, eccentricity: 0.14, inclinationDeg: 21.5, rotationPeriodDays: 0.245, style: 'dwarf', color: '#a89279' }),
  body({ id: 'varuna', name: 'Varuna', kind: 'candidate', parentId: 'sun', radiusKm: 334, semiMajorAxisAu: 43.1, orbitalPeriodDays: 103000, eccentricity: 0.056, inclinationDeg: 17.2, rotationPeriodDays: 0.264, style: 'dwarf', color: '#8c695c' }),
  body({ id: 'ixion', name: 'Ixion', kind: 'candidate', parentId: 'sun', radiusKm: 325, semiMajorAxisAu: 39.6, orbitalPeriodDays: 91000, eccentricity: 0.24, inclinationDeg: 19.6, rotationPeriodDays: 0.52, style: 'dwarf', color: '#815e53' }),
  body({ id: 'moon', name: 'Moon', kind: 'moon', parentId: 'earth', radiusKm: 1737.4, orbitKm: 384400, orbitalPeriodDays: 27.3217, style: 'moon', color: '#aaa9a5' }),
  body({ id: 'phobos', name: 'Phobos', kind: 'moon', parentId: 'mars', radiusKm: 11.27, orbitKm: 9376, orbitalPeriodDays: 0.31891, style: 'moon', color: '#6f6257' }),
  body({ id: 'deimos', name: 'Deimos', kind: 'moon', parentId: 'mars', radiusKm: 6.2, orbitKm: 23463, orbitalPeriodDays: 1.26244, style: 'moon', color: '#81756b' }),
  body({ id: 'io', name: 'Io', kind: 'moon', parentId: 'jupiter', radiusKm: 1821.6, orbitKm: 421700, orbitalPeriodDays: 1.769, style: 'io', color: '#d6b95e' }),
  body({ id: 'europa', name: 'Europa', kind: 'moon', parentId: 'jupiter', radiusKm: 1560.8, orbitKm: 671100, orbitalPeriodDays: 3.551, style: 'ice', color: '#c9bda9' }),
  body({ id: 'ganymede', name: 'Ganymede', kind: 'moon', parentId: 'jupiter', radiusKm: 2634.1, orbitKm: 1070400, orbitalPeriodDays: 7.155, style: 'moon', color: '#8e877b' }),
  body({ id: 'callisto', name: 'Callisto', kind: 'moon', parentId: 'jupiter', radiusKm: 2410.3, orbitKm: 1882700, orbitalPeriodDays: 16.689, style: 'moon', color: '#665e55' }),
  body({ id: 'amalthea', name: 'Amalthea', kind: 'moon', parentId: 'jupiter', radiusKm: 83.5, orbitKm: 181400, orbitalPeriodDays: 0.498, style: 'moon', color: '#8b4937' }),
  body({ id: 'thebe', name: 'Thebe', kind: 'moon', parentId: 'jupiter', radiusKm: 49.3, orbitKm: 221900, orbitalPeriodDays: 0.675, style: 'moon', color: '#7c6252' }),
  body({ id: 'metis', name: 'Metis', kind: 'moon', parentId: 'jupiter', radiusKm: 21.5, orbitKm: 128000, orbitalPeriodDays: 0.295, style: 'moon', color: '#7d6f62' }),
  body({ id: 'adrastea', name: 'Adrastea', kind: 'moon', parentId: 'jupiter', radiusKm: 8.2, orbitKm: 129000, orbitalPeriodDays: 0.298, style: 'moon', color: '#77706a' }),
  body({ id: 'himalia', name: 'Himalia', kind: 'moon', parentId: 'jupiter', radiusKm: 69.8, orbitKm: 11461000, orbitalPeriodDays: 250.6, style: 'moon', color: '#80746c' }),
  body({ id: 'elara', name: 'Elara', kind: 'moon', parentId: 'jupiter', radiusKm: 43, orbitKm: 11741000, orbitalPeriodDays: 259.7, style: 'moon', color: '#756c66' }),
  body({ id: 'pasiphae', name: 'Pasiphae', kind: 'moon', parentId: 'jupiter', radiusKm: 30, orbitKm: 23624000, orbitalPeriodDays: -743.6, style: 'moon', color: '#69625e' }),
  body({ id: 'sinope', name: 'Sinope', kind: 'moon', parentId: 'jupiter', radiusKm: 19, orbitKm: 23939000, orbitalPeriodDays: -758.9, style: 'moon', color: '#75645d' }),
  body({ id: 'leda', name: 'Leda', kind: 'moon', parentId: 'jupiter', radiusKm: 10, orbitKm: 11165000, orbitalPeriodDays: 240.9, style: 'moon', color: '#87766c' }),
  body({ id: 'mimas', name: 'Mimas', kind: 'moon', parentId: 'saturn', radiusKm: 198.2, orbitKm: 185539, orbitalPeriodDays: 0.942, style: 'moon', color: '#bdbbb4' }),
  body({ id: 'enceladus', name: 'Enceladus', kind: 'moon', parentId: 'saturn', radiusKm: 252.1, orbitKm: 238037, orbitalPeriodDays: 1.37, style: 'ice', color: '#e7eef1' }),
  body({ id: 'tethys', name: 'Tethys', kind: 'moon', parentId: 'saturn', radiusKm: 531.1, orbitKm: 294672, orbitalPeriodDays: 1.888, style: 'ice', color: '#d8d5cc' }),
  body({ id: 'dione', name: 'Dione', kind: 'moon', parentId: 'saturn', radiusKm: 561.4, orbitKm: 377415, orbitalPeriodDays: 2.737, style: 'ice', color: '#c9c6bf' }),
  body({ id: 'rhea', name: 'Rhea', kind: 'moon', parentId: 'saturn', radiusKm: 763.8, orbitKm: 527108, orbitalPeriodDays: 4.518, style: 'moon', color: '#bcb9b3' }),
  body({ id: 'titan', name: 'Titan', kind: 'moon', parentId: 'saturn', radiusKm: 2574.7, orbitKm: 1221870, orbitalPeriodDays: 15.945, style: 'titan', color: '#d3a15c' }),
  body({ id: 'hyperion', name: 'Hyperion', kind: 'moon', parentId: 'saturn', radiusKm: 135, orbitKm: 1481000, orbitalPeriodDays: 21.277, style: 'moon', color: '#9a7d61' }),
  body({ id: 'iapetus', name: 'Iapetus', kind: 'moon', parentId: 'saturn', radiusKm: 734.5, orbitKm: 3560820, orbitalPeriodDays: 79.3215, style: 'moon', color: '#7b726a' }),
  body({ id: 'phoebe', name: 'Phoebe', kind: 'moon', parentId: 'saturn', radiusKm: 106.5, orbitKm: 12952000, orbitalPeriodDays: -550.3, style: 'moon', color: '#645e5a' }),
  body({ id: 'janus', name: 'Janus', kind: 'moon', parentId: 'saturn', radiusKm: 89.5, orbitKm: 151472, orbitalPeriodDays: 0.695, style: 'moon', color: '#9b9388' }),
  body({ id: 'epimetheus', name: 'Epimetheus', kind: 'moon', parentId: 'saturn', radiusKm: 58.1, orbitKm: 151422, orbitalPeriodDays: 0.694, style: 'moon', color: '#918981' }),
  body({ id: 'atlas', name: 'Atlas', kind: 'moon', parentId: 'saturn', radiusKm: 15.1, orbitKm: 137670, orbitalPeriodDays: 0.602, style: 'moon', color: '#a79d91' }),
  body({ id: 'prometheus', name: 'Prometheus', kind: 'moon', parentId: 'saturn', radiusKm: 43.1, orbitKm: 139380, orbitalPeriodDays: 0.613, style: 'moon', color: '#988d80' }),
  body({ id: 'pandora', name: 'Pandora', kind: 'moon', parentId: 'saturn', radiusKm: 40.7, orbitKm: 141720, orbitalPeriodDays: 0.629, style: 'moon', color: '#8f867e' }),
  body({ id: 'pan', name: 'Pan', kind: 'moon', parentId: 'saturn', radiusKm: 14.1, orbitKm: 133584, orbitalPeriodDays: 0.575, style: 'moon', color: '#b4aa9c' }),
  body({ id: 'miranda', name: 'Miranda', kind: 'moon', parentId: 'uranus', radiusKm: 235.8, orbitKm: 129390, orbitalPeriodDays: 1.413, style: 'ice', color: '#b8b8b4' }),
  body({ id: 'ariel', name: 'Ariel', kind: 'moon', parentId: 'uranus', radiusKm: 578.9, orbitKm: 191020, orbitalPeriodDays: 2.52, style: 'ice', color: '#c7c7c2' }),
  body({ id: 'umbriel', name: 'Umbriel', kind: 'moon', parentId: 'uranus', radiusKm: 584.7, orbitKm: 266300, orbitalPeriodDays: 4.144, style: 'moon', color: '#666661' }),
  body({ id: 'titania', name: 'Titania', kind: 'moon', parentId: 'uranus', radiusKm: 788.9, orbitKm: 435910, orbitalPeriodDays: 8.706, style: 'moon', color: '#aaa9a2' }),
  body({ id: 'oberon', name: 'Oberon', kind: 'moon', parentId: 'uranus', radiusKm: 761.4, orbitKm: 583520, orbitalPeriodDays: 13.463, style: 'moon', color: '#8a8177' }),
  body({ id: 'puck', name: 'Puck', kind: 'moon', parentId: 'uranus', radiusKm: 81, orbitKm: 86000, orbitalPeriodDays: 0.762, style: 'moon', color: '#77726c' }),
  body({ id: 'triton', name: 'Triton', kind: 'moon', parentId: 'neptune', radiusKm: 1353.4, orbitKm: 354759, orbitalPeriodDays: -5.877, style: 'triton', color: '#c5a99d' }),
  body({ id: 'nereid', name: 'Nereid', kind: 'moon', parentId: 'neptune', radiusKm: 170, orbitKm: 5513400, orbitalPeriodDays: 360.1, style: 'moon', color: '#77736e' }),
  body({ id: 'proteus', name: 'Proteus', kind: 'moon', parentId: 'neptune', radiusKm: 210, orbitKm: 117647, orbitalPeriodDays: 1.122, style: 'moon', color: '#6f6c68' }),
  body({ id: 'larissa', name: 'Larissa', kind: 'moon', parentId: 'neptune', radiusKm: 97, orbitKm: 73548, orbitalPeriodDays: 0.555, style: 'moon', color: '#736e68' }),
  body({ id: 'galatea', name: 'Galatea', kind: 'moon', parentId: 'neptune', radiusKm: 88, orbitKm: 61953, orbitalPeriodDays: 0.429, style: 'moon', color: '#6f6b67' }),
  body({ id: 'despina', name: 'Despina', kind: 'moon', parentId: 'neptune', radiusKm: 75, orbitKm: 52526, orbitalPeriodDays: 0.335, style: 'moon', color: '#77716b' }),
  body({ id: 'thalassa', name: 'Thalassa', kind: 'moon', parentId: 'neptune', radiusKm: 41, orbitKm: 50075, orbitalPeriodDays: 0.311, style: 'moon', color: '#77726d' }),
  body({ id: 'naiad', name: 'Naiad', kind: 'moon', parentId: 'neptune', radiusKm: 33, orbitKm: 48227, orbitalPeriodDays: 0.294, style: 'moon', color: '#76726f' }),
  body({ id: 'charon', name: 'Charon', kind: 'moon', parentId: 'pluto', radiusKm: 606, orbitKm: 19596, orbitalPeriodDays: 6.387, style: 'moon', color: '#9e9b96' }),
  body({ id: 'styx', name: 'Styx', kind: 'moon', parentId: 'pluto', radiusKm: 5.2, orbitKm: 42656, orbitalPeriodDays: 20.16, style: 'moon', color: '#8a8782' }),
  body({ id: 'nix', name: 'Nix', kind: 'moon', parentId: 'pluto', radiusKm: 19.3, orbitKm: 48694, orbitalPeriodDays: 24.85, style: 'moon', color: '#aaa7a1' }),
  body({ id: 'kerberos', name: 'Kerberos', kind: 'moon', parentId: 'pluto', radiusKm: 6, orbitKm: 57783, orbitalPeriodDays: 32.17, style: 'moon', color: '#8e8a83' }),
  body({ id: 'hydra', name: 'Hydra', kind: 'moon', parentId: 'pluto', radiusKm: 25.4, orbitKm: 64738, orbitalPeriodDays: 38.2, style: 'moon', color: '#aaa7a0' }),
  body({ id: 'hiiaka', name: 'Hiʻiaka', kind: 'moon', parentId: 'haumea', radiusKm: 160, orbitKm: 49880, orbitalPeriodDays: 49.46, style: 'ice', color: '#d7dcdf' }),
  body({ id: 'namaka', name: 'Namaka', kind: 'moon', parentId: 'haumea', radiusKm: 85, orbitKm: 25657, orbitalPeriodDays: 18.28, style: 'ice', color: '#cbd2d6' }),
  body({ id: 'dysnomia', name: 'Dysnomia', kind: 'moon', parentId: 'eris', radiusKm: 350, orbitKm: 37350, orbitalPeriodDays: 15.786, style: 'moon', color: '#8f9294' }),
  body({ id: 'mk2', name: 'S/2015 (136472) 1', kind: 'moon', parentId: 'makemake', radiusKm: 80, orbitKm: 21000, orbitalPeriodDays: 12.4, style: 'moon', color: '#88827c' }),
  body({ id: 'xiangliu', name: 'Xiangliu', kind: 'moon', parentId: 'gonggong', radiusKm: 100, orbitKm: 24000, orbitalPeriodDays: 25.2, style: 'moon', color: '#79736d' }),
  body({ id: 'weywot', name: 'Weywot', kind: 'moon', parentId: 'quaoar', radiusKm: 85, orbitKm: 14500, orbitalPeriodDays: 12.44, style: 'moon', color: '#7b7773' }),
  body({ id: 'vanth', name: 'Vanth', kind: 'moon', parentId: 'orcus', radiusKm: 221, orbitKm: 9000, orbitalPeriodDays: 9.54, style: 'moon', color: '#898682' }),
  body({ id: 'actaea', name: 'Actaea', kind: 'moon', parentId: 'salacia', radiusKm: 150, orbitKm: 5600, orbitalPeriodDays: 5.49, style: 'moon', color: '#8b8884' }),
  body({ id: 'ilmarë', name: 'Ilmarë', kind: 'moon', parentId: 'varda', radiusKm: 163, orbitKm: 4800, orbitalPeriodDays: 5.75, style: 'moon', color: '#96918a' }),
]

export const SOLAR_BODY_MAP = new Map(SOLAR_BODIES.map((item) => [item.id, item]))
export const PRIMARY_DESTINATIONS = SOLAR_BODIES.filter((item) => item.kind === 'planet' || item.kind === 'dwarf' || item.kind === 'candidate')
export const MOON_DESTINATIONS = SOLAR_BODIES.filter((item) => item.kind === 'moon')
export function bodyDisplayClass(body: SolarBody): string {
  if (body.kind === 'candidate') return 'DWARF-PLANET CANDIDATE'
  return body.kind.toUpperCase()
}
export const AU_KM = 149_597_870.7
export const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0)
export const DAY_MS = 86_400_000
