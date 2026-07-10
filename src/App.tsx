import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadExoplanetSystems, type ExoplanetSystem } from './data/exoplanets'
import {
  BODY_BLURBS,
  DAY_MS,
  J2000_MS,
  MINOR_DESTINATIONS,
  MOON_DESTINATIONS,
  PRIMARY_DESTINATIONS,
  SOLAR_BODY_MAP,
  bodyDisplayClass,
  type BodyKind,
  type SolarBody,
} from './data/solarCatalog'
import { SpaceCanvas } from './space/SpaceCanvas'
import { useDisplaySync } from './sync/useDisplaySync'
import type {
  AwayState,
  CameraPose,
  DisplayRole,
  NavigationMode,
  QualityPreset,
  ScaleMode,
  SceneMode,
  SharedSimulationState,
} from './types'
import { createInitialState } from './types'
import { buildDisplayUrl, getDisplayRole, getOrCreateSessionId } from './utils/display'

function useClock(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

function useExoplanetCatalog(): { systems: ExoplanetSystem[]; source: string; loading: boolean } {
  const [systems, setSystems] = useState<ExoplanetSystem[]>([])
  const [source, setSource] = useState('NASA EXOPLANET ARCHIVE · CONNECTING')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    loadExoplanetSystems()
      .then((result) => {
        if (!active) return
        setSystems(result.systems)
        setSource(result.source)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])
  return { systems, source, loading }
}

function roleLabel(role: DisplayRole): string {
  if (role === 'left') return 'DISPLAY 01 · LEFT'
  if (role === 'right') return 'DISPLAY 02 · RIGHT'
  return 'DISPLAY 01'
}

function sceneLabel(sceneMode: SceneMode): string {
  if (sceneMode === 'galaxy') return 'MILKY WAY · EXOPLANET SURVEY'
  if (sceneMode === 'sagittarius') return 'SAGITTARIUS A* · GALACTIC CORE'
  return 'SOLAR SYSTEM · LIVE ORRERY'
}

const TIME_PRESETS: Array<{ label: string; value: number }> = [
  { label: 'REAL', value: 1 / 86_400 },
  { label: '1 HR/S', value: 1 / 24 },
  { label: '1 DAY/S', value: 1 },
  { label: '1 MO/S', value: 30.44 },
  { label: '1 YR/S', value: 365.25 },
]

type CatalogFilter = 'all' | 'planet' | 'moon' | 'asteroid' | 'trojan' | 'tno' | 'nea' | 'comet'
const CATALOG_FILTERS: Array<{ key: CatalogFilter; label: string }> = [
  { key: 'all', label: 'ALL' },
  { key: 'planet', label: 'PLANETS' },
  { key: 'moon', label: 'MOONS' },
  { key: 'asteroid', label: 'ASTEROIDS' },
  { key: 'trojan', label: 'TROJANS' },
  { key: 'tno', label: 'TNOs' },
  { key: 'nea', label: 'NEAs' },
  { key: 'comet', label: 'COMETS' },
]
function catalogGroup(kind: BodyKind): CatalogFilter {
  if (kind === 'star' || kind === 'planet' || kind === 'dwarf' || kind === 'candidate') return 'planet'
  return kind as CatalogFilter
}

function formatSimDate(simDays: number): string {
  const date = new Date(J2000_MS + simDays * DAY_MS)
  const day = date.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: '2-digit' })
  const time = date.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit', minute: '2-digit' })
  return `${day.toUpperCase()} · ${time} UTC`
}

function bodyFacts(body: SolarBody): Array<[string, string]> {
  const facts: Array<[string, string]> = [
    ['CLASS', bodyDisplayClass(body)],
    ['RADIUS', `${Math.round(body.radiusKm).toLocaleString()} KM`],
  ]
  if (body.semiMajorAxisAu) facts.push(['ORBIT', `${body.semiMajorAxisAu.toLocaleString()} AU`])
  if (body.orbitKm) facts.push(['ORBIT', `${Math.round(body.orbitKm).toLocaleString()} KM`])
  if (body.orbitalPeriodDays) facts.push(['PERIOD', `${Math.abs(body.orbitalPeriodDays).toLocaleString()} DAYS`])
  if (body.parentId) facts.push(['PRIMARY', SOLAR_BODY_MAP.get(body.parentId)?.name.toUpperCase() ?? body.parentId.toUpperCase()])
  return facts
}

function systemFacts(system: ExoplanetSystem): Array<[string, string]> {
  return [
    ['CLASS', 'CONFIRMED PLANETARY SYSTEM'],
    ['PLANETS', system.planets.length.toLocaleString()],
    ['DISTANCE', system.distancePc ? `${system.distancePc.toFixed(2)} PC` : 'NOT PUBLISHED'],
    ['COORDINATES', `${system.raDeg.toFixed(2)}° / ${system.decDeg.toFixed(2)}°`],
    ['STAR TEMP', system.stellarTemperatureK ? `${Math.round(system.stellarTemperatureK).toLocaleString()} K` : 'NOT PUBLISHED'],
  ]
}

const KIND_BLURBS: Partial<Record<BodyKind, string>> = {
  asteroid: 'A main-belt asteroid — one of over a million rocky remnants orbiting between Mars and Jupiter.',
  trojan: 'A Jupiter Trojan, shepherded 60° ahead of or behind the giant planet at a stable Lagrange point.',
  tno: 'A trans-Neptunian object from the frozen Kuiper Belt beyond Neptune’s orbit.',
  nea: 'A near-Earth asteroid whose orbit carries it into Earth’s neighbourhood.',
  comet: 'A comet on a steeply eccentric orbit; near the Sun its ices sublimate into a glowing coma and tail.',
}
function targetBlurb(sceneMode: SceneMode, body?: SolarBody, system?: ExoplanetSystem): string {
  if (sceneMode === 'sagittarius') {
    return 'The supermassive black hole at the center of the Milky Way, imaged by the Event Horizon Telescope in 2022. Its accretion disk is rendered with relativistic doppler beaming.'
  }
  if (body) {
    return body.blurb
      ?? BODY_BLURBS[body.id]
      ?? KIND_BLURBS[body.kind]
      ?? (body.kind === 'moon'
        ? `A natural satellite of ${SOLAR_BODY_MAP.get(body.parentId ?? '')?.name ?? 'its primary'}, rendered from measured orbital elements.`
        : 'A distant world of the outer solar system, rendered from its published orbital elements.')
  }
  if (system) {
    return `A confirmed planetary system from the NASA Exoplanet Archive. Select it to fly to a schematic view of its ${system.planets.length === 1 ? 'planet' : `${system.planets.length} planets`}.`
  }
  return ''
}

export default function App() {
  const [role, setRole] = useState<DisplayRole>(() => getDisplayRole())
  const [state, setState] = useState<SharedSimulationState>(() => createInitialState(getOrCreateSessionId()))
  const [panelOpen, setPanelOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(() => window.innerWidth > 760)
  const [targetOpen, setTargetOpen] = useState(() => window.innerWidth > 1100)
  const [deckVisible, setDeckVisible] = useState(true)
  const [viewOpen, setViewOpen] = useState(false)
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>('all')
  const [hudVisible, setHudVisible] = useState(true)
  const [search, setSearch] = useState('')
  const [fps, setFps] = useState(0)
  const [notice, setNotice] = useState('')
  const [simDays, setSimDays] = useState(() => (Date.now() - J2000_MS) / DAY_MS)
  const [booted, setBooted] = useState(false)
  const [splashGone, setSplashGone] = useState(false)
  const now = useClock()
  const exoplanets = useExoplanetCatalog()
  const isController = role !== 'right'

  const applyRemoteState = useCallback((remote: SharedSimulationState) => {
    setState((current) => (remote.revision >= current.revision ? remote : current))
  }, [])
  useDisplaySync(role, state, applyRemoteState)

  useEffect(() => {
    document.title = role === 'single' ? 'Space Simulation' : `Space Simulation · ${role.toUpperCase()}`
  }, [role])

  useEffect(() => {
    if (!booted || splashGone) return
    const timer = window.setTimeout(() => setSplashGone(true), 900)
    return () => window.clearTimeout(timer)
  }, [booted, splashGone])

  const updateState = useCallback(
    (updater: (current: SharedSimulationState) => SharedSimulationState) => {
      if (!isController) return
      setState((current) => {
        const next = updater(current)
        return { ...next, revision: current.revision + 1 }
      })
    },
    [isController],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyO' && isController) {
        event.preventDefault()
        setPanelOpen((open) => !open)
      }
      if (!isController || typing || event.metaKey || event.ctrlKey || event.altKey) {
        if (event.code === 'Escape') { setPanelOpen(false); setViewOpen(false) }
        return
      }
      if (event.code === 'Space') {
        event.preventDefault()
        updateState((current) => ({ ...current, timePaused: !current.timePaused }))
      }
      if (event.code === 'KeyH') { event.preventDefault(); setHudVisible((visible) => !visible) }
      if (event.code === 'KeyC') { event.preventDefault(); setCatalogOpen((open) => !open) }
      if (event.code === 'KeyB') { event.preventDefault(); setDeckVisible((visible) => !visible) }
      if (event.code === 'KeyV') { event.preventDefault(); setViewOpen((open) => !open) }
      if (event.code === 'KeyO') { event.preventDefault(); updateState((current) => ({ ...current, orbitsVisible: !current.orbitsVisible })) }
      if (event.code === 'KeyL') { event.preventDefault(); updateState((current) => ({ ...current, labelsVisible: !current.labelsVisible })) }
      if (event.code === 'Escape') { setPanelOpen(false); setViewOpen(false) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isController, updateState])

  const updateAway = useCallback((patch: Partial<AwayState>) => {
    updateState((current) => ({ ...current, away: { ...current.away, ...patch } }))
  }, [updateState])

  const updateCamera = useCallback((camera: CameraPose) => {
    updateState((current) => ({ ...current, camera }))
  }, [updateState])

  const handleFps = useCallback((value: number) => {
    setFps(value)
    if (value > 0) setBooted(true)
  }, [])

  const setNavigationMode = (navigationMode: NavigationMode) => updateState((current) => ({ ...current, navigationMode }))
  const setQuality = (quality: QualityPreset) => updateState((current) => ({ ...current, quality }))
  const setScaleMode = (scaleMode: ScaleMode) => updateState((current) => ({ ...current, scaleMode }))
  const setTimeScale = (timeScale: number) => updateState((current) => ({ ...current, timeScale, timePaused: false }))
  const toggleTimePaused = () => updateState((current) => ({ ...current, timePaused: !current.timePaused }))
  const resetSimTime = () => updateState((current) => ({ ...current, simResetToken: current.simResetToken + 1 }))
  const selectTarget = useCallback((selectedTargetId: string) => {
    updateState((current) => ({ ...current, selectedTargetId }))
    if (window.innerWidth > 1100) setTargetOpen(true)
  }, [updateState])
  const toggleOrbits = () => updateState((current) => ({ ...current, orbitsVisible: !current.orbitsVisible }))
  const toggleLabels = () => updateState((current) => ({ ...current, labelsVisible: !current.labelsVisible }))
  const toggleBelt = () => updateState((current) => ({ ...current, minorBodiesVisible: !current.minorBodiesVisible }))

  const setSceneMode = (sceneMode: SceneMode) => {
    const fallbackTarget = sceneMode === 'solar'
      ? 'earth'
      : sceneMode === 'galaxy'
        ? exoplanets.systems[0]?.id ?? 'exo:proxima-centauri'
        : 'sagittarius-a'
    updateState((current) => ({ ...current, sceneMode, selectedTargetId: fallbackTarget }))
    setSearch('')
  }

  const launchSecondDisplay = async () => {
    if (!isController) return
    const child = window.open('about:blank', 'space-simulation-right', 'popup=yes')
    if (!child) {
      setNotice('POP-UP BLOCKED · ALLOW POP-UPS, THEN TRY AGAIN')
      return
    }
    const rightUrl = buildDisplayUrl('right', state.sessionId)
    const leftUrl = buildDisplayUrl('left', state.sessionId)
    window.history.replaceState({}, '', leftUrl)
    setRole('left')
    let positioned = false
    try {
      if (window.getScreenDetails) {
        const details = await window.getScreenDetails()
        const screens = [...details.screens].sort((a, b) => a.left - b.left)
        const rightScreen = screens.at(-1)
        if (rightScreen) {
          child.moveTo(rightScreen.availLeft, rightScreen.availTop)
          child.resizeTo(rightScreen.availWidth, rightScreen.availHeight)
          positioned = true
        }
      }
    } catch {
      // Firefox and denied permissions use the manual placement workflow.
    }
    child.location.href = rightUrl
    child.focus()
    setNotice(positioned
      ? 'SECOND DISPLAY OPENED · USE FULLSCREEN IN BOTH WINDOWS'
      : 'SECOND DISPLAY OPENED · MOVE IT TO THE RIGHT MONITOR, THEN USE FULLSCREEN')
  }

  const restoreSingleDisplay = () => {
    window.history.replaceState({}, '', buildDisplayUrl('single', state.sessionId))
    setRole('single')
    setNotice('SINGLE-DISPLAY VIEW RESTORED')
  }

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    } catch {
      setNotice('FULLSCREEN REQUEST WAS NOT ACCEPTED BY THE BROWSER')
    }
  }

  const localTime = useMemo(() => now.toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }), [now])

  const normalizedSearch = search.trim().toLowerCase()
  const solarCatalog = useMemo(() => {
    const sun = SOLAR_BODY_MAP.get('sun')
    return [...(sun ? [sun] : []), ...PRIMARY_DESTINATIONS, ...MOON_DESTINATIONS, ...MINOR_DESTINATIONS]
  }, [])
  const solarResults = useMemo(() => {
    let list = solarCatalog
    if (catalogFilter !== 'all') list = list.filter((body) => catalogGroup(body.kind) === catalogFilter)
    if (normalizedSearch) list = list.filter((body) => body.name.toLowerCase().includes(normalizedSearch))
    return list.slice(0, 140)
  }, [solarCatalog, catalogFilter, normalizedSearch])
  const galaxyResults = useMemo(() => {
    if (!normalizedSearch) return exoplanets.systems.slice(0, 36)
    return exoplanets.systems.filter((system) =>
      system.hostname.toLowerCase().includes(normalizedSearch) ||
      system.planets.some((planet) => planet.name.toLowerCase().includes(normalizedSearch)),
    ).slice(0, 80)
  }, [exoplanets.systems, normalizedSearch])

  const selectedBody = state.sceneMode === 'solar' ? SOLAR_BODY_MAP.get(state.selectedTargetId) : undefined
  const selectedSystem = state.sceneMode === 'galaxy'
    ? exoplanets.systems.find((system) => system.id === state.selectedTargetId)
    : undefined
  const selectedTitle = state.sceneMode === 'sagittarius'
    ? 'Sagittarius A*'
    : selectedBody?.name ?? selectedSystem?.hostname ?? sceneLabel(state.sceneMode)
  const selectedFacts: Array<[string, string]> = state.sceneMode === 'sagittarius'
    ? [
        ['CLASS', 'SUPERMASSIVE BLACK HOLE'],
        ['LOCATION', 'GALACTIC CENTER'],
        ['MASS', '≈ 4 MILLION SOLAR MASSES'],
        ['VIEW', 'SCIENTIFIC VISUALIZATION'],
      ]
    : selectedBody
      ? bodyFacts(selectedBody)
      : selectedSystem
        ? systemFacts(selectedSystem)
        : []
  const blurb = targetBlurb(state.sceneMode, selectedBody, selectedSystem)

  const activePreset = TIME_PRESETS.reduce((closest, preset) =>
    Math.abs(Math.log(preset.value / state.timeScale)) < Math.abs(Math.log(closest.value / state.timeScale)) ? preset : closest,
  TIME_PRESETS[0])

  return (
    <main className={`app ${state.away.active && state.away.dimScene ? 'is-dimmed' : ''} ${hudVisible ? '' : 'hud-hidden'}`}>
      <SpaceCanvas
        role={role}
        navigationMode={state.navigationMode}
        quality={state.quality}
        sceneMode={state.sceneMode}
        scaleMode={state.scaleMode}
        selectedTargetId={state.selectedTargetId}
        timeScale={state.timeScale}
        timePaused={state.timePaused}
        labelsVisible={state.labelsVisible}
        orbitsVisible={state.orbitsVisible}
        minorBodiesVisible={state.minorBodiesVisible}
        simResetToken={state.simResetToken}
        bezelPixels={state.bezelPixels}
        cameraPose={state.camera}
        isController={isController}
        paused={state.away.active}
        exoplanetSystems={exoplanets.systems}
        onCameraPose={updateCamera}
        onFps={handleFps}
        onSimDays={setSimDays}
        onSelectTarget={selectTarget}
      />

      {!splashGone ? (
        <div className={`boot-splash ${booted ? 'is-done' : ''}`} aria-hidden={booted}>
          <div className="boot-orbit"><span /><span /><span /></div>
          <strong>SPACE SIMULATION</strong>
          <p>{booted ? 'TELEMETRY LOCKED' : 'INITIALIZING ORBITAL MECHANICS'}</p>
        </div>
      ) : null}

      {isController ? (
        <>
          <nav className="scene-switcher" aria-label="Simulation regions">
            <button type="button" className={state.sceneMode === 'solar' ? 'is-active' : ''} onClick={() => setSceneMode('solar')}>SOLAR</button>
            <button type="button" className={state.sceneMode === 'galaxy' ? 'is-active' : ''} onClick={() => setSceneMode('galaxy')}>MILKY WAY</button>
            <button type="button" className={state.sceneMode === 'sagittarius' ? 'is-active' : ''} onClick={() => setSceneMode('sagittarius')}>SGR A*</button>
          </nav>

          <div className="top-toolbar">
            <span className="fps-readout" title="Frames per second">{fps || '—'}<small>FPS</small></span>
            <button type="button" className={`tool-button ${catalogOpen ? 'is-active' : ''}`} onClick={() => setCatalogOpen((open) => !open)}>CATALOG</button>
            <div className="view-menu">
              <button type="button" className={`tool-button ${viewOpen ? 'is-active' : ''}`} onClick={() => setViewOpen((open) => !open)}>VIEW</button>
              {viewOpen ? (
                <div className="view-popover" role="menu">
                  <span className="view-heading">SHOW IN SCENE</span>
                  <label className="view-row"><span>Orbits <kbd>O</kbd></span><input type="checkbox" checked={state.orbitsVisible} onChange={toggleOrbits} /></label>
                  <label className="view-row"><span>Labels <kbd>L</kbd></span><input type="checkbox" checked={state.labelsVisible} onChange={toggleLabels} /></label>
                  <label className="view-row"><span>Asteroid belt</span><input type="checkbox" checked={state.minorBodiesVisible} onChange={toggleBelt} /></label>
                  <div className="view-divider" />
                  <span className="view-heading">INTERFACE</span>
                  <label className="view-row"><span>Catalog <kbd>C</kbd></span><input type="checkbox" checked={catalogOpen} onChange={() => setCatalogOpen((open) => !open)} /></label>
                  <label className="view-row"><span>Target panel</span><input type="checkbox" checked={targetOpen} onChange={() => setTargetOpen((open) => !open)} /></label>
                  <label className="view-row"><span>Time bar <kbd>B</kbd></span><input type="checkbox" checked={deckVisible} onChange={() => setDeckVisible((open) => !open)} /></label>
                  <button type="button" className="view-hide-all" onClick={() => { setHudVisible(false); setViewOpen(false) }}>HIDE ALL INTERFACE · H</button>
                </div>
              ) : null}
            </div>
            <button type="button" className="tool-button icon" onClick={enterFullscreen} aria-label="Fullscreen" title="Fullscreen">⤢</button>
            <button type="button" className="tool-button icon" onClick={() => setPanelOpen(true)} aria-label="Settings" title="Settings">⚙</button>
          </div>

          {catalogOpen && state.sceneMode !== 'sagittarius' ? (
            <aside className="catalog-panel">
              <div className="catalog-heading">
                <div>
                  <span>{state.sceneMode === 'solar' ? 'OBJECT CATALOG' : 'EXOPLANET HOSTS'}</span>
                  <small>{state.sceneMode === 'solar'
                    ? `${solarCatalog.length.toLocaleString()} OBJECTS`
                    : exoplanets.loading
                      ? 'LOADING NASA ARCHIVE'
                      : `${exoplanets.systems.length.toLocaleString()} SYSTEMS`}</small>
                </div>
                <button type="button" className="panel-close" onClick={() => setCatalogOpen(false)} aria-label="Close catalog">✕</button>
              </div>
              <input className="catalog-search" type="search" placeholder="Search destinations…" value={search} onChange={(event) => setSearch(event.target.value)} />
              {state.sceneMode === 'solar' ? (
                <div className="catalog-filters">
                  {CATALOG_FILTERS.map((filter) => (
                    <button type="button" key={filter.key} className={catalogFilter === filter.key ? 'is-active' : ''} onClick={() => setCatalogFilter(filter.key)}>{filter.label}</button>
                  ))}
                </div>
              ) : null}
              <div className="catalog-results">
                {state.sceneMode === 'solar'
                  ? solarResults.map((body) => (
                      <button type="button" key={body.id} className={state.selectedTargetId === body.id ? 'is-active' : ''} onClick={() => selectTarget(body.id)}>
                        <span className={`body-dot dot-${body.kind}`} aria-hidden="true" />
                        <span><strong>{body.name}</strong><small>{bodyDisplayClass(body)}</small></span>
                        <span className="result-meta">{body.parentId && body.kind === 'moon' ? SOLAR_BODY_MAP.get(body.parentId)?.name.toUpperCase() : body.semiMajorAxisAu ? `${body.semiMajorAxisAu} AU` : ''}</span>
                      </button>
                    ))
                  : galaxyResults.map((system) => (
                      <button type="button" key={system.id} className={state.selectedTargetId === system.id ? 'is-active' : ''} onClick={() => selectTarget(system.id)}>
                        <span className="body-dot dot-star" aria-hidden="true" />
                        <span><strong>{system.hostname}</strong><small>{system.planets.length} PLANET{system.planets.length === 1 ? '' : 'S'}</small></span>
                        <span className="result-meta">{system.distancePc ? `${system.distancePc.toFixed(1)} PC` : ''}</span>
                      </button>
                    ))}
                {state.sceneMode === 'solar' && solarResults.length === 0 ? <p className="catalog-empty">No objects match.</p> : null}
              </div>
            </aside>
          ) : null}

          {targetOpen ? (
            <section className="target-panel">
              <div className="target-head">
                <span className="panel-kicker">ACTIVE TARGET</span>
                <button type="button" className="panel-close" onClick={() => setTargetOpen(false)} aria-label="Close target panel">✕</button>
              </div>
              <h2>{selectedTitle}</h2>
              {blurb ? <p className="target-blurb">{blurb}</p> : null}
              <div className="target-facts">
                {selectedFacts.map(([label, value]) => (
                  <div key={label}><small>{label}</small><strong>{value}</strong></div>
                ))}
              </div>
              {selectedSystem ? (
                <div className="planet-chips">
                  {selectedSystem.planets.slice(0, 10).map((planet) => <span key={planet.name}>{planet.name}</span>)}
                </div>
              ) : null}
            </section>
          ) : null}

          {deckVisible ? (
            <div className="command-deck">
              <button type="button" className="deck-collapse" onClick={() => setDeckVisible(false)} aria-label="Hide time bar" title="Hide time bar (B)">▾</button>
              <div className="time-deck" aria-label="Simulation time controls">
                <button type="button" className="play-toggle" onClick={toggleTimePaused} aria-label={state.timePaused ? 'Resume time' : 'Pause time'}>
                  {state.timePaused
                    ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>
                    : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" /></svg>}
                </button>
                <div className="time-presets">
                  {TIME_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      className={!state.timePaused && activePreset.label === preset.label ? 'is-active' : ''}
                      onClick={() => setTimeScale(preset.value)}
                    >{preset.label}</button>
                  ))}
                </div>
                <div className="sim-date">
                  <small>{state.timePaused ? 'TIME HELD' : 'SIM EPOCH'}</small>
                  <span>{formatSimDate(simDays)}</span>
                </div>
                <button type="button" className="now-button" onClick={resetSimTime}>NOW</button>
              </div>
              <nav className="control-rail" aria-label="Simulation controls">
                <button type="button" className={state.navigationMode === 'cinematic' ? 'is-active' : ''} onClick={() => setNavigationMode('cinematic')}>CINEMATIC</button>
                <button type="button" className={state.navigationMode === 'free' ? 'is-active' : ''} onClick={() => setNavigationMode('free')}>FREE FLIGHT</button>
                {role === 'single'
                  ? <button type="button" onClick={launchSecondDisplay}>SECOND DISPLAY</button>
                  : <button type="button" onClick={restoreSingleDisplay}>SINGLE DISPLAY</button>}
              </nav>
            </div>
          ) : (
            <button type="button" className="deck-show" onClick={() => setDeckVisible(true)} aria-label="Show time bar" title="Show time bar (B)">▴ TIME</button>
          )}
        </>
      ) : (
        <nav className="control-rail follower-controls" aria-label="Display controls">
          <button type="button" onClick={enterFullscreen}>FULLSCREEN DISPLAY 02</button>
        </nav>
      )}

      {state.navigationMode === 'free' && isController && !state.away.active
        ? <div className="flight-help">DRAG TO LOOK · SCROLL TO ZOOM · W A S D MOVE · Q / E VERTICAL · SHIFT BOOST · CLICK A BODY TO TARGET IT</div>
        : null}
      {notice ? <button type="button" className="notice" onClick={() => setNotice('')}>{notice}</button> : null}

      {state.away.active ? (
        <section className="away-overlay" aria-live="polite">
          <div className="away-rule" />
          <p>STATUS</p>
          <h1>{state.away.message || 'Out of the office'}</h1>
          {state.away.returnTime ? <h2>EXPECTED RETURN · {state.away.returnTime}</h2> : null}
          {state.away.showClock ? <time>{localTime}</time> : null}
          <span className="away-display-id">{roleLabel(role)}</span>
        </section>
      ) : null}

      {panelOpen && isController ? (
        <div className="panel-backdrop" onMouseDown={() => setPanelOpen(false)}>
          <aside className="settings-panel" onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div><span>DISPLAY CONTROL</span><h2>Simulation settings</h2></div>
              <button type="button" className="icon-button" onClick={() => setPanelOpen(false)}>CLOSE</button>
            </div>
            <div className="two-column-fields">
              <label className="field-row"><span>RENDER QUALITY</span><select value={state.quality} onChange={(event) => setQuality(event.target.value as QualityPreset)}><option value="performance">Performance</option><option value="balanced">Balanced</option><option value="quality">Quality</option></select></label>
              <label className="field-row"><span>SOLAR SCALE</span><select value={state.scaleMode} onChange={(event) => setScaleMode(event.target.value as ScaleMode)}><option value="cinematic">Cinematic compression</option><option value="scientific">Orbital-proportion mode</option></select></label>
            </div>
            <label className="toggle-row">
              <span><strong>BODY LABELS</strong><small>Floating designations above planets and moons.</small></span>
              <input type="checkbox" checked={state.labelsVisible} onChange={(event) => updateState((current) => ({ ...current, labelsVisible: event.target.checked }))} />
            </label>
            <label className="toggle-row">
              <span><strong>ORBIT PATHS</strong><small>Keplerian orbit lines. Click a line to target that world.</small></span>
              <input type="checkbox" checked={state.orbitsVisible} onChange={(event) => updateState((current) => ({ ...current, orbitsVisible: event.target.checked }))} />
            </label>
            <label className="toggle-row">
              <span><strong>ASTEROID BELT</strong><small>{MINOR_DESTINATIONS.length.toLocaleString()} asteroids, trojans, TNOs, comets &amp; NEAs.</small></span>
              <input type="checkbox" checked={state.minorBodiesVisible} onChange={(event) => updateState((current) => ({ ...current, minorBodiesVisible: event.target.checked }))} />
            </label>
            <label className="field-row">
              <span>BEZEL CORRECTION · {state.bezelPixels} PX</span>
              <input type="range" min="0" max="240" step="2" value={state.bezelPixels} onChange={(event) => updateState((current) => ({ ...current, bezelPixels: Number(event.target.value) }))} />
            </label>
            <div className="settings-divider"><span>AWAY MODE</span></div>
            <label className="toggle-row">
              <span><strong>AWAY MODE</strong><small>Synchronizes across both display windows.</small></span>
              <input type="checkbox" checked={state.away.active} onChange={(event) => updateAway({ active: event.target.checked })} />
            </label>
            <label className="field-row"><span>MESSAGE</span><input type="text" value={state.away.message} maxLength={80} onChange={(event) => updateAway({ message: event.target.value })} /></label>
            <label className="field-row"><span>EXPECTED RETURN</span><input type="time" value={state.away.returnTime} onChange={(event) => updateAway({ returnTime: event.target.value })} /></label>
            <div className="two-column-fields">
              <label className="toggle-row compact"><span>SHOW CLOCK</span><input type="checkbox" checked={state.away.showClock} onChange={(event) => updateAway({ showClock: event.target.checked })} /></label>
              <label className="toggle-row compact"><span>DIM SCENE</span><input type="checkbox" checked={state.away.dimScene} onChange={(event) => updateAway({ dimScene: event.target.checked })} /></label>
            </div>
            <div className="panel-note"><strong>VISUAL REALISM</strong><p>Earth renders with NASA 4K day/night imagery, live terminator city lights, ocean sun-glint, and drifting cloud shadows. Other worlds stream NASA maps with procedural fallbacks.</p></div>
            <div className="panel-note"><strong>SHORTCUTS</strong><p>Space pause · H hide all UI · B time bar · C catalog · V view menu · O orbits · L labels · Click any body, orbit, or asteroid to target it.</p></div>
            <div className="panel-note"><strong>FIREFOX WORKFLOW</strong><p>Open the second display, move it to the right monitor, then select fullscreen in each window.</p></div>
          </aside>
        </div>
      ) : null}

      <footer className="data-footer">
        <span>{state.sceneMode === 'solar'
          ? 'POSITIONS · KEPLERIAN J2000 APPROXIMATION'
          : state.sceneMode === 'galaxy'
            ? exoplanets.source
            : 'SAGITTARIUS A* · CINEMATIC RELATIVISTIC APPROXIMATION'}</span>
        <span>IMAGERY · NASA VISIBLE EARTH + 3D RESOURCES</span>
      </footer>
    </main>
  )
}
