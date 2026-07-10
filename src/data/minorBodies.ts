import type { BodyKind, SolarBody } from './solarCatalog'

/**
 * A programmatically generated catalog of ~1,000 small solar-system bodies:
 * named main-belt asteroids with published orbital elements, a distributed
 * main belt filling the Kirkwood-gap structure, Jupiter Trojans clustered at
 * the L4/L5 points, trans-Neptunian objects, near-Earth asteroids, and a set
 * of well-known comets on eccentric orbits.
 *
 * These are rendered collectively as a performant point field (not individual
 * meshes) but are individually selectable from the catalog — selecting one
 * flies the camera to its Keplerian position for the current epoch.
 */

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Kepler's third law: orbital period in days for a semi-major axis in AU. */
function periodDays(semiMajorAxisAu: number): number {
  return 365.25 * Math.pow(Math.max(0.001, semiMajorAxisAu), 1.5)
}

interface MinorSeed {
  name: string
  a: number
  e: number
  i: number
  radiusKm: number
  blurb?: string
}

// Largest / most famous main-belt asteroids with approximate real elements.
const NAMED_BELT: MinorSeed[] = [
  { name: '4 Vesta', a: 2.362, e: 0.089, i: 7.14, radiusKm: 262.7, blurb: 'The brightest asteroid and second most massive, with a giant basaltic impact basin at its south pole. Visited by NASA’s Dawn in 2011.' },
  { name: '2 Pallas', a: 2.772, e: 0.231, i: 34.83, radiusKm: 256, blurb: 'The third-largest asteroid, on a steeply inclined orbit that makes it hard to reach despite its size.' },
  { name: '10 Hygiea', a: 3.139, e: 0.112, i: 3.83, radiusKm: 217, blurb: 'The fourth-largest asteroid and, being nearly round, a possible dwarf-planet candidate.' },
  { name: '511 Davida', a: 3.168, e: 0.186, i: 15.94, radiusKm: 143 },
  { name: '704 Interamnia', a: 3.062, e: 0.155, i: 17.29, radiusKm: 166 },
  { name: '52 Europa', a: 3.095, e: 0.109, i: 7.48, radiusKm: 152 },
  { name: '3 Juno', a: 2.669, e: 0.256, i: 12.99, radiusKm: 127 },
  { name: '16 Psyche', a: 2.923, e: 0.134, i: 3.10, radiusKm: 111, blurb: 'A metal-rich asteroid thought to be the exposed core of a shattered protoplanet — the target of NASA’s Psyche mission.' },
  { name: '65 Cybele', a: 3.433, e: 0.105, i: 3.56, radiusKm: 118 },
  { name: '87 Sylvia', a: 3.485, e: 0.089, i: 10.87, radiusKm: 143, blurb: 'A large asteroid with two small moons, Romulus and Remus.' },
  { name: '15 Eunomia', a: 2.643, e: 0.187, i: 11.75, radiusKm: 116 },
  { name: '31 Euphrosyne', a: 3.155, e: 0.223, i: 26.28, radiusKm: 128 },
  { name: '624 Hektor', a: 5.234, e: 0.024, i: 18.18, radiusKm: 113 },
  { name: '532 Herculina', a: 2.771, e: 0.176, i: 16.31, radiusKm: 111 },
  { name: '1 Ceres', a: 2.767, e: 0.076, i: 10.59, radiusKm: 469, blurb: 'The largest object in the asteroid belt and a dwarf planet, with bright salt deposits in Occator crater.' },
  { name: '7 Iris', a: 2.386, e: 0.231, i: 5.52, radiusKm: 99 },
  { name: '324 Bamberga', a: 2.681, e: 0.338, i: 11.10, radiusKm: 114 },
  { name: '451 Patientia', a: 3.062, e: 0.076, i: 15.24, radiusKm: 112 },
  { name: '48 Doris', a: 3.110, e: 0.073, i: 6.55, radiusKm: 111 },
  { name: '13 Egeria', a: 2.577, e: 0.085, i: 16.53, radiusKm: 103 },
  { name: '9 Metis', a: 2.386, e: 0.123, i: 5.58, radiusKm: 95 },
  { name: '19 Fortuna', a: 2.442, e: 0.158, i: 1.57, radiusKm: 100 },
  { name: '29 Amphitrite', a: 2.554, e: 0.073, i: 6.09, radiusKm: 106 },
  { name: '423 Diotima', a: 3.067, e: 0.037, i: 11.24, radiusKm: 104 },
  { name: '106 Dione', a: 3.180, e: 0.166, i: 4.62, radiusKm: 74 },
  { name: '45 Eugenia', a: 2.721, e: 0.083, i: 6.61, radiusKm: 107, blurb: 'A large asteroid orbited by two small moons, Petit-Prince and S/2004.' },
  { name: '128 Nemesis', a: 2.749, e: 0.127, i: 6.24, radiusKm: 100 },
  { name: '94 Aurora', a: 3.160, e: 0.088, i: 7.97, radiusKm: 102 },
  { name: '702 Alauda', a: 3.194, e: 0.028, i: 20.58, radiusKm: 96 },
  { name: '121 Hermione', a: 3.457, e: 0.131, i: 7.60, radiusKm: 95 },
  { name: '6 Hebe', a: 2.426, e: 0.203, i: 14.75, radiusKm: 93 },
  { name: '8 Flora', a: 2.201, e: 0.156, i: 5.89, radiusKm: 68 },
  { name: '5 Astraea', a: 2.574, e: 0.191, i: 5.37, radiusKm: 58 },
  { name: '20 Massalia', a: 2.409, e: 0.143, i: 0.71, radiusKm: 73 },
  { name: '11 Parthenope', a: 2.453, e: 0.100, i: 4.63, radiusKm: 76 },
  { name: '39 Laetitia', a: 2.769, e: 0.113, i: 10.37, radiusKm: 75 },
  { name: '354 Eleonora', a: 2.797, e: 0.115, i: 18.40, radiusKm: 78 },
  { name: '18 Melpomene', a: 2.296, e: 0.218, i: 10.13, radiusKm: 70 },
  { name: '349 Dembowska', a: 2.925, e: 0.091, i: 8.24, radiusKm: 70 },
  { name: '89 Julia', a: 2.551, e: 0.184, i: 16.13, radiusKm: 75 },
  { name: '216 Kleopatra', a: 2.794, e: 0.251, i: 13.11, radiusKm: 62, blurb: 'A metallic, dog-bone-shaped asteroid with two tiny moons.' },
  { name: '22 Kalliope', a: 2.911, e: 0.099, i: 13.70, radiusKm: 83 },
  { name: '444 Gyptis', a: 2.769, e: 0.174, i: 10.28, radiusKm: 84 },
  { name: '24 Themis', a: 3.138, e: 0.124, i: 0.75, radiusKm: 99, blurb: 'Surface water ice has been detected on this dark outer-belt asteroid.' },
  { name: '412 Elisabetha', a: 2.756, e: 0.041, i: 13.83, radiusKm: 65 },
  { name: 'laetitia', a: 2.77, e: 0.11, i: 10.4, radiusKm: 74 },
]

const BELT_NAME_POOL = [
  'Melete', 'Kalypso', 'Aemilia', 'Una', 'Athor', 'Erigone', 'Loreley', 'Ophelia', 'Baucis', 'Ino',
  'Phaedra', 'Andromache', 'Iduna', 'Irma', 'Belisana', 'Garumna', 'Eucharis', 'Elpis', 'Nemausa', 'Europa',
  'Alexandra', 'Pandora', 'Mnemosyne', 'Concordia', 'Echo', 'Danae', 'Erato', 'Ausonia', 'Angelina', 'Maja',
  'Asia', 'Leto', 'Hesperia', 'Panopaea', 'Niobe', 'Feronia', 'Klytia', 'Galatea', 'Eurydike', 'Frigga',
  'Diana', 'Eurynome', 'Sappho', 'Terpsichore', 'Alkmene', 'Beatrix', 'Klio', 'Semele', 'Thisbe', 'Antiope',
  'Aegina', 'Undina', 'Minerva', 'Arethusa', 'Aegle', 'Klotho', 'Ianthe', 'Dike', 'Hekate', 'Helena',
  'Miriam', 'Hera', 'Klymene', 'Artemis', 'Hecuba', 'Felicitas', 'Lydia', 'Ate', 'Iphigenia', 'Kassandra',
  'Adorea', 'Justitia', 'Bertha', 'Xanthippe', 'Dejanira', 'Koronis', 'Laurentia', 'Eva', 'Thia', 'Ismene',
  'Hilda', 'Palma', 'Melpomene', 'Nausikaa', 'Prokne', 'Eurybia', 'Philomela', 'Ampella', 'Byblis', 'Dynamene',
  'Penelope', 'Chryseis', 'Pompeja', 'Kolga', 'Nephthys', 'Eukrate', 'Lameia', 'Ilse', 'Bettina', 'Sophia',
  'Clementina', 'Emma', 'Amalthea', 'Nerthus', 'Marion', 'Laodica', 'Bruna', 'Iolanda', 'Gudrun', 'Brunhild',
  'Karin', 'Ottilia', 'Chloe', 'Aline', 'Tergeste', 'Marbachia', 'Notburga', 'Prudentia', 'Ara', 'Gerlinde',
  'Judith', 'Sabine', 'Palatia', 'Vaticana', 'Suleika', 'Dulcinea', 'Colchis', 'Mireille', 'Bettina', 'Sophie',
]

const TROJAN_NAMES = [
  'Achilles', 'Patroclus', 'Hektor', 'Nestor', 'Agamemnon', 'Odysseus', 'Ajax', 'Diomedes', 'Antilochus', 'Menelaus',
  'Aeneas', 'Anchises', 'Troilus', 'Deiphobus', 'Priamus', 'Paris', 'Sarpedon', 'Aisyetes', 'Cebriones', 'Sinon',
  'Palamedes', 'Machaon', 'Teucer', 'Thersites', 'Automedon', 'Neoptolemus', 'Idomeneus', 'Deucalion', 'Panthoos', 'Laomedon',
]

const TNO_NAMES = [
  'Chaos', 'Deucalion', 'Huya', 'Rhadamanthus', 'Logos', 'Teharonhiawako', 'Ceto', 'Typhon', 'Altjira', 'Borasisi',
  'Sila-Nunam', 'Lempo', 'Praamzius', 'Varda', 'Chariklo', 'Chiron', 'Pholus', 'Asbolus', 'Bienor', 'Amycus',
  'Thereus', 'Okyrhoe', 'Echeclus', 'Elatus', 'Cyllarus', 'Hylonome', 'Manwe', 'Dziewanna', 'Arawn', 'Mors-Somnus',
  'Gǃkúnǁʼhomdima', 'Salacia', 'Actaea', 'Chimera', 'Rhiphonos', 'Kolyo', 'Pelion', 'Nessus', 'Crantor', 'Bellerophon',
]

const NEA_SEEDS: MinorSeed[] = [
  { name: '433 Eros', a: 1.458, e: 0.223, i: 10.83, radiusKm: 8.4, blurb: 'The first asteroid orbited and landed on by a spacecraft (NEAR Shoemaker, 2000–2001).' },
  { name: '99942 Apophis', a: 0.922, e: 0.191, i: 3.34, radiusKm: 0.17, blurb: 'A near-Earth asteroid that will pass closer than geostationary satellites on 13 April 2029.' },
  { name: '101955 Bennu', a: 1.126, e: 0.204, i: 6.03, radiusKm: 0.24, blurb: 'A carbon-rich rubble pile sampled by OSIRIS-REx, whose return capsule reached Earth in 2023.' },
  { name: '162173 Ryugu', a: 1.190, e: 0.190, i: 5.88, radiusKm: 0.45, blurb: 'A spinning-top-shaped asteroid sampled by Japan’s Hayabusa2.' },
  { name: '25143 Itokawa', a: 1.324, e: 0.280, i: 1.62, radiusKm: 0.17, blurb: 'A tiny rubble-pile asteroid; the first from which samples were returned (Hayabusa, 2010).' },
  { name: '3200 Phaethon', a: 1.271, e: 0.890, i: 22.26, radiusKm: 2.9, blurb: 'The parent body of the Geminid meteor shower, approaching the Sun closer than Mercury.' },
  { name: '1620 Geographos', a: 1.246, e: 0.335, i: 13.34, radiusKm: 1.3 },
  { name: '4179 Toutatis', a: 2.530, e: 0.629, i: 0.45, radiusKm: 2.1 },
  { name: '1566 Icarus', a: 1.078, e: 0.827, i: 22.83, radiusKm: 0.7 },
  { name: '1036 Ganymed', a: 2.665, e: 0.534, i: 26.68, radiusKm: 18.3 },
  { name: '3122 Florence', a: 1.769, e: 0.423, i: 22.15, radiusKm: 2.3 },
  { name: '4769 Castalia', a: 1.063, e: 0.483, i: 8.89, radiusKm: 0.4 },
  { name: '4660 Nereus', a: 1.489, e: 0.360, i: 1.43, radiusKm: 0.17 },
  { name: '65803 Didymos', a: 1.644, e: 0.384, i: 3.41, radiusKm: 0.39, blurb: 'Its moonlet Dimorphos was struck by NASA’s DART in 2022 in the first planetary-defense deflection test.' },
  { name: '1862 Apollo', a: 1.471, e: 0.560, i: 6.35, radiusKm: 0.85 },
  { name: '2062 Aten', a: 0.967, e: 0.183, i: 18.93, radiusKm: 0.5 },
  { name: '1863 Antinous', a: 2.259, e: 0.606, i: 18.40, radiusKm: 1.4 },
  { name: '2101 Adonis', a: 1.874, e: 0.765, i: 1.33, radiusKm: 0.3 },
  { name: '69230 Hermes', a: 1.655, e: 0.624, i: 6.07, radiusKm: 0.4 },
  { name: '4183 Cuno', a: 1.982, e: 0.636, i: 6.70, radiusKm: 2.4 },
]

const COMET_SEEDS: MinorSeed[] = [
  { name: '1P/Halley', a: 17.83, e: 0.967, i: 162.26, radiusKm: 5.5, blurb: 'The most famous comet, returning about every 76 years; next perihelion 2061.' },
  { name: '2P/Encke', a: 2.215, e: 0.848, i: 11.78, radiusKm: 2.4, blurb: 'The comet with the shortest known orbital period, 3.3 years.' },
  { name: '55P/Tempel-Tuttle', a: 10.34, e: 0.906, i: 162.49, radiusKm: 1.8, blurb: 'The parent comet of the Leonid meteor showers.' },
  { name: '109P/Swift-Tuttle', a: 26.09, e: 0.963, i: 113.45, radiusKm: 13, blurb: 'The parent comet of the Perseid meteor shower.' },
  { name: '67P/Churyumov–Gerasimenko', a: 3.463, e: 0.641, i: 7.04, radiusKm: 2.0, blurb: 'The rubber-duck-shaped comet orbited and landed on by ESA’s Rosetta and Philae.' },
  { name: '19P/Borrelly', a: 3.61, e: 0.624, i: 30.32, radiusKm: 4.0 },
  { name: '81P/Wild', a: 3.45, e: 0.537, i: 3.24, radiusKm: 2.0 },
  { name: '9P/Tempel', a: 3.14, e: 0.512, i: 10.47, radiusKm: 3.0 },
  { name: '103P/Hartley', a: 3.47, e: 0.694, i: 13.60, radiusKm: 0.6 },
  { name: 'C/1995 O1 Hale–Bopp', a: 186, e: 0.995, i: 89.43, radiusKm: 30, blurb: 'The Great Comet of 1997, visible to the naked eye for a record 18 months.' },
  { name: 'C/1996 B2 Hyakutake', a: 1700, e: 0.9998, i: 124.9, radiusKm: 2.1 },
  { name: 'C/2020 F3 NEOWISE', a: 358, e: 0.999, i: 128.9, radiusKm: 2.5, blurb: 'A bright comet widely seen in July 2020.' },
  { name: 'C/1858 L1 Donati', a: 156, e: 0.996, i: 116.9, radiusKm: 3 },
  { name: 'C/2006 P1 McNaught', a: 220, e: 0.9999, i: 77.8, radiusKm: 12.5 },
  { name: '153P/Ikeya–Zhang', a: 51.0, e: 0.990, i: 28.12, radiusKm: 2.0 },
  { name: '17P/Holmes', a: 3.62, e: 0.432, i: 19.11, radiusKm: 1.7 },
  { name: '21P/Giacobini–Zinner', a: 3.50, e: 0.706, i: 31.99, radiusKm: 1.0 },
  { name: '46P/Wirtanen', a: 3.09, e: 0.658, i: 11.75, radiusKm: 0.6 },
  { name: '73P/Schwassmann–Wachmann', a: 3.06, e: 0.693, i: 11.39, radiusKm: 0.5 },
  { name: '8P/Tuttle', a: 5.70, e: 0.820, i: 54.98, radiusKm: 2.3 },
]

function makeBody(
  id: string,
  name: string,
  kind: BodyKind,
  a: number,
  e: number,
  i: number,
  radiusKm: number,
  meanLongitudeDeg: number,
  color: string,
  blurb?: string,
): SolarBody {
  return {
    id,
    name,
    kind,
    parentId: 'sun',
    radiusKm,
    semiMajorAxisAu: Number(a.toFixed(3)),
    orbitalPeriodDays: Math.round(periodDays(a)),
    eccentricity: Number(e.toFixed(3)),
    inclinationDeg: Number(i.toFixed(2)),
    meanLongitudeDeg: Number(meanLongitudeDeg.toFixed(1)),
    rotationPeriodDays: 0.2 + radiusKm / 400,
    style: 'dwarf',
    color,
    blurb,
  }
}

function buildMinorBodies(): SolarBody[] {
  const random = mulberry32(0x5eed_a17e)
  const bodies: SolarBody[] = []
  const seen = new Set<string>()
  const slug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const push = (body: SolarBody) => {
    let id = body.id
    let n = 2
    while (seen.has(id)) id = `${body.id}-${n++}`
    seen.add(id)
    bodies.push({ ...body, id })
  }

  // 1) Named main-belt asteroids with published elements.
  for (const seed of NAMED_BELT) {
    push(makeBody(`mb:${slug(seed.name)}`, seed.name, 'asteroid', seed.a, seed.e, seed.i, seed.radiusKm, random() * 360, '#9a8f80', seed.blurb))
  }

  // 2) Distributed main belt honouring the Kirkwood gaps (2.06–3.28 AU).
  const kirkwoodGaps = [2.502, 2.825, 2.958, 3.279]
  let poolIndex = 0
  let mainBeltTarget = 720
  let attempts = 0
  while (mainBeltTarget > 0 && attempts < 6000) {
    attempts += 1
    const a = 2.06 + random() * (3.28 - 2.06)
    // Reject samples inside a resonance gap.
    if (kirkwoodGaps.some((gap) => Math.abs(a - gap) < 0.018 + random() * 0.01)) continue
    const e = Math.min(0.35, Math.abs(random() + random() - 1) * 0.28)
    const i = Math.abs(random() + random() - 1) * 22
    const radiusKm = 1.2 + Math.pow(random(), 3) * 55
    const named = poolIndex < BELT_NAME_POOL.length && random() < 0.5
    const name = named
      ? BELT_NAME_POOL[poolIndex++]
      : `${1900 + Math.floor(random() * 125)} ${String.fromCharCode(65 + Math.floor(random() * 26))}${String.fromCharCode(65 + Math.floor(random() * 26))}${Math.floor(random() * 30)}`
    push(makeBody(`mb:gen-${bodies.length}`, name, 'asteroid', a, e, i, radiusKm, random() * 360, '#8f8578'))
    mainBeltTarget -= 1
  }

  // 3) Jupiter Trojans clustered at the L4 (leading) and L5 (trailing) points.
  const jupiterLongitude = 34.4
  for (let index = 0; index < 130; index += 1) {
    const lead = index % 2 === 0
    const camp = lead ? 60 : -60
    const a = 5.05 + (random() + random() - 1) * 0.18
    const e = random() * 0.12
    const i = Math.abs(random() + random() - 1) * 30
    const meanLongitude = jupiterLongitude + camp + (random() + random() - 1) * 22
    const radiusKm = 2 + Math.pow(random(), 2.4) * 60
    const name = index < TROJAN_NAMES.length
      ? TROJAN_NAMES[index]
      : `${lead ? 'L4' : 'L5'} ${2000 + Math.floor(random() * 25)} ${String.fromCharCode(65 + Math.floor(random() * 26))}${Math.floor(random() * 90)}`
    push(makeBody(`troj:${index}`, name, 'trojan', a, e, i, radiusKm, ((meanLongitude % 360) + 360) % 360, '#a5794f'))
  }

  // 4) Trans-Neptunian objects (classical belt, resonant, and scattered).
  for (let index = 0; index < 140; index += 1) {
    const scattered = random() < 0.28
    const a = scattered ? 45 + random() * 90 : 39 + random() * 9
    const e = scattered ? 0.2 + random() * 0.45 : random() * 0.18
    const i = Math.abs(random() + random() - 1) * 34
    const radiusKm = 30 + Math.pow(random(), 2.2) * 380
    const name = index < TNO_NAMES.length
      ? TNO_NAMES[index]
      : `${2000 + Math.floor(random() * 24)} ${String.fromCharCode(65 + Math.floor(random() * 26))}${String.fromCharCode(65 + Math.floor(random() * 26))}${Math.floor(random() * 300)}`
    push(makeBody(`tno:${index}`, name, 'tno', a, e, i, radiusKm, random() * 360, '#6f8ea8'))
  }

  // 5) Near-Earth asteroids.
  for (const seed of NEA_SEEDS) {
    push(makeBody(`nea:${slug(seed.name)}`, seed.name, 'nea', seed.a, seed.e, seed.i, seed.radiusKm, random() * 360, '#c06a4a', seed.blurb))
  }
  for (let index = 0; index < 30; index += 1) {
    const a = 0.8 + random() * 1.7
    const e = 0.1 + random() * 0.6
    const i = Math.abs(random() + random() - 1) * 30
    const radiusKm = 0.1 + Math.pow(random(), 2) * 6
    const name = `${1990 + Math.floor(random() * 35)} ${String.fromCharCode(65 + Math.floor(random() * 26))}${String.fromCharCode(65 + Math.floor(random() * 26))}${Math.floor(random() * 400)}`
    push(makeBody(`nea:gen-${index}`, name, 'nea', a, e, i, radiusKm, random() * 360, '#b86747'))
  }

  // 6) Comets on eccentric, often highly inclined orbits.
  for (const seed of COMET_SEEDS) {
    push(makeBody(`comet:${slug(seed.name)}`, seed.name, 'comet', seed.a, seed.e, seed.i, seed.radiusKm, random() * 360, '#7fd8d0', seed.blurb))
  }

  return bodies
}

export const MINOR_BODIES: SolarBody[] = buildMinorBodies()
export const MINOR_BODY_MAP = new Map(MINOR_BODIES.map((body) => [body.id, body]))
