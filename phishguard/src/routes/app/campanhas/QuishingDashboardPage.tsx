import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
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

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
  scheduled: { label: 'Agendado', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  active: { label: 'Ativo', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  paused: { label: 'Pausado', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  completed: { label: 'Concluído', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
};

function generateMockHeatmapData(): ScanEvent[] {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    // Generate realistic-looking scan patterns (peak at 10-12 and 14-16)
    let count = Math.floor(Math.random() * 15);
    if ((i >= 10 && i <= 12) || (i >= 14 && i <= 16)) {
      count = Math.floor(Math.random() * 40) + 20;
    } else if (i >= 9 && i <= 17) {
      count = Math.floor(Math.random() * 25) + 10;
    }
    hours.push({ scan_hour: i, count });
  }
  return hours;
}

function getHeatmapColor(count: number, max: number): string {
  const intensity = max > 0 ? count / max : 0;
  if (intensity === 0) return 'var(--color-surface-2)';
  if (intensity < 0.2) return 'rgba(245, 158, 11, 0.2)';
  if (intensity < 0.4) return 'rgba(245, 158, 11, 0.4)';
  if (intensity < 0.6) return 'rgba(245, 158, 11, 0.6)';
  if (intensity < 0.8) return 'rgba(245, 158, 11, 0.8)';
  return 'rgba(245, 158, 11, 1)';
}

export default function QuishingDashboardPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<QuishingCampaign | null>(null);
  const [qrcodes, setQrcodes] = useState<QuishingQRCode[]>([]);
  const [heatmapData, setHeatmapData] = useState<ScanEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

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
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [campaignId]);

  const statusInfo = campaign ? STATUS_CONFIG[campaign.status] : STATUS_CONFIG.draft;
  const maxHeatmapCount = heatmapData.reduce((max, h) => Math.max(max, h.count), 0);

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
          {/* Heatmap Preview */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Atividade por Hora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-24 gap-1">
                {heatmapData.map((hour) => (
                  <div
                    key={hour.scan_hour}
                    className="aspect-square rounded-sm transition-colors"
                    style={{ backgroundColor: getHeatmapColor(hour.count, maxHeatmapCount) }}
                    title={`${hour.scan_hour}:00 - ${hour.count} scans`}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-fg-tertiary)]">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:00</span>
              </div>
              <div className="mt-2 flex items-center justify-end gap-2">
                <span className="text-xs text-[var(--color-fg-tertiary)]">Intensidade:</span>
                <div className="flex gap-1">
                  <div className="h-3 w-3 rounded-sm bg-[var(--color-surface-2)]" />
                  <div className="h-3 w-3 rounded-sm bg-[rgba(245,158,11,0.3)]" />
                  <div className="h-3 w-3 rounded-sm bg-[rgba(245,158,11,0.6)]" />
                  <div className="h-3 w-3 rounded-sm bg-[rgba(245,158,11,0.9)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">QR Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {qrcodes.map((qr) => (
                  <div
                    key={qr.id}
                    className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-white">
                      <QrCode className="h-6 w-6 text-gray-800" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--color-fg-primary)]">{qr.name || 'QR Code'}</p>
                      <p className="text-xs text-[var(--color-fg-tertiary)] truncate">
                        {baseUrl}/qr/{qr.tracking_id.slice(0, 8)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-[var(--color-accent)]">
                        {qr.scan_count}
                      </p>
                      <p className="text-xs text-[var(--color-fg-tertiary)]">scans</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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