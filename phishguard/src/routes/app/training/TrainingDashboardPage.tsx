// routes/app/training/TrainingDashboardPage.tsx — Gamified Training Dashboard
import { useState } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  ShieldAlert,
  Lock,
  Clock,
  BookOpen,
  CheckCircle2,
  Trophy,
  Medal,
  Star,
  Zap,
  Search,
  Filter,
  TrendingUp,
  Award,
  Target,
  Calendar,
  Users,
  ChevronRight,
  Flame,
  Crown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// =============================================================================
// TYPES
// =============================================================================

interface TrainingTrack {
  id: string;
  title: string;
  description: string;
  modules: number;
  duration: string;
  level: 'Básico' | 'Intermediário' | 'Avançado';
  levelColor: string;
  icon: React.ElementType;
  progress: number;
  status: 'assigned' | 'available' | 'completed';
  dueDate?: string;
  xp: number;
  category: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  department: string;
  trend: 'up' | 'down' | 'same';
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  description: string;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const mockCatalogTracks: TrainingTrack[] = [
  {
    id: '1',
    title: 'Phishing Awareness 101',
    description: 'Aprenda a identificar emails suspeitos, links maliciosos e técnicas básicas de engenharia social usadas em ataques de phishing.',
    modules: 8,
    duration: '45min',
    level: 'Básico',
    levelColor: 'var(--color-success)',
    icon: GraduationCap,
    progress: 100,
    status: 'completed',
    xp: 500,
    category: 'Segurança Básica',
  },
  {
    id: '2',
    title: 'Advanced Social Engineering',
    description: 'Deep dive em técnicas sofisticadas de engenharia social, spear phishing direcionado, vishing e como se proteger contra manipulação psicológica.',
    modules: 12,
    duration: '90min',
    level: 'Avançado',
    levelColor: 'var(--color-danger)',
    icon: ShieldAlert,
    progress: 65,
    status: 'assigned',
    dueDate: '2026-05-01',
    xp: 1200,
    category: 'Engenharia Social',
  },
  {
    id: '3',
    title: 'LGPD & Data Protection',
    description: 'Entenda a Lei Geral de Proteção de Dados, suas obrigações, como tratar dados sensíveis e as penalidades por descumprimento.',
    modules: 10,
    duration: '60min',
    level: 'Intermediário',
    levelColor: 'var(--color-warning)',
    icon: Lock,
    progress: 30,
    status: 'assigned',
    dueDate: '2026-05-15',
    xp: 800,
    category: 'Compliance',
  },
  {
    id: '4',
    title: 'Secure Password Practices',
    description: 'Técnicas para criar senhas fortes, gerenciadores de senhas, autenticação em dois fatores e práticas de segurança de credenciais.',
    modules: 6,
    duration: '30min',
    level: 'Básico',
    levelColor: 'var(--color-success)',
    icon: Lock,
    progress: 0,
    status: 'available',
    xp: 400,
    category: 'Segurança Básica',
  },
  {
    id: '5',
    title: 'Mobile Device Security',
    description: 'Proteção de dispositivos móveis, segurança de apps, criptografia, remote wipe e políticas de BYOD em ambientes corporativos.',
    modules: 8,
    duration: '50min',
    level: 'Intermediário',
    levelColor: 'var(--color-warning)',
    icon: ShieldAlert,
    progress: 0,
    status: 'available',
    xp: 700,
    category: 'Dispositivos',
  },
];

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Marina Santos', avatar: 'MS', xp: 4850, level: 12, department: 'TI', trend: 'same' },
  { rank: 2, name: 'Ricardo Oliveira', avatar: 'RO', xp: 4200, level: 10, department: 'Marketing', trend: 'up' },
  { rank: 3, name: 'Carla Mendes', avatar: 'CM', xp: 3850, level: 9, department: 'RH', trend: 'down' },
  { rank: 4, name: 'André Lima', avatar: 'AL', xp: 3400, level: 8, department: 'Vendas', trend: 'up' },
  { rank: 5, name: 'Juliana Costa', avatar: 'JC', xp: 2950, level: 7, department: 'Financeiro', trend: 'same' },
  { rank: 6, name: 'Paulo Ferreira', avatar: 'PF', xp: 2600, level: 6, department: 'TI', trend: 'down' },
  { rank: 7, name: 'Fernanda Alves', avatar: 'FA', xp: 2200, level: 5, department: 'Operações', trend: 'up' },
];

const mockBadges: Badge[] = [
  { id: 'b1', name: 'First Steps', icon: '👣', earned: true, description: 'Complete seu primeiro treinamento' },
  { id: 'b2', name: 'Phishing Hunter', icon: '🎯', earned: true, description: 'Identifique 10 tentativas de phishing' },
  { id: 'b3', name: 'Speed Learner', icon: '⚡', earned: true, description: 'Complete um treinamento em menos de 20min' },
  { id: 'b4', name: 'Security Pro', icon: '🏆', earned: false, description: 'Complete todos os treinamentos básicos' },
  { id: 'b5', name: 'Legend', icon: '👑', earned: false, description: 'Alcance o nível 15' },
];

// =============================================================================
// PROGRESS STATS COMPONENT
// =============================================================================

function ProgressStats() {
  const userStats = {
    xp: 2450,
    level: 6,
    pointsToNextLevel: 550,
    totalXpForNextLevel: 3000,
    completedTracks: 3,
    totalTracks: 12,
    streak: 7,
  };

  const levelProgress = ((userStats.xp - (userStats.xp - userStats.pointsToNextLevel)) / userStats.totalXpForNextLevel) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* XP Card */}
      <Card className="bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-noir-800)] border-[var(--color-accent)]/30">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-fg-muted)] uppercase tracking-wide">Experiência</p>
              <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{userStats.xp.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[var(--color-fg-muted)]">Próximo nível</span>
              <span className="font-mono text-xs text-[var(--color-accent)]">{userStats.pointsToNextLevel} XP</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--color-noir-700)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-amber-400)] transition-all"
                style={{ width: `${(userStats.pointsToNextLevel / userStats.totalXpForNextLevel) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Card */}
      <Card className="bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-noir-800)] border-[var(--color-accent)]/30">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-fg-muted)] uppercase tracking-wide">Nível Atual</p>
              <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{userStats.level}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="warning" className="text-xs">Defensor</Badge>
            <span className="text-xs text-[var(--color-fg-muted)]}>rankings</span>
          </div>
        </CardContent>
      </Card>

      {/* Streak Card */}
      <Card className="bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-noir-800)] border-[var(--color-accent)]/30">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-fg-muted)] uppercase tracking-wide">Sequência</p>
              <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{userStats.streak} dias</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--color-fg-muted)]">Continue aprendendo!</p>
        </CardContent>
      </Card>

      {/* Progress Card */}
      <Card className="bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-noir-800)] border-[var(--color-accent)]/30">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-fg-muted)] uppercase tracking-wide">Conclusão</p>
              <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{userStats.completedTracks}/{userStats.totalTracks}</p>
            </div>
          </div>
          <div className="mt-2">
            <div className="h-2 overflow-hidden rounded-full bg-[var(--color-noir-700)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-success)] to-[var(--color-accent)] transition-all"
                style={{ width: `${(userStats.completedTracks / userStats.totalTracks) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// BADGES DISPLAY COMPONENT
// =============================================================================

function BadgesDisplay() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-[var(--color-accent)]" />
        <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">Conquistas</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {mockBadges.map((badge) => (
          <div
            key={badge.id}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-xl border transition-all
              ${badge.earned
                ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30'
                : 'bg-[var(--color-surface-2)] border-[var(--color-noir-700)] opacity-50'
              }
            `}
            title={badge.description}
          >
            <span className="text-lg">{badge.icon}</span>
            <span className={`text-sm font-medium ${badge.earned ? 'text-[var(--color-fg-primary)]' : 'text-[var(--color-fg-muted)]'}`}>
              {badge.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// ASSIGNED TRAINING CARDS COMPONENT
// =============================================================================

function AssignedTrainingCards() {
  const assignedTracks = mockCatalogTracks.filter(t => t.status === 'assigned' || t.status === 'completed');

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--color-accent)]" />
          <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">Meus Treinamentos</h3>
        </div>
        <Badge variant="outline">{assignedTracks.length} atribuídos</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assignedTracks.map((track, index) => {
          const Icon = track.icon;
          const daysUntilDue = track.dueDate
            ? Math.ceil((new Date(track.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 100 }}
            >
              <Card className={`
                bg-[var(--color-surface-1)] border-[var(--color-noir-700)] hover:border-[var(--color-accent)]/50 transition-all duration-200
                ${track.status === 'completed' ? 'border-[var(--color-success)]/30' : ''}
              `}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[var(--color-accent)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h4 className="font-display text-base font-semibold text-[var(--color-fg-primary)] truncate">
                            {track.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={track.status === 'completed' ? 'success' : 'warning'}
                              className="text-xs"
                            >
                              {track.status === 'completed' ? 'Concluído' : 'Em andamento'}
                            </Badge>
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${track.levelColor}20`,
                                color: track.levelColor,
                              }}
                            >
                              {track.level}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="font-mono text-lg font-bold text-[var(--color-accent)]">{track.progress}%</p>
                          <p className="text-xs text-[var(--color-fg-muted)]">{track.xp} XP</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-noir-700)]">
                          <div
                            className={`h-full rounded-full transition-all ${track.status === 'completed'
                                ? 'bg-gradient-to-r from-[var(--color-success)] to-[var(--color-accent)]'
                                : 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-amber-400)]'
                              }`}
                            style={{ width: `${track.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Meta and due date */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 text-xs text-[var(--color-fg-muted)]">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {track.modules} módulos
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {track.duration}
                          </span>
                        </div>
                        {daysUntilDue !== null && daysUntilDue > 0 && (
                          <span className={`text-xs font-medium ${daysUntilDue <= 7 ? 'text-[var(--color-danger)]' : 'text-[var(--color-fg-muted)]'}`}>
                            {daysUntilDue} dias restantes
                          </span>
                        )}
                      </div>

                      {/* Action button */}
                      <div className="mt-4">
                        <Button
                          variant={track.status === 'completed' ? 'secondary' : 'default'}
                          className="w-full justify-center gap-2"
                        >
                          {track.status === 'completed' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Revisitar
                            </>
                          ) : (
                            <>
                              Continuar
                              <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// TRAINING CATALOG COMPONENT
// =============================================================================

function TrainingCatalog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const availableTracks = mockCatalogTracks.filter(t => t.status === 'available');

  const categories = [...new Set(availableTracks.map(t => t.category))];
  const levels = ['all', 'Básico', 'Intermediário', 'Avançado'];

  const filteredTracks = availableTracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || track.level === selectedLevel;
    const matchesCategory = selectedCategory === 'all' || track.category === selectedCategory;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-[var(--color-accent)]" />
        <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">Catálogo de Treinamentos</h3>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-fg-muted)]" />
          <Input
            type="text"
            placeholder="Buscar treinamentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[var(--color-surface-2)] border-[var(--color-noir-700)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--color-fg-muted)]" />
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-noir-700)] text-sm text-[var(--color-fg-primary)]"
          >
            {levels.map(level => (
              <option key={level} value={level}>
                {level === 'all' ? 'Todos os níveis' : level}
              </option>
            ))}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-noir-700)] text-sm text-[var(--color-fg-primary)]"
          >
            <option value="all">Todas categorias</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTracks.map((track, index) => {
          const Icon = track.icon;
          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 50 }}
            >
              <Card className="bg-[var(--color-surface-1)] border-[var(--color-noir-700)] hover:border-[var(--color-accent)]/50 transition-all duration-200 h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-subtle)] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[var(--color-accent)]" />
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${track.levelColor}20`,
                        color: track.levelColor,
                      }}
                    >
                      {track.level}
                    </span>
                  </div>

                  {/* Title and Description */}
                  <h4 className="font-display text-base font-semibold text-[var(--color-fg-primary)] mb-1.5">
                    {track.title}
                  </h4>
                  <p className="text-sm text-[var(--color-fg-secondary)] mb-3 flex-1">
                    {track.description}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center gap-3 mb-3 text-xs text-[var(--color-fg-muted)]">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {track.modules} módulos
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {track.duration}
                    </span>
                    <span className="flex items-center gap-1 text-[var(--color-accent)]">
                      <Zap className="w-3.5 h-3.5" />
                      {track.xp} XP
                    </span>
                  </div>

                  {/* Category badge */}
                  <div className="mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {track.category}
                    </Badge>
                  </div>

                  {/* Start button */}
                  <Button
                    variant="primary"
                    className="w-full justify-center gap-2 mt-auto"
                  >
                    Iniciar
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredTracks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--color-fg-muted)]">Nenhum treinamento encontrado com os filtros selecionados.</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// LEADERBOARD COMPONENT
// =============================================================================

function Leaderboard() {
  const currentUser = {
    rank: 8,
    name: 'Você',
    avatar: 'VO',
    xp: 2450,
    level: 6,
    department: 'TI',
    trend: 'up' as const,
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-[var(--color-accent)]" />;
      case 2: return <Medal className="w-5 h-5 text-[var(--color-noir-400)]" />;
      case 3: return <Medal className="w-5 h-5 text-[var(--color-amber-600)]" />;
      default: return null;
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-[var(--color-accent)]" />
        <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">Ranking da Organização</h3>
      </div>
      <Card className="bg-[var(--color-surface-1)] border-[var(--color-noir-700)]">
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[var(--color-noir-700)] text-xs text-[var(--color-fg-muted)] uppercase tracking-wide">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Usuário</div>
            <div className="col-span-2 text-center">Nível</div>
            <div className="col-span-2 text-right">XP</div>
            <div className="col-span-2 text-right">Tendência</div>
          </div>

          {/* Leaderboard entries */}
          {mockLeaderboard.map((entry, index) => (
            <div
              key={entry.rank}
              className={`
                grid grid-cols-12 gap-4 px-5 py-3 items-center
                ${index !== mockLeaderboard.length - 1 ? 'border-b border-[var(--color-noir-800)]' : ''}
                ${entry.rank <= 3 ? 'bg-[var(--color-accent)]/5' : ''}
                hover:bg-[var(--color-surface-2)] transition-colors
              `}
            >
              <div className="col-span-1 flex items-center justify-center">
                {getRankIcon(entry.rank) || (
                  <span className="font-mono text-sm font-bold text-[var(--color-fg-muted)]">
                    {entry.rank}
                  </span>
                )}
              </div>
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-accent)]">
                  {entry.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-fg-primary)]">{entry.name}</p>
                  <p className="text-xs text-[var(--color-fg-muted)]">{entry.department}</p>
                </div>
              </div>
              <div className="col-span-2 text-center">
                <Badge variant="secondary" className="text-xs">
                  Nível {entry.level}
                </Badge>
              </div>
              <div className="col-span-2 text-right">
                <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
                  {entry.xp.toLocaleString()}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1">
                {entry.trend === 'up' && <TrendingUp className="w-4 h-4 text-[var(--color-success)]" />}
                {entry.trend === 'down' && <TrendingUp className="w-4 h-4 text-[var(--color-danger)] rotate-180" />}
                {entry.trend === 'same' && <span className="w-4" />}
              </div>
            </div>
          ))}

          {/* Current user highlight */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 items-center bg-[var(--color-accent)]/10 border-t-2 border-[var(--color-accent)]">
            <div className="col-span-1 flex items-center justify-center">
              <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
                {currentUser.rank}
              </span>
            </div>
            <div className="col-span-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-xs font-bold text-[var(--color-surface-0)]">
                {currentUser.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-fg-primary)]">{currentUser.name}</p>
                <p className="text-xs text-[var(--color-fg-muted)]">{currentUser.department}</p>
              </div>
            </div>
            <div className="col-span-2 text-center">
              <Badge variant="warning" className="text-xs">
                Nível {currentUser.level}
              </Badge>
            </div>
            <div className="col-span-2 text-right">
              <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
                {currentUser.xp.toLocaleString()}
              </span>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-1">
              {currentUser.trend === 'up' && <TrendingUp className="w-4 h-4 text-[var(--color-success)]" />}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function TrainingDashboardPage() {
  return (
    <div className="h-full bg-[var(--color-surface-0)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-[var(--color-accent)]" />
            </div>
            <h1 className="text-3xl font-display font-bold text-[var(--color-fg-primary)] tracking-tight">
              Centro de Treinamento
            </h1>
          </div>
          <p className="ml-[3.5rem] text-[var(--color-fg-secondary)]">
            Desenvolva competências em segurança digital e suba no ranking
          </p>
        </motion.div>

        {/* Progress Stats */}
        <ProgressStats />

        {/* Badges Display */}
        <BadgesDisplay />

        {/* Assigned Training Cards */}
        <AssignedTrainingCards />

        {/* Training Catalog */}
        <TrainingCatalog />

        {/* Leaderboard */}
        <Leaderboard />
      </div>
    </div>
  );
}
