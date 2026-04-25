/* eslint-disable @typescript-eslint/no-explicit-any */
// Landing Builder - Main component with block editor
import { useState, useCallback } from 'react';
import type { LandingTemplate, BuilderState, DomainMaskConfig, DeployResult, Block, BlockType, BrandPreset } from './types';
import { BRAND_PRESETS, generateBlockId, defaultHeaderBlock, defaultParagraphBlock, defaultButtonBlock, defaultInputBlock, defaultImageBlock, defaultDividerBlock, defaultSpacerBlock, defaultHtmlBlock, defaultLoginFormBlock, defaultPasswordFieldBlock, defaultTwoFactorInputBlock, defaultPhoneInputBlock } from './types';
import LandingPreview from './LandingPreview';
import DomainMaskConfigPanel from './DomainMaskConfigPanel';
import DeployPanel from './DeployPanel';
import BlockEditorPanel from './BlockEditorPanel';

interface BlockCategory {
  label: string;
  blocks: { type: BlockType; label: string; icon: string; description: string }[];
}

const BLOCK_CATEGORIES: BlockCategory[] = [
  {
    label: 'Básico',
    blocks: [
      { type: 'header', label: 'Header', icon: 'H', description: 'Título ou cabeçalho' },
      { type: 'paragraph', label: 'Parágrafo', icon: '¶', description: 'Texto descritivo' },
      { type: 'button', label: 'Botão', icon: '▢', description: 'Botão de ação' },
      { type: 'input', label: 'Campo', icon: '[ ]', description: 'Campo de entrada' },
    ],
  },
  {
    label: 'Mídia',
    blocks: [
      { type: 'image', label: 'Imagem', icon: '🖼', description: 'Imagem ou logo' },
      { type: 'divider', label: 'Divisor', icon: '—', description: 'Linha divisória' },
      { type: 'spacer', label: 'Espaçador', icon: '↕', description: 'Espaço vertical' },
    ],
  },
  {
    label: 'Formulários',
    blocks: [
      { type: 'loginForm', label: 'Login Form', icon: '🔐', description: 'Formulário com usuário + senha' },
      { type: 'passwordField', label: 'Senha', icon: '🔒', description: 'Campo de senha isolado' },
      { type: 'twoFactorInput', label: '2FA Input', icon: '6', description: 'Código de 6 dígitos' },
      { type: 'phoneInput', label: 'Telefone', icon: '📱', description: 'Campo com código de país' },
    ],
  },
  {
    label: 'Avançado',
    blocks: [
      { type: 'html', label: 'HTML Block', icon: '< >', description: 'Código HTML personalizado' },
    ],
  },
];

const DEFAULT_CSS_VARIABLES = {
  '--lp-primary-color': '#0078d4',
  '--lp-bg-color': '#ffffff',
  '--lp-text-color': '#323130',
  '--lp-logo-url': '',
  '--lp-border-radius': '8px',
  '--lp-accent-color': '#0078d4',
  '--lp-secondary-color': '#e1dfdd',
};

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

  // Block editor state
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [cssVariables, setCssVariables] = useState(DEFAULT_CSS_VARIABLES);
  const [selectedBrandPreset, setSelectedBrandPreset] = useState<BrandPreset | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(1);
  const [activeTab, setActiveTab] = useState<'blocks' | 'properties' | 'css' | 'presets'>('blocks');

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
    // Reset blocks when changing template
    setBlocks([]);
    setSelectedBlockId(null);
    setCurrentStep(1);
    setTotalSteps(1);
  }, []);

  const addBlock = useCallback((type: BlockType) => {
    const id = generateBlockId();
    let newBlock: Block;

    switch (type) {
      case 'header':
        newBlock = defaultHeaderBlock(id);
        break;
      case 'paragraph':
        newBlock = defaultParagraphBlock(id);
        break;
      case 'button':
        newBlock = defaultButtonBlock(id);
        break;
      case 'input':
        newBlock = defaultInputBlock(id);
        break;
      case 'image':
        newBlock = defaultImageBlock(id);
        break;
      case 'divider':
        newBlock = defaultDividerBlock(id);
        break;
      case 'spacer':
        newBlock = defaultSpacerBlock(id);
        break;
      case 'html':
        newBlock = defaultHtmlBlock(id);
        break;
      case 'loginForm':
        newBlock = defaultLoginFormBlock(id);
        break;
      case 'passwordField':
        newBlock = defaultPasswordFieldBlock(id);
        break;
      case 'twoFactorInput':
        newBlock = defaultTwoFactorInputBlock(id);
        break;
      case 'phoneInput':
        newBlock = defaultPhoneInputBlock(id);
        break;
      default:
        return;
    }

    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(id);
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(block =>
      block.id === id ? { ...block, ...updates } : block
    ));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);

  const duplicateBlock = useCallback((id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    const newId = generateBlockId();
    const newBlock = { ...block, id: newId };
    const index = blocks.findIndex(b => b.id === id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setSelectedBlockId(newId);
  }, [blocks]);

  const applyBrandPreset = useCallback((preset: BrandPreset) => {
    const config = BRAND_PRESETS[preset];
    setSelectedBrandPreset(preset);
    setCssVariables({
      '--lp-primary-color': config.primaryColor,
      '--lp-bg-color': config.backgroundColor,
      '--lp-text-color': config.textColor,
      '--lp-logo-url': config.logoUrl,
      '--lp-border-radius': '8px',
      '--lp-accent-color': config.accentColor,
      '--lp-secondary-color': config.primaryColor + '20',
    });
    setCustomizations(prev => ({
      ...prev,
      primaryColor: config.primaryColor,
      logoUrl: config.logoUrl,
      companyName: config.companyName,
      fakeDomain: config.fakeDomain,
    }));
    setDomainMask(prev => ({
      ...prev,
      displayDomain: config.fakeDomain,
    }));
  }, []);

  const updateCssVariable = useCallback((key: string, value: string) => {
    setCssVariables(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleDeploy = useCallback(async (): Promise<DeployResult> => {
    if (!selectedTemplate) {
      return { success: false, error: 'Nenhum template selecionado' };
    }

    const deploymentId = `deploy_${Date.now()}`;
    const fakeUrl = `https://${customizations.fakeDomain || selectedTemplate.branding.fakeDomain}`;

    await new Promise(resolve => setTimeout(resolve, 1500));

    const result: DeployResult = {
      success: true,
      url: fakeUrl,
      deploymentId,
    };

    setDeployResult(result);
    return result;
  }, [selectedTemplate, customizations]);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

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

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column - Block Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            {/* Block Categories */}
            <div className="rounded-xl border border-noir-700 bg-noir-900/50 p-4">
              <h2 className="mb-4 text-lg font-semibold">Blocos</h2>

              <div className="space-y-4">
                {BLOCK_CATEGORIES.map((category) => (
                  <div key={category.label}>
                    <h3 className="text-xs font-medium text-noir-500 uppercase tracking-wider mb-2">
                      {category.label}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {category.blocks.map((block) => (
                        <button
                          key={block.type}
                          onClick={() => addBlock(block.type)}
                          className="flex flex-col items-center gap-1 p-3 rounded-lg border border-noir-700 bg-noir-800/50 hover:border-amber-500/50 hover:bg-noir-800 transition-all text-center"
                          title={block.description}
                        >
                          <span className="text-lg">{block.icon}</span>
                          <span className="text-xs text-noir-400">{block.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Template Selection */}
            <div className="rounded-xl border border-noir-700 bg-noir-900/50 p-4">
              <h2 className="mb-4 text-lg font-semibold">Templates</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-noir-700 bg-noir-800/50 hover:border-noir-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {template.category === 'banco' && '🏦'}
                        {template.category === 'rh' && '👥'}
                        {template.category === 'ti' && '💻'}
                        {template.category === 'gov' && '🏛️'}
                        {template.category === 'ecommerce' && '🛒'}
                      </span>
                      <span className="text-sm font-medium truncate">{template.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column - Canvas */}
          <div className="lg:col-span-6">
            {/* Canvas Toolbar */}
            <div className="mb-4 flex items-center justify-between rounded-xl border border-noir-700 bg-noir-900/50 p-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-noir-400">
                  {blocks.length} bloco{blocks.length !== 1 ? 's' : ''}
                </span>
                {blocks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                      disabled={currentStep <= 1}
                      className="rounded px-2 py-1 text-sm bg-noir-700 hover:bg-noir-600 disabled:opacity-30"
                    >
                      ← Anterior
                    </button>
                    <span className="text-sm">
                      Passo {currentStep} de {totalSteps}
                    </span>
                    <button
                      onClick={() => setTotalSteps(Math.min(5, totalSteps + 1))}
                      className="rounded px-2 py-1 text-sm bg-noir-700 hover:bg-noir-600"
                    >
                      + Passo
                    </button>
                    <button
                      onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                      disabled={currentStep >= totalSteps}
                      className="rounded px-2 py-1 text-sm bg-noir-700 hover:bg-noir-600 disabled:opacity-30"
                    >
                      Próximo →
                    </button>
                  </div>
                )}
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
              </div>
            </div>

            {/* Canvas Area */}
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

              {/* Block Canvas */}
              <div
                className={`min-h-[500px] p-4 ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}
              >
                {blocks.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-noir-500 py-20">
                    <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-lg font-medium">Arraste blocos para cá</p>
                    <p className="text-sm mt-1">ou clique em um bloco na barra lateral</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blocks.map((block) => (
                      <div
                        key={block.id}
                        onClick={() => setSelectedBlockId(block.id)}
                        className={`relative group cursor-pointer transition-all rounded-lg p-3 ${
                          selectedBlockId === block.id
                            ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-noir-800'
                            : 'hover:bg-noir-700/50'
                        }`}
                      >
                        {selectedBlockId === block.id && (
                          <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateBlock(block.id);
                              }}
                              className="w-6 h-6 rounded bg-noir-600 hover:bg-amber-500 text-noir-300 hover:text-noir-950 flex items-center justify-center text-xs"
                              title="Duplicar"
                            >
                              ⧉
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBlock(block.id);
                              }}
                              className="w-6 h-6 rounded bg-noir-600 hover:bg-red-500 text-noir-300 hover:text-white flex items-center justify-center text-xs"
                              title="Remover"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        <BlockCanvasItem block={block} cssVariables={cssVariables} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Preview Toggle */}
            <button
              onClick={() => setShowPreview(true)}
              className="mt-4 w-full rounded-xl bg-amber-500 py-3 font-semibold text-noir-950 hover:bg-amber-400 transition-colors"
            >
              Abrir Preview Completo
            </button>
          </div>

          {/* Right Column - Properties Panel */}
          <div className="lg:col-span-3 space-y-4">
            {/* Tab Navigation */}
            <div className="rounded-xl border border-noir-700 bg-noir-900/50 p-1">
              <div className="flex">
                {(['blocks', 'properties', 'css', 'presets'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-amber-500 text-noir-950'
                        : 'text-noir-400 hover:text-white hover:bg-noir-800'
                    }`}
                  >
                    {tab === 'blocks' && 'Blocos'}
                    {tab === 'properties' && 'Props'}
                    {tab === 'css' && 'CSS'}
                    {tab === 'presets' && 'Presets'}
                  </button>
                ))}
              </div>
            </div>

            {/* Blocks Tab */}
            {activeTab === 'blocks' && (
              <div className="rounded-xl border border-noir-700 bg-noir-900/50 p-4">
                <h3 className="text-lg font-semibold mb-4">Blocos Adicionados</h3>
                {blocks.length === 0 ? (
                  <p className="text-sm text-noir-500">Nenhum bloco ainda. Clique nos blocos à esquerda para adicionar.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {blocks.map((block, index) => (
                      <button
                        key={block.id}
                        onClick={() => setSelectedBlockId(block.id)}
                        className={`w-full rounded-lg border p-3 text-left transition-all flex items-center gap-3 ${
                          selectedBlockId === block.id
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-noir-700 bg-noir-800/50 hover:border-noir-600'
                        }`}
                      >
                        <span className="text-lg">
                          {block.type === 'header' && 'H'}
                          {block.type === 'paragraph' && '¶'}
                          {block.type === 'button' && '▢'}
                          {block.type === 'input' && '[ ]'}
                          {block.type === 'image' && '🖼'}
                          {block.type === 'divider' && '—'}
                          {block.type === 'spacer' && '↕'}
                          {block.type === 'html' && '< >'}
                          {block.type === 'loginForm' && '🔐'}
                          {block.type === 'passwordField' && '🔒'}
                          {block.type === 'twoFactorInput' && '6'}
                          {block.type === 'phoneInput' && '📱'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{block.type}</p>
                          <p className="text-xs text-noir-500">#{index + 1}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <div className="rounded-xl border border-noir-700 bg-noir-900/50 p-4">
                <h3 className="text-lg font-semibold mb-4">Propriedades</h3>
                {selectedBlock ? (
                  <BlockEditorPanel
                    block={selectedBlock}
                    onChange={(updated) => updateBlock(selectedBlock.id, updated)}
                  />
                ) : (
                  <p className="text-sm text-noir-500">Selecione um bloco para editar suas propriedades.</p>
                )}
              </div>
            )}

            {/* CSS Variables Tab */}
            {activeTab === 'css' && (
              <div className="rounded-xl border border-noir-700 bg-noir-900/50 p-4">
                <h3 className="text-lg font-semibold mb-4">CSS Variables</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm text-noir-400">--lp-primary-color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={cssVariables['--lp-primary-color']}
                        onChange={(e) => updateCssVariable('--lp-primary-color', e.target.value)}
                        className="w-10 h-10 rounded border border-noir-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cssVariables['--lp-primary-color']}
                        onChange={(e) => updateCssVariable('--lp-primary-color', e.target.value)}
                        className="flex-1 rounded-lg border border-noir-600 bg-noir-800 px-3 py-2 text-sm text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-noir-400">--lp-bg-color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={cssVariables['--lp-bg-color']}
                        onChange={(e) => updateCssVariable('--lp-bg-color', e.target.value)}
                        className="w-10 h-10 rounded border border-noir-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cssVariables['--lp-bg-color']}
                        onChange={(e) => updateCssVariable('--lp-bg-color', e.target.value)}
                        className="flex-1 rounded-lg border border-noir-600 bg-noir-800 px-3 py-2 text-sm text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-noir-400">--lp-text-color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={cssVariables['--lp-text-color']}
                        onChange={(e) => updateCssVariable('--lp-text-color', e.target.value)}
                        className="w-10 h-10 rounded border border-noir-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cssVariables['--lp-text-color']}
                        onChange={(e) => updateCssVariable('--lp-text-color', e.target.value)}
                        className="flex-1 rounded-lg border border-noir-600 bg-noir-800 px-3 py-2 text-sm text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-noir-400">--lp-logo-url</label>
                    <input
                      type="url"
                      value={cssVariables['--lp-logo-url']}
                      onChange={(e) => updateCssVariable('--lp-logo-url', e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-noir-600 bg-noir-800 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-noir-400">--lp-border-radius</label>
                    <input
                      type="text"
                      value={cssVariables['--lp-border-radius']}
                      onChange={(e) => updateCssVariable('--lp-border-radius', e.target.value)}
                      className="w-full rounded-lg border border-noir-600 bg-noir-800 px-3 py-2 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-noir-400">--lp-accent-color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={cssVariables['--lp-accent-color']}
                        onChange={(e) => updateCssVariable('--lp-accent-color', e.target.value)}
                        className="w-10 h-10 rounded border border-noir-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cssVariables['--lp-accent-color']}
                        onChange={(e) => updateCssVariable('--lp-accent-color', e.target.value)}
                        className="flex-1 rounded-lg border border-noir-600 bg-noir-800 px-3 py-2 text-sm text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Brand Presets Tab */}
            {activeTab === 'presets' && (
              <div className="rounded-xl border border-noir-700 bg-noir-900/50 p-4">
                <h3 className="text-lg font-semibold mb-4">Brand Presets</h3>
                <p className="text-xs text-noir-500 mb-4">
                  Selecione um preset para auto-preencher as CSS variables e configurações de marca.
                </p>
                <div className="space-y-2">
                  {(Object.keys(BRAND_PRESETS) as BrandPreset[]).map((presetKey) => {
                    const preset = BRAND_PRESETS[presetKey];
                    return (
                      <button
                        key={presetKey}
                        onClick={() => applyBrandPreset(presetKey)}
                        className={`w-full rounded-lg border p-4 text-left transition-all ${
                          selectedBrandPreset === presetKey
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-noir-700 bg-noir-800/50 hover:border-noir-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                            style={{ backgroundColor: preset.primaryColor, color: '#fff' }}
                          >
                            {presetKey === 'microsoft' && 'M'}
                            {presetKey === 'google' && 'G'}
                            {presetKey === 'banco' && 'B'}
                            {presetKey === 'itHelpDesk' && 'IT'}
                            {presetKey === 'linkedin' && 'in'}
                          </div>
                          <div>
                            <p className="font-medium">{preset.name}</p>
                            <p className="text-xs text-noir-500">{preset.fakeDomain}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Customization Panel */}
            <div className="rounded-xl border border-noir-700 bg-noir-900/50 p-4">
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
        </div>

        {/* Deploy Panel */}
        <div className="mt-6">
          <DeployPanel
            onDeploy={handleDeploy}
            result={deployResult}
            template={selectedTemplate}
            customizations={customizations}
          />
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
                blocks={blocks}
                cssVariables={cssVariables}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Block Canvas Item - renders block in the canvas
function BlockCanvasItem({ block, cssVariables }: { block: Block; cssVariables: Record<string, string> }) {
  const style = {
    '--lp-primary-color': cssVariables['--lp-primary-color'],
    '--lp-bg-color': cssVariables['--lp-bg-color'],
    '--lp-text-color': cssVariables['--lp-text-color'],
    '--lp-border-radius': cssVariables['--lp-border-radius'],
    '--lp-accent-color': cssVariables['--lp-accent-color'],
  } as React.CSSProperties;

  switch (block.type) {
    case 'header':
      return (
        <div style={style} className="font-bold" data-block-type="header">
          {(block.props as any).content}
        </div>
      );
    case 'paragraph':
      return (
        <div style={style} className="text-noir-400" data-block-type="paragraph">
          {(block.props as any).content}
        </div>
      );
    case 'button':
      return (
        <div className="text-center" data-block-type="button">
          <span
            className="inline-block px-6 py-3 rounded-lg font-semibold text-black"
            style={{ backgroundColor: (block.props as any).backgroundColor || cssVariables['--lp-primary-color'] }}
          >
            {(block.props as any).text}
          </span>
        </div>
      );
    case 'input':
      return (
        <div data-block-type="input">
          <label className="mb-1 block text-sm text-noir-400">{(block.props as any).label}</label>
          <input
            type={(block.props as any).type || 'text'}
            placeholder={(block.props as any).placeholder}
            className="w-full rounded-lg border border-noir-600 bg-noir-800 px-4 py-2 text-white"
          />
        </div>
      );
    case 'loginForm':
      return (
        <div className="rounded-xl border border-noir-700 bg-noir-800/50 p-4" data-block-type="loginForm">
          <div className="text-center mb-4 text-amber-500 font-semibold">🔐 Login Form</div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-noir-400">{(block.props as any).usernameLabel}</label>
              <input
                type="text"
                placeholder={(block.props as any).usernamePlaceholder}
                className="w-full rounded-lg border border-noir-600 bg-noir-800 px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-noir-400">{(block.props as any).passwordLabel}</label>
              <input
                type="password"
                placeholder={(block.props as any).passwordPlaceholder}
                className="w-full rounded-lg border border-noir-600 bg-noir-800 px-4 py-2 text-white"
              />
            </div>
            <button
              className="w-full rounded-lg py-2 font-semibold text-black"
              style={{ backgroundColor: cssVariables['--lp-primary-color'] }}
            >
              {(block.props as any).submitText}
            </button>
          </div>
        </div>
      );
    case 'passwordField':
      return (
        <div data-block-type="passwordField">
          <label className="mb-1 block text-sm text-noir-400">{(block.props as any).label}</label>
          <input
            type="password"
            placeholder={(block.props as any).placeholder}
            className="w-full rounded-lg border border-noir-600 bg-noir-800 px-4 py-2 text-white"
          />
        </div>
      );
    case 'twoFactorInput':
      return (
        <div data-block-type="twoFactorInput">
          <label className="mb-1 block text-sm text-noir-400">{(block.props as any).label}</label>
          <input
            type="text"
            placeholder={(block.props as any).placeholder}
            maxLength={(block.props as any).codeLength || 6}
            className="rounded-lg border border-noir-600 bg-noir-800 px-4 py-2 text-white text-center tracking-widest font-mono"
            style={{ width: cssVariables['--lp-border-radius'] === '8px' ? '150px' : '200px' }}
          />
        </div>
      );
    case 'phoneInput':
      return (
        <div data-block-type="phoneInput">
          <label className="mb-1 block text-sm text-noir-400">{(block.props as any).label}</label>
          <div className="flex gap-2">
            {(block.props as any).showCountrySelect && (
              <select
                className="rounded-lg border border-noir-600 bg-noir-800 px-2 py-2 text-white"
                defaultValue={(block.props as any).defaultCountryCode || '+1'}
              >
                <option value="+1">+1 US</option>
                <option value="+55">+55 BR</option>
                <option value="+44">+44 UK</option>
              </select>
            )}
            <input
              type="tel"
              placeholder={(block.props as any).placeholder}
              className="flex-1 rounded-lg border border-noir-600 bg-noir-800 px-4 py-2 text-white"
            />
          </div>
        </div>
      );
    case 'image':
      return (
        <div className="text-center" data-block-type="image">
          {(block.props as any).src ? (
            <img
              src={(block.props as any).src}
              alt={(block.props as any).alt || 'Image'}
              className="max-w-full rounded"
              style={{ maxHeight: '150px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-32 bg-noir-800 rounded border border-dashed border-noir-600">
              <span className="text-noir-500">🖼 Imagem</span>
            </div>
          )}
        </div>
      );
    case 'divider':
      return (
        <hr
          className="border-noir-600"
          style={{
            borderWidth: (block.props as any).thickness || 1,
            width: (block.props as any).width || '100%',
          }}
        />
      );
    case 'spacer':
      return (
        <div
          className="bg-noir-800/30 border border-dashed border-noir-700 rounded flex items-center justify-center text-noir-600 text-xs"
          style={{ height: (block.props as any).height || 40 }}
        >
          ↕ {(block.props as any).height || 40}px
        </div>
      );
    case 'html':
      return (
        <div className="rounded bg-noir-800 p-2 font-mono text-xs text-noir-400 overflow-hidden" data-block-type="html">
          <code>{(block.props as any).content}</code>
        </div>
      );
    default:
      return <div className="text-noir-500">Bloco desconhecido: {block.type}</div>;
  }
}