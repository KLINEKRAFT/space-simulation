export interface ExoplanetPlanet {
  name: string
  radiusEarth?: number
  massEarth?: number
  semiMajorAxisAu?: number
  orbitalPeriodDays?: number
  equilibriumTempK?: number
  eccentricity?: number
}

export interface ExoplanetSystem {
  id: string
  hostname: string
  raDeg: number
  decDeg: number
  distancePc?: number
  stellarRadiusSolar?: number
  stellarTemperatureK?: number
  planets: ExoplanetPlanet[]
}

interface ArchiveRow {
  pl_name: string
  hostname: string
  ra: number | null
  dec: number | null
  sy_dist: number | null
  st_rad: number | null
  st_teff: number | null
  pl_rade: number | null
  pl_bmasse: number | null
  pl_orbsmax: number | null
  pl_orbper: number | null
  pl_eqt: number | null
  pl_orbeccen: number | null
}

const FALLBACK_SYSTEMS: ExoplanetSystem[] = [
  {
    id: 'exo:proxima-centauri', hostname: 'Proxima Centauri', raDeg: 217.429, decDeg: -62.679,
    distancePc: 1.301, stellarRadiusSolar: 0.154, stellarTemperatureK: 3042,
    planets: [
      { name: 'Proxima Cen b', radiusEarth: 1.1, massEarth: 1.27, semiMajorAxisAu: 0.0485, orbitalPeriodDays: 11.186 },
      { name: 'Proxima Cen d', massEarth: 0.26, semiMajorAxisAu: 0.0289, orbitalPeriodDays: 5.123 },
    ],
  },
  {
    id: 'exo:trappist-1', hostname: 'TRAPPIST-1', raDeg: 346.622, decDeg: -5.041,
    distancePc: 12.43, stellarRadiusSolar: 0.119, stellarTemperatureK: 2566,
    planets: [
      { name: 'TRAPPIST-1 b', radiusEarth: 1.116, semiMajorAxisAu: 0.0115, orbitalPeriodDays: 1.511 },
      { name: 'TRAPPIST-1 c', radiusEarth: 1.097, semiMajorAxisAu: 0.0158, orbitalPeriodDays: 2.422 },
      { name: 'TRAPPIST-1 d', radiusEarth: 0.788, semiMajorAxisAu: 0.0223, orbitalPeriodDays: 4.05 },
      { name: 'TRAPPIST-1 e', radiusEarth: 0.92, semiMajorAxisAu: 0.0293, orbitalPeriodDays: 6.101 },
      { name: 'TRAPPIST-1 f', radiusEarth: 1.045, semiMajorAxisAu: 0.0385, orbitalPeriodDays: 9.208 },
      { name: 'TRAPPIST-1 g', radiusEarth: 1.129, semiMajorAxisAu: 0.0469, orbitalPeriodDays: 12.353 },
      { name: 'TRAPPIST-1 h', radiusEarth: 0.755, semiMajorAxisAu: 0.0619, orbitalPeriodDays: 18.767 },
    ],
  },
  {
    id: 'exo:tau-ceti', hostname: 'tau Cet', raDeg: 26.017, decDeg: -15.937,
    distancePc: 3.65, stellarRadiusSolar: 0.79, stellarTemperatureK: 5344,
    planets: [
      { name: 'tau Cet e', massEarth: 3.93, semiMajorAxisAu: 0.538, orbitalPeriodDays: 162.87 },
      { name: 'tau Cet f', massEarth: 3.93, semiMajorAxisAu: 1.334, orbitalPeriodDays: 636.13 },
    ],
  },
  {
    id: 'exo:kepler-186', hostname: 'Kepler-186', raDeg: 299.668, decDeg: 43.964,
    distancePc: 177.6, stellarRadiusSolar: 0.523, stellarTemperatureK: 3788,
    planets: [
      { name: 'Kepler-186 b', radiusEarth: 1.07, orbitalPeriodDays: 3.887 },
      { name: 'Kepler-186 c', radiusEarth: 1.25, orbitalPeriodDays: 7.267 },
      { name: 'Kepler-186 d', radiusEarth: 1.4, orbitalPeriodDays: 13.343 },
      { name: 'Kepler-186 e', radiusEarth: 1.27, orbitalPeriodDays: 22.408 },
      { name: 'Kepler-186 f', radiusEarth: 1.17, orbitalPeriodDays: 129.946 },
    ],
  },
  {
    id: 'exo:51-pegasi', hostname: '51 Peg', raDeg: 344.367, decDeg: 20.769,
    distancePc: 15.46, stellarRadiusSolar: 1.24, stellarTemperatureK: 5793,
    planets: [{ name: '51 Peg b', massEarth: 150, semiMajorAxisAu: 0.0527, orbitalPeriodDays: 4.231 }],
  },
  {
    id: 'exo:hd-189733', hostname: 'HD 189733', raDeg: 300.183, decDeg: 22.71,
    distancePc: 19.78, stellarRadiusSolar: 0.78, stellarTemperatureK: 5052,
    planets: [{ name: 'HD 189733 b', massEarth: 360, radiusEarth: 12.6, semiMajorAxisAu: 0.031, orbitalPeriodDays: 2.219 }],
  },
]

function numberOrUndefined(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function groupRows(rows: ArchiveRow[]): ExoplanetSystem[] {
  const systems = new Map<string, ExoplanetSystem>()
  for (const row of rows) {
    if (!row.hostname || !row.pl_name || typeof row.ra !== 'number' || typeof row.dec !== 'number') continue
    const existing = systems.get(row.hostname)
    const system = existing ?? ({
      id: `exo:${slug(row.hostname)}`,
      hostname: row.hostname,
      raDeg: row.ra,
      decDeg: row.dec,
      distancePc: numberOrUndefined(row.sy_dist),
      stellarRadiusSolar: numberOrUndefined(row.st_rad),
      stellarTemperatureK: numberOrUndefined(row.st_teff),
      planets: [],
    } satisfies ExoplanetSystem)
    system.planets.push({
      name: row.pl_name,
      radiusEarth: numberOrUndefined(row.pl_rade),
      massEarth: numberOrUndefined(row.pl_bmasse),
      semiMajorAxisAu: numberOrUndefined(row.pl_orbsmax),
      orbitalPeriodDays: numberOrUndefined(row.pl_orbper),
      equilibriumTempK: numberOrUndefined(row.pl_eqt),
      eccentricity: numberOrUndefined(row.pl_orbeccen),
    })
    systems.set(row.hostname, system)
  }
  return [...systems.values()].sort((a, b) => (a.distancePc ?? Number.POSITIVE_INFINITY) - (b.distancePc ?? Number.POSITIVE_INFINITY))
}

const query = [
  'select',
  'pl_name,hostname,ra,dec,sy_dist,st_rad,st_teff,pl_rade,pl_bmasse,pl_orbsmax,pl_orbper,pl_eqt,pl_orbeccen',
  'from pscomppars',
].join(' ')
const LIVE_ARCHIVE_URL = `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${encodeURIComponent(query)}&format=json`

async function fetchJson(url: string): Promise<ArchiveRow[]> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Astronomy catalog request failed: ${response.status}`)
  return (await response.json()) as ArchiveRow[]
}

export async function loadExoplanetSystems(): Promise<{ systems: ExoplanetSystem[]; source: string }> {
  try {
    const staticRows = await fetchJson('/data/exoplanets.json')
    const systems = groupRows(staticRows)
    if (systems.length > 0) return { systems, source: 'NASA EXOPLANET ARCHIVE · CACHED SNAPSHOT' }
  } catch {
    // The checked-in snapshot is optional until the data workflow has run.
  }
  try {
    const liveRows = await fetchJson(LIVE_ARCHIVE_URL)
    const systems = groupRows(liveRows)
    if (systems.length > 0) return { systems, source: 'NASA EXOPLANET ARCHIVE · LIVE TAP' }
  } catch {
    // Offline and restrictive-browser fallback.
  }
  return { systems: FALLBACK_SYSTEMS, source: 'CURATED OFFLINE FALLBACK' }
}

export { FALLBACK_SYSTEMS }
