import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { mockSupabaseAuth } from '@/lib/auth/mockAuth';
import { isMockMode } from '@/lib/auth/session';

// Client logos for social proof (SVG placeholders representing company logos)
const clientLogos = [
  { name: 'TechCorp', initials: 'TC', color: '#4A5568' },
  { name: 'DataFlow', initials: 'DF', color: '#2D3748' },
  { name: 'CloudNet', initials: 'CN', color: '#1A202C' },
  { name: 'SecureSys', initials: 'SS', color: '#4A5568' },
  { name: 'NetWise', initials: 'NW', color: '#2D3748' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Integrate with Supabase auth
      // For now, simulate login
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check demo credentials or proceed
      if (email && password) {
        navigate('/app/dashboard');
      } else {
        setError('Preencha email e senha');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Integrate with Supabase magic link
      await new Promise(resolve => setTimeout(resolve, 800));
      setMagicLinkSent(true);
    } catch (err) {
      setError('Erro ao enviar link mágico. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (isMockMode()) {
        await mockSupabaseAuth.signIn({ email: 'demo@phishguard.com', name: 'Demo User' });
      }
      navigate('/app/dashboard');
    } catch (err) {
      setError('Erro ao entrar no modo demo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-noir-950 px-4 py-12">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        </div>

      <div className="relative w-full max-w-none">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent rounded-3xl blur-xl" />

          <div className="relative w-full rounded-2xl border border-noir-700/50 bg-noir-900/80 backdrop-blur-sm p-8 shadow-2xl">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-noir-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-display font-bold text-white text-center">
              Link enviado!
            </h1>
            <p className="mt-3 text-noir-400 text-center text-sm leading-relaxed">
              Enviamos um link de acesso para{' '}
              <span className="text-amber-500 font-medium">{email}</span>
            </p>
            <p className="mt-2 text-noir-500 text-center text-xs max-w-none">
              Clique no link recebido por email para fazer login. O link expira em 15 minutos.
            </p>

            <div className="mt-8 p-4 rounded-xl bg-noir-800/50 border border-noir-700/50">
              <p className="text-xs text-noir-400 text-center max-w-none">
                Não recebeu o email? Verifique sua caixa de spam ou{' '}
                <button 
                  onClick={() => setMagicLinkSent(false)}
                  className="text-amber-500 hover:text-amber-400 underline"
                >
                  tente novamente
                </button>
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="text-sm text-noir-400 hover:text-white transition-colors"
              >
                Voltar ao login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-noir-950 px-4 py-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-noir-900/50 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent rounded-3xl blur-xl" />

        <div className="relative w-full rounded-2xl border border-noir-700/50 bg-noir-900/80 backdrop-blur-sm p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
              <svg className="w-7 h-7 text-noir-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-display font-bold text-white text-center">
            Entrar na sua conta
          </h1>
          <p className="mt-2 text-noir-400 text-center text-sm">
            Não tem conta?{' '}
            <Link to="/register" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
              Cadastre-se grátis
            </Link>
          </p>

          {!showMagicLink ? (
            <>
              {/* Email/Password Form */}
              <form onSubmit={handleEmailPasswordLogin} className="mt-8 space-y-5">
                {error && (
                  <div className="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-sm">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-noir-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@empresa.com"
                    className="bg-noir-800/50 border-noir-700/50 focus:border-amber-500/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-noir-300">Senha</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-noir-800/50 border-noir-700/50 focus:border-amber-500/50"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Entrando...
                    </span>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-noir-700/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-noir-900/80 px-4 text-xs text-noir-500">
                    ou continue com
                  </span>
                </div>
              </div>

              {/* Magic Link Option */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowMagicLink(true)}
                  aria-label="Entrar com link mágico"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-noir-700/50 bg-noir-800/30 hover:bg-noir-800/50 text-noir-300 hover:text-white transition-all duration-200 group"
                >
                  <svg className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium">Entrar com link mágico</span>
                </button>
              </div>

              {/* Demo Login Button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-noir-800/20 hover:bg-noir-800/40 text-noir-400 hover:text-amber-500 transition-all duration-200 text-sm"
                >
                  Entrar como Demo
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Magic Link Form */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowMagicLink(false)}
                  aria-label="Voltar ao login com senha"
                  className="flex items-center gap-2 text-sm text-noir-400 hover:text-white transition-colors mb-4"
                >
                  <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Voltar ao login com senha
                </button>
              </div>

              <form onSubmit={handleMagicLink} className="mt-4 space-y-5">
                {error && (
                  <div className="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-sm">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="magic-email" className="text-noir-300">Email para receber o link</Label>
                  <Input
                    id="magic-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@empresa.com"
                    className="bg-noir-800/50 border-noir-700/50 focus:border-amber-500/50"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Enviar link mágico
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-4 text-xs text-noir-500 text-center">
                Enviaremos um link de acesso瞬Seu email. O link expira em 15 minutos.
              </p>
            </>
          )}

          {/* Terms */}
          <p className="mt-6 text-xs text-noir-500 text-center">
            Ao entrar, você concorda com nossos{' '}
            <Link to="/termos" className="text-amber-500/70 hover:text-amber-500 transition-colors">
              Termos de Uso
            </Link>
            {' '}e{' '}
            <Link to="/termos" className="text-amber-500/70 hover:text-amber-500 transition-colors">
              Política de Privacidade
            </Link>
          </p>
        </div>

        {/* Social Proof */}
        <div className="mt-8 text-center">
          <p className="text-xs text-noir-500 uppercase tracking-wider mb-4">
            Empresas que confiam
          </p>
          <div className="flex items-center justify-center gap-6">
            {clientLogos.map((logo, index) => (
              <div
                key={logo.name}
                className="flex items-center gap-2 opacity-40 hover:opacity-60 transition-opacity"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: logo.color }}
                >
                  {logo.initials}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}