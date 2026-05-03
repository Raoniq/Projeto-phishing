import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
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
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company } = useAuth();

  const [activeTab, setActiveTab] = useState<'activity' | 'campaigns' | 'training'>('activity');
  const [user, setUser] = useState<UserDetail | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [campaignResults, setCampaignResults] = useState<CampaignResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id || !params.id) {
      setUser(null);
      setActivityLog([]);
      setCampaignResults([]);
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Fetch user from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', params.id)
          .eq('company_id', company.id)
          .single();

        if (userError) throw userError;

        // Map to UserDetail interface
        const mappedUser: UserDetail = {
          id: userData.id,
          name: userData.name || userData.email,
          email: userData.email,
          role: (userData.role === 'admin' ? 'admin' : userData.role === 'member' ? 'manager' : 'learner') as UserDetail['role'],
          status: userData.last_login_at ? 'active' : 'pending',
          department: userData.department || 'Não definido',
          risk: 'medium',
          lastActivity: userData.last_login_at || userData.created_at,
          createdAt: userData.created_at,
          phone: '',
          manager: '',
          location: '',
          trainingCompleted: 0,
          trainingTotal: 0,
          lastTraining: userData.last_login_at || userData.created_at,
        };

        setUser(mappedUser);

        // Fetch audit logs for this user
        const { data: auditData } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', params.id)
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })
          .limit(50);

        // Map audit logs to ActivityLog
        const mappedActivities: ActivityLog[] = (auditData || []).map((log, i) => {
          let type: ActivityLog['type'] = 'login';
          let title = log.action;
          const description = log.table_name || '';

          if (log.action.includes('campaign') || log.table_name === 'campaign_targets') {
            type = 'campaign';
            title = 'Campanha';
          } else if (log.action.includes('training') || log.table_name === 'user_training_enrollments') {
            type = 'training';
            title = 'Treinamento';
          } else if (log.action === 'login' || log.action === 'logout') {
            type = 'login';
            title = log.action === 'login' ? 'Login no sistema' : 'Logout';
          } else {
            type = 'status_change';
            title = 'Status alterado';
          }

          return {
            id: log.id || `activity-${i}`,
            type,
            title,
            description,
            timestamp: log.created_at,
            campaignId: log.record_id || undefined,
          };
        });

        setActivityLog(mappedActivities);

        // Fetch campaign targets for this user
        const { data: targetsData } = await supabase
          .from('campaign_targets')
          .select('*, campaigns:campaigns(name)')
          .eq('user_id', params.id)
          .order('sent_at', { ascending: false });

        // Map campaign targets to CampaignResult
        const mappedResults: CampaignResult[] = (targetsData || []).map((target) => {
          const campaignName = (target.campaigns as { name?: string } | null)?.name || 'Campanha';
          const status = target.status === 'failed' ? 'compromised' : target.status;

          return {
            id: target.id,
            campaignName,
            template: '',
            sentAt: target.sent_at || target.created_at,
            openedAt: target.opened_at,
            clickedAt: target.clicked_at,
            reportedAt: target.reported_at,
            compromisedAt: null,
            status: status as CampaignResult['status'],
          };
        });

        setCampaignResults(mappedResults);
      } catch (err) {
        console.error('[UserDetailPage] Failed to fetch user data:', err);
        setUser(null);
        setActivityLog([]);
        setCampaignResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [company, params.id]);

  const daysSinceLastActivity = useMemo(() => {
    if (!user?.lastActivity) return 0;
    return Math.floor((INITIAL_TIMESTAMP - new Date(user.lastActivity).getTime()) / (24 * 60 * 60 * 1000));
  }, [user?.lastActivity]);

  const riskScore = useMemo(() => {
    const compromised = campaignResults.filter(r => r.status === 'compromised').length;
    const reported = campaignResults.filter(r => r.status === 'reported').length;
    const clicked = campaignResults.filter(r => r.status === 'clicked').length;
    return Math.min(100, compromised * 30 + reported * 15 + clicked * 10);
  }, [campaignResults]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-0)]">
        <div className="text-[var(--color-fg-muted)]">Carregando...</div>
      </div>
    );
  }

  // User not found
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-0)]">
        <div className="text-[var(--color-fg-muted)]">Usuário não encontrado</div>
      </div>
    );
  }

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
