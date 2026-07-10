import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadExoplanetSystems, type ExoplanetSystem } from './data/exoplanets'
import {
  MOON_DESTINATIONS,
  PRIMARY_DESTINATIONS,
  SOLAR_BODY_MAP,
  bodyDisplayClass,
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
  return 'DISPLAY 01 · SINGLE'
}

function qualityLabel(quality: QualityPreset): string {
  if (quality === 'quality') return 'QUALITY'
  if (quality === 'performance') return 'PERFORMANCE'
  return 'BALANCED'
}

function sceneLabel(sceneMode: SceneMode): string {
  if (sceneMode === 'galaxy') return 'MILKY WAY / EXOPLANETS'
  if (sceneMode === 'sagittarius') return 'SAGITTARIUS A*'
  return 'SOLAR SYSTEM'
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

export default function App() {
  const [role, setRole] = useState<DisplayRole>(() => getDisplayRole())
  const [state, setState] = useState<SharedSimulationState>(() => createInitialState(getOrCreateSessionId()))
  const [panelOpen, setPanelOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [fps, setFps] = useState(0)
  const [notice, setNotice] = useState('')
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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyO' && isController) {
        event.preventDefault()
        setPanelOpen((open) => !open)
      }
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyK' && isController) {
        event.preventDefault()
        setCatalogOpen((open) => !open)
      }
      if (event.code === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isController])

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

  const updateAway = useCallback((patch: Partial<AwayState>) => {
    updateState((current) => ({ ...current, away: { ...current.away, ...patch } }))
  }, [updateState])

  const updateCamera = useCallback((camera: CameraPose) => {
    updateState((current) => ({ ...current, camera }))
  }, [updateState])

  const setNavigationMode = (navigationMode: NavigationMode) => updateState((current) => ({ ...current, navigationMode }))
  const setQuality = (quality: QualityPreset) => updateState((current) => ({ ...current, quality }))
  const setScaleMode = (scaleMode: ScaleMode) => updateState((current) => ({ ...current, scaleMode }))
  const selectTarget = (selectedTargetId: string) => updateState((current) => ({ ...current, selectedTargetId }))

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
  const utcTime = useMemo(() => now.toLocaleTimeString('en-US', {
    timeZone: 'UTC', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  }), [now])

  const normalizedSearch = search.trim().toLowerCase()
  const solarResults = useMemo(() => {
    const all = [...PRIMARY_DESTINATIONS, ...MOON_DESTINATIONS]
    if (!normalizedSearch) return all.slice(0, 38)
    return all.filter((body) => body.name.toLowerCase().includes(normalizedSearch)).slice(0, 80)
  }, [normalizedSearch])
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

  return (
    <main className={`app ${state.away.active && state.away.dimScene ? 'is-dimmed' : ''}`}>
      <SpaceCanvas
        role={role}
        navigationMode={state.navigationMode}
        quality={state.quality}
        sceneMode={state.sceneMode}
        scaleMode={state.scaleMode}
        selectedTargetId={state.selectedTargetId}
        timeScale={state.timeScale}
        bezelPixels={state.bezelPixels}
        cameraPose={state.camera}
        isController={isController}
        paused={state.away.active}
        exoplanetSystems={exoplanets.systems}
        onCameraPose={updateCamera}
        onFps={setFps}
      />

      <header className="instrument-bar">
        <div className="instrument-identity">
          <span className="instrument-mark" aria-hidden="true" />
          <div>
            <strong>SPACE SIMULATION</strong>
            <span>{sceneLabel(state.sceneMode)} · RESEARCH BUILD 02</span>
          </div>
        </div>
        <div className="instrument-readouts">
          <span>{roleLabel(role)}</span>
          <span>{qualityLabel(state.quality)}</span>
          <span>{fps || '—'} FPS</span>
          <span>{utcTime} UTC</span>
        </div>
      </header>

      {isController ? (
        <>
          <nav className="scene-switcher" aria-label="Simulation regions">
            <button type="button" className={state.sceneMode === 'solar' ? 'is-active' : ''} onClick={() => setSceneMode('solar')}>SOLAR</button>
            <button type="button" className={state.sceneMode === 'galaxy' ? 'is-active' : ''} onClick={() => setSceneMode('galaxy')}>MILKY WAY</button>
            <button type="button" className={state.sceneMode === 'sagittarius' ? 'is-active' : ''} onClick={() => setSceneMode('sagittarius')}>SGR A*</button>
          </nav>

          <button type="button" className={`catalog-toggle ${catalogOpen ? 'is-open' : ''}`} onClick={() => setCatalogOpen((open) => !open)}>CATALOG</button>

          {catalogOpen && state.sceneMode !== 'sagittarius' ? (
            <aside className="catalog-panel">
              <div className="catalog-heading">
                <span>{state.sceneMode === 'solar' ? 'SOLAR OBJECT CATALOG' : 'CONFIRMED EXOPLANET HOSTS'}</span>
                <small>{state.sceneMode === 'solar'
                  ? `${PRIMARY_DESTINATIONS.length + MOON_DESTINATIONS.length} CURATED OBJECTS`
                  : exoplanets.loading
                    ? 'LOADING NASA ARCHIVE'
                    : `${exoplanets.systems.length.toLocaleString()} SYSTEMS`}</small>
              </div>
              <input className="catalog-search" type="search" placeholder="Search destination" value={search} onChange={(event) => setSearch(event.target.value)} />
              <div className="catalog-results">
                {state.sceneMode === 'solar'
                  ? solarResults.map((body) => (
                      <button type="button" key={body.id} className={state.selectedTargetId === body.id ? 'is-active' : ''} onClick={() => selectTarget(body.id)}>
                        <span><strong>{body.name}</strong><small>{bodyDisplayClass(body)}</small></span>
                        <span>{body.parentId ? SOLAR_BODY_MAP.get(body.parentId)?.name.toUpperCase() : ''}</span>
                      </button>
                    ))
                  : galaxyResults.map((system) => (
                      <button type="button" key={system.id} className={state.selectedTargetId === system.id ? 'is-active' : ''} onClick={() => selectTarget(system.id)}>
                        <span><strong>{system.hostname}</strong><small>{system.planets.length} PLANET{system.planets.length === 1 ? '' : 'S'}</small></span>
                        <span>{system.distancePc ? `${system.distancePc.toFixed(1)} PC` : ''}</span>
                      </button>
                    ))}
              </div>
            </aside>
          ) : null}

          <section className="target-panel">
            <span>ACTIVE TARGET</span>
            <h2>{selectedTitle}</h2>
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

          <nav className="control-rail" aria-label="Simulation controls">
            <button type="button" className={state.navigationMode === 'cinematic' ? 'is-active' : ''} onClick={() => setNavigationMode('cinematic')}>CINEMATIC</button>
            <button type="button" className={state.navigationMode === 'free' ? 'is-active' : ''} onClick={() => setNavigationMode('free')}>FREE FLIGHT</button>
            {role === 'single'
              ? <button type="button" onClick={launchSecondDisplay}>LAUNCH SECOND DISPLAY</button>
              : <button type="button" onClick={restoreSingleDisplay}>SINGLE DISPLAY</button>}
            <button type="button" onClick={enterFullscreen}>FULLSCREEN</button>
            <button type="button" onClick={() => setPanelOpen(true)}>AWAY / SETTINGS</button>
          </nav>
        </>
      ) : (
        <nav className="control-rail follower-controls" aria-label="Display controls">
          <button type="button" onClick={enterFullscreen}>FULLSCREEN DISPLAY 02</button>
        </nav>
      )}

      {state.navigationMode === 'free' && isController && !state.away.active
        ? <div className="flight-help">DRAG TO LOOK · SCROLL TO ZOOM · W A S D MOVE · Q / E VERTICAL · SHIFT BOOST</div>
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
              <div><span>DISPLAY CONTROL</span><h2>Away mode &amp; simulation calibration</h2></div>
              <button type="button" className="icon-button" onClick={() => setPanelOpen(false)}>CLOSE</button>
            </div>
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
            <div className="two-column-fields">
              <label className="field-row"><span>RENDER QUALITY</span><select value={state.quality} onChange={(event) => setQuality(event.target.value as QualityPreset)}><option value="performance">Performance</option><option value="balanced">Balanced</option><option value="quality">Quality</option></select></label>
              <label className="field-row"><span>SOLAR SCALE</span><select value={state.scaleMode} onChange={(event) => setScaleMode(event.target.value as ScaleMode)}><option value="cinematic">Cinematic compression</option><option value="scientific">Orbital-proportion mode</option></select></label>
            </div>
            <label className="field-row">
              <span>TIME RATE · {state.timeScale.toLocaleString()} SIMULATION DAYS / SECOND</span>
              <input type="range" min="0" max="120" step="1" value={state.timeScale} onChange={(event) => updateState((current) => ({ ...current, timeScale: Number(event.target.value) }))} />
            </label>
            <label className="field-row">
              <span>BEZEL CORRECTION · {state.bezelPixels} PX</span>
              <input type="range" min="0" max="240" step="2" value={state.bezelPixels} onChange={(event) => updateState((current) => ({ ...current, bezelPixels: Number(event.target.value) }))} />
            </label>
            <div className="panel-note"><strong>VISUAL ACCURACY</strong><p>NASA texture maps are used when available. Planetary sizes are enhanced for visibility; orbital mode preserves relative orbital spacing more closely.</p></div>
            <div className="panel-note"><strong>FIREFOX WORKFLOW</strong><p>Open the second display, move it to the right monitor, then select fullscreen in each window.</p></div>
            <div className="panel-note"><strong>KEYBOARD SHORTCUTS</strong><p>Control + Shift + O opens settings. Control + Shift + K toggles the catalog.</p></div>
          </aside>
        </div>
      ) : null}

      <footer className="data-footer">
        <span>{state.sceneMode === 'solar'
          ? 'POSITIONS · KEPLERIAN J2000 APPROXIMATION · JPL SNAPSHOT PIPELINE INCLUDED'
          : state.sceneMode === 'galaxy'
            ? exoplanets.source
            : 'SAGITTARIUS A* · CINEMATIC RELATIVISTIC APPROXIMATION'}</span>
        <span>TEXTURES · NASA 3D RESOURCES + PROCEDURAL FALLBACKS</span>
      </footer>
    </main>
  )
}
