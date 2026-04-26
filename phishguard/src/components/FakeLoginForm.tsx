import { useState } from 'react';
import { hashCredentials, isValidEmail, isCorporateEmail } from '~/lib/crypto';

/**
 * Fake credential capture form for phishing simulations
 *
 * SECURITY CRITICAL:
 * - Password is NEVER transmitted in plaintext
 * - Only SHA-256 hash + password length are sent
 * - Email is validated for corporate domain check
 */
interface FakeLoginFormProps {
  campaignTargetId: string;
  onSubmitSuccess?: () => void;
  corporateEmailHint?: string; // e.g., "@empresa.com.br"
}

interface FormState {
  email: string;
  password: string;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}

export default function FakeLoginForm({
  campaignTargetId,
  onSubmitSuccess,
  corporateEmailHint,
}: FakeLoginFormProps) {
  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    isSubmitting: false,
    error: null,
    success: false,
  });

  const validateForm = (): string | null => {
    if (!form.email.trim()) {
      return 'Informe seu email corporativo';
    }

    if (!isValidEmail(form.email)) {
      return 'Formato de email inválido';
    }

    if (corporateEmailHint && !form.email.toLowerCase().endsWith(corporateEmailHint.toLowerCase())) {
      return `Use seu email corporativo (${corporateEmailHint})`;
    }

    if (!isCorporateEmail(form.email)) {
      return 'Use seu email corporativo, não pessoal';
    }

    if (!form.password) {
      return 'Informe sua senha';
    }

    if (form.password.length < 4) {
      return 'Senha muito curta';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setForm((prev) => ({ ...prev, error: validationError }));
      return;
    }

    setForm((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // CRITICAL: Hash credentials locally BEFORE sending
      // Password is NEVER sent in plaintext
      const credentialHash = await hashCredentials(form.email, form.password);

      const payload = {
        campaign_target_id: campaignTargetId,
        attempt_hash: credentialHash,
        password_length: form.password.length,
        email: form.email, // Email is sent for logging/corporate validation
        email_matches_corporate: isCorporateEmail(form.email),
        // IMPORTANT: password field is NEVER sent
      };

      // Send to tracking endpoint
      const response = await fetch('/tracking/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar credenciais');
      }

      setForm((prev) => ({
        ...prev,
        isSubmitting: false,
        success: true,
        error: null,
      }));

      onSubmitSuccess?.();
    } catch {
      setForm((prev) => ({
        ...prev,
        isSubmitting: false,
        error: 'Erro ao processar credenciais. Tente novamente.',
      }));
    }
  };

  if (form.success) {
    return (
      <div className="rounded-xl border border-success/30 bg-success-subtle/30 p-6 text-center">
        <svg
          className="mx-auto h-12 w-12 text-success"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-fg-primary">Credenciais enviadas!</h3>
        <p className="mt-2 text-sm text-fg-secondary">
          Suas credenciais foram processadas com segurança.
        </p>
        <p className="mt-1 text-xs text-fg-tertiary">
          Senha NÃO foi armazenada em texto claro.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Security Notice */}
      <div className="rounded-lg border border-warning/30 bg-warning-subtle/20 p-3">
        <p className="text-xs text-warning flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Sua senha NÃO será capturada ou armazenada.
        </p>
      </div>

      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-fg-secondary mb-1.5">
          Email corporativo
        </label>
        <input
          type="email"
          id="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value, error: null }))}
          placeholder={corporateEmailHint ? `nome${corporateEmailHint}` : 'seu.email@empresa.com.br'}
          className="w-full rounded-lg border border-border-default bg-surface-inset px-4 py-2.5 text-fg-primary placeholder:text-fg-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 transition-colors"
          disabled={form.isSubmitting}
          autoComplete="email"
        />
      </div>

      {/* Password Input */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-fg-secondary mb-1.5">
          Senha
        </label>
        <input
          type="password"
          id="password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value, error: null }))}
          placeholder="Sua senha"
          className="w-full rounded-lg border border-border-default bg-surface-inset px-4 py-2.5 text-fg-primary placeholder:text-fg-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 transition-colors"
          disabled={form.isSubmitting}
          autoComplete="current-password"
        />
        <p className="mt-1.5 text-xs text-fg-tertiary">
          Sua senha será transformada em hash SHA-256 antes do envio.
        </p>
      </div>

      {/* Error Message */}
      {form.error && (
        <div className="rounded-lg border border-danger/30 bg-danger-subtle/20 p-3">
          <p className="text-sm text-danger flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {form.error}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={form.isSubmitting}
        className="w-full rounded-lg bg-accent px-4 py-3 font-semibold text-surface-0 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {form.isSubmitting ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processando...
          </>
        ) : (
          'Entrar'
        )}
      </button>

      {/* Security Footer */}
      <p className="text-xs text-fg-tertiary text-center">
        Suas credenciais são processadas com hash SHA-256.
        <br />
        A senha real nunca é transmitida ou armazenada.
      </p>
    </form>
  );
}
