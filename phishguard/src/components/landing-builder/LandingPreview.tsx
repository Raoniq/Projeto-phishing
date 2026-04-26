// Landing Page Preview Component
import { useState, useCallback, useEffect } from 'react';
import type { LandingTemplate, BuilderState, DomainMaskConfig } from './types';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';

interface Props {
  template: LandingTemplate | null;
  customizations: BuilderState['customizations'];
  domainMask: DomainMaskConfig;
  isFullPage?: boolean;
}

// Variable patterns to interpolate
const VARIABLE_PATTERN = /\{\{(\.[a-zA-Z0-9]+)\}\}/g;

function interpolateVariables(text: string, data: Record<string, string>): string {
  return text.replace(VARIABLE_PATTERN, (_, varPath) => {
    const key = varPath.replace('.', '');
    return data[key] || varPath;
  });
}

export default function LandingPreview({ template, customizations, domainMask, isFullPage }: Props) {
  const { company } = useAuth();
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showTestResult, setShowTestResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [landingPagesData, setLandingPagesData] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchRealData() {
      if (!company?.id) return;

      // Fetch real landing pages for the company
      const { data: pages } = await supabase
        .from('landing_pages')
        .select('name, slug, headline, body_text')
        .eq('company_id', company.id)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (pages) {
        // Extract name from "name" field or generate from slug
        const nameParts = pages.name?.split(' ') || pages.slug?.split('-') || [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Use company domain to generate email
        const emailPrefix = pages.slug?.replace(/-/g, '.') || 'user';
        const companyDomain = company.domain || 'company.com';

        setLandingPagesData({
          FirstName: firstName,
          LastName: lastName,
          Email: `${emailPrefix}@${companyDomain}`,
          CompanyName: company.name,
        });
      }
    }

    fetchRealData();
  }, [company]);

  const handleTestSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission delay
    await new Promise(resolve => setTimeout(resolve, 800));

    setIsSubmitting(false);
    setShowTestResult(true);
  }, []);

  if (!template) {
    return (
      <div className="flex h-96 items-center justify-center bg-noir-800">
        <p className="text-noir-400 max-w-xs">Selecione um template para visualizar</p>
      </div>
    );
  }

  const colors = {
    primary: customizations.primaryColor || template.colorScheme.primary,
    secondary: customizations.secondaryColor || template.colorScheme.secondary,
    background: template.colorScheme.background,
    text: template.colorScheme.text,
  };

  const companyName = customizations.companyName || template.branding.companyName;
  const logoEmoji = template.category === 'banco' ? '🏦' :
                    template.category === 'rh' ? '👥' :
                    template.category === 'ti' ? '💻' :
                    template.category === 'gov' ? '🏛️' : '🛒';

  // Interpolate content with real data
  const headline = interpolateVariables(template.content.headline, landingPagesData);
  const subheadline = interpolateVariables(template.content.subheadline, landingPagesData);
  const body = interpolateVariables(template.content.body, landingPagesData);
  const ctaText = interpolateVariables(template.content.ctaText, landingPagesData);
  const footerText = interpolateVariables(template.content.footerText, landingPagesData);

  return (
    <div
      className={`bg-white font-sans ${isFullPage ? 'min-h-full' : 'min-h-96'}`}
      style={{ backgroundColor: colors.background }}
    >
      {/* Domain Mask Bar */}
      {domainMask.enabled && (
        <div
          className="px-4 py-2 text-center text-xs"
          style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
        >
          <span title={domainMask.hoverText}>
            🔒 {domainMask.displayDomain || template.branding.fakeDomain}
          </span>
          <span className="mx-2">|</span>
          <span>Simulação de Phishing</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header Card */}
          <div
            className="rounded-2xl p-8 text-center shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            }}
          >
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              {logoEmoji}
            </div>
            <p className="text-lg font-semibold text-white">{companyName}</p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl bg-white p-8 shadow-lg" style={{ color: colors.text }}>
            <h1 className="mb-2 text-center text-xl font-bold">{headline}</h1>
            <p className="mb-6 text-center text-sm" style={{ color: '#666' }}>
              {subheadline}
            </p>

            {/* Alert Box */}
            <div
              className="mb-6 flex items-center gap-2 rounded-lg p-3 text-sm"
              style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e' }}
            >
              <span>⚠️</span>
              <span>{body}</span>
            </div>

            {/* Form Fields - Pre-filled with real data */}
            <form className="space-y-4" onSubmit={handleTestSubmit}>
              {template.fields.map((field) => (
                <div key={field.id}>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: '#374151' }}
                  >
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      style={{ backgroundColor: '#fff' }}
                    >
                      <option value="">Selecione...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={interpolateVariables(field.placeholder, landingPagesData)}
                      defaultValue={
                        field.name === 'firstName' || field.name === 'first_name' ? landingPagesData.FirstName :
                        field.name === 'lastName' || field.name === 'last_name' ? landingPagesData.LastName :
                        field.name === 'email' ? landingPagesData.Email :
                        field.name === 'company' || field.name === 'companyName' ? landingPagesData.CompanyName :
                        ''
                      }
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      style={{ backgroundColor: '#fff' }}
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                }}
              >
                {isSubmitting ? 'Enviando...' : ctaText}
              </button>
            </form>

            {/* Test Submit Educational Result */}
            {showTestResult && (
              <div className="mt-6 rounded-lg border-2 border-amber-500 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎓</span>
                  <div>
                    <h4 className="font-semibold text-amber-800">Simulação de Phishing</h4>
                    <p className="mt-2 text-sm text-amber-700">
                      Este foi um <strong>teste de phishing simulado</strong>. Em um ataque real,
                      suas credenciais seriam harvestadas.
                    </p>
                    <p className="mt-2 text-xs text-amber-600">
                      💡 Dica: Sempre verifique a URL na barra de endereços antes de inserir credenciais.
                      Desconfie de domínios incomuns ou大众 mal escritos.
                    </p>
                    <button
                      onClick={() => setShowTestResult(false)}
                      className="mt-3 text-xs text-amber-600 hover:text-amber-800 underline"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs" style={{ color: '#9ca3af' }}>
            {footerText}
          </p>
        </div>
      </div>

      {/* Preview Mode Toggle (for embedded preview only) */}
      {!isFullPage && (
        <div className="border-t border-noir-700 bg-noir-800/50 px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-noir-400">Preview Mode:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`rounded px-2 py-1 text-xs ${
                  previewMode === 'desktop'
                    ? 'bg-amber-500 text-noir-950'
                    : 'bg-noir-700 text-noir-300'
                }`}
              >
                Desktop
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`rounded px-2 py-1 text-xs ${
                  previewMode === 'mobile'
                    ? 'bg-amber-500 text-noir-950'
                    : 'bg-noir-700 text-noir-300'
                }`}
              >
                Mobile
              </button>
            </div>
          </div>
          {previewMode === 'mobile' && (
            <p className="mt-1 text-center text-xs text-noir-500">
              Mobile: 375px width
            </p>
          )}
        </div>
      )}
    </div>
  );
}