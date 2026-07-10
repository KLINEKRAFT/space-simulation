/**
 * A curated subset of the brightest stars (a small HYG-style catalog) with
 * approximate J2000 right ascension / declination and visual magnitude, plus
 * line figures for recognizable constellations. Rendered on the celestial
 * sphere in the Milky Way view so the backdrop reads as a real sky.
 */

export interface BrightStar {
  id: string
  name: string
  raDeg: number
  decDeg: number
  mag: number
  color?: string
}

export interface Constellation {
  name: string
  lines: Array<[string, string]>
}

export const BRIGHT_STARS: BrightStar[] = [
  // Orion
  { id: 'betelgeuse', name: 'Betelgeuse', raDeg: 88.79, decDeg: 7.41, mag: 0.42, color: '#ff9d6b' },
  { id: 'rigel', name: 'Rigel', raDeg: 78.63, decDeg: -8.20, mag: 0.13, color: '#a9c9ff' },
  { id: 'bellatrix', name: 'Bellatrix', raDeg: 81.28, decDeg: 6.35, mag: 1.64, color: '#cfe0ff' },
  { id: 'saiph', name: 'Saiph', raDeg: 86.94, decDeg: -9.67, mag: 2.07, color: '#bcd4ff' },
  { id: 'alnitak', name: 'Alnitak', raDeg: 85.19, decDeg: -1.94, mag: 1.77, color: '#cfe0ff' },
  { id: 'alnilam', name: 'Alnilam', raDeg: 84.05, decDeg: -1.20, mag: 1.69, color: '#cfe0ff' },
  { id: 'mintaka', name: 'Mintaka', raDeg: 83.00, decDeg: -0.30, mag: 2.25, color: '#cfe0ff' },
  // Canis Major
  { id: 'sirius', name: 'Sirius', raDeg: 101.29, decDeg: -16.72, mag: -1.46, color: '#eaf1ff' },
  { id: 'mirzam', name: 'Mirzam', raDeg: 95.67, decDeg: -17.96, mag: 1.98, color: '#cfe0ff' },
  { id: 'adhara', name: 'Adhara', raDeg: 104.66, decDeg: -28.97, mag: 1.50, color: '#cfe0ff' },
  { id: 'wezen', name: 'Wezen', raDeg: 107.10, decDeg: -26.39, mag: 1.83, color: '#fff4e0' },
  { id: 'aludra', name: 'Aludra', raDeg: 111.02, decDeg: -29.30, mag: 2.45, color: '#cfe0ff' },
  // Taurus
  { id: 'aldebaran', name: 'Aldebaran', raDeg: 68.98, decDeg: 16.51, mag: 0.85, color: '#ffb98a' },
  { id: 'elnath', name: 'Elnath', raDeg: 81.57, decDeg: 28.61, mag: 1.65, color: '#cfe0ff' },
  { id: 'alcyone', name: 'Alcyone', raDeg: 56.87, decDeg: 24.10, mag: 2.87, color: '#cfe0ff' },
  // Gemini
  { id: 'pollux', name: 'Pollux', raDeg: 116.33, decDeg: 28.03, mag: 1.14, color: '#ffcf8a' },
  { id: 'castor', name: 'Castor', raDeg: 113.65, decDeg: 31.89, mag: 1.58, color: '#eaf1ff' },
  { id: 'alhena', name: 'Alhena', raDeg: 99.43, decDeg: 16.40, mag: 1.90, color: '#eaf1ff' },
  { id: 'mebsuta', name: 'Mebsuta', raDeg: 100.98, decDeg: 25.13, mag: 3.06 },
  { id: 'tejat', name: 'Tejat', raDeg: 95.74, decDeg: 22.51, mag: 2.87, color: '#ff9d6b' },
  // Ursa Major (Big Dipper)
  { id: 'dubhe', name: 'Dubhe', raDeg: 165.93, decDeg: 61.75, mag: 1.79, color: '#ffcf8a' },
  { id: 'merak', name: 'Merak', raDeg: 165.46, decDeg: 56.38, mag: 2.37, color: '#eaf1ff' },
  { id: 'phecda', name: 'Phecda', raDeg: 178.46, decDeg: 53.69, mag: 2.44 },
  { id: 'megrez', name: 'Megrez', raDeg: 183.86, decDeg: 57.03, mag: 3.31 },
  { id: 'alioth', name: 'Alioth', raDeg: 193.51, decDeg: 55.96, mag: 1.77 },
  { id: 'mizar', name: 'Mizar', raDeg: 200.98, decDeg: 54.93, mag: 2.23 },
  { id: 'alkaid', name: 'Alkaid', raDeg: 206.89, decDeg: 49.31, mag: 1.86, color: '#cfe0ff' },
  // Cassiopeia
  { id: 'schedar', name: 'Schedar', raDeg: 10.13, decDeg: 56.54, mag: 2.24, color: '#ffcf8a' },
  { id: 'caph', name: 'Caph', raDeg: 2.29, decDeg: 59.15, mag: 2.28 },
  { id: 'gamma-cas', name: 'γ Cassiopeiae', raDeg: 14.18, decDeg: 60.72, mag: 2.15, color: '#cfe0ff' },
  { id: 'ruchbah', name: 'Ruchbah', raDeg: 21.45, decDeg: 60.24, mag: 2.68 },
  { id: 'segin', name: 'Segin', raDeg: 28.60, decDeg: 63.67, mag: 3.35 },
  // Cygnus (Northern Cross)
  { id: 'deneb', name: 'Deneb', raDeg: 310.36, decDeg: 45.28, mag: 1.25, color: '#eaf1ff' },
  { id: 'sadr', name: 'Sadr', raDeg: 305.56, decDeg: 40.26, mag: 2.23, color: '#fff4e0' },
  { id: 'gienah-cyg', name: 'Gienah', raDeg: 311.55, decDeg: 33.97, mag: 2.48, color: '#ffcf8a' },
  { id: 'delta-cyg', name: 'δ Cygni', raDeg: 296.24, decDeg: 45.13, mag: 2.87 },
  { id: 'albireo', name: 'Albireo', raDeg: 292.68, decDeg: 27.96, mag: 3.08, color: '#ffcf8a' },
  // Lyra
  { id: 'vega', name: 'Vega', raDeg: 279.23, decDeg: 38.78, mag: 0.03, color: '#cfe0ff' },
  { id: 'sheliak', name: 'Sheliak', raDeg: 282.52, decDeg: 33.36, mag: 3.52 },
  { id: 'sulafat', name: 'Sulafat', raDeg: 284.74, decDeg: 32.69, mag: 3.24 },
  // Aquila
  { id: 'altair', name: 'Altair', raDeg: 297.70, decDeg: 8.87, mag: 0.76, color: '#eaf1ff' },
  { id: 'tarazed', name: 'Tarazed', raDeg: 296.56, decDeg: 10.61, mag: 2.72, color: '#ffb98a' },
  { id: 'alshain', name: 'Alshain', raDeg: 298.83, decDeg: 6.41, mag: 3.71 },
  // Leo
  { id: 'regulus', name: 'Regulus', raDeg: 152.09, decDeg: 11.97, mag: 1.35, color: '#cfe0ff' },
  { id: 'denebola', name: 'Denebola', raDeg: 177.26, decDeg: 14.57, mag: 2.11, color: '#eaf1ff' },
  { id: 'algieba', name: 'Algieba', raDeg: 154.99, decDeg: 19.84, mag: 2.28, color: '#ffcf8a' },
  { id: 'zosma', name: 'Zosma', raDeg: 168.53, decDeg: 20.52, mag: 2.56 },
  { id: 'chertan', name: 'Chertan', raDeg: 167.42, decDeg: 15.43, mag: 3.32 },
  { id: 'adhafera', name: 'Adhafera', raDeg: 154.17, decDeg: 23.42, mag: 3.43 },
  { id: 'rasalas', name: 'Rasalas', raDeg: 148.19, decDeg: 25.98, mag: 3.88 },
  { id: 'algenubi', name: 'Algenubi', raDeg: 146.46, decDeg: 23.77, mag: 2.98, color: '#ffcf8a' },
  // Boötes
  { id: 'arcturus', name: 'Arcturus', raDeg: 213.92, decDeg: 19.18, mag: -0.05, color: '#ffb98a' },
  { id: 'izar', name: 'Izar', raDeg: 221.25, decDeg: 27.07, mag: 2.35, color: '#ffcf8a' },
  { id: 'muphrid', name: 'Muphrid', raDeg: 208.67, decDeg: 18.40, mag: 2.68 },
  { id: 'seginus', name: 'Seginus', raDeg: 218.02, decDeg: 38.31, mag: 3.03 },
  { id: 'nekkar', name: 'Nekkar', raDeg: 225.49, decDeg: 40.39, mag: 3.49 },
  // Scorpius
  { id: 'antares', name: 'Antares', raDeg: 247.35, decDeg: -26.43, mag: 1.09, color: '#ff7a5a' },
  { id: 'shaula', name: 'Shaula', raDeg: 263.40, decDeg: -37.10, mag: 1.63, color: '#cfe0ff' },
  { id: 'sargas', name: 'Sargas', raDeg: 264.33, decDeg: -43.00, mag: 1.86, color: '#fff4e0' },
  { id: 'dschubba', name: 'Dschubba', raDeg: 240.08, decDeg: -22.62, mag: 2.29, color: '#cfe0ff' },
  { id: 'graffias', name: 'Graffias', raDeg: 241.36, decDeg: -19.81, mag: 2.56 },
  { id: 'pi-sco', name: 'π Scorpii', raDeg: 239.71, decDeg: -26.11, mag: 2.89 },
  { id: 'epsilon-sco', name: 'ε Scorpii', raDeg: 252.97, decDeg: -34.29, mag: 2.29, color: '#ffcf8a' },
  { id: 'kappa-sco', name: 'κ Scorpii', raDeg: 265.62, decDeg: -39.03, mag: 2.39 },
  { id: 'iota-sco', name: 'ι Scorpii', raDeg: 266.90, decDeg: -40.13, mag: 2.99 },
  // Crux (Southern Cross) + Centaurus pointers
  { id: 'acrux', name: 'Acrux', raDeg: 186.65, decDeg: -63.10, mag: 0.76, color: '#a9c9ff' },
  { id: 'mimosa', name: 'Mimosa', raDeg: 191.93, decDeg: -59.69, mag: 1.25, color: '#a9c9ff' },
  { id: 'gacrux', name: 'Gacrux', raDeg: 187.79, decDeg: -57.11, mag: 1.63, color: '#ffb98a' },
  { id: 'imai', name: 'Imai', raDeg: 183.79, decDeg: -58.75, mag: 2.79 },
  { id: 'rigil-kent', name: 'Rigil Kentaurus', raDeg: 219.90, decDeg: -60.83, mag: -0.27, color: '#fff2d6' },
  { id: 'hadar', name: 'Hadar', raDeg: 210.96, decDeg: -60.37, mag: 0.61, color: '#a9c9ff' },
  // Bright ambiance (no line figures)
  { id: 'canopus', name: 'Canopus', raDeg: 95.99, decDeg: -52.70, mag: -0.74, color: '#fdf6e8' },
  { id: 'achernar', name: 'Achernar', raDeg: 24.43, decDeg: -57.24, mag: 0.46, color: '#cfe0ff' },
  { id: 'procyon', name: 'Procyon', raDeg: 114.83, decDeg: 5.22, mag: 0.34, color: '#fff4e0' },
  { id: 'capella', name: 'Capella', raDeg: 79.17, decDeg: 46.00, mag: 0.08, color: '#ffcf8a' },
  { id: 'spica', name: 'Spica', raDeg: 201.30, decDeg: -11.16, mag: 0.97, color: '#cfe0ff' },
  { id: 'fomalhaut', name: 'Fomalhaut', raDeg: 344.41, decDeg: -29.62, mag: 1.16, color: '#eaf1ff' },
  { id: 'polaris', name: 'Polaris', raDeg: 37.95, decDeg: 89.26, mag: 1.98, color: '#fff4e0' },
  { id: 'mirfak', name: 'Mirfak', raDeg: 51.08, decDeg: 49.86, mag: 1.79, color: '#fff4e0' },
  { id: 'alphard', name: 'Alphard', raDeg: 141.90, decDeg: -8.66, mag: 1.98, color: '#ffb98a' },
  { id: 'kaus-australis', name: 'Kaus Australis', raDeg: 276.04, decDeg: -34.38, mag: 1.85, color: '#cfe0ff' },
  { id: 'nunki', name: 'Nunki', raDeg: 283.82, decDeg: -26.30, mag: 2.05, color: '#cfe0ff' },
]

export const BRIGHT_STAR_MAP = new Map(BRIGHT_STARS.map((star) => [star.id, star]))

/** Stars that get a floating name label (the most recognizable). */
export const LABELED_STARS = new Set([
  'sirius', 'betelgeuse', 'rigel', 'vega', 'arcturus', 'capella', 'procyon', 'aldebaran',
  'antares', 'spica', 'pollux', 'deneb', 'altair', 'regulus', 'canopus', 'polaris',
  'acrux', 'rigil-kent', 'fomalhaut',
])

export const CONSTELLATIONS: Constellation[] = [
  { name: 'Orion', lines: [
    ['bellatrix', 'betelgeuse'], ['betelgeuse', 'alnitak'], ['bellatrix', 'mintaka'],
    ['mintaka', 'alnilam'], ['alnilam', 'alnitak'], ['mintaka', 'rigel'],
    ['alnitak', 'saiph'], ['rigel', 'saiph'],
  ] },
  { name: 'Canis Major', lines: [
    ['sirius', 'mirzam'], ['sirius', 'adhara'], ['adhara', 'wezen'], ['wezen', 'aludra'], ['wezen', 'sirius'],
  ] },
  { name: 'Gemini', lines: [
    ['castor', 'pollux'], ['castor', 'mebsuta'], ['mebsuta', 'tejat'], ['pollux', 'alhena'],
  ] },
  { name: 'Taurus', lines: [['aldebaran', 'elnath'], ['aldebaran', 'alcyone']] },
  { name: 'Ursa Major', lines: [
    ['dubhe', 'merak'], ['merak', 'phecda'], ['phecda', 'megrez'], ['megrez', 'dubhe'],
    ['megrez', 'alioth'], ['alioth', 'mizar'], ['mizar', 'alkaid'],
  ] },
  { name: 'Cassiopeia', lines: [
    ['caph', 'schedar'], ['schedar', 'gamma-cas'], ['gamma-cas', 'ruchbah'], ['ruchbah', 'segin'],
  ] },
  { name: 'Cygnus', lines: [
    ['deneb', 'sadr'], ['sadr', 'albireo'], ['gienah-cyg', 'sadr'], ['sadr', 'delta-cyg'],
  ] },
  { name: 'Lyra', lines: [['vega', 'sheliak'], ['sheliak', 'sulafat'], ['sulafat', 'vega']] },
  { name: 'Aquila', lines: [['altair', 'tarazed'], ['altair', 'alshain']] },
  { name: 'Leo', lines: [
    ['algenubi', 'rasalas'], ['rasalas', 'adhafera'], ['adhafera', 'algieba'], ['algieba', 'regulus'],
    ['regulus', 'chertan'], ['chertan', 'denebola'], ['denebola', 'zosma'], ['zosma', 'algieba'],
  ] },
  { name: 'Boötes', lines: [
    ['arcturus', 'izar'], ['izar', 'seginus'], ['seginus', 'nekkar'], ['arcturus', 'muphrid'],
  ] },
  { name: 'Scorpius', lines: [
    ['graffias', 'dschubba'], ['dschubba', 'pi-sco'], ['dschubba', 'antares'],
    ['antares', 'epsilon-sco'], ['epsilon-sco', 'kappa-sco'], ['kappa-sco', 'shaula'],
    ['shaula', 'sargas'], ['sargas', 'iota-sco'],
  ] },
  { name: 'Crux', lines: [['acrux', 'gacrux'], ['mimosa', 'imai']] },
  { name: 'Centaurus', lines: [['rigil-kent', 'hadar']] },
]
