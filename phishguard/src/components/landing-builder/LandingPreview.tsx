// Landing Page Preview Component
import type { LandingTemplate, BuilderState, DomainMaskConfig } from './types';

interface Props {
  template: LandingTemplate | null;
  customizations: BuilderState['customizations'];
  domainMask: DomainMaskConfig;
  isFullPage?: boolean;
}

export default function LandingPreview({ template, customizations, domainMask, isFullPage }: Props) {
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
            <h1 className="mb-2 text-center text-xl font-bold">{template.content.headline}</h1>
            <p className="mb-6 text-center text-sm" style={{ color: '#666' }}>
              {template.content.subheadline}
            </p>

            {/* Alert Box */}
            <div
              className="mb-6 flex items-center gap-2 rounded-lg p-3 text-sm"
              style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e' }}
            >
              <span>⚠️</span>
              <span>{template.content.body}</span>
            </div>

            {/* Form Fields */}
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
                      placeholder={field.placeholder}
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      style={{ backgroundColor: '#fff' }}
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                }}
              >
                {template.content.ctaText}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs" style={{ color: '#9ca3af' }}>
            {template.content.footerText}
          </p>
        </div>
      </div>
    </div>
  );
}