/**
 * useRoomWebSocket — connects to /ws/positions and streams person positions.
 *
 * Usage:
 *   const { persons, connected, error } = useRoomWebSocket('ws://localhost:8000')
 *
 * Returns:
 *   persons   {Array}   [{id, world_x, world_y, zone?}, ...]
 *   connected {boolean} true while the socket is open
 *   error     {string|null} last error message, or null
 */
import { useState, useEffect, useRef, useCallback } from 'react'

const DEFAULT_RECONNECT_MS = 3000
const WS_PATH = '/ws/positions'

export default function useRoomWebSocket(
  serverUrl,
  {
    reconnectMs = DEFAULT_RECONNECT_MS,
    enabled     = true,
  } = {}
) {
  const [persons,   setPersons]   = useState([])
  const [connected, setConnected] = useState(false)
  const [error,     setError]     = useState(null)

  const wsRef         = useRef(null)
  const reconnectRef  = useRef(null)
  const mountedRef    = useRef(true)

  const connect = useCallback(() => {
    if (!serverUrl || !enabled) return

    // Build ws:// URL from http:// server URL
    const wsUrl = serverUrl
      .replace(/^http:\/\//, 'ws://')
      .replace(/^https:\/\//, 'wss://')
      .replace(/\/$/, '')
      + WS_PATH

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        setConnected(true)
        setError(null)
      }

      ws.onmessage = (evt) => {
        if (!mountedRef.current) return
        try {
          const data = JSON.parse(evt.data)
          if (Array.isArray(data.persons)) {
            setPersons(data.persons)
          }
        } catch (_) { /* ignore malformed frames */ }
      }

      ws.onerror = () => {
        if (!mountedRef.current) return
        setError('WebSocket error — retrying…')
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setConnected(false)
        // Auto-reconnect
        reconnectRef.current = setTimeout(connect, reconnectMs)
      }
    } catch (err) {
      setError(err.message || 'Failed to open WebSocket')
    }
  }, [serverUrl, enabled, reconnectMs])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [connect])

  return { persons, connected, error }
}
