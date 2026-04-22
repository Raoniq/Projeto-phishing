// Landing Builder - Main component
import { useState, useCallback } from 'react';
import type { LandingTemplate, BuilderState, DomainMaskConfig, DeployResult } from './types';
import { TEMPLATES, CATEGORY_LABELS } from './templates';
import LandingPreview from './LandingPreview';
import DomainMaskConfigPanel from './DomainMaskConfigPanel';
import DeployPanel from './DeployPanel';

export default function LandingBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState<LandingTemplate | null>(TEMPLATES[0]);
  const [customizations, setCustomizations] = useState<BuilderState['customizations']>({
    primaryColor: '',
    secondaryColor: '',
    logoUrl: '',
    companyName: '',
    fakeDomain: '',
  });
  const [domainMask, setDomainMask] = useState<DomainMaskConfig>({
    enabled: true,
    displayDomain: '',
    hoverText: 'Este é um ambiente de simulação de phishing',
    useFavicon: true,
    faviconUrl: '',
  });
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);

  const handleTemplateSelect = useCallback((template: LandingTemplate) => {
    setSelectedTemplate(template);
    setCustomizations({
      primaryColor: template.colorScheme.primary,
      secondaryColor: template.colorScheme.secondary,
      logoUrl: '',
      companyName: '',
      fakeDomain: template.branding.fakeDomain,
    });
    setDomainMask(prev => ({
      ...prev,
      displayDomain: template.branding.fakeDomain,
    }));
  }, []);

  const handleDeploy = useCallback(async (): Promise<DeployResult> => {
    if (!selectedTemplate) {
      return { success: false, error: 'Nenhum template selecionado' };
    }

    // Simulate deploy (in production, would call Cloudflare Pages API)
    const deploymentId = `deploy_${Date.now()}`;
    const fakeUrl = `https://${customizations.fakeDomain || selectedTemplate.branding.fakeDomain}`;

    // Simulate async deploy
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result: DeployResult = {
      success: true,
      url: fakeUrl,
      deploymentId,
    };

    setDeployResult(result);
    return result;
  }, [selectedTemplate, customizations]);

  return (
    <div className="min-h-screen bg-noir-950 text-white">
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-amber-500">Landing Page Builder</h1>
          <p className="mt-2 text-noir-400 max-w-sm">
            Crie páginas de phishing simuladas para treinamento de segurança
          </p>
        </div>

        {/* Warning Banner */}
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-amber-500">Aviso de Simulação</h3>
              <p className="mt-1 text-sm text-noir-300">
                Este builder é apenas para <strong>treinamento de segurança</strong>.
                Todas as credenciais são hasheadas localmente e nunca são transmitidas.
                Não utilize domínios de empresas reais.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Template Selection */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-noir-700 bg-noir-900/50 p-4">
              <h2 className="mb-4 text-lg font-semibold">Templates Disponíveis</h2>

              <div className="space-y-3">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-noir-700 bg-noir-800/50 hover:border-noir-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {template.category === 'banco' && '🏦'}
                        {template.category === 'rh' && '👥'}
                        {template.category === 'ti' && '💻'}
                        {template.category === 'gov' && '🏛️'}
                        {template.category === 'ecommerce' && '🛒'}
                      </span>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-noir-400">{CATEGORY_LABELS[template.category]}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Customization Panel */}
            <div className="mt-4 rounded-xl border border-noir-700 bg-noir-900/50 p-4">
              <h3 className="mb-4 text-lg font-semibold">Personalização</h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-noir-400">Cor Primária</label>
                  <input
                    type="color"
                    value={customizations.primaryColor || selectedTemplate?.colorScheme.primary || '#1e40af'}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-noir-600 bg-noir-800"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-noir-400">Cor Secundária</label>
                  <input
                    type="color"
                    value={customizations.secondaryColor || selectedTemplate?.colorScheme.secondary || '#3b82f6'}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-noir-600 bg-noir-800"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-noir-400">Nome da Empresa (Simulada)</label>
                  <input
                    type="text"
                    value={customizations.companyName || selectedTemplate?.branding.companyName || ''}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Nome fictício para a simulação"
                    className="w-full rounded-lg border border-noir-600 bg-noir-800 px-4 py-2 text-white placeholder-noir-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-noir-400">Domínio Simulado</label>
                  <input
                    type="text"
                    value={customizations.fakeDomain || selectedTemplate?.branding.fakeDomain || ''}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, fakeDomain: e.target.value }))}
                    placeholder="dominio-simulado.com"
                    className="w-full rounded-lg border border-noir-600 bg-noir-800 px-4 py-2 text-white placeholder-noir-500"
                  />
                  <p className="mt-1 text-xs text-noir-500">Use um domínio fictício, nunca real</p>
                </div>
              </div>
            </div>

            {/* Domain Mask Config */}
            <DomainMaskConfigPanel
              config={domainMask}
              onChange={setDomainMask}
            />
          </div>

          {/* Right Column - Preview & Deploy */}
          <div className="lg:col-span-2">
            {/* Preview Controls */}
            <div className="mb-4 flex items-center justify-between rounded-xl border border-noir-700 bg-noir-900/50 p-4">
              <div>
                <h3 className="font-semibold">Preview</h3>
                <p className="text-sm text-noir-400">
                  Template: {selectedTemplate?.name || 'Nenhum selecionado'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    previewMode === 'desktop'
                      ? 'bg-amber-500 text-noir-950'
                      : 'bg-noir-700 text-noir-300'
                  }`}
                >
                  Desktop
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    previewMode === 'mobile'
                      ? 'bg-amber-500 text-noir-950'
                      : 'bg-noir-700 text-noir-300'
                  }`}
                >
                  Mobile
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  className="ml-4 rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-noir-950"
                >
                  Abrir Preview
                </button>
              </div>
            </div>

            {/* Live Preview Embed */}
            <div className="rounded-xl border border-noir-700 bg-noir-800 overflow-hidden">
              <div className="border-b border-noir-700 bg-noir-800/80 px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-500"></span>
                    <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                    <span className="h-3 w-3 rounded-full bg-green-500"></span>
                  </div>
                  <div className="ml-4 flex-1 rounded bg-noir-900 px-3 py-1 text-xs text-noir-400">
                    {domainMask.enabled ? domainMask.displayDomain : 'preview.local'}
                  </div>
                </div>
              </div>
              <div
                className={`transition-all ${
                  previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
                }`}
              >
                <LandingPreview
                  template={selectedTemplate}
                  customizations={customizations}
                  domainMask={domainMask}
                />
              </div>
            </div>

            {/* Deploy Panel */}
            <DeployPanel onDeploy={handleDeploy} result={deployResult} />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="h-[90vh] w-[90vw] rounded-2xl border border-noir-600 bg-noir-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-noir-700 p-4">
              <div>
                <h3 className="font-semibold">Preview Completo</h3>
                <p className="text-sm text-noir-400">{selectedTemplate.name}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg bg-noir-700 px-4 py-2 hover:bg-noir-600"
              >
                Fechar
              </button>
            </div>
            <div className="h-[calc(90vh-73px)] overflow-auto p-8">
              <LandingPreview
                template={selectedTemplate}
                customizations={customizations}
                domainMask={domainMask}
                isFullPage
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}