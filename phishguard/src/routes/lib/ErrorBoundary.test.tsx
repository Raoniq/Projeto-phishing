import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary'

// Properly mock window.location with reload
const mockLocation = {
  pathname: '/',
  reload: vi.fn(),
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('ErrorBoundary', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockLocation.pathname = '/'
    mockLocation.reload.mockClear()
    cleanup()
  })

  describe('RouteErrorView - Auth-aware fallback routing', () => {
    it('routes to /app/dashboard when current pathname starts with /app', () => {
      mockLocation.pathname = '/app/campanhas'

      render(
        <MemoryRouter initialEntries={['/app/campanhas']}>
          <ErrorBoundary>
            <ErrorTrigger error={new Error('Test error')} />
          </ErrorBoundary>
        </MemoryRouter>
      )

      const buttons = screen.getAllByRole('button', { name: 'Voltar ao início' })
      fireEvent.click(buttons[0])

      expect(mockNavigate).toHaveBeenCalledWith('/app/dashboard')
    })

    it('routes to / when current pathname is a public route', () => {
      mockLocation.pathname = '/pricing'

      render(
        <MemoryRouter initialEntries={['/pricing']}>
          <ErrorBoundary>
            <ErrorTrigger error={new Error('Test error')} />
          </ErrorBoundary>
        </MemoryRouter>
      )

      const buttons = screen.getAllByRole('button', { name: 'Voltar ao início' })
      fireEvent.click(buttons[0])

      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  describe('Retry behavior - resetError', () => {
    it('does NOT call window.location.reload() on "Tentar novamente"', () => {
      mockLocation.pathname = '/app/test'

      render(
        <MemoryRouter initialEntries={['/app/test']}>
          <ErrorBoundary>
            <ErrorTrigger error={new Error('Test error')} />
          </ErrorBoundary>
        </MemoryRouter>
      )

      const buttons = screen.getAllByRole('button', { name: 'Tentar novamente' })
      fireEvent.click(buttons[0])

      expect(mockLocation.reload).not.toHaveBeenCalled()
    })
  })
})

// Helper component that throws an error to trigger the boundary
function ErrorTrigger({ error }: { error: Error }) {
  throw error
}
