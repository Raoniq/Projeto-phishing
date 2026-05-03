import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVersionCheck, cleanVersionParam } from '../useVersionCheck'

// Stub the global __APP_VERSION__ injected by Vite
beforeAll(() => {
  vi.stubGlobal('__APP_VERSION__', '12345')
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('cleanVersionParam', () => {
  const originalHref = window.location.href

  beforeEach(() => {
    window.history.replaceState({}, '', originalHref)
  })

  afterEach(() => {
    window.history.replaceState({}, '', originalHref)
    vi.restoreAllMocks()
  })

  it('removes ?v= parameter from URL and preserves path', () => {
    window.history.replaceState({}, '', '/app?v=12345')
    cleanVersionParam()
    expect(window.location.search).toBe('')
    expect(window.location.pathname).toBe('/app')
  })

  it('preserves other query params when removing v', () => {
    window.history.replaceState({}, '', '/app?page=1&v=12345')
    cleanVersionParam()
    expect(window.location.search).toBe('?page=1')
    expect(window.location.pathname).toBe('/app')
  })

  it('removes &v=456 when mixed with other params', () => {
    window.history.replaceState({}, '', '/app?page=2&v=67890&sort=asc')
    cleanVersionParam()
    expect(window.location.search).toBe('?page=2&sort=asc')
    expect(window.location.pathname).toBe('/app')
  })

  it('does nothing when no v param exists', () => {
    window.history.replaceState({}, '', '/app?page=3')
    const initialSearch = window.location.search
    cleanVersionParam()
    expect(window.location.search).toBe(initialSearch)
  })

  it('handles URL with only ?v param', () => {
    window.history.replaceState({}, '', '/?v=99999')
    cleanVersionParam()
    expect(window.location.search).toBe('')
    expect(window.location.pathname).toBe('/')
  })
})

describe('useVersionCheck', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch')
    sessionStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    sessionStorage.clear()
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('initializes with updateAvailable: false and loading: false', () => {
      const { result } = renderHook(() => useVersionCheck())
      expect(result.current.updateAvailable).toBe(false)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.remoteVersion).toBe(null)
    })

    it('returns currentVersion equal to __APP_VERSION__', () => {
      const { result } = renderHook(() => useVersionCheck())
      expect(result.current.currentVersion).toBe('12345')
    })
  })

  describe('fetch handling', () => {
    it('handles HTTP error status', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(null, { status: 404 }))

      const { result } = renderHook(() => useVersionCheck())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6000)
      })

      expect(result.current.error).toBe('HTTP 404')
      expect(result.current.loading).toBe(false)
    })

    it('handles fetch rejection gracefully', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useVersionCheck())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6000)
      })

      expect(result.current.error).toBe('Fetch failed')
      expect(result.current.loading).toBe(false)
    })

    it('handles malformed JSON response', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('not json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))

      const { result } = renderHook(() => useVersionCheck())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6000)
      })

      // Malformed JSON throws during res.json() which is caught by outer catch
      expect(result.current.error).toBe('Fetch failed')
      expect(result.current.loading).toBe(false)
    })

    it('handles missing version field in JSON', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('{"data":"other"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))

      const { result } = renderHook(() => useVersionCheck())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6000)
      })

      expect(result.current.error).toBe('Invalid version.json')
      expect(result.current.loading).toBe(false)
    })
  })

  describe('version comparison', () => {
    it('sets updateAvailable: true when remote version differs from current', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('{"version":"99999"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))

      const { result } = renderHook(() => useVersionCheck())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6000)
      })

      expect(result.current.updateAvailable).toBe(true)
      expect(result.current.remoteVersion).toBe('99999')
    })

    it('sets updateAvailable: false when remote version equals current', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('{"version":"12345"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))

      const { result } = renderHook(() => useVersionCheck())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6000)
      })

      expect(result.current.updateAvailable).toBe(false)
      expect(result.current.remoteVersion).toBe('12345')
    })
  })

  describe('dismissal logic', () => {
    it('dismiss stores version in sessionStorage', () => {
      const { result } = renderHook(() => useVersionCheck())

      act(() => {
        result.current.dismiss('99999')
      })

      expect(sessionStorage.getItem('phishguard:dismissedVersion')).toBe('99999')
    })

    it('dismiss sets updateAvailable to false', () => {
      const { result } = renderHook(() => useVersionCheck())

      act(() => {
        result.current.dismiss('99999')
      })

      expect(result.current.updateAvailable).toBe(false)
    })

    it('updateAvailable is false when remote version matches dismissed version', async () => {
      sessionStorage.setItem('phishguard:dismissedVersion', '99999')

      fetchSpy.mockResolvedValueOnce(new Response('{"version":"99999"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))

      const { result } = renderHook(() => useVersionCheck())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6000)
      })

      expect(result.current.updateAvailable).toBe(false)
    })
  })
})