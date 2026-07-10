import { useEffect, useRef } from 'react'
import type { DisplayRole, SharedSimulationState } from '../types'

const CHANNEL_NAME = 'space-simulation-display-v1'
const STORAGE_KEY = 'space-simulation-display-message'

interface StateMessage {
  type: 'STATE'
  originId: string
  sessionId: string
  payload: SharedSimulationState
  sentAt: number
}

interface RequestMessage {
  type: 'REQUEST_STATE'
  originId: string
  sessionId: string
  sentAt: number
}

type SyncMessage = StateMessage | RequestMessage

function isSyncMessage(value: unknown): value is SyncMessage {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<SyncMessage>
  return (
    (candidate.type === 'STATE' || candidate.type === 'REQUEST_STATE') &&
    typeof candidate.originId === 'string' &&
    typeof candidate.sessionId === 'string'
  )
}

export function useDisplaySync(
  role: DisplayRole,
  state: SharedSimulationState,
  applyRemoteState: (state: SharedSimulationState) => void,
): void {
  const originIdRef = useRef(crypto.randomUUID())
  const stateRef = useRef(state)
  const applyRef = useRef(applyRemoteState)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const isController = role !== 'right'

  stateRef.current = state
  applyRef.current = applyRemoteState

  useEffect(() => {
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null
    channelRef.current = channel

    const send = (message: SyncMessage) => {
      channel?.postMessage(message)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(message))
      } catch {
        // Storage can be unavailable in privacy modes; BroadcastChannel remains primary.
      }
    }

    const receive = (message: unknown) => {
      if (!isSyncMessage(message)) return
      if (message.originId === originIdRef.current) return
      if (message.sessionId !== stateRef.current.sessionId) return

      if (message.type === 'REQUEST_STATE' && isController) {
        send({
          type: 'STATE',
          originId: originIdRef.current,
          sessionId: stateRef.current.sessionId,
          payload: stateRef.current,
          sentAt: Date.now(),
        })
        return
      }

      if (message.type === 'STATE' && !isController) {
        applyRef.current(message.payload)
      }
    }

    const onMessage = (event: MessageEvent<unknown>) => receive(event.data)
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        receive(JSON.parse(event.newValue))
      } catch {
        // Ignore malformed cross-window messages.
      }
    }

    channel?.addEventListener('message', onMessage)
    window.addEventListener('storage', onStorage)

    if (!isController) {
      send({
        type: 'REQUEST_STATE',
        originId: originIdRef.current,
        sessionId: stateRef.current.sessionId,
        sentAt: Date.now(),
      })
    }

    return () => {
      channel?.removeEventListener('message', onMessage)
      channel?.close()
      channelRef.current = null
      window.removeEventListener('storage', onStorage)
    }
  }, [isController])

  useEffect(() => {
    if (!isController) return

    const message: StateMessage = {
      type: 'STATE',
      originId: originIdRef.current,
      sessionId: state.sessionId,
      payload: state,
      sentAt: Date.now(),
    }
    channelRef.current?.postMessage(message)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(message))
    } catch {
      // BroadcastChannel is sufficient when localStorage is unavailable.
    }
  }, [isController, state])
}
