import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  Filter,
  X,
  MapPin,
  Activity,
  Clock,
  TrendingUp,
  ChevronRight,
  Mail,
  Eye,
  MousePointer,
  Flag,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/Select';
import { CampaignFunnel } from '@/components/data-viz/CampaignFunnel';
import { cn } from '@/lib/utils';

// Types
interface AnalyticsEvent {
  id: string;
  timestamp: Date;
  type: 'sent' | 'opened' | 'clicked' | 'reported' | 'compromised';
  userId: string;
  userName: string;
  userEmail: string;
  department: string;
  role: string;
  region: string;
}

interface GeoData {
  region: string;
  state: string;
  clicks: number;
  percentage: number;
}

// Mock data generators
function generateMockEvents(count: number): AnalyticsEvent[] {
  const departments = ['TI', 'Vendas', 'Marketing', 'RH', 'Financeiro', 'Operações', 'Jurídico', 'Compras'];
  const roles = ['Analista', 'Gerente', 'Diretor', 'Coordenador', 'Estagiário', 'Assistente', 'Executor'];
  const regions = [
    'São Paulo - SP', 'Rio de Janeiro - RJ', 'Belo Horizonte - MG', 'Salvador - BA',
    'Brasília - DF', 'Curitiba - PR', 'Porto Alegre - RS', 'Recife - PE',
    'Fortaleza - CE', 'Manaus - AM', 'Goiânia - GO', 'Vitória - ES'
  ];
  const names = [
    'Ana Silva', 'Bruno Costa', 'Carla Santos', 'Daniel Oliveira', 'Elena Ferreira',
    'Fernando Lima', 'Gabriela Rocha', 'Henrique Alves', 'Isabela Martins', 'João Pereira',
    'Karen Souza', 'Leonardo Castro', 'Marina Rodrigues', 'Nathan Pereira', 'Olivia Gomes'
  ];

  const types: AnalyticsEvent['type'][] = ['sent', 'opened', 'clicked', 'reported', 'compromised'];
  const baseTime = new Date('2026-04-15T10:00:00Z');

  return Array.from({ length: count }, (_, i) => {
    const typeIndex = Math.random() < 0.5 ? 1 : Math.floor(Math.random() * 5);
    const hoursOffset = Math.random() * 48;
    const eventTime = new Date(baseTime.getTime() + hoursOffset * 60 * 60 * 1000);

    return {
      id: `event-${i}`,
      timestamp: eventTime,
      type: types[typeIndex],
      userId: `user-${i % 50}`,
      userName: names[i % names.length],
      userEmail: `${names[i % names.length].toLowerCase().replace(' ', '.')}@empresa.com`,
      department: departments[Math.floor(Math.random() * departments.length)],
      role: roles[Math.floor(Math.random() * roles.length)],
      region: regions[Math.floor(Math.random() * regions.length)]
    };
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function generateGeoData(): GeoData[] {
  return [
    { region: 'Sudeste', state: 'SP', clicks: 45, percentage: 38 },
    { region: 'Sudeste', state: 'RJ', clicks: 22, percentage: 18 },
    { region: 'Sudeste', state: 'MG', clicks: 12, percentage: 10 },
    { region: 'Nordeste', state: 'BA', clicks: 10, percentage: 8 },
    { region: 'Nordeste', state: 'PE', clicks: 8, percentage: 7 },
    { region: 'Sul', state: 'PR', clicks: 7, percentage: 6 },
    { region: 'Centro-Oeste', state: 'DF', clicks: 6, percentage: 5 },
    { region: 'Sul', state: 'RS', clicks: 5, percentage: 4 },
    { region: 'Nordeste', state: 'CE', clicks: 4, percentage: 3 },
    { region: 'Norte', state: 'AM', clicks: 1, percentage: 1 }
  ];
}

// Funnel data
const FUNNEL_STEPS = [
  { label: 'Enviados', value: 150, color: 'var(--color-accent)' },
  { label: 'Abertos', value: 89, color: '#8b5cf6' },
  { label: 'Clicados', value: 12, color: '#f59e0b' },
  { label: 'Reportados', value: 3, color: '#22c55e' }
];

// Event type config
const EVENT_CONFIG = {
  sent: { label: 'Enviado', color: 'bg-blue-500/20 text-blue-400', icon: Mail },
  opened: { label: 'Aberto', color: 'bg-purple-500/20 text-purple-400', icon: Eye },
  clicked: { label: 'Clicado', color: 'bg-amber-500/20 text-amber-400', icon: MousePointer },
  reported: { label: 'Reportado', color: 'bg-green-500/20 text-green-400', icon: Flag },
  compromised: { label: 'Comprometido', color: 'bg-red-500/20 text-red-400', icon: AlertTriangle }
};

// Region color scale
const REGION_COLORS: Record<string, string> = {
  'SP': '#f59e0b',
  'RJ': '#8b5cf6',
  'MG': '#06b6d4',
  'BA': '#ec4899',
  'PE': '#f97316',
  'PR': '#22c55e',
  'DF': '#3b82f6',
  'RS': '#14b8a6',
  'CE': '#a855f7',
  'AM': '#64748b'
};

export default function CampaignAnalyticsPage() {
  const { id } = useParams();
  const [events] = useState<AnalyticsEvent[]>(() => generateMockEvents(150));
  const [geoData] = useState<GeoData[]>(() => generateGeoData());

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  // Stats
  const stats = {
    sent: 150,
    opened: 89,
    clicked: 12,
    reported: 3,
    compromised: 2
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (departmentFilter !== 'all' && event.department !== departmentFilter) return false;
      if (roleFilter !== 'all' && event.role !== roleFilter) return false;
      if (eventTypeFilter !== 'all' && event.type !== eventTypeFilter) return false;
      return true;
    });
  }, [events, departmentFilter, roleFilter, eventTypeFilter]);

  // Get unique departments and roles for filters
  const departments = useMemo(() => [...new Set(events.map(e => e.department))].sort(), [events]);
  const roles = useMemo(() => [...new Set(events.map(e => e.role))].sort(), [events]);

  // Export handlers
  const exportCSV = useCallback(() => {
    const headers = ['Timestamp', 'Tipo', 'Usuário', 'Email', 'Departamento', 'Cargo', 'Região'];
    const rows = filteredEvents.map(e => [
      e.timestamp.toISOString(),
      e.type,
      e.userName,
      e.userEmail,
      e.department,
      e.role,
      e.region
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${id}-analytics.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredEvents, id]);

  const exportPDF = useCallback(() => {
    // Simple text-based PDF generation (avoiding heavy libraries)
    const content = `
PHISHGUARD - ANALYTICS REPORT
Campaign: ${id}
Generated: ${new Date().toLocaleString('pt-BR')}
========================================

FUNNEL SUMMARY
--------------
Enviados: ${stats.sent}
Abertos: ${stats.opened} (${((stats.opened / stats.sent) * 100).toFixed(1)}%)
Clicados: ${stats.clicked} (${((stats.clicked / stats.opened) * 100).toFixed(1)}%)
Reportados: ${stats.reported} (${((stats.reported / stats.clicked) * 100).toFixed(1)}%)
Comprometidos: ${stats.compromised}

GEOGRAPHIC DISTRIBUTION
-----------------------
${geoData.map(g => `${g.state}: ${g.clicks} clicks (${g.percentage}%)`).join('\n')}

EVENTS (${filteredEvents.length} total)
---------
${filteredEvents.slice(0, 50).map(e =>
      `${e.timestamp.toLocaleString('pt-BR')} | ${e.type.toUpperCase()} | ${e.userName} | ${e.department}`
    ).join('\n')}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${id}-analytics.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredEvents, geoData, id, stats]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Header */}
      <div className="border-b border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <div className="mx-auto max-w-7xl px-4 py-4">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-fg-tertiary)]">
            <Link to="/app/campanhas" className="flex items-center gap-1 hover:text-[var(--color-fg-primary)]">
              <ArrowLeft className="h-4 w-4" />
              Campanhas
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/app/campanhas/${id}`} className="hover:text-[var(--color-fg-primary)]">
              Black Friday 2026
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[var(--color-fg-primary)]">Analytics</span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                Analytics da Campanha
              </h1>
              <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                Análise detalhada do desempenho e comportamento dos alvos
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={exportCSV}>
                <FileSpreadsheet className="h-4 w-4" />
                Exportar CSV
              </Button>
              <Button variant="secondary" size="sm" onClick={exportPDF}>
                <FileText className="h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[var(--color-fg-secondary)]">
              <Filter className="h-4 w-4" />
              Filtros:
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Departamentos</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Cargos</SelectItem>
                  {roles.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo de Evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Eventos</SelectItem>
                  <SelectItem value="sent">Enviados</SelectItem>
                  <SelectItem value="opened">Abertos</SelectItem>
                  <SelectItem value="clicked">Clicados</SelectItem>
                  <SelectItem value="reported">Reportados</SelectItem>
                  <SelectItem value="compromised">Comprometidos</SelectItem>
                </SelectContent>
              </Select>

              {(departmentFilter !== 'all' || roleFilter !== 'all' || eventTypeFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDepartmentFilter('all');
                    setRoleFilter('all');
                    setEventTypeFilter('all');
                  }}
                >
                  <X className="h-4 w-4" />
                  Limpar
                </Button>
              )}
            </div>

            <div className="ml-auto text-sm text-[var(--color-fg-tertiary)]">
              {filteredEvents.length} de {events.length} eventos
            </div>
          </div>
        </motion.div>

        {/* Top stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          {[
            { label: 'Enviados', value: stats.sent, icon: Mail, color: 'text-blue-400' },
            { label: 'Abertos', value: stats.opened, icon: Eye, color: 'text-purple-400', pct: ((stats.opened / stats.sent) * 100).toFixed(1) + '%' },
            { label: 'Clicados', value: stats.clicked, icon: MousePointer, color: 'text-amber-400', pct: ((stats.clicked / stats.opened) * 100).toFixed(1) + '%' },
            { label: 'Reportados', value: stats.reported, icon: Flag, color: 'text-green-400', pct: ((stats.reported / stats.clicked) * 100).toFixed(0) + '%' },
            { label: 'Comprometidos', value: stats.compromised, icon: AlertTriangle, color: 'text-red-400' }
          ].map((stat) => (
            <Card key={stat.label} className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-surface-2)]')}>
                    <stat.icon className={cn('h-5 w-5', stat.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">{stat.label}</p>
                    <p className="font-display text-xl font-bold text-[var(--color-fg-primary)]">
                      {stat.value}
                      {stat.pct && <span className="ml-2 text-sm font-normal text-[var(--color-fg-muted)]">{stat.pct}</span>}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Funnel + Map row */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {/* Funnel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[var(--color-accent)]" />
                  Funil de Conversão
                </CardTitle>
                <CardDescription>
                  Etapas da campanha do envio ao reporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CampaignFunnel steps={FUNNEL_STEPS} height={240} />

                {/* Conversion rates */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Taxa Abertura', value: ((stats.opened / stats.sent) * 100).toFixed(1) + '%', color: 'text-purple-400' },
                    { label: 'Taxa Clique', value: ((stats.clicked / stats.opened) * 100).toFixed(1) + '%', color: 'text-amber-400' },
                    { label: 'Taxa Reporte', value: ((stats.reported / stats.clicked) * 100).toFixed(0) + '%', color: 'text-green-400' }
                  ].map(rate => (
                    <div key={rate.label} className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3 text-center">
                      <p className="text-xs text-[var(--color-fg-tertiary)]">{rate.label}</p>
                      <p className={cn('font-display text-xl font-bold', rate.color)}>{rate.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Geographic Map */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[var(--color-accent)]" />
                  Distribuição Geográfica
                </CardTitle>
                <CardDescription>
                  Cliques por região do Brasil
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Simple Brazil map representation */}
                <div className="relative">
                  {/* State bars visualization */}
                  <div className="space-y-2">
                    {geoData.map((geo, index) => (
                      <div key={geo.state} className="flex items-center gap-3">
                        <div className="w-8 text-xs font-mono text-[var(--color-fg-secondary)]">{geo.state}</div>
                        <div className="flex-1">
                          <div className="h-6 rounded bg-[var(--color-surface-2)] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${geo.percentage * 2.5}%` }}
                              transition={{ delay: index * 0.05, duration: 0.5 }}
                              className="h-full rounded"
                              style={{ backgroundColor: REGION_COLORS[geo.state] || 'var(--color-accent)' }}
                            />
                          </div>
                        </div>
                        <div className="w-20 text-right">
                          <span className="font-mono text-sm text-[var(--color-fg-primary)]">{geo.clicks}</span>
                          <span className="ml-1 text-xs text-[var(--color-fg-muted)]">({geo.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(REGION_COLORS).slice(0, 5).map(([state, color]) => (
                      <div key={state} className="flex items-center gap-1 text-xs text-[var(--color-fg-muted)]">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                        {state}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[var(--color-accent)]" />
                Timeline de Eventos
              </CardTitle>
              <CardDescription>
                Últimas {filteredEvents.length} interações registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Timeline */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--color-noir-700)]" />

                {/* Events */}
                <div className="space-y-3">
                  {filteredEvents.slice(0, 100).map((event, index) => {
                    const EventIcon = EVENT_CONFIG[event.type].icon;
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.01 }}
                        className="relative flex items-start gap-4 pl-10"
                      >
                        {/* Icon */}
                        <div className={cn(
                          'absolute left-0 z-10 grid h-8 w-8 place-items-center rounded-full border-2 border-[var(--color-surface-1)]',
                          EVENT_CONFIG[event.type].color.split(' ')[0],
                          EVENT_CONFIG[event.type].color.split(' ')[1]
                        )}>
                          <EventIcon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[var(--color-fg-primary)]">
                                {event.userName}
                              </p>
                              <p className="text-xs text-[var(--color-fg-muted)]">
                                {event.userEmail}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--color-fg-muted)]">
                              <Clock className="h-3 w-3" />
                              {event.timestamp.toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                              EVENT_CONFIG[event.type].color
                            )}>
                              <EventIcon className="h-3 w-3" />
                              {EVENT_CONFIG[event.type].label}
                            </span>
                            <span className="text-xs text-[var(--color-fg-muted)]">
                              {event.department} • {event.role}
                            </span>
                            <span className="text-xs text-[var(--color-fg-muted)]">
                              {event.region}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Show more indicator */}
                {filteredEvents.length > 100 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-[var(--color-fg-muted)]">
                      Mostrando 100 de {filteredEvents.length} eventos
                    </p>
                  </div>
                )}

                {/* Empty state */}
                {filteredEvents.length === 0 && (
                  <div className="py-12 text-center">
                    <Zap className="mx-auto h-12 w-12 text-[var(--color-noir-600)]" />
                    <p className="mt-2 text-[var(--color-fg-muted)]">
                      Nenhum evento encontrado com os filtros aplicados
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}