/* eslint-disable react-hooks/immutability, react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Target,
  Mail,
  Users,
  Calendar,
  FileCheck,
  Lightbulb,
  Clock,
  AlertCircle,
  X,
  Search,
  Info,
  Globe,
  Upload,
  FileSpreadsheet,
  Zap,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal';
import LandingPreview from '@/components/landing-builder/LandingPreview';

// Step configuration with icons
const STEPS = [
  { id: 1, title: 'Informações', subtitle: 'Nome e descrição', icon: Info },
  { id: 2, title: 'Template', subtitle: 'E-mail modelo', icon: Mail },
  { id: 3, title: 'Landing Page', subtitle: 'Página destino', icon: Globe },
  { id: 4, title: 'Público-alvo', subtitle: 'Alvos da campanha', icon: Users },
  { id: 5, title: 'Agendamento', subtitle: 'Quando enviar', icon: Calendar },
  { id: 6, title: 'Revisar', subtitle: 'Confirme e lance', icon: FileCheck },
];

// Difficulty tiers
const TIER_INFO = {
  beginner: {
    title: 'Iniciante',
    description: 'E-mail básico com landing educativa simples. Ideal para medição inicial.',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  intermediate: {
    title: 'Intermediário',
    description: 'E-mail mais verossímil com módulo de 5-8 minutos com conteúdo educativo.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  advanced: {
    title: 'Avançado',
    description: 'Simula roubo de credenciais com avaliação rigorosa. Para setores regulados.',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
};

// Timezone options (focus on Brazil)
const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (Brasília) - UTC-3' },
  { value: 'America/Manaus', label: 'Manaus - UTC-4' },
  { value: 'America/Recife', label: 'Recife - UTC-3' },
  { value: 'America/Rio_Branco', label: 'Rio Branco - UTC-5' },
  { value: 'UTC', label: 'UTC' },
];

interface CampaignFormData {
  // Step 1: Info
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  // Step 2: Template
  templateId: string | null;
  // Step 3: Landing Page
  landingPageId: string | null;
  // Step 4: Targets
  targetType: 'groups' | 'csv' | 'segmentation';
  targetGroupIds: string[];
  csvFile: File | null;
  csvData: Array<{ email: string; name?: string; department?: string }>;
  departmentFilter: string[];
  roleFilter: string[];
  // Step 5: Scheduling
  scheduleType: 'now' | 'schedule' | 'staggered';
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  staggerHours: number;
  businessHoursOnly: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
}

interface TargetGroup {
  id: string;
  name: string;
  count: number;
  type: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  subject: string;
  body_html: string;
  preview_text: string;
}

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  category: string;
  html_content: string;
  css_variables?: string;
}

const initialFormData: CampaignFormData = {
  name: '',
  description: '',
  difficulty: 'beginner',
  templateId: null,
  landingPageId: null,
  targetType: 'groups',
  targetGroupIds: [],
  csvFile: null,
  csvData: [],
  departmentFilter: [],
  roleFilter: [],
  scheduleType: 'now',
  scheduledDate: '',
  scheduledTime: '',
  timezone: 'America/Sao_Paulo',
  staggerHours: 2,
  businessHoursOnly: false,
  businessHoursStart: '09:00',
  businessHoursEnd: '18:00',
};

export default function NovaCampanhaPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // Data from Supabase
  const [templates, setTemplates] = useState<Template[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [targetGroups, setTargetGroups] = useState<TargetGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // UI State
  const [templateSearch, setTemplateSearch] = useState('');
  const [landingSearch, setLandingSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [showLandingPreview, setShowLandingPreview] = useState(false);

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        // Load templates
        const { data: templatesData } = await supabase
          .from('campaign_templates')
          .select('id, name, category, subject, body_html, body_text')
          .eq('is_active', true)
          .order('name');

        if (templatesData) {
          // Map body_text to preview_text for template preview modal
          setTemplates(templatesData.map(t => ({
            ...t,
            preview_text: t.body_text || t.subject,
          })));
        }

        // Load landing pages
        const { data: landingData } = await supabase
          .from('landing_pages')
          .select('id, name, slug, category, body_html')
          .eq('is_active', true)
          .order('name');

        if (landingData) {
          setLandingPages(landingData.map(lp => ({
            ...lp,
            html_content: lp.body_html,
          })));
        }

        // Load target groups from view
        const { data: groupsData } = await supabase
          .from('target_groups')
          .select('*')
          .order('name');

        if (groupsData) {
          setTargetGroups(groupsData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // If no landing pages from DB, use mock data
  useEffect(() => {
    if (landingPages.length === 0 && !loading) {
      setLandingPages([
        { id: 'lp-1', name: 'Login Corporativo', slug: 'login-corporativo', category: 'it', html_content: '<html><body><form><input placeholder="Email"/><input type="password" placeholder="Senha"/></form></body></html>' },
        { id: 'lp-2', name: 'Atualização de Dados', slug: 'update-data', category: 'rh', html_content: '<html><body><form><input placeholder="Nome"/><input placeholder="CPF"/></form></body></html>' },
        { id: 'lp-3', name: 'Confirmação de Pagamento', slug: 'payment-confirm', category: 'finance', html_content: '<html><body><form><input placeholder="Cartão"/><input placeholder="CVV"/></form></body></html>' },
      ]);
    }
  }, [loading, landingPages.length]);

  // Update form field
  const updateField = useCallback(<K extends keyof CampaignFormData>(key: K, value: CampaignFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }, []);

  // Toggle target group
  const toggleTargetGroup = useCallback((groupId: string) => {
    setFormData(prev => ({
      ...prev,
      targetGroupIds: prev.targetGroupIds.includes(groupId)
        ? prev.targetGroupIds.filter(id => id !== groupId)
        : [...prev.targetGroupIds, groupId],
    }));
  }, []);

  // Handle CSV upload
  const handleCSVUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].toLowerCase().split(',');

      const emailIdx = headers.findIndex(h => h.includes('email'));
      const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('nome'));
      const deptIdx = headers.findIndex(h => h.includes('dept') || h.includes('departamento'));

      const data = lines.slice(1).map(line => {
        const cols = line.split(',');
        return {
          email: cols[emailIdx]?.trim() || '',
          name: nameIdx >= 0 ? cols[nameIdx]?.trim() : undefined,
          department: deptIdx >= 0 ? cols[deptIdx]?.trim() : undefined,
        };
      }).filter(row => row.email);

      updateField('csvFile', file);
      updateField('csvData', data);
    };
    reader.readAsText(file);
  }, [updateField]);

  // Validate current step
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        else if (formData.name.length < 3) newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
        break;
      case 2:
        if (!formData.templateId) newErrors.templateId = 'Selecione um template';
        break;
      case 3:
        if (!formData.landingPageId) newErrors.landingPageId = 'Selecione uma landing page';
        break;
      case 4:
        if (formData.targetType === 'groups' && formData.targetGroupIds.length === 0) {
          newErrors.targetGroupIds = 'Selecione pelo menos um grupo';
        }
        if (formData.targetType === 'csv' && formData.csvData.length === 0) {
          newErrors.csvData = 'Carregue um arquivo CSV com e-mails';
        }
        break;
      case 5:
        if (formData.scheduleType === 'schedule' || formData.scheduleType === 'staggered') {
          if (!formData.scheduledDate) newErrors.scheduledDate = 'Data é obrigatória';
          if (!formData.scheduledTime) newErrors.scheduledTime = 'Horário é obrigatório';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Navigation
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // Submit campaign
  const handleSubmit = useCallback(async () => {
    try {
      setLoadingSubmit(true);

      // Get current user company
      const { data: companyIdData, error: companyError } = await supabase.rpc('get_user_company_id');
      if (companyError) throw new Error('Failed to get company ID');
      const companyId = companyIdData;

      // Calculate total targets INSIDE the callback to avoid TDZ
      const calcTotalTargets = () => formData.targetType === 'csv'
        ? formData.csvData.length
        : formData.targetGroupIds.reduce((sum, id) => {
            const group = targetGroups.find(g => g.id === id);
            return sum + (group?.count || 0);
          }, 0);
      const theTotalTargets = calcTotalTargets();

      // Create campaign
      const scheduledAt = formData.scheduleType !== 'now'
        ? new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString()
        : null;

      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          company_id: companyId,
          name: formData.name,
          description: formData.description || null,
          template_id: formData.templateId,
          status: formData.scheduleType === 'now' ? 'running' : 'scheduled',
          scheduled_at: scheduledAt,
          target_count: theTotalTargets,
          settings: {
            difficulty: formData.difficulty,
            target_type: formData.targetType,
            target_group_ids: formData.targetGroupIds,
            landing_page_id: formData.landingPageId,
            timezone: formData.timezone,
            stagger_hours: formData.staggerHours,
            business_hours_only: formData.businessHoursOnly,
            business_hours_start: formData.businessHoursStart,
            business_hours_end: formData.businessHoursEnd,
          },
        })
        .select()
        .single();

      if (campaignError) {
        console.error('Campaign insert error:', campaignError);
        throw campaignError;
      }

      // Insert campaign targets (Step 4)
      if (formData.targetType === 'csv' && formData.csvData.length > 0) {
        // CSV targets - insert directly with emails
        const targetInserts = formData.csvData.map(row => ({
          campaign_id: campaign.id,
          user_id: '', // No user_id for CSV targets
          email: row.email,
          tracking_id: crypto.randomUUID(),
          status: 'pending' as const,
        }));

        const { error: targetsError } = await supabase
          .from('campaign_targets')
          .insert(targetInserts);

        if (targetsError) {
          console.error('Targets insert error:', targetsError);
          throw targetsError;
        }
      } else if (formData.targetGroupIds.length > 0) {
        // Group-based targets - fetch users from groups and insert
        // For now, insert pending records that will be resolved by backend
        const { data: groupUsers } = await supabase
          .from('target_groups')
          .select('id, name, type')
          .in('id', formData.targetGroupIds);

        if (groupUsers && groupUsers.length > 0) {
          // Get employees/users in these groups
          // Since target_groups is a view/table with user counts, we insert placeholder targets
          // The backend will resolve these to actual users when campaign starts
          const targetInserts = formData.targetGroupIds.map(groupId => ({
            campaign_id: campaign.id,
            user_id: groupId, // Using group ID as reference - backend will expand
            email: '', // Will be filled by backend
            tracking_id: crypto.randomUUID(),
            status: 'pending' as const,
          }));

          const { error: targetsError } = await supabase
            .from('campaign_targets')
            .insert(targetInserts);

          if (targetsError) {
            console.error('Targets insert error:', targetsError);
            throw targetsError;
          }
        }
      }

      // Insert sending schedule for staggered campaigns (Step 5)
      if (formData.scheduleType === 'staggered' && scheduledAt) {
        const { error: scheduleError } = await supabase
          .from('sending_schedules')
          .insert({
            campaign_id: campaign.id,
            scheduled_for: scheduledAt,
            batch_size: 50,
            batch_interval_minutes: formData.staggerHours * 60 / Math.max(1, Math.ceil(theTotalTargets / 50)),
          });

        if (scheduleError) {
          console.error('Schedule insert error:', scheduleError);
          throw scheduleError;
        }
      }

      // Success - navigate to campaigns list
      navigate('/app/campanhas');
    } catch (err) {
      console.error('Error creating campaign:', err);
      window.alert('Erro ao criar campanha. Por favor, tente novamente.');
    } finally {
      setLoadingSubmit(false);
    }
  }, [formData, targetGroups, navigate]);

  // Filter data
  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.category.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const filteredLandingPages = landingPages.filter(lp =>
    lp.name.toLowerCase().includes(landingSearch.toLowerCase()) ||
    lp.category.toLowerCase().includes(landingSearch.toLowerCase())
  );

  const filteredGroups = targetGroups.filter(g =>
    g.name.toLowerCase().includes(targetSearch.toLowerCase())
  );

  // Selected items
  const selectedTemplate = templates.find(t => t.id === formData.templateId);
  const selectedLandingPage = landingPages.find(lp => lp.id === formData.landingPageId);
  const selectedGroups = targetGroups.filter(g => formData.targetGroupIds.includes(g.id));

  // Calculate total targets
  const totalTargets = formData.targetType === 'csv'
    ? formData.csvData.length
    : formData.targetGroupIds.reduce((sum, id) => {
        const group = targetGroups.find(g => g.id === id);
        return sum + (group?.count || 0);
      }, 0);

  // Step indicator click handler
  const handleStepClick = useCallback((stepId: number) => {
    // Only allow going back or to completed steps
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    }
  }, [currentStep]);

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-0)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <div className="sticky top-0 p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--color-fg-primary)] mb-6">
            Nova Campanha
          </h2>

          {/* Step List */}
          <nav className="space-y-2">
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isClickable = step.id < currentStep;

              return (
                <div key={step.id}>
                  <button
                    onClick={() => isClickable && handleStepClick(step.id)}
                    disabled={!isClickable && !isActive}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-300',
                      isActive && 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30',
                      isCompleted && 'cursor-pointer hover:bg-[var(--color-surface-2)]',
                      !isActive && !isCompleted && 'cursor-default'
                    )}
                  >
                    {/* Step indicator */}
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

                      {/* Active glow effect */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-full bg-[var(--color-accent)] blur-md opacity-50 -z-10" />
                      )}
                    </div>

                    {/* Step text */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium truncate transition-colors',
                        isActive || isCompleted ? 'text-[var(--color-fg-primary)]' : 'text-[var(--color-fg-tertiary)]'
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-[var(--color-fg-tertiary)] truncate">
                        {step.subtitle}
                      </p>
                    </div>

                    {/* Arrow for completed steps */}
                    {isCompleted && !isActive && (
                      <ChevronRight className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
                    )}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Content Area */}
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
                    Informações da Campanha
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Defina o nome, descrição e nível de dificuldade
                  </p>
                </div>

                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="space-y-6 p-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da campanha *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Ex: Black Friday 2026 - Simulação de Phishing"
                        className={cn(errors.name && 'border-red-500')}
                      />
                      {errors.name && (
                        <p className="flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição (opcional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Descreva o objetivo desta campanha de phishing simulado..."
                        rows={3}
                      />
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-3">
                      <Label>Nível de dificuldade *</Label>
                      <div className="grid gap-3">
                        {(['beginner', 'intermediate', 'advanced'] as const).map(diff => (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => updateField('difficulty', diff)}
                            className={cn(
                              'flex items-start gap-4 rounded-[var(--radius-lg)] border-2 p-4 text-left transition-all',
                              formData.difficulty === diff
                                ? `border-[var(--color-accent)] ${TIER_INFO[diff].bgColor}`
                                : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                            )}
                          >
                            <div className={cn(
                              'grid h-10 w-10 shrink-0 place-items-center rounded-lg',
                              TIER_INFO[diff].bgColor
                            )}>
                              <Target className={cn('h-5 w-5', TIER_INFO[diff].color)} />
                            </div>
                            <div className="flex-1">
                              <p className={cn('font-display font-semibold', TIER_INFO[diff].color)}>
                                {TIER_INFO[diff].title}
                              </p>
                              <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                                {TIER_INFO[diff].description}
                              </p>
                            </div>
                            {formData.difficulty === diff && (
                              <Check className="h-5 w-5 text-[var(--color-accent)]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 2: Template */}
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
                    Selecione o Template
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Escolha o modelo de e-mail para esta campanha
                  </p>
                </div>

                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="space-y-4 p-6">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-tertiary)]" />
                      <Input
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Buscar templates..."
                        className="pl-10"
                      />
                    </div>

                    {errors.templateId && (
                      <p className="flex items-center gap-1 text-xs text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        {errors.templateId}
                      </p>
                    )}

                    {/* Template Grid */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredTemplates.map(template => (
                        <div
                          key={template.id}
                          className={cn(
                            'group relative rounded-[var(--radius-lg)] border-2 p-4 transition-all cursor-pointer',
                            formData.templateId === template.id
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                              : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                          )}
                          onClick={() => updateField('templateId', template.id)}
                        >
                          {/* Preview button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateField('templateId', template.id);
                              setShowTemplatePreview(true);
                            }}
                            className="absolute right-2 top-2 rounded-full bg-[var(--color-surface-3)] p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--color-accent)] hover:text-[var(--color-surface-0)]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--color-surface-3)]">
                              <Mail className="h-5 w-5 text-[var(--color-fg-tertiary)]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-[var(--color-fg-primary)] truncate">
                                  {template.name}
                                </p>
                                {formData.templateId === template.id && (
                                  <Check className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                                )}
                              </div>
                              <p className="text-xs text-[var(--color-fg-tertiary)]">{template.category}</p>
                              <p className="mt-1 text-xs text-[var(--color-fg-tertiary)] line-clamp-2">
                                {template.preview_text}
                              </p>
                              {template.click_rate && (
                                <div className="mt-2">
                                  <Badge variant="secondary" className="text-[10px]">
                                    {template.click_rate.toFixed(1)}% clique
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredTemplates.length === 0 && (
                      <div className="py-8 text-center text-[var(--color-fg-tertiary)]">
                        Nenhum template encontrado
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Selected template preview */}
                {selectedTemplate && (
                  <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Template selecionado</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTemplatePreview(true)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver preview
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--color-accent)]/10">
                          <Mail className="h-5 w-5 text-[var(--color-accent)]" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--color-fg-primary)]">{selectedTemplate.name}</p>
                          <p className="text-xs text-[var(--color-fg-tertiary)]">{selectedTemplate.subject}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* STEP 3: Landing Page */}
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
                    Selecione a Landing Page
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Escolha a página para onde os alvos serão direcionados
                  </p>
                </div>

                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="space-y-4 p-6">
                    {/* Search */}
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

                    {/* Landing Page Grid */}
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
                          {/* Preview button */}
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

                {/* Selected landing preview */}
                {selectedLandingPage && (
                  <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Landing page selecionada</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowLandingPreview(true)}
                        >
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

            {/* STEP 4: Targets */}
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
                    Selecione o Público-alvo
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Defina quem receberá esta campanha
                  </p>
                </div>

                {/* Target type selector */}
                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="p-6">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => updateField('targetType', 'groups')}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 p-4 transition-all',
                          formData.targetType === 'groups'
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                            : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                        )}
                      >
                        <Users className={cn(
                          'h-6 w-6',
                          formData.targetType === 'groups' ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-tertiary)]'
                        )} />
                        <span className="text-sm font-medium">Grupos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateField('targetType', 'csv')}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 p-4 transition-all',
                          formData.targetType === 'csv'
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                            : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                        )}
                      >
                        <FileSpreadsheet className={cn(
                          'h-6 w-6',
                          formData.targetType === 'csv' ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-tertiary)]'
                        )} />
                        <span className="text-sm font-medium">Upload CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateField('targetType', 'segmentation')}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 p-4 transition-all',
                          formData.targetType === 'segmentation'
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                            : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                        )}
                      >
                        <Target className={cn(
                          'h-6 w-6',
                          formData.targetType === 'segmentation' ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-tertiary)]'
                        )} />
                        <span className="text-sm font-medium">Segmentação</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Groups selection */}
                {formData.targetType === 'groups' && (
                  <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                    <CardContent className="space-y-4 p-6">
                      {/* Selected groups */}
                      {selectedGroups.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-[var(--color-fg-secondary)]">Grupos selecionados:</Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedGroups.map(group => (
                              <Badge
                                key={group.id}
                                variant="secondary"
                                className="pr-1"
                              >
                                {group.name}
                                <span className="mx-1 text-[var(--color-fg-tertiary)]">({group.count})</span>
                                <button
                                  type="button"
                                  onClick={() => toggleTargetGroup(group.id)}
                                  className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-surface-3)]"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            <Badge variant="primary" className="text-xs">
                              Total: {totalTargets.toLocaleString('pt-BR')} alvos
                            </Badge>
                          </div>
                        </div>
                      )}

                      {errors.targetGroupIds && (
                        <p className="flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          {errors.targetGroupIds}
                        </p>
                      )}

                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-tertiary)]" />
                        <Input
                          value={targetSearch}
                          onChange={(e) => setTargetSearch(e.target.value)}
                          placeholder="Buscar grupos..."
                          className="pl-10"
                        />
                      </div>

                      {/* Group list */}
                      <div className="space-y-2">
                        {filteredGroups.map(group => (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => toggleTargetGroup(group.id)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-all',
                              formData.targetGroupIds.includes(group.id)
                                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                                : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                            )}
                          >
                            <div className={cn(
                              'grid h-5 w-5 shrink-0 place-items-center rounded border',
                              formData.targetGroupIds.includes(group.id)
                                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                                : 'border-[var(--color-noir-600)]'
                            )}>
                              {formData.targetGroupIds.includes(group.id) && (
                                <Check className="h-3 w-3 text-[var(--color-surface-0)]" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-[var(--color-fg-primary)]">{group.name}</p>
                              <p className="text-xs text-[var(--color-fg-tertiary)]">
                                {group.count.toLocaleString('pt-BR')} usuários · {group.type}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {group.count}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* CSV Upload */}
                {formData.targetType === 'csv' && (
                  <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                    <CardContent className="space-y-4 p-6">
                      <div
                        className={cn(
                          'flex flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed p-8 transition-colors',
                          formData.csvFile
                            ? 'border-green-500/30 bg-green-500/5'
                            : 'border-[var(--color-noir-600)] hover:border-[var(--color-accent)]'
                        )}
                      >
                        <Upload className="h-10 w-10 text-[var(--color-fg-tertiary)] mb-4" />
                        <p className="text-sm text-[var(--color-fg-primary)] mb-1">
                          Arraste um arquivo CSV ou clique para selecionar
                        </p>
                        <p className="text-xs text-[var(--color-fg-tertiary)] mb-4">
                          O arquivo deve conter uma coluna "email" (obrigatória) e opcionalmente "name" e "department"
                        </p>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCSVUpload}
                          className="hidden"
                          id="csv-upload"
                        />
                        <Label
                          htmlFor="csv-upload"
                          className="cursor-pointer rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-4 py-2 text-sm hover:bg-[var(--color-surface-3)] transition-colors"
                        >
                          Selecionar arquivo
                        </Label>
                      </div>

                      {errors.csvData && (
                        <p className="flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          {errors.csvData}
                        </p>
                      )}

                      {formData.csvData.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[var(--color-fg-secondary)]">
                              {formData.csvData.length} e-mails carregados
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                updateField('csvFile', null);
                                updateField('csvData', []);
                              }}
                            >
                              <X className="h-4 w-4" />
                              Remover
                            </Button>
                          </div>
                          <div className="max-h-48 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-noir-700)]">
                            <table className="w-full text-xs">
                              <thead className="bg-[var(--color-surface-2)]">
                                <tr>
                                  <th className="px-3 py-2 text-left">Email</th>
                                  <th className="px-3 py-2 text-left">Nome</th>
                                  <th className="px-3 py-2 text-left">Departamento</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--color-noir-700)]">
                                {formData.csvData.slice(0, 100).map((row, idx) => (
                                  <tr key={idx}>
                                    <td className="px-3 py-2">{row.email}</td>
                                    <td className="px-3 py-2 text-[var(--color-fg-tertiary)]">{row.name || '-'}</td>
                                    <td className="px-3 py-2 text-[var(--color-fg-tertiary)]">{row.department || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {formData.csvData.length > 100 && (
                              <div className="px-3 py-2 text-xs text-[var(--color-fg-tertiary)] bg-[var(--color-surface-2)]">
                                ... e mais {formData.csvData.length - 100} registros
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Segmentation */}
                {formData.targetType === 'segmentation' && (
                  <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                    <CardContent className="space-y-6 p-6">
                      <div className="space-y-4">
                        <Label>Departamentos</Label>
                        <div className="flex flex-wrap gap-2">
                          {['Financeiro', 'TI', 'RH', 'Marketing', 'Vendas', 'Operações', 'Diretoria'].map(dept => (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => {
                                const current = formData.departmentFilter;
                                updateField('departmentFilter',
                                  current.includes(dept)
                                    ? current.filter(d => d !== dept)
                                    : [...current, dept]
                                );
                              }}
                              className={cn(
                                'rounded-full px-3 py-1 text-sm transition-colors',
                                formData.departmentFilter.includes(dept)
                                  ? 'bg-[var(--color-accent)] text-[var(--color-surface-0)]'
                                  : 'bg-[var(--color-surface-2)] text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-3)]'
                              )}
                            >
                              {dept}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label>Cargos/Funções</Label>
                        <div className="flex flex-wrap gap-2">
                          {['Gerente', 'Coordenador', 'Analista', 'Assistente', 'Diretor', 'Estagiário'].map(role => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => {
                                const current = formData.roleFilter;
                                updateField('roleFilter',
                                  current.includes(role)
                                    ? current.filter(r => r !== role)
                                    : [...current, role]
                                );
                              }}
                              className={cn(
                                'rounded-full px-3 py-1 text-sm transition-colors',
                                formData.roleFilter.includes(role)
                                  ? 'bg-[var(--color-accent)] text-[var(--color-surface-0)]'
                                  : 'bg-[var(--color-surface-2)] text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-3)]'
                              )}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]/10">
                            <Users className="h-5 w-5 text-[var(--color-accent)]" />
                          </div>
                          <div>
                            <p className="text-sm text-[var(--color-fg-tertiary)]">Alvos estimados</p>
                            <p className="text-lg font-display font-bold text-[var(--color-fg-primary)]">
                              {formData.targetGroupIds.length > 0 ? formData.targetGroupIds.reduce((acc, id) => acc + (targetGroups.find(g => g.id === id)?.count || 0), 0) : '—'}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-[var(--color-fg-tertiary)]">
                          A contagem final será calculada ao salvar a campanha
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* STEP 5: Scheduling */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                    Agendamento
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Defina quando e como esta campanha será enviada
                  </p>
                </div>

                {/* Schedule type */}
                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="space-y-4 p-6">
                    <Label>Quando enviar:</Label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => updateField('scheduleType', 'now')}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 p-4 transition-all',
                          formData.scheduleType === 'now'
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                            : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                        )}
                      >
                        <Zap className={cn(
                          'h-6 w-6',
                          formData.scheduleType === 'now' ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-tertiary)]'
                        )} />
                        <span className="text-sm font-medium">Enviar agora</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateField('scheduleType', 'schedule')}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 p-4 transition-all',
                          formData.scheduleType === 'schedule'
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                            : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                        )}
                      >
                        <Calendar className={cn(
                          'h-6 w-6',
                          formData.scheduleType === 'schedule' ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-tertiary)]'
                        )} />
                        <span className="text-sm font-medium">Agendar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateField('scheduleType', 'staggered')}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 p-4 transition-all',
                          formData.scheduleType === 'staggered'
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                            : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                        )}
                      >
                        <Clock className={cn(
                          'h-6 w-6',
                          formData.scheduleType === 'staggered' ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-tertiary)]'
                        )} />
                        <span className="text-sm font-medium">Espalhar envio</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Date/Time selection */}
                {(formData.scheduleType === 'schedule' || formData.scheduleType === 'staggered') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                      <CardContent className="space-y-4 p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="date">Data *</Label>
                            <Input
                              id="date"
                              type="date"
                              value={formData.scheduledDate}
                              onChange={(e) => updateField('scheduledDate', e.target.value)}
                              className={cn(errors.scheduledDate && 'border-red-500')}
                            />
                            {errors.scheduledDate && (
                              <p className="text-xs text-red-400">{errors.scheduledDate}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="time">Horário *</Label>
                            <Input
                              id="time"
                              type="time"
                              value={formData.scheduledTime}
                              onChange={(e) => updateField('scheduledTime', e.target.value)}
                              className={cn(errors.scheduledTime && 'border-red-500')}
                            />
                            {errors.scheduledTime && (
                              <p className="text-xs text-red-400">{errors.scheduledTime}</p>
                            )}
                          </div>
                        </div>

                        {/* Timezone */}
                        <div className="space-y-2">
                          <Label htmlFor="timezone">Fuso horário</Label>
                          <select
                            id="timezone"
                            value={formData.timezone}
                            onChange={(e) => updateField('timezone', e.target.value)}
                            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-600)] bg-[var(--color-surface-0)] px-3 py-2 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-0)]"
                          >
                            {TIMEZONES.map(tz => (
                              <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Staggered options */}
                        {formData.scheduleType === 'staggered' && (
                          <div className="space-y-4 pt-4 border-t border-[var(--color-noir-700)]">
                            <div className="space-y-2">
                              <Label>Espalhar envio durante {formData.staggerHours} horas</Label>
                              <input
                                type="range"
                                min="1"
                                max="24"
                                value={formData.staggerHours}
                                onChange={(e) => updateField('staggerHours', parseInt(e.target.value))}
                                className="w-full accent-[var(--color-accent)]"
                              />
                              <div className="flex justify-between text-xs text-[var(--color-fg-tertiary)]">
                                <span>1h</span>
                                <span>{formData.staggerHours}h</span>
                                <span>24h</span>
                              </div>
                            </div>

                            {/* Business hours only */}
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-[var(--color-fg-primary)]">Apenas horários comerciais</Label>
                                <p className="text-xs text-[var(--color-fg-tertiary)]">Seg a Sex, 09:00 - 18:00</p>
                              </div>
                              <Switch
                                checked={formData.businessHoursOnly}
                                onCheckedChange={(checked) => updateField('businessHoursOnly', checked)}
                              />
                            </div>

                            {formData.businessHoursOnly && (
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label htmlFor="businessStart">Início</Label>
                                  <Input
                                    id="businessStart"
                                    type="time"
                                    value={formData.businessHoursStart}
                                    onChange={(e) => updateField('businessHoursStart', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="businessEnd">Fim</Label>
                                  <Input
                                    id="businessEnd"
                                    type="time"
                                    value={formData.businessHoursEnd}
                                    onChange={(e) => updateField('businessHoursEnd', e.target.value)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Preview */}
                        {formData.scheduledDate && formData.scheduledTime && (
                          <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                            <div className="flex items-center gap-2 text-sm text-[var(--color-fg-secondary)]">
                              <Clock className="h-4 w-4" />
                              <span>
                                {formData.scheduleType === 'staggered' ? 'Início do envio: ' : 'Envio agendado para: '}
                                <span className="font-medium text-[var(--color-fg-primary)]">
                                  {new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleString('pt-BR', {
                                    dateStyle: 'full',
                                    timeStyle: 'short',
                                  })}
                                </span>
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Targets summary */}
                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Resumo dos alvos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-accent)]/10">
                        <Users className="h-6 w-6 text-[var(--color-accent)]" />
                      </div>
                      <div>
                        <p className="text-lg font-display font-bold text-[var(--color-fg-primary)]">
                          {totalTargets.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-sm text-[var(--color-fg-tertiary)]">
                          {formData.targetType === 'groups' && `${selectedGroups.length} grupo${selectedGroups.length !== 1 ? 's' : ''} selecionado${selectedGroups.length !== 1 ? 's' : ''}`}
                          {formData.targetType === 'csv' && `${formData.csvData.length} e-mails do CSV`}
                          {formData.targetType === 'segmentation' && 'Segmentação personalizada'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 6: Review */}
            {currentStep === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                    Revisar e Confirmar
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Verifique todos os detalhes antes de criar a campanha
                  </p>
                </div>

                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="space-y-6 p-6">
                    {/* Campaign info */}
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
                            {formData.name}
                          </h3>
                          {formData.description && (
                            <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">{formData.description}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                          Editar
                        </Button>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="secondary">{TIER_INFO[formData.difficulty].title}</Badge>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Template */}
                      <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                            <Mail className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[var(--color-fg-tertiary)]">Template</p>
                            <p className="font-medium text-[var(--color-fg-primary)] truncate">
                              {selectedTemplate?.name || 'Não selecionado'}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setCurrentStep(2)}>
                          Alterar
                        </Button>
                      </div>

                      {/* Landing Page */}
                      <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-lg bg-purple-500/10">
                            <Globe className="h-5 w-5 text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[var(--color-fg-tertiary)]">Landing Page</p>
                            <p className="font-medium text-[var(--color-fg-primary)] truncate">
                              {selectedLandingPage?.name || 'Não selecionada'}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setCurrentStep(3)}>
                          Alterar
                        </Button>
                      </div>

                      {/* Targets */}
                      <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10">
                            <Users className="h-5 w-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-fg-tertiary)]">Alvos</p>
                            <p className="font-medium text-[var(--color-fg-primary)]">
                              {totalTargets.toLocaleString('pt-BR')} usuários
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setCurrentStep(4)}>
                          Alterar
                        </Button>
                      </div>

                      {/* Schedule */}
                      <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4 sm:col-span-2">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'grid h-10 w-10 place-items-center rounded-lg',
                            formData.scheduleType === 'now' ? 'bg-green-500/10' : 'bg-amber-500/10'
                          )}>
                            <Clock className={cn(
                              'h-5 w-5',
                              formData.scheduleType === 'now' ? 'text-green-400' : 'text-amber-400'
                            )} />
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-fg-tertiary)]">
                              {formData.scheduleType === 'now' ? 'Envio' : formData.scheduleType === 'schedule' ? 'Agendamento' : 'Envio espalhado'}
                            </p>
                            <p className="font-medium text-[var(--color-fg-primary)]">
                              {formData.scheduleType === 'now'
                                ? 'Envio imediato'
                                : new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleString('pt-BR', {
                                    dateStyle: 'full',
                                    timeStyle: 'short',
                                  })}
                              {formData.scheduleType === 'staggered' && ` (espalhado em ${formData.staggerHours}h)`}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setCurrentStep(5)}>
                          Alterar
                        </Button>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/5 p-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                        <div>
                          <p className="font-medium text-amber-400">Pronto para começar?</p>
                          <p className="mt-1 text-sm text-[var(--color-fg-secondary)] max-w-xl">
                            Ao criar esta campanha, {totalTargets.toLocaleString('pt-BR')} usuário{totalTargets !== 1 ? 's' : ''} receberá{selectedGroups.length === 1 ? '' : 'ão'} o e-mail de phishing simulado conforme agendado.
                            Você pode cancelar a campanha a qualquer momento antes do envio.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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

            {currentStep < 6 ? (
              <Button variant="primary" onClick={handleNext}>
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSubmit} disabled={loadingSubmit}>
                {loadingSubmit ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Criar campanha
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        isOpen={showTemplatePreview}
        onClose={() => setShowTemplatePreview(false)}
        template={selectedTemplate || null}
      />

      {/* Landing Preview Modal */}
      {showLandingPreview && selectedLandingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-2xl">
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="sm" onClick={() => setShowLandingPreview(false)}>
                <X className="h-4 w-4" />
                Fechar
              </Button>
            </div>
            <div className="rounded-lg overflow-hidden border border-[var(--color-noir-700)]">
              <LandingPreview
                template={{
                  id: selectedLandingPage.id,
                  name: selectedLandingPage.name,
                  category: selectedLandingPage.category,
                  content: {
                    headline: 'Simulação de Phishing',
                    subheadline: 'Por favor, confirme suas credenciais',
                    body: 'Este é um teste de segurança. Suas informações não estão em risco.',
                    ctaText: 'Enviar',
                    footerText: '© 2026 PhishGuard - Simulação de Segurança',
                  },
                  colorScheme: {
                    primary: '#3b82f6',
                    secondary: '#8b5cf6',
                    background: '#ffffff',
                    text: '#1f2937',
                  },
                  branding: {
                    companyName: 'PhishGuard',
                    fakeDomain: 'security-alert.net',
                  },
                  fields: [
                    { id: '1', name: 'email', type: 'email', label: 'Email', placeholder: 'seu@email.com' },
                    { id: '2', name: 'password', type: 'password', label: 'Senha', placeholder: '••••••••' },
                  ],
                }}
                customizations={{}}
                domainMask={{ enabled: true, displayDomain: 'security-alert.net', hoverText: 'Simulação de Phishing' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}