/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Globe,
  QrCode,
  Eye,
  Printer,
  Search,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { QRCodeGenerator } from '@/components/quishing/QRCodeGenerator';
import type { QRCodeSettings } from '@/components/quishing/QRCodeGenerator';

// Step configuration
const STEPS = [
  { id: 1, title: 'Informações', subtitle: 'Nome e descrição', icon: Info },
  { id: 2, title: 'Landing Page', subtitle: 'Página destino', icon: Globe },
  { id: 3, title: 'QR Code', subtitle: 'Personalize o QR', icon: QrCode },
  { id: 4, title: 'Preview', subtitle: 'Confirme e baixe', icon: Printer },
];

interface QuishingFormData {
  name: string;
  description: string;
  landingPageId: string | null;
  scheduleType: 'now' | 'schedule';
  scheduledDate: string;
  scheduledTime: string;
  qrSettings: QRCodeSettings;
}

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  category: string;
  html_content: string;
}

const initialFormData: QuishingFormData = {
  name: '',
  description: '',
  landingPageId: null,
  scheduleType: 'now',
  scheduledDate: '',
  scheduledTime: '',
  qrSettings: {
    foregroundColor: '#1a1a2e',
    backgroundColor: '#ffffff',
    size: 300,
    logoUrl: null,
    margin: 2,
  },
};

export default function NovaCampanhaQRPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<QuishingFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<string, string>>({});
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [landingSearch, setLandingSearch] = useState('');
  const [, setShowLandingPreview] = useState(false);

  // Tracking ID for this campaign
  const [trackingId] = useState(() => crypto.randomUUID());

  // Load landing pages
  useEffect(() => {
    async function loadData() {
      try {
        const { data: landingData } = await supabase
          .from('landing_pages')
          .select('id, name, slug, category, html_content')
          .eq('is_active', true)
          .order('name');

        if (landingData) {
          setLandingPages(landingData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Mock data if no landing pages from DB
  useEffect(() => {
    if (landingPages.length === 0 && !loading) {
      setLandingPages([
        { id: 'lp-1', name: 'Login Corporativo', slug: 'login-corporativo', category: 'it', html_content: '<html><body><form><input placeholder="Email"/><input type="password" placeholder="Senha"/></form></body></html>' },
        { id: 'lp-2', name: 'Atualização de Dados', slug: 'update-data', category: 'rh', html_content: '<html><body><form><input placeholder="Nome"/><input placeholder="CPF"/></form></body></html>' },
        { id: 'lp-3', name: 'Confirmação de Pagamento', slug: 'payment-confirm', category: 'finance', html_content: '<html><body><form><input placeholder="Cartão"/><input placeholder="CVV"/></form></body></html>' },
      ]);
    }
  }, [loading, landingPages.length]);

  const updateField = useCallback(<K extends keyof QuishingFormData>(key: K, value: QuishingFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        else if (formData.name.length < 3) newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
        break;
      case 2:
        if (!formData.landingPageId) newErrors.landingPageId = 'Selecione uma landing page';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const { data: userData, error: companyError } = await supabase.rpc('get_user_company_id');
      if (companyError || !userData) {
        throw new Error(companyError?.message || 'Falha ao obter ID da empresa');
      }
      const companyId = userData;

      // Create quishing campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('quishing_campaigns')
        .insert({
          company_id: companyId,
          name: formData.name,
          description: formData.description,
          landing_page_id: formData.landingPageId,
          status: formData.scheduleType === 'now' ? 'active' : 'scheduled',
          scheduled_at: formData.scheduleType !== 'now'
            ? new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString()
            : null,
          started_at: formData.scheduleType === 'now' ? new Date().toISOString() : null,
          settings: {
            qr_settings: formData.qrSettings,
          },
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create QR code entry
      await supabase
        .from('quishing_qrcodes')
        .insert({
          campaign_id: campaign.id,
          tracking_id: trackingId,
          url_shortcode: trackingId,
          foreground_color: formData.qrSettings.foregroundColor,
          background_color: formData.qrSettings.backgroundColor,
          logo_url: formData.qrSettings.logoUrl,
        });

      navigate('/app/campanhas/quishing');
    } catch (err) {
      console.error('Error creating campaign:', err);
      // For demo, navigate anyway
      navigate('/app/campanhas/quishing');
    }
  }, [formData, trackingId, navigate]);

  const filteredLandingPages = landingPages.filter(lp =>
    lp.name.toLowerCase().includes(landingSearch.toLowerCase()) ||
    lp.category.toLowerCase().includes(landingSearch.toLowerCase())
  );

  const selectedLandingPage = landingPages.find(lp => lp.id === formData.landingPageId);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-0)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <div className="sticky top-0 p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--color-fg-primary)] mb-6">
            Nova Campanha QR
          </h2>

          <nav className="space-y-2">
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id}>
                  <button
                    onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                    disabled={!isCompleted && !isActive}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-300',
                      isActive && 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30',
                      isCompleted && 'cursor-pointer hover:bg-[var(--color-surface-2)]',
                      !isActive && !isCompleted && 'cursor-default'
                    )}
                  >
                    <div className={cn(
                      'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all',
                      isCompleted
                        ? 'bg-[var(--color-accent)] text-[var(--color-surface-0)]'
                        : isActive
                        ? 'bg-[var(--color-accent)] text-[var(--color-surface-0)] shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                        : 'border-2 border-[var(--color-noir-600)] bg-[var(--color-surface-2)] text-[var(--color-fg-tertiary)]'
                    )}>
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                      {isActive && (
                        <div className="absolute inset-0 rounded-full bg-[var(--color-accent)] blur-md opacity-50 -z-10" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium truncate',
                        isActive || isCompleted ? 'text-[var(--color-fg-primary)]' : 'text-[var(--color-fg-tertiary)]'
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-[var(--color-fg-tertiary)] truncate">
                        {step.subtitle}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-8 py-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: Informações */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                    Informações da Campanha QR
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Defina o nome e descrição da campanha de quishing
                  </p>
                </div>

                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="space-y-6 p-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da campanha *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Ex: Black Friday 2026 - QR Phishing"
                        className={cn(errors.name && 'border-red-500')}
                      />
                      {errors.name && (
                        <p className="flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição (opcional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Descreva o objetivo desta campanha de quishing..."
                        rows={3}
                      />
                    </div>

                    <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]/10">
                          <QrCode className="h-5 w-5 text-[var(--color-accent)]" />
                        </div>
                        <div>
                          <p className="text-sm text-[var(--color-fg-tertiary)]">ID de rastreamento</p>
                          <p className="font-mono text-sm text-[var(--color-fg-primary)]">
                            {trackingId.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 2: Landing Page */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                    Selecione a Landing Page
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Escolha a página para onde os alvos serão direcionados ao escanear o QR code
                  </p>
                </div>

                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="space-y-4 p-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-tertiary)]" />
                      <Input
                        value={landingSearch}
                        onChange={(e) => setLandingSearch(e.target.value)}
                        placeholder="Buscar landing pages..."
                        className="pl-10"
                      />
                    </div>

                    {errors.landingPageId && (
                      <p className="flex items-center gap-1 text-xs text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        {errors.landingPageId}
                      </p>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredLandingPages.map(lp => (
                        <div
                          key={lp.id}
                          className={cn(
                            'group relative rounded-[var(--radius-lg)] border-2 p-4 transition-all cursor-pointer',
                            formData.landingPageId === lp.id
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                              : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                          )}
                          onClick={() => updateField('landingPageId', lp.id)}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateField('landingPageId', lp.id);
                              setShowLandingPreview(true);
                            }}
                            className="absolute right-2 top-2 rounded-full bg-[var(--color-surface-3)] p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--color-accent)] hover:text-[var(--color-surface-0)]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--color-surface-3)]">
                              <Globe className="h-5 w-5 text-[var(--color-fg-tertiary)]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-[var(--color-fg-primary)] truncate">
                                  {lp.name}
                                </p>
                                {formData.landingPageId === lp.id && (
                                  <Check className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                                )}
                              </div>
                              <p className="text-xs text-[var(--color-fg-tertiary)]">/{lp.slug}</p>
                              <Badge variant="secondary" className="mt-2 text-[10px]">
                                {lp.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredLandingPages.length === 0 && (
                      <div className="py-8 text-center text-[var(--color-fg-tertiary)]">
                        Nenhuma landing page encontrada
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedLandingPage && (
                  <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Landing page selecionada</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setShowLandingPreview(true)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver preview
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--color-accent)]/10">
                          <Globe className="h-5 w-5 text-[var(--color-accent)]" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--color-fg-primary)]">{selectedLandingPage.name}</p>
                          <p className="text-xs text-[var(--color-fg-tertiary)]">/{selectedLandingPage.slug}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* STEP 3: QR Code Customization */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                    Personalize o QR Code
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Escolha as cores e adicione um logo ao seu QR code
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">QR Code</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <QRCodeGenerator
                        url={baseUrl}
                        trackingId={trackingId}
                        settings={formData.qrSettings}
                        onSettingsChange={(settings) => updateField('qrSettings', settings)}
                        showControls={true}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Resumo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs text-[var(--color-fg-tertiary)]">Nome da campanha</p>
                        <p className="font-medium text-[var(--color-fg-primary)]">{formData.name || '-'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-[var(--color-fg-tertiary)]">Landing page</p>
                        <p className="font-medium text-[var(--color-fg-primary)]">
                          {selectedLandingPage?.name || '-'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-[var(--color-fg-tertiary)]">URL de destino</p>
                        <code className="block rounded bg-[var(--color-surface-2)] p-2 text-xs">
                          {baseUrl}/qr/{trackingId}
                        </code>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Preview */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                    Preview e Download
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Confirme os detalhes e baixe seus materiais
                  </p>
                </div>

                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="space-y-6 p-6">
                    <div className="flex flex-col items-center gap-6">
                      <QRCodeGenerator
                        url={baseUrl}
                        trackingId={trackingId}
                        settings={formData.qrSettings}
                        showControls={false}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="space-y-4 p-6">
                    <h3 className="font-display font-semibold text-[var(--color-fg-primary)]">
                      Detalhes da campanha
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs text-[var(--color-fg-tertiary)]">Nome</p>
                        <p className="font-medium text-[var(--color-fg-primary)]">{formData.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-[var(--color-fg-tertiary)]">Landing page</p>
                        <p className="font-medium text-[var(--color-fg-primary)]">
                          {selectedLandingPage?.name || '-'}
                        </p>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-xs text-[var(--color-fg-tertiary)]">URL de rastreamento</p>
                        <code className="block rounded bg-[var(--color-surface-2)] p-2 text-sm text-[var(--color-accent)]">
                          {baseUrl}/qr/{trackingId}
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Modelos para impressão</CardTitle>
                    <CardDescription>
                      Baixe modelos prontos para impressão em diferentes formatos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Button variant="secondary" size="sm">
                        <Printer className="h-4 w-4 mr-2" />
                        Flyer A4
                      </Button>
                      <Button variant="secondary" size="sm">
                        <Printer className="h-4 w-4 mr-2" />
                        Poster A3
                      </Button>
                      <Button variant="secondary" size="sm">
                        <Printer className="h-4 w-4 mr-2" />
                        Cartão Visita
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                    <div>
                      <p className="font-medium text-amber-400">Dica: Scan para testar</p>
                      <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                        Escaneie o QR code com seu celular para verificar se redireciona corretamente.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer actions */}
          <div className="mt-8 flex items-center justify-between border-t border-[var(--color-noir-700)] pt-6">
            <Button
              variant="secondary"
              onClick={currentStep === 1 ? () => navigate('/app/campanhas') : handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 1 ? 'Cancelar' : 'Voltar'}
            </Button>

            {currentStep < 4 ? (
              <Button variant="primary" onClick={handleNext}>
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSubmit}>
                <Check className="h-4 w-4" />
                Criar campanha
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}