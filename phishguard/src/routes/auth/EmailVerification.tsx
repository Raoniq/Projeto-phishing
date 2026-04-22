import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const verifyEmail = useCallback(async () => {
    setStatus('verifying');

    try {
      // TODO: Integrate with Supabase
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Não foi possível verificar o email. O link pode ter expirado.');
    }
  }, []);

  useEffect(() => {
    if (token) {
      // Defer to avoid cascading renders
      requestAnimationFrame(() => {
        verifyEmail();
      });
    }
  }, [token, verifyEmail]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleResend = async () => {
    if (resendCountdown > 0 || !email) return;
    
    setStatus('pending');
    setErrorMessage('');
    
    try {
      // TODO: Integrate with Supabase
      await new Promise(resolve => setTimeout(resolve, 800));
      setResendCountdown(60);
    } catch {
      setErrorMessage('Erro ao reenviar. Tente novamente.');
    }
  };

  // If token is present, show verification in progress
  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-noir-950 px-4 py-12">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-noir-900/50 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-4xl">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent rounded-3xl blur-xl" />

          <div className="relative rounded-2xl border border-noir-700/50 bg-noir-900/80 backdrop-blur-sm p-8 shadow-2xl text-center">
            {status === 'verifying' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <svg className="w-10 h-10 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <h1 className="text-2xl font-display font-bold text-white">
                  Verificando email...
                </h1>
                <p className="mt-3 text-noir-400 text-sm">
                  Por favor, aguarde enquanto verificamos seu email.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-noir-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <h1 className="text-2xl font-display font-bold text-white">
                  Email verificado!
                </h1>
                <p className="mt-3 text-noir-400 text-sm leading-relaxed max-w-lg">
                  Sua conta foi confirmada com sucesso. Bem-vindo ao PhishGuard!
                </p>

                <div className="mt-8">
                  <Link to="/login">
                    <Button variant="primary" size="lg" className="w-full">
                      Acessar dashboard
                      <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>

                <h1 className="text-2xl font-display font-bold text-white">
                  Erro na verificação
                </h1>
                <p className="mt-3 text-noir-400 text-sm leading-relaxed max-w-lg">
                  {errorMessage || 'O link de verificação expirou ou é inválido.'}
                </p>

                {email && (
                  <div className="mt-6">
                    <button
                      onClick={handleResend}
                      disabled={resendCountdown > 0}
                      className={`
                        w-full py-3 rounded-xl font-medium text-sm transition-all duration-200
                        ${resendCountdown > 0 
                          ? 'bg-noir-800 text-noir-500 cursor-not-allowed'
                          : 'bg-amber-500 text-noir-950 hover:bg-amber-400'
                        }
                      `}
                    >
                      {resendCountdown > 0 ? (
                        `Reenviar email em ${resendCountdown}s`
                      ) : (
                        'Reenviar email de verificação'
                      )}
                    </button>
                  </div>
                )}

                <div className="mt-6">
                  <Link 
                    to="/login" 
                    className="text-sm text-noir-400 hover:text-white transition-colors"
                  >
                    Voltar ao login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No token - show pending state with email info
  return (
    <div className="min-h-screen flex items-center justify-center bg-noir-950 px-4 py-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-noir-900/50 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent rounded-3xl blur-xl" />

        <div className="relative rounded-2xl border border-noir-700/50 bg-noir-900/80 backdrop-blur-sm p-8 shadow-2xl text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-display font-bold text-white">
            Verifique seu email
          </h1>

          {/* Demo login button */}
          <div className="mt-4 p-4 rounded-xl bg-noir-800/30 border border-noir-700/30">
            <p className="text-xs text-noir-500 text-center mb-3">Quer só experimentar?</p>
            <button
              type="button"
              onClick={() => navigate('/app/dashboard')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 hover:text-amber-400 transition-all duration-200 font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Entrar como Demo
            </button>
          </div>
          
          {email ? (
            <p className="mt-3 text-noir-400 text-sm leading-relaxed max-w-lg">
              Enviamos um link de confirmação para{' '}
              <span className="text-amber-500 font-medium">{email}</span>
            </p>
          ) : (
            <p className="mt-3 text-noir-400 text-sm leading-relaxed">
              Verifique sua caixa de entrada e clique no link de confirmação para ativar sua conta.
            </p>
          )}

          <div className="mt-6 p-4 rounded-xl bg-noir-800/50 border border-noir-700/50 text-left">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-noir-300">
                <p className="font-medium text-white mb-1">Dicas</p>
                <ul className="text-noir-400 space-y-1">
                  <li>• Verifique também sua caixa de spam</li>
                  <li>• O link expira em 24 horas</li>
                  <li>• Certifique-se de usar o mesmo email informado no cadastro</li>
                </ul>
              </div>
            </div>
          </div>

          {email && (
            <div className="mt-6">
              <button
                onClick={handleResend}
                disabled={resendCountdown > 0}
                className={`
                  w-full py-3 rounded-xl font-medium text-sm transition-all duration-200
                  ${resendCountdown > 0 
                    ? 'bg-noir-800 text-noir-500 cursor-not-allowed'
                    : 'bg-noir-800/50 text-noir-300 hover:bg-noir-800 hover:text-white border border-noir-700/50'
                  }
                `}
              >
                {resendCountdown > 0 ? (
                  <span className="flex items-center justify-center gap-1">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Reenviar em {resendCountdown}s
                  </span>
                ) : (
                  'Reenviar email de verificação'
                )}
              </button>
            </div>
          )}

          <div className="mt-6 space-y-2">
            <Link 
              to="/login" 
              className="block text-sm text-noir-400 hover:text-white transition-colors"
            >
              Já verificou? Faça login
            </Link>
            <Link 
              to="/register" 
              className="block text-sm text-noir-500 hover:text-noir-300 transition-colors"
            >
              Não recebeu o email? Cadastre novamente
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}