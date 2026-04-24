import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  QrCode,
  Activity,
  Users,
  Clock,
  TrendingUp,
  MoreVertical,
  ExternalLink,
  Download,
  Pause,
  Play,
  AlertCircle,
  Smartphone,
  Monitor,
  Tablet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import { MetricCard } from '@/components/data-viz/MetricCard';
import { QRCodeGenerator } from '@/components/quishing/QRCodeGenerator';
import { FlyerTemplates } from '@/components/quishing/FlyerTemplates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface QuishingCampaign {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  scan_count: number;
  unique_scans: number;
  target_count: number;
  started_at: string | null;
  scheduled_at: string | null;
  created_at: string;
}

interface QuishingQRCode {
  id: string;
  name: string | null;
  tracking_id: string;
  url_shortcode: string;
  foreground_color: string;
  background_color: string;
  logo_url: string | null;
  scan_count: number;
  unique_scans: number;
  created_at: string;
}

interface ScanEvent {
  scan_hour: number;
  count: number;
}

interface HeatmapCell {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  count: number;
}

interface DeviceStats {
  mobile: number;
  desktop: number;
  tablet: number;
}

interface QRPerformance {
  id: string;
  name: string;
  totalScans: number;
  uniqueScans: number;
  avgTimeToScan: number; // in seconds
  createdAt: string;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
  scheduled: { label: 'Agendado', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  active: { label: 'Ativo', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  paused: { label: 'Pausado', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  completed: { label: 'Concluído', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
};

function generateMockHeatmapData(): HeatmapCell[] {
  const data: HeatmapCell[] = [];
  // Peak hours: 9-12 and 14-17 on weekdays
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      let count = Math.floor(Math.random() * 15);
      // Weekend reduction
      if (day === 0 || day === 6) {
        count = Math.floor(count * 0.3);
      } else {
        // Weekday peaks
        if ((hour >= 9 && hour <= 12) || (hour >= 14 && hour <= 17)) {
          count = Math.floor(Math.random() * 45) + 25;
        } else if (hour >= 7 && hour <= 19) {
          count = Math.floor(Math.random() * 25) + 10;
        }
      }
      data.push({ day, hour, count });
    }
  }
  return data;
}

function getHeatmapColor(count: number, max: number): string {
  const intensity = max > 0 ? count / max : 0;
  if (intensity === 0) return 'var(--color-surface-2)';
  if (intensity < 0.2) return 'rgba(245, 158, 11, 0.15)';
  if (intensity < 0.4) return 'rgba(245, 158, 11, 0.3)';
  if (intensity < 0.6) return 'rgba(245, 158, 11, 0.5)';
  if (intensity < 0.8) return 'rgba(245, 158, 11, 0.7)';
  return 'rgba(245, 158, 11, 0.95)';
}

function generateMockDeviceStats(): DeviceStats {
  // Realistic distribution: mobile dominant
  const mobile = Math.floor(Math.random() * 30) + 55; // 55-85%
  const desktop = Math.floor(Math.random() * 20) + 10; // 10-30%
  const tablet = 100 - mobile - desktop;
  return { mobile, desktop, tablet };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

export default function QuishingDashboardPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<QuishingCampaign | null>(null);
  const [qrcodes, setQrcodes] = useState<QuishingQRCode[]>([]);
  const [heatmapData, setHeatmapData] = useState<ScanEvent[]>([]);
  const [heatmap7x24, setHeatmap7x24] = useState<HeatmapCell[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({ mobile: 0, desktop: 0, tablet: 0 });
  const [qrPerformance, setQrPerformance] = useState<QRPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedQR, setExpandedQR] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<'totalScans' | 'uniqueScans' | 'avgTimeToScan'>('totalScans');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shouldReduceMotion = useReducedMotion();

  // Load campaign data
  useEffect(() => {
    async function loadData() {
      if (!campaignId) return;

      try {
        // Load campaign
        const { data: campaignData } = await supabase
          .from('quishing_campaigns')
          .select('*')
          .eq('id', campaignId)
          .single();

        if (campaignData) {
          setCampaign(campaignData);
        }

        // Load QR codes
        const { data: qrData } = await supabase
          .from('quishing_qrcodes')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at');

        if (qrData) {
          setQrcodes(qrData);
        }

        // Load scan events for heatmap
        const { data: eventsData } = await supabase
          .from('quishing_scan_events')
          .select('scan_hour, count')
          .eq('campaign_id', campaignId);

        if (eventsData && eventsData.length > 0) {
          setHeatmapData(eventsData);
        } else {
          setHeatmapData(generateMockHeatmapData());
        }

        // Load 7x24 heatmap data
        setHeatmap7x24(generateMockHeatmapData());
        setDeviceStats(generateMockDeviceStats());
      } catch (err) {
        console.error('Error loading data:', err);
        // Load mock data for demo
        setCampaign({
          id: campaignId,
          name: 'Black Friday QR Campaign',
          description: 'Simulação de quishing para Black Friday',
          status: 'active',
          scan_count: 847,
          unique_scans: 623,
          target_count: 1000,
          started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          scheduled_at: null,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

        setQrcodes([
          {
            id: 'qr-1',
            name: 'QR Principal',
            tracking_id: campaignId || 'demo',
            url_shortcode: campaignId || 'demo',
            foreground_color: '#1a1a2e',
            background_color: '#ffffff',
            logo_url: null,
            scan_count: 523,
            unique_scans: 412,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'qr-2',
            name: 'QR Secundário',
            tracking_id: 'sec-' + (campaignId || 'demo'),
            url_shortcode: 'sec-' + (campaignId || 'demo'),
            foreground_color: '#1a1a2e',
            background_color: '#ffffff',
            logo_url: null,
            scan_count: 324,
            unique_scans: 211,
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);

        setHeatmapData(generateMockHeatmapData());
        setHeatmap7x24(generateMockHeatmapData());
        setDeviceStats(generateMockDeviceStats());
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [campaignId]);

  // Generate performance data from qrcodes
  useEffect(() => {
    if (qrcodes.length > 0) {
      const performance: QRPerformance[] = qrcodes.map((qr, index) => ({
        id: qr.id,
        name: qr.name || `QR Code ${index + 1}`,
        totalScans: qr.scan_count,
        uniqueScans: qr.unique_scans,
        avgTimeToScan: Math.floor(Math.random() * 120) + 15, // 15-135 seconds
        createdAt: qr.created_at,
      }));
      setQrPerformance(performance);
    }
  }, [qrcodes]);

  const statusInfo = campaign ? STATUS_CONFIG[campaign.status] : STATUS_CONFIG.draft;
  const maxHeatmapCount = heatmapData.reduce((max, h) => Math.max(max, h.count), 0);
  const maxHeatmap7x24 = useMemo(
    () => heatmap7x24.reduce((max, cell) => Math.max(max, cell.count), 0),
    [heatmap7x24]
  );

  // Sorting for QR Performance Table
  const sortedQRPerformance = useMemo(() => {
    return [...qrPerformance].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [qrPerformance, sortColumn, sortDirection]);

  const toggleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Calculate stats
  const scansToday = heatmapData
    .filter(h => {
      const hour = new Date().getHours();
      return h.scan_hour === hour;
    })
    .reduce((sum, h) => sum + h.count, 0) || Math.floor(Math.random() * 50) + 10;

  const peakHour = heatmapData.reduce(
    (peak, h) => (h.count > peak.count ? h : peak),
    { scan_hour: 0, count: 0 }
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <AlertCircle className="h-12 w-12 text-[var(--color-fg-tertiary)]" />
        <p className="text-lg text-[var(--color-fg-secondary)]">Campanha não encontrada</p>
        <Button variant="secondary" onClick={() => navigate('/app/campanhas/quishing')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para campanhas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/campanhas/quishing')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                {campaign.name}
              </h1>
              <Badge className={cn(statusInfo.bgColor, statusInfo.color)}>
                {statusInfo.label}
              </Badge>
            </div>
            {campaign.description && (
              <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                {campaign.description}
              </p>
            )}
            <p className="mt-1 text-xs text-[var(--color-fg-tertiary)]">
              Criado em {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {/* pause/resume */}}>
              {campaign.status === 'paused' ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Retomar
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Exportar relatório
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total de Scans"
          value={campaign.scan_count.toLocaleString('pt-BR')}
          icon={<Activity className="h-5 w-5" />}
          delta={{ value: '+12%', trend: 'positive' }}
        />
        <MetricCard
          label="Scans Únicos"
          value={campaign.unique_scans.toLocaleString('pt-BR')}
          icon={<Users className="h-5 w-5" />}
          delta={{ value: '+8%', trend: 'positive' }}
        />
        <MetricCard
          label="Scans Hoje"
          value={scansToday}
          icon={<Clock className="h-5 w-5" />}
          delta={{ value: '↑', trend: 'positive' }}
        />
        <MetricCard
          label="Hora Pico"
          value={`${peakHour.scan_hour}:00`}
          icon={<TrendingUp className="h-5 w-5" />}
          delta={{ value: `${peakHour.count} scans`, trend: 'neutral' }}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="heatmap">Mapa de Calor</TabsTrigger>
          <TabsTrigger value="qrcodes">QR Codes</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* 7x24 Scan Heatmap */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mapa de Calor - Scans por Dia e Hora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-[var(--color-fg-secondary)]">
                  Distribuição de scans ao longo da semana
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--color-fg-tertiary)]">
                  <span>Mín</span>
                  <div className="flex h-4 gap-0.5">
                    {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
                      <div
                        key={intensity}
                        className="h-full w-4 rounded-sm"
                        style={{ backgroundColor: intensity === 0 ? 'var(--color-surface-2)' : `rgba(245, 158, 11, ${intensity})` }}
                      />
                    ))}
                  </div>
                  <span>Máx</span>
                </div>
              </div>

              {/* Heatmap grid: 24 columns (hours) x 7 rows (days) */}
              <div className="overflow-x-auto">
                <div className="inline-flex flex-col gap-1">
                  {/* Hour labels row */}
                  <div className="flex gap-1 pl-10">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="w-6 text-center text-[10px] text-[var(--color-fg-muted)]"
                      >
                        {hour % 6 === 0 ? `${hour}` : ''}
                      </div>
                    ))}
                  </div>

                  {/* Day rows */}
                  {DAYS_OF_WEEK.map((dayLabel, dayIndex) => (
                    <div key={dayLabel} className="flex items-center gap-1">
                      {/* Day label */}
                      <div className="w-8 text-xs text-[var(--color-fg-muted)] text-right pr-2">
                        {dayLabel}
                      </div>
                      {/* Hour cells */}
                      {HOURS.map((hour) => {
                        const cell = heatmap7x24.find(c => c.day === dayIndex && c.hour === hour);
                        const count = cell?.count || 0;
                        return (
                          <motion.div
                            key={`${dayIndex}-${hour}`}
                            className="h-6 w-6 rounded-sm transition-all hover:ring-1 hover:ring-[var(--color-accent)] cursor-pointer"
                            style={{ backgroundColor: getHeatmapColor(count, maxHeatmap7x24) }}
                            whileHover={shouldReduceMotion ? {} : { scale: 1.2 }}
                            title={`${dayLabel} ${hour}:00 - ${count} scans`}
                          >
                            {count > 0 && maxHeatmap7x24 > 0 && count / maxHeatmap7x24 > 0.7 && (
                              <span className="flex h-full items-center justify-center text-[8px] text-white">
                                {count}
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Breakdown + QR Performance Table */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Device Breakdown Pie Chart */}
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dispositivos</CardTitle>
              </CardHeader>
              <CardContent>
                {/* SVG Pie Chart using conic-gradient */}
                <div className="relative flex h-40 w-40 flex-col items-center">
                  <div
                    className="h-40 w-40"
                    style={{
                      background: `conic-gradient(
                        var(--color-accent) 0% ${deviceStats.mobile}%,
                        var(--color-blue-500) ${deviceStats.mobile}% ${deviceStats.mobile + deviceStats.desktop}%,
                        var(--color-purple-500) ${deviceStats.mobile + deviceStats.desktop}% 100%
                      )`,
                      borderRadius: '50%',
                      mask: 'radial-gradient(transparent 55%, black 55%)',
                      WebkitMask: 'radial-gradient(transparent 55%, black 55%)',
                    }}
                  />
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                      {campaign.scan_count.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs text-[var(--color-fg-muted)]">total scans</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-6 space-y-3">
                  {/* Mobile */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-[var(--color-accent)]" />
                      <span className="text-sm text-[var(--color-fg-secondary)]">Mobile</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[var(--color-fg-primary)]">
                        {deviceStats.mobile}%
                      </span>
                      <div
                        className="h-2 w-12 rounded-full bg-[var(--color-accent)]"
                        style={{ width: `${deviceStats.mobile}%`, maxWidth: '3rem' }}
                      />
                    </div>
                  </div>
                  {/* Desktop */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-[var(--color-blue-500)]" />
                      <span className="text-sm text-[var(--color-fg-secondary)]">Desktop</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[var(--color-fg-primary)]">
                        {deviceStats.desktop}%
                      </span>
                      <div
                        className="h-2 w-12 rounded-full bg-[var(--color-blue-500)]"
                        style={{ width: `${deviceStats.desktop}%`, maxWidth: '3rem' }}
                      />
                    </div>
                  </div>
                  {/* Tablet */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tablet className="h-4 w-4 text-[var(--color-purple-500)]" />
                      <span className="text-sm text-[var(--color-fg-secondary)]">Tablet</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[var(--color-fg-primary)]">
                        {deviceStats.tablet}%
                      </span>
                      <div
                        className="h-2 w-12 rounded-full bg-[var(--color-purple-500)]"
                        style={{ width: `${deviceStats.tablet}%`, maxWidth: '3rem' }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Performance Table */}
            <div className="lg:col-span-2">
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Desempenho por QR Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-noir-700)]">
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
                            QR Code
                          </th>
                          <th
                            className="cursor-pointer pb-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]"
                            onClick={() => toggleSort('totalScans')}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Total Scans
                              {sortColumn === 'totalScans' && (
                                sortDirection === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                              )}
                            </div>
                          </th>
                          <th
                            className="cursor-pointer pb-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]"
                            onClick={() => toggleSort('uniqueScans')}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Únicos
                              {sortColumn === 'uniqueScans' && (
                                sortDirection === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                              )}
                            </div>
                          </th>
                          <th
                            className="cursor-pointer pb-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]"
                            onClick={() => toggleSort('avgTimeToScan')}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Tempo Médio
                              {sortColumn === 'avgTimeToScan' && (
                                sortDirection === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                              )}
                            </div>
                          </th>
                          <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
                            Criado em
                          </th>
                          <th className="pb-3 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedQRPerformance.map((qr, index) => (
                          <motion.tr
                            key={qr.id}
                            className="border-b border-[var(--color-noir-800)] transition-colors hover:bg-[var(--color-surface-2)]"
                            initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={shouldReduceMotion ? {} : { duration: 0.3, delay: index * 0.05 }}
                          >
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded bg-white">
                                  <QrCode className="h-4 w-4 text-gray-800" />
                                </div>
                                <span className="font-medium text-[var(--color-fg-primary)]">{qr.name}</span>
                              </div>
                            </td>
                            <td className="py-3 text-right font-mono text-[var(--color-fg-primary)]">
                              {qr.totalScans.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-3 text-right font-mono text-[var(--color-fg-secondary)]">
                              {qr.uniqueScans.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-3 text-right font-mono text-[var(--color-accent)]">
                              {formatDuration(qr.avgTimeToScan)}
                            </td>
                            <td className="py-3 text-right text-xs text-[var(--color-fg-muted)]">
                              {new Date(qr.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 text-center">
                              <button
                                className="rounded p-1 transition-colors hover:bg-[var(--color-surface-3)]"
                                onClick={() => setExpandedQR(expandedQR === qr.id ? null : qr.id)}
                              >
                                {expandedQR === qr.id ? (
                                  <ChevronUp className="h-4 w-4 text-[var(--color-fg-muted)]" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-[var(--color-fg-muted)]" />
                                )}
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Expanded row details */}
                  <AnimatePresence>
                    {expandedQR && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                          <h4 className="mb-3 text-sm font-semibold text-[var(--color-fg-primary)]">
                            Detalhes - {qrPerformance.find(q => q.id === expandedQR)?.name}
                          </h4>
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div>
                              <p className="text-xs text-[var(--color-fg-muted)]">Total Scans</p>
                              <p className="font-display text-lg font-bold text-[var(--color-fg-primary)]">
                                {qrPerformance.find(q => q.id === expandedQR)?.totalScans.toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-[var(--color-fg-muted)]">Scans Únicos</p>
                              <p className="font-display text-lg font-bold text-[var(--color-fg-primary)]">
                                {qrPerformance.find(q => q.id === expandedQR)?.uniqueScans.toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-[var(--color-fg-muted)]">Tempo Médio</p>
                              <p className="font-display text-lg font-bold text-[var(--color-accent)]">
                                {formatDuration(qrPerformance.find(q => q.id === expandedQR)?.avgTimeToScan || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-[var(--color-fg-muted)]">Taxa Única</p>
                              <p className="font-display text-lg font-bold text-[var(--color-fg-primary)]">
                                {qrPerformance.find(q => q.id === expandedQR)
                                  ? Math.round((qrPerformance.find(q => q.id === expandedQR)!.uniqueScans / qrPerformance.find(q => q.id === expandedQR)!.totalScans) * 100)
                                  : 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {sortedQRPerformance.length === 0 && (
                    <div className="py-8 text-center text-sm text-[var(--color-fg-muted)]">
                      Nenhum QR code encontrado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="heatmap" className="mt-4">
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mapa de Calor - Scans por Hora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-[var(--color-fg-secondary)]">
                  Distribuição de scans ao longo das últimas 24 horas
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--color-fg-tertiary)]">
                  <span>Mínimo</span>
                  <div className="flex h-4 gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-full w-4 rounded-sm"
                        style={{
                          backgroundColor: `rgba(245, 158, 11, ${(i + 1) * 0.2})`,
                        }}
                      />
                    ))}
                  </div>
                  <span>Máximo</span>
                </div>
              </div>

              <div className="grid grid-cols-24 gap-1">
                {heatmapData.map((hour) => {
                  const intensity = maxHeatmapCount > 0 ? hour.count / maxHeatmapCount : 0;
                  return (
                    <div key={hour.scan_hour} className="flex flex-col items-center">
                      <div
                        className="flex h-12 w-full items-end justify-center rounded-t-sm transition-all hover:opacity-80"
                        style={{
                          backgroundColor: getHeatmapColor(hour.count, maxHeatmapCount),
                          height: `${Math.max(10, intensity * 100)}%`,
                        }}
                        title={`${hour.scan_hour}:00 - ${hour.count} scans`}
                      >
                        {intensity > 0.5 && (
                          <span className="text-[8px] text-white">{hour.count}</span>
                        )}
                      </div>
                      <span className="mt-1 text-[8px] text-[var(--color-fg-muted)]">
                        {hour.scan_hour}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Horário com mais scans</p>
                  <p className="font-display text-lg font-bold text-[var(--color-accent)]">
                    {peakHour.scan_hour}:00 - {peakHour.count} scans
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Média por hora</p>
                  <p className="font-display text-lg font-bold text-[var(--color-fg-primary)]">
                    {Math.round(heatmapData.reduce((s, h) => s + h.count, 0) / 24)} scans
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Total de scans</p>
                  <p className="font-display text-lg font-bold text-[var(--color-fg-primary)]">
                    {campaign.scan_count.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qrcodes" className="mt-4 space-y-6">
          {qrcodes.map((qr) => (
            <Card key={qr.id} className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{qr.name || 'QR Code'}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="flex flex-col items-center">
                    <QRCodeGenerator
                      url={baseUrl}
                      trackingId={qr.tracking_id}
                      settings={{
                        foregroundColor: qr.foreground_color,
                        backgroundColor: qr.background_color,
                        size: 200,
                        logoUrl: qr.logo_url,
                        margin: 2,
                      }}
                      showControls={false}
                    />
                    <div className="mt-4 text-center">
                      <p className="text-xs text-[var(--color-fg-tertiary)]">URL de rastreamento</p>
                      <code className="block rounded bg-[var(--color-surface-2)] px-3 py-1 text-sm text-[var(--color-accent)]">
                        {baseUrl}/qr/{qr.tracking_id}
                      </code>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
                        <p className="text-xs text-[var(--color-fg-tertiary)]">Total Scans</p>
                        <p className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                          {qr.scan_count}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3">
                        <p className="text-xs text-[var(--color-fg-tertiary)]">Scans Únicos</p>
                        <p className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                          {qr.unique_scans}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-[var(--color-fg-tertiary)]">Criado em</p>
                      <p className="text-sm text-[var(--color-fg-primary)]">
                        {new Date(qr.created_at).toLocaleDateString('pt-BR', {
                          dateStyle: 'full',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-[var(--color-fg-tertiary)]">Tracking ID</p>
                      <p className="font-mono text-sm text-[var(--color-fg-primary)]">{qr.tracking_id}</p>
                    </div>

                    <Button variant="secondary" size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar QR Code
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-6">
              <FlyerTemplates
                trackingId={qrcodes[0]?.tracking_id || 'demo'}
                qrSettings={{
                  foregroundColor: qrcodes[0]?.foreground_color || '#1a1a2e',
                  backgroundColor: qrcodes[0]?.background_color || '#ffffff',
                  size: 300,
                  logoUrl: qrcodes[0]?.logo_url || null,
                  margin: 2,
                }}
                campaignName={campaign.name}
                baseUrl={baseUrl}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}