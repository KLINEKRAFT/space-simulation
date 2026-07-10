import { useCallback, useEffect, useMemo, useState } from 'react'
import { SpaceCanvas } from './space/SpaceCanvas'
import { useDisplaySync } from './sync/useDisplaySync'
import type {
  AwayState,
  CameraPose,
  DisplayRole,
  NavigationMode,
  QualityPreset,
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

export default function App() {
  const [role, setRole] = useState<DisplayRole>(() => getDisplayRole())
  const [state, setState] = useState<SharedSimulationState>(() =>
    createInitialState(getOrCreateSessionId()),
  )
  const [panelOpen, setPanelOpen] = useState(false)
  const [fps, setFps] = useState(0)
  const [notice, setNotice] = useState('')
  const now = useClock()
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

  const updateAway = useCallback(
    (patch: Partial<AwayState>) => {
      updateState((current) => ({
        ...current,
        away: { ...current.away, ...patch },
      }))
    },
    [updateState],
  )

  const updateCamera = useCallback(
    (camera: CameraPose) => {
      updateState((current) => ({ ...current, camera }))
    },
    [updateState],
  )

  const setNavigationMode = (navigationMode: NavigationMode) => {
    updateState((current) => ({ ...current, navigationMode }))
  }

  const setQuality = (quality: QualityPreset) => {
    updateState((current) => ({ ...current, quality }))
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
    setNotice(
      positioned
        ? 'SECOND DISPLAY OPENED · USE FULLSCREEN IN BOTH WINDOWS'
        : 'SECOND DISPLAY OPENED · MOVE IT TO THE RIGHT MONITOR, THEN USE FULLSCREEN',
    )
  }

  const restoreSingleDisplay = () => {
    const url = buildDisplayUrl('single', state.sessionId)
    window.history.replaceState({}, '', url)
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

  const localTime = useMemo(
    () =>
      now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    [now],
  )
  const utcTime = useMemo(
    () =>
      now.toLocaleTimeString('en-US', {
        timeZone: 'UTC',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    [now],
  )

  return (
    <main className={`app ${state.away.active && state.away.dimScene ? 'is-dimmed' : ''}`}>
      <SpaceCanvas
        role={role}
        navigationMode={state.navigationMode}
        quality={state.quality}
        bezelPixels={state.bezelPixels}
        cameraPose={state.camera}
        isController={isController}
        paused={state.away.active}
        onCameraPose={updateCamera}
        onFps={setFps}
      />

      <header className="instrument-bar">
        <div className="instrument-identity">
          <span className="instrument-mark" aria-hidden="true" />
          <div>
            <strong>SPACE SIMULATION</strong>
            <span>SOLAR SYSTEM · TECHNICAL PROOF 01</span>
          </div>
        </div>
        <div className="instrument-readouts">
          <span>{roleLabel(role)}</span>
          <span>{qualityLabel(state.quality)}</span>
          <span>{fps || '—'} FPS</span>
          <span>{utcTime} UTC</span>
        </div>
      </header>

      <div className="object-label object-label-sun">
        <span>SOL</span>
        <small>G2V MAIN-SEQUENCE STAR</small>
      </div>

      {isController ? (
        <nav className="control-rail" aria-label="Simulation controls">
          <button
            type="button"
            className={state.navigationMode === 'cinematic' ? 'is-active' : ''}
            onClick={() => setNavigationMode('cinematic')}
          >
            CINEMATIC
          </button>
          <button
            type="button"
            className={state.navigationMode === 'free' ? 'is-active' : ''}
            onClick={() => setNavigationMode('free')}
          >
            FREE FLIGHT
          </button>
          {role === 'single' ? (
            <button type="button" onClick={launchSecondDisplay}>
              LAUNCH SECOND DISPLAY
            </button>
          ) : (
            <button type="button" onClick={restoreSingleDisplay}>
              SINGLE DISPLAY
            </button>
          )}
          <button type="button" onClick={enterFullscreen}>
            FULLSCREEN
          </button>
          <button type="button" onClick={() => setPanelOpen(true)}>
            AWAY / SETTINGS
          </button>
        </nav>
      ) : (
        <nav className="control-rail follower-controls" aria-label="Display controls">
          <button type="button" onClick={enterFullscreen}>
            FULLSCREEN DISPLAY 02
          </button>
        </nav>
      )}

      {state.navigationMode === 'free' && isController && !state.away.active ? (
        <div className="flight-help">DRAG TO LOOK · SCROLL TO ZOOM · W A S D MOVE · Q / E VERTICAL · SHIFT BOOST</div>
      ) : null}

      {notice ? (
        <button type="button" className="notice" onClick={() => setNotice('')}>
          {notice}
        </button>
      ) : null}

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
              <div>
                <span>DISPLAY CONTROL</span>
                <h2>Away mode &amp; calibration</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setPanelOpen(false)}>
                CLOSE
              </button>
            </div>

            <label className="toggle-row">
              <span>
                <strong>AWAY MODE</strong>
                <small>Synchronizes across both display windows.</small>
              </span>
              <input
                type="checkbox"
                checked={state.away.active}
                onChange={(event) => updateAway({ active: event.target.checked })}
              />
            </label>

            <label className="field-row">
              <span>MESSAGE</span>
              <input
                type="text"
                value={state.away.message}
                maxLength={80}
                onChange={(event) => updateAway({ message: event.target.value })}
              />
            </label>

            <label className="field-row">
              <span>EXPECTED RETURN</span>
              <input
                type="time"
                value={state.away.returnTime}
                onChange={(event) => updateAway({ returnTime: event.target.value })}
              />
            </label>

            <div className="two-column-fields">
              <label className="toggle-row compact">
                <span>SHOW CLOCK</span>
                <input
                  type="checkbox"
                  checked={state.away.showClock}
                  onChange={(event) => updateAway({ showClock: event.target.checked })}
                />
              </label>
              <label className="toggle-row compact">
                <span>DIM SCENE</span>
                <input
                  type="checkbox"
                  checked={state.away.dimScene}
                  onChange={(event) => updateAway({ dimScene: event.target.checked })}
                />
              </label>
            </div>

            <label className="field-row">
              <span>RENDER QUALITY</span>
              <select value={state.quality} onChange={(event) => setQuality(event.target.value as QualityPreset)}>
                <option value="performance">Performance</option>
                <option value="balanced">Balanced</option>
                <option value="quality">Quality</option>
              </select>
            </label>

            <label className="field-row">
              <span>BEZEL CORRECTION · {state.bezelPixels} PX</span>
              <input
                type="range"
                min="0"
                max="240"
                step="2"
                value={state.bezelPixels}
                onChange={(event) =>
                  updateState((current) => ({ ...current, bezelPixels: Number(event.target.value) }))
                }
              />
            </label>

            <div className="panel-note">
              <strong>FIREFOX WORKFLOW</strong>
              <p>Open the second display, move it to the right monitor, then select fullscreen in each window.</p>
            </div>
            <div className="panel-note">
              <strong>KEYBOARD SHORTCUT</strong>
              <p>Control + Shift + O opens this panel. Free flight uses W, A, S, D, Q, E and Shift.</p>
            </div>
          </aside>
        </div>
      ) : null}

      <footer className="data-footer">
        <span>POSITION MODEL · LOW-PRECISION J2000 DEMO EPHEMERIS</span>
        <span>DATA PIPELINE · JPL / NASA / GAIA INTEGRATION PLANNED</span>
      </footer>
    </main>
  )
}
