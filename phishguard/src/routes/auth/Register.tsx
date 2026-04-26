import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { registerSchema, type RegisterFormData } from '@/lib/validations/registerSchema';
import { supabase } from '@/lib/supabase';
import { isMockMode } from '@/lib/auth/session';
import { mockSupabaseAuth } from '@/lib/auth/mockAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'user' | 'company'>('user');

  const handleInputChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement> | boolean
  ) => {
    const value = typeof e === 'boolean'
      ? e
      : (field === 'acceptTerms'
        ? (e.target as HTMLInputElement).checked
        : e.target.value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const firstError = result.error.errors[0];
      setError(firstError.message);
      return;
    }

    // Move to company step
    setStep('company');
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!companyName.trim()) {
      setError('Nome da empresa é obrigatório');
      setIsLoading(false);
      return;
    }

    try {
      if (isMockMode()) {
        await mockSupabaseAuth.signIn({ email: formData.email, name: formData.name });
        navigate('/verify-email', { state: { email: formData.email } });
        return;
      }

      // Create user account with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: formData.name,
            company_name: companyName,
          },
        },
      });

      if (error) {
        // Translate Supabase errors to Portuguese
        const message = error.message.toLowerCase();
        if (message.includes('email already') || message.includes('user already')) {
          setError('Este email já está cadastrado');
        } else if (message.includes('invalid email')) {
          setError('Email inválido');
        } else if (message.includes('password') && message.includes('length')) {
          setError('A senha deve ter pelo menos 8 caracteres');
        } else {
          setError('Erro ao criar conta. Tente novamente.');
        }
        return;
      }

      // If we have a user but no session, email confirmation is required
      if (data.user && !data.session) {
        navigate('/verify-email', { state: { email: formData.email } });
        return;
      }

      // If we have a session directly (email confirmation disabled), navigate to dashboard
      navigate('/app/dashboard');
    } catch {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Progress indicator
  const progressSteps = [
    { id: 1, label: 'Conta', active: step === 'user', completed: step === 'company' },
    { id: 2, label: 'Empresa', active: step === 'company' },
  ];

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

        <div className="relative rounded-2xl border border-noir-700/50 bg-noir-900/80 backdrop-blur-sm p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
              <svg className="w-7 h-7 text-noir-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 108 0 4 4 0 00-8 0zm-5 0v.01M12 2v.01" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-display font-bold text-white text-center">
            {step === 'user' ? 'Criar sua conta' : 'Configurar empresa'}
          </h1>
          <p className="mt-2 text-noir-400 text-center text-sm">
            {step === 'user' ? (
              <>
                Já tem conta?{' '}
                <Link to="/login" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
                  Entre
                </Link>
              </>
            ) : (
              <>
                <span className="text-amber-500">{formData.name}</span>, almost there!
              </>
            )}
          </p>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {progressSteps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${s.completed 
                    ? 'bg-amber-500 text-noir-950' 
                    : s.active 
                      ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-500'
                      : 'bg-noir-800 border border-noir-600 text-noir-500'
                  }
                `}>
                  {s.completed ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s.id}
                </div>
                <span className={`ml-2 text-xs font-medium ${
                  s.active || s.completed ? 'text-white' : 'text-noir-500'
                }`}>
                  {s.label}
                </span>
                {i < progressSteps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-3 ${
                    s.completed ? 'bg-amber-500' : 'bg-noir-700'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {step === 'user' ? (
            <form onSubmit={handleUserSubmit} className="mt-8 space-y-5">
              {error && (
                <div className="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-noir-300">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  placeholder="João Silva"
                  className="bg-noir-800/50 border-noir-700/50 focus:border-amber-500/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-noir-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="joao@empresa.com"
                  className="bg-noir-800/50 border-noir-700/50 focus:border-amber-500/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-noir-300">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  placeholder="Mínimo 8 caracteres"
                  className="bg-noir-800/50 border-noir-700/50 focus:border-amber-500/50"
                  required
                />
                <p className="text-xs text-noir-500">
                  Use letras, números e símbolos para uma senha forte
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-noir-300">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  placeholder="Repita a senha"
                  className="bg-noir-800/50 border-noir-700/50 focus:border-amber-500/50"
                  required
                />
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-noir-800/30 border border-noir-700/30">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange('acceptTerms')}
                  className="mt-0.5"
                />
                <label htmlFor="acceptTerms" className="text-sm text-noir-300 leading-relaxed">
                  Concordo com os{' '}
                  <Link to="/termos" className="text-amber-500 hover:text-amber-400 underline">
                    Termos de Uso
                  </Link>
                  {' '}e{' '}
                  <Link to="/termos" className="text-amber-500 hover:text-amber-400 underline">
                    Política de Privacidade
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
              >
                Continuar
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCompanySubmit} className="mt-8 space-y-5">
              {error && (
                <div className="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-400">
                  Crie um espaço de trabalho para sua empresa. Você poderá adicionar colegas depois.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-noir-300">Nome da empresa</Label>
                <Input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Corp"
                  className="bg-noir-800/50 border-noir-700/50 focus:border-amber-500/50"
                  required
                />
                <p className="text-xs text-noir-500">
                  Este será o nome do seu espaço de trabalho na plataforma
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize" className="text-noir-300">Número de funcionários</Label>
                <select
                  id="companySize"
                  className="w-full rounded-lg border border-noir-700 bg-noir-800/50 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  aria-label="Número de funcionários"
                >
                  <option value="">Selecione</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep('user')}
                >
                  <svg className="w-4 h-4 mr-1" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Voltar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Criando...
                    </span>
                  ) : (
                    'Criar conta'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}