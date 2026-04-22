import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export default function ChangePasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Link inválido ou expirado. Solicite um novo link.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Integrate with Supabase
      // Verify token and reset password
      await new Promise(resolve => setTimeout(resolve, 800));
      setSuccess(true);
    } catch {
      setError('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-noir-950 px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-4xl">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent rounded-3xl blur-xl" />
          
          <div className="relative rounded-2xl border border-noir-700/50 bg-noir-900/80 backdrop-blur-sm p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h1 className="text-2xl font-display font-bold text-white">
              Link expirado
            </h1>
            <p className="mt-3 text-noir-400 text-sm leading-relaxed max-w-lg">
              Este link de recuperação de senha expirou ou é inválido.
            </p>

            <div className="mt-8">
              <Link to="/forgot-password">
                <Button variant="primary" size="lg">
                  Solicitar novo link
                </Button>
              </Link>
            </div>

            <div className="mt-6">
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-noir-950 px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-4xl">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent rounded-3xl blur-xl" />
          
          <div className="relative rounded-2xl border border-noir-700/50 bg-noir-900/80 backdrop-blur-sm p-8 shadow-2xl text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
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

            <h1 className="text-2xl font-display font-bold text-white">
              Senha alterada!
            </h1>
            <p className="mt-3 text-noir-400 text-sm leading-relaxed max-w-lg">
              Sua senha foi redefinida com sucesso. Agora você pode fazer login com sua nova senha.
            </p>

            <div className="mt-8">
              <Link to="/login">
                <Button variant="primary" size="lg" className="w-full">
                  Fazer login
                </Button>
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

      <div className="relative w-full max-w-4xl">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent rounded-3xl blur-xl" />

        <div className="relative rounded-2xl border border-noir-700/50 bg-noir-900/80 backdrop-blur-sm p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-display font-bold text-white text-center">
            Criar nova senha
          </h1>
          <p className="mt-2 text-noir-400 text-center text-sm">
            Escolha uma senha forte para proteger sua conta.
          </p>

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
              <Label htmlFor="password" className="text-noir-300">Nova senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="bg-noir-800/50 border-noir-700/50 focus:border-amber-500/50"
                required
              />
              <p className="text-xs text-noir-500">
                Use letras, números e símbolos para uma senha forte
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-noir-300">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="bg-noir-800/50 border-noir-700/50 focus:border-amber-500/50"
                required
              />
            </div>

            {/* Password strength indicator */}
            <div className="space-y-2">
              <div className="flex gap-1">
                <div className={`h-1 flex-1 rounded-full ${password.length >= 8 ? 'bg-amber-500' : 'bg-noir-700'}`} />
                <div className={`h-1 flex-1 rounded-full ${/[A-Z]/.test(password) && password.length >= 8 ? 'bg-amber-500' : 'bg-noir-700'}`} />
                <div className={`h-1 flex-1 rounded-full ${/[0-9]/.test(password) && password.length >= 8 ? 'bg-amber-500' : 'bg-noir-700'}`} />
                <div className={`h-1 flex-1 rounded-full ${/[^A-Za-z0-9]/.test(password) && password.length >= 8 ? 'bg-amber-500' : 'bg-noir-700'}`} />
              </div>
              <p className="text-xs text-noir-500">
                Senha forte: min 8 caracteres + maiúsculas + números + símbolos
              </p>
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
                  Alterando...
                </span>
              ) : (
                'Alterar senha'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="text-sm text-noir-400 hover:text-white transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}