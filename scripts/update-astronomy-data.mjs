import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const outputDir = path.resolve('public/data')
await mkdir(outputDir, { recursive: true })

async function fetchJson(url, label) {
  const response = await fetch(url, { headers: { 'User-Agent': 'space-simulation-data-pipeline/0.2' } })
  if (!response.ok) throw new Error(`${label} returned ${response.status}`)
  return response.json()
}

async function updateExoplanets() {
  const columns = [
    'pl_name', 'hostname', 'ra', 'dec', 'sy_dist', 'st_rad', 'st_teff',
    'pl_rade', 'pl_bmasse', 'pl_orbsmax', 'pl_orbper', 'pl_eqt', 'pl_orbeccen',
  ].join(',')
  const query = `select ${columns} from pscomppars order by hostname,pl_name`
  const url = new URL('https://exoplanetarchive.ipac.caltech.edu/TAP/sync')
  url.searchParams.set('query', query)
  url.searchParams.set('format', 'json')
  const rows = await fetchJson(url, 'NASA Exoplanet Archive')
  await writeFile(path.join(outputDir, 'exoplanets.json'), `${JSON.stringify(rows)}\n`, 'utf8')
  return rows.length
}

const HORIZONS_BODIES = {
  sun: '10', mercury: '199', venus: '299', earth: '399', moon: '301', mars: '499',
  jupiter: '599', saturn: '699', uranus: '799', neptune: '899', pluto: '999',
}
const dateString = (date) => date.toISOString().slice(0, 10)
function parseVectorResult(result) {
  const start = result.indexOf('$$SOE')
  const end = result.indexOf('$$EOE')
  if (start < 0 || end < 0) return { raw: result }
  return { lines: result.slice(start + 5, end).trim().split('\n').map((line) => line.trim()).filter(Boolean) }
}

async function updateHorizonsVectors() {
  const start = new Date()
  const stop = new Date(start.getTime() + 2 * 86_400_000)
  const bodies = {}
  for (const [id, command] of Object.entries(HORIZONS_BODIES)) {
    const url = new URL('https://ssd.jpl.nasa.gov/api/horizons.api')
    const params = {
      format: 'json', COMMAND: `'${command}'`, OBJ_DATA: "'NO'", MAKE_EPHEM: "'YES'",
      EPHEM_TYPE: "'VECTORS'", CENTER: "'500@10'", START_TIME: `'${dateString(start)}'`,
      STOP_TIME: `'${dateString(stop)}'`, STEP_SIZE: "'1 d'", VEC_TABLE: "'2'",
      CSV_FORMAT: "'YES'", OUT_UNITS: "'KM-S'", REF_PLANE: "'ECLIPTIC'", REF_SYSTEM: "'ICRF'",
    }
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
    const payload = await fetchJson(url, `JPL Horizons ${id}`)
    bodies[id] = {
      command,
      generatedAt: new Date().toISOString(),
      vectors: parseVectorResult(payload.result ?? ''),
      signature: payload.signature ?? null,
    }
  }
  await writeFile(
    path.join(outputDir, 'solar-vectors.json'),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), center: 'Sun', bodies })}\n`,
    'utf8',
  )
  return Object.keys(bodies).length
}

const [planetCount, vectorCount] = await Promise.all([updateExoplanets(), updateHorizonsVectors()])
console.log(`Updated ${planetCount} exoplanet rows and ${vectorCount} Horizons body vector sets.`)
