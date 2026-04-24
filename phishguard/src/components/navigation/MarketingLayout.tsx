import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export default function MarketingLayout() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { to: '/', label: 'Início' },
    { to: '/pricing', label: 'Preços' },
    { to: '/about', label: 'Sobre' },
    { to: '/security', label: 'Segurança' },
    { to: '/lgpd', label: 'LGPD' },
    { to: '/contact', label: 'Contato' },
    { to: '/demo', label: 'Demo' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-noir-950">
      {/* Header */}
      <header className="border-b border-noir-800 bg-noir-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="text-2xl font-display font-bold text-surface-0 hover:text-amber-500 transition-colors">
              PhishGuard
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isActive(link.to)
                      ? 'text-amber-500'
                      : 'text-noir-400 hover:text-surface-0'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:block">
              <Button variant="primary" size="sm" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-noir-400 hover:text-surface-0 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-noir-800 bg-noir-950">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'text-sm font-medium py-2 transition-colors',
                    isActive(link.to) ? 'text-amber-500' : 'text-noir-400 hover:text-surface-0'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-noir-800">
                <Button variant="primary" size="sm" className="w-full" asChild>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    Entrar
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-noir-800 bg-noir-950">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-noir-500">
              © 2026 PhishGuard. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/lgpd" className="text-sm text-noir-500 hover:text-amber-500 transition-colors">
                LGPD
              </Link>
              <Link to="/security" className="text-sm text-noir-500 hover:text-amber-500 transition-colors">
                Segurança
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}