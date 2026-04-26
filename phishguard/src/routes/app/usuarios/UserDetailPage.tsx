import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  FileText,
  Target,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'learner';
  status: 'active' | 'inactive' | 'pending';
  department: string;
  risk: 'high' | 'medium' | 'low';
  lastActivity: string;
  createdAt: string;
  phone: string;
  manager: string;
  location: string;
  trainingCompleted: number;
  trainingTotal: number;
  lastTraining: string;
}

interface ActivityLog {
  id: string;
  type: 'campaign' | 'training' | 'login' | 'status_change';
  title: string;
  description: string;
  timestamp: string;
  campaignId?: string;
  campaignName?: string;
}

interface CampaignResult {
  id: string;
  campaignName: string;
  template: string;
  sentAt: string;
  openedAt: string | null;
  clickedAt: string | null;
  reportedAt: string | null;
  compromisedAt: string | null;
  status: 'sent' | 'opened' | 'clicked' | 'reported' | 'compromised';
}

// Mock user data
const MOCK_USER: UserDetail = {
  id: 'user-1',
  name: 'Ana Silva 001',
  email: 'ana.silva.001@empresa.com',
  role: 'manager',
  status: 'active',
  department: 'TI',
  risk: 'medium',
  lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  phone: '+55 11 98765-4321',
  manager: 'Carlos Santos',
  location: 'São Paulo, SP',
  trainingCompleted: 6,
  trainingTotal: 8,
  lastTraining: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
};

// Mock activity history
function generateActivityLog(): ActivityLog[] {
  const activities: ActivityLog[] = [];
  const types: ActivityLog['type'][] = ['campaign', 'training', 'login', 'status_change'];
  const campaigns = [
    { name: 'Phishing Awareness - Básico', id: 'camp-1' },
    { name: 'LGPD Reminder Fevereiro', id: 'camp-2' },
    { name: 'Password Expiry Alert', id: 'camp-3' },
    { name: 'Security Update Required', id: 'camp-4' },
    { name: 'Invoice Due Notice', id: 'camp-5' },
  ];

  for (let i = 0; i < 50; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const daysAgo = Math.floor(Math.random() * 90);
    let activity: ActivityLog;

    switch (type) {
      case 'campaign': {
        const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
        const statuses: CampaignResult['status'][] = ['sent', 'opened', 'clicked', 'reported', 'compromised'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        activity = {
          id: `activity-${i}`,
          type: 'campaign',
          title: `Campanha: ${campaign.name}`,
          description: status === 'compromised' 
            ? 'Usuário caiu no phishing e teve credenciais expostas'
            : status === 'reported'
            ? 'Usuário reportou a campanha como suspeita'
            : status === 'clicked'
            ? 'Usuário clicou no link malicioso'
            : status === 'opened'
            ? 'Usuário abriu o email'
            : 'Email enviado',
          timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
          campaignId: campaign.id,
          campaignName: campaign.name,
        };
        break;
      }
      case 'training': {
        activity = {
          id: `activity-${i}`,
          type: 'training',
          title: 'Treinamento concluído',
          description: 'Phishing Awareness - Básico',
          timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        };
        break;
      }
      case 'login': {
        activity = {
          id: `activity-${i}`,
          type: 'login',
          title: 'Login no sistema',
          description: 'Acesso ao painel PhishGuard',
          timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        };
        break;
      }
      case 'status_change': {
        activity = {
          id: `activity-${i}`,
          type: 'status_change',
          title: 'Status alterado',
          description: daysAgo > 60 ? 'Conta criada' : 'Perfil atualizado',
          timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        };
        break;
      }
    }

    activities.push(activity);
  }

  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Mock campaign results
function generateCampaignResults(): CampaignResult[] {
  const campaigns = [
    { name: 'Phishing Awareness - Básico', template: 'Black Friday Promo' },
    { name: 'LGPD Reminder Fevereiro', template: 'LGPD Reminder' },
    { name: 'Password Expiry Alert', template: 'Password Expiry' },
    { name: 'Security Update Required', template: 'Security Update' },
    { name: 'Invoice Due Notice', template: 'Invoice Due' },
    { name: 'VPN Maintenance', template: 'VPN Maintenance' },
  ];

  return campaigns.map((c, i) => {
    const sentAt = new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000);
    const statuses: CampaignResult['status'][] = ['sent', 'opened', 'clicked', 'reported', 'compromised'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      id: `result-${i}`,
      campaignName: c.name,
      template: c.template,
      sentAt: sentAt.toISOString(),
      openedAt: status !== 'sent' ? new Date(sentAt.getTime() + 2 * 60 * 60 * 1000).toISOString() : null,
      clickedAt: status === 'clicked' || status === 'reported' || status === 'compromised' 
        ? new Date(sentAt.getTime() + 4 * 60 * 60 * 1000).toISOString() : null,
      reportedAt: status === 'reported' || status === 'compromised' 
        ? new Date(sentAt.getTime() + 6 * 60 * 60 * 1000).toISOString() : null,
      compromisedAt: status === 'compromised' 
        ? new Date(sentAt.getTime() + 8 * 60 * 60 * 1000).toISOString() : null,
      status,
    };
  });
}

const STATUS_CONFIG = {
  active: { label: 'Ativo', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  inactive: { label: 'Inativo', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  pending: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-400', icon: Clock },
} as const;

const RISK_CONFIG = {
  high: { label: 'Alto', color: 'bg-red-500/20 text-red-400', icon: AlertTriangle },
  medium: { label: 'Médio', color: 'bg-amber-500/20 text-amber-400', icon: AlertTriangle },
  low: { label: 'Baixo', color: 'bg-green-500/20 text-green-400', icon: Shield },
} as const;

const ROLE_CONFIG = {
  admin: { label: 'Administrador', color: 'bg-purple-500/20 text-purple-400' },
  manager: { label: 'Gestor', color: 'bg-blue-500/20 text-blue-400' },
  learner: { label: 'Usuário', color: 'bg-[var(--color-surface-3)] text-[var(--color-fg-secondary)]' },
} as const;

const ACTIVITY_ICONS = {
  campaign: Target,
  training: GraduationCap,
  login: Shield,
  status_change: Edit,
};

const CAMPAIGN_STATUS_CONFIG = {
  sent: { label: 'Enviado', color: 'text-[var(--color-fg-muted)]' },
  opened: { label: 'Aberto', color: 'text-blue-400' },
  clicked: { label: 'Clicado', color: 'text-amber-400' },
  reported: { label: 'Reportado', color: 'text-orange-400' },
  compromised: { label: 'Comprometido', color: 'text-red-400' },
};

// Capture timestamp once at module load to avoid impure function calls during render
const INITIAL_TIMESTAMP = Date.now();

export default function UserDetailPage() {
  useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'activity' | 'campaigns' | 'training'>('activity');

  const user = MOCK_USER;
  const activityLog = useMemo(() => generateActivityLog(), []);
  const campaignResults = useMemo(() => generateCampaignResults(), []);

  const daysSinceLastActivity = useMemo(() => {
    return Math.floor((INITIAL_TIMESTAMP - new Date(user.lastActivity).getTime()) / (24 * 60 * 60 * 1000));
  }, [user.lastActivity]);

  const riskScore = useMemo(() => {
    const compromised = campaignResults.filter(r => r.status === 'compromised').length;
    const reported = campaignResults.filter(r => r.status === 'reported').length;
    const clicked = campaignResults.filter(r => r.status === 'clicked').length;
    return Math.min(100, compromised * 30 + reported * 15 + clicked * 10);
  }, [campaignResults]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/usuarios')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para pessoas
        </Button>
      </motion.div>

      {/* User Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-accent)]/10 font-display text-3xl text-[var(--color-accent)]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
                {user.name}
              </h1>
              <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">{user.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', ROLE_CONFIG[user.role].color)}>
                  {ROLE_CONFIG[user.role].label}
                </span>
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', STATUS_CONFIG[user.status].color)}>
                  {(() => {
                    const Icon = STATUS_CONFIG[user.status].icon;
                    return <Icon className="h-3 w-3" />;
                  })()}
                  {STATUS_CONFIG[user.status].label}
                </span>
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', RISK_CONFIG[user.risk].color)}>
                  {(() => {
                    const Icon = RISK_CONFIG[user.risk].icon;
                    return <Icon className="h-3 w-3" />;
                  })()}
                  Risco {RISK_CONFIG[user.risk].label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm">
              <Mail className="h-4 w-4" />
              Enviar email
            </Button>
            <Button variant="secondary" size="sm">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]/10">
                  <Shield className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{riskScore}%</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Score de risco</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                    {user.trainingCompleted}/{user.trainingTotal}
                  </p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Treinamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                    {campaignResults.length}
                  </p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Campanhas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-purple-500/10">
                  <Clock className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                    {daysSinceLastActivity}d
                  </p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Última atividade</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Info */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-1"
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <CardTitle className="text-lg">Informações do perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-[var(--color-fg-tertiary)]" />
                <div>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Email</p>
                  <p className="text-sm font-medium text-[var(--color-fg-primary)]">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-[var(--color-fg-tertiary)]" />
                <div>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Telefone</p>
                  <p className="text-sm font-medium text-[var(--color-fg-primary)]">{user.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building className="mt-0.5 h-4 w-4 text-[var(--color-fg-tertiary)]" />
                <div>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Departamento</p>
                  <p className="text-sm font-medium text-[var(--color-fg-primary)]">{user.department}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-4 w-4 text-[var(--color-fg-tertiary)]" />
                <div>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Gestor</p>
                  <p className="text-sm font-medium text-[var(--color-fg-primary)]">{user.manager}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-[var(--color-fg-tertiary)]" />
                <div>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Membro desde</p>
                  <p className="text-sm font-medium text-[var(--color-fg-primary)]">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-[var(--color-fg-tertiary)]" />
                <div>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Último treinamento</p>
                  <p className="text-sm font-medium text-[var(--color-fg-primary)]">
                    {new Date(user.lastTraining).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column - Tabs */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            {/* Tabs */}
            <div className="flex border-b border-[var(--color-noir-700)]">
              <button
                onClick={() => setActiveTab('activity')}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                  activeTab === 'activity'
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]'
                )}
              >
                <FileText className="h-4 w-4" />
                Histórico
                {activeTab === 'activity' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                  activeTab === 'campaigns'
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]'
                )}
              >
                <Target className="h-4 w-4" />
                Campanhas
                {activeTab === 'campaigns' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                  activeTab === 'training'
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]'
                )}
              >
                <GraduationCap className="h-4 w-4" />
                Treinamentos
                {activeTab === 'training' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
                )}
              </button>
            </div>

            <CardContent className="p-0">
              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="max-h-96 overflow-y-auto">
                  {activityLog.map((activity) => {
                    const Icon = ACTIVITY_ICONS[activity.type];
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 border-b border-[var(--color-noir-800)] px-4 py-3 last:border-0"
                      >
                        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-surface-2)]">
                          <Icon className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[var(--color-fg-primary)]">{activity.title}</p>
                          <p className="text-xs text-[var(--color-fg-muted)]">{activity.description}</p>
                        </div>
                        <span className="text-xs text-[var(--color-fg-tertiary)]">
                          {new Date(activity.timestamp).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Campaigns Tab */}
              {activeTab === 'campaigns' && (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-surface-2)]">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-fg-tertiary)]">Campanha</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-fg-tertiary)]">Enviado</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-fg-tertiary)]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-noir-800)]">
                      {campaignResults.map((result) => (
                        <tr key={result.id} className="hover:bg-[var(--color-surface-2)]/50">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-[var(--color-fg-primary)]">{result.campaignName}</p>
                            <p className="text-xs text-[var(--color-fg-muted)]">{result.template}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--color-fg-secondary)]">
                            {new Date(result.sentAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('text-sm font-medium', CAMPAIGN_STATUS_CONFIG[result.status].color)}>
                              {CAMPAIGN_STATUS_CONFIG[result.status].label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Training Tab */}
              {activeTab === 'training' && (
                <div className="max-h-96 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {[
                      { name: 'Phishing Awareness - Básico', completed: true, date: '15/01/2026' },
                      { name: 'Phishing Awareness - Intermediário', completed: true, date: '01/02/2026' },
                      { name: 'Phishing Awareness - Avançado', completed: true, date: '15/02/2026' },
                      { name: 'Spear Phishing', completed: false, date: null },
                      { name: 'Engenharia Social', completed: false, date: null },
                      { name: 'LGPD e Privacidade', completed: false, date: null },
                    ].map((training, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)]/50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          {training.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <Clock className="h-5 w-5 text-[var(--color-fg-muted)]" />
                          )}
                          <span className="text-sm font-medium text-[var(--color-fg-primary)]">{training.name}</span>
                        </div>
                        {training.completed ? (
                          <span className="text-xs text-[var(--color-fg-muted)]">{training.date}</span>
                        ) : (
                          <Button variant="secondary" size="sm">Iniciar</Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
