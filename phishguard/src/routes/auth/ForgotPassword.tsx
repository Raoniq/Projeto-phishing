import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { supabase } from '@/lib/supabase';
import { isMockMode } from '@/lib/auth/session';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isMockMode()) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setSent(true);
        setResendCountdown(60);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/change-password`,
        });

        if (error) {
          const message = error.message.toLowerCase();
          if (message.includes('email not found') || message.includes('user not found')) {
            setError('Este email não está cadastrado');
          } else if (message.includes('invalid email')) {
            setError('Email inválido');
          } else {
            setError('Erro ao enviar email. Tente novamente.');
          }
          return;
        }
        setSent(true);
        setResendCountdown(60);
      }

      // Start countdown for resend
      const interval = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError('Erro ao enviar email. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;

    setError('');
    setIsLoading(true);

    try {
      if (isMockMode()) {
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/change-password`,
        });

        if (error) {
          setError('Erro ao reenviar. Tente novamente.');
          return;
        }
      }
      setResendCountdown(60);

      const interval = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError('Erro ao reenviar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-noir-950 px-4 py-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-noir-900/50 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent rounded-3xl blur-xl" />

        <div className="relative rounded-2xl border border-noir-700/50 bg-noir-900/80 backdrop-blur-sm p-8 shadow-2xl">
          {!sent ? (
            <>
              {/* Step 1: Request Reset */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <h1 className="text-2xl font-display font-bold text-white text-center">
                Esqueceu a senha?
              </h1>
              <p className="mt-3 text-noir-400 text-center text-sm leading-relaxed">
                Sem problemas! Digite seu email e enviaremos instruções para criar uma nova senha.
              </p>

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

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                    'Enviar instruções'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="text-sm text-noir-400 hover:text-white transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Voltar ao login
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Email Sent */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-noir-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-display font-bold text-white text-center">
                Email enviado!
              </h1>
              <p className="mt-4 text-noir-400 text-center text-sm leading-relaxed">
                Enviamos instruções para resetar sua senha para{' '}
                <span className="text-amber-500 font-medium">{email}</span>
              </p>

              <div className="mt-6 p-4 rounded-xl bg-noir-800/50 border border-noir-700/50">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-noir-300">
                    <p className="font-medium text-white mb-1">Verifique sua caixa de entrada</p>
                    <p className="text-noir-400">
                      O link de recuperação expira em <span className="text-amber-500">15 minutos</span>. 
                      Verifique também sua caixa de spam.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleResend}
                  disabled={resendCountdown > 0 || isLoading}
                  className={`
                    flex-1 py-3 rounded-xl font-medium text-sm transition-all duration-200
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
                  ) : isLoading ? (
                    'Enviando...'
                  ) : (
                    'Reenviar email'
                  )}
                </button>
              </div>

              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="text-sm text-noir-400 hover:text-white transition-colors"
                >
                  Lembrou a senha? Entre aqui
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}