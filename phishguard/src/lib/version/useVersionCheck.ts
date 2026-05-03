import { useState, useEffect, useCallback } from 'react'
import type { UpdateState, UpdateAction } from './types'
import { INITIAL_STATE } from './types'

// Injected at build time by Vite (see vite.config.ts)
declare const __APP_VERSION__: string

// ─── URL cleanup ──────────────────────────────────────────────────────────────

/**
 * Removes `?v=` or `&v=` query param from the current URL.
 * Called at module import time to clean up the URL before React renders.
 * Preserves all other query parameters.
 */
function cleanVersionParam(): void {
  const url = new URL(window.location.href)
  const hasVersionParam = url.searchParams.has('v')

  if (hasVersionParam) {
    url.searchParams.delete('v')
    const search = url.search
    // history.replaceState cleans the URL in-place without navigation
    history.replaceState(null, '', url.pathname + (search || '') + url.hash)
  }
}

cleanVersionParam()

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVersionCheck() {
  const [state, setState] = useState<UpdateState>(INITIAL_STATE)

  const dispatch = useCallback((action: UpdateAction) => {
    setState(prev => {
      switch (action.type) {
        case 'DISMISS':
          return {
            ...prev,
            updateAvailable: false,
            dismissedVersion: action.version,
          }
        case 'SET_REMOTE': {
          const isNewer = action.version !== __APP_VERSION__
          const isDismissed = sessionStorage.getItem('phishguard:dismissedVersion') === action.version
          return {
            ...prev,
            loading: false,
            error: null,
            remoteVersion: action.version,
            updateAvailable: isNewer && !isDismissed,
          }
        }
        case 'SET_ERROR':
          return {
            ...prev,
            loading: false,
            error: action.error,
          }
        case 'RESET':
          return INITIAL_STATE
        default:
          return prev
      }
    })
  }, [])

  const checkForUpdate = useCallback(async () => {
    try {
      dispatch({ type: 'RESET' })
      setState(s => ({ ...s, loading: true }))

      const url = `/version.json?t=${Date.now()}`
      const res = await fetch(url)

      if (!res.ok) {
        dispatch({ type: 'SET_ERROR', error: `HTTP ${res.status}` })
        return
      }

      const json = await res.json()
      const remoteVersion: string = json?.version

      if (!remoteVersion) {
        dispatch({ type: 'SET_ERROR', error: 'Invalid version.json' })
        return
      }

      dispatch({ type: 'SET_REMOTE', version: remoteVersion })
    } catch {
      dispatch({ type: 'SET_ERROR', error: 'Fetch failed' })
    }
  }, [dispatch])

  const dismiss = useCallback((version: string) => {
    sessionStorage.setItem('phishguard:dismissedVersion', version)
    dispatch({ type: 'DISMISS', version })
  }, [dispatch])

  const update = useCallback(() => {
    const separator = window.location.search ? '&' : '?'
    window.location.href = `${window.location.pathname}${window.location.search || ''}${separator}v=${Date.now()}`
  }, [])

  // First check: 5 seconds after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdate()
    }, 5000)
    return () => clearTimeout(timer)
  }, [checkForUpdate])

  // Repeat check: every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      checkForUpdate()
    }, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [checkForUpdate])

  // Check on tab focus (visibilitychange)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [checkForUpdate])

  return {
    updateAvailable: state.updateAvailable,
    currentVersion: __APP_VERSION__,
    remoteVersion: state.remoteVersion,
    dismiss,
    update,
    loading: state.loading,
    error: state.error,
  }
}

// ─── Pure helper ─────────────────────────────────────────────────────────────

export { cleanVersionParam }