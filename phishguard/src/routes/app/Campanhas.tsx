// routes/app/Campanhas.tsx — Campaigns management page
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, Mail, Eye, MousePointer, Flag, Send, Calendar, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  template: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  sentAt: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    reported: number;
  };
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'Black Friday 2026',
    template: 'E-commerce Promo',
    status: 'active',
    sentAt: '2026-04-20',
    stats: { sent: 150, opened: 89, clicked: 12, reported: 3 },
  },
  {
    id: '2',
    name: 'Novo template QR Code',
    template: 'QR Code Scan',
    status: 'draft',
    sentAt: '-',
    stats: { sent: 0, opened: 0, clicked: 0, reported: 0 },
  },
  {
    id: '3',
    name: 'Reminder LGPD',
    template: 'Política Mandatory',
    status: 'completed',
    sentAt: '2026-04-15',
    stats: { sent: 200, opened: 180, clicked: 8, reported: 1 },
  },
];

const STATUS_CONFIG = {
  active: { label: 'Ativa', color: 'bg-green-500/20 text-green-400', dot: 'bg-green-400' },
  draft: { label: 'Rascunho', color: 'bg-[var(--color-surface-3)] text-[var(--color-fg-secondary)]', dot: 'bg-[var(--color-fg-tertiary)]' },
  scheduled: { label: 'Agendada', color: 'bg-blue-500/20 text-blue-400', dot: 'bg-blue-400' },
  completed: { label: 'Concluída', color: 'bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]', dot: 'bg-[var(--color-fg-muted)]' },
} as const;

export default function CampanhasPage() {
  const campaigns = MOCK_CAMPAIGNS;

  // Stats
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalSent = campaigns.reduce((sum, c) => sum + c.stats.sent, 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + c.stats.clicked, 0);
  const totalReported = campaigns.reduce((sum, c) => sum + c.stats.reported, 0);

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-[var(--color-noir-700)] bg-[var(--color-surface-1)]"
      >
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-fg-primary)]">
                Campanhas
              </h1>
              <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                Gerencie suas campanhas de phishing simulado
              </p>
            </div>
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4" />
              Nova campanha
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10">
                    <Send className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{activeCampaigns}</p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Campanhas ativas</p>
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
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                    <Mail className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{totalSent.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Emails enviados</p>
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
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10">
                    <MousePointer className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{totalClicked}</p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Cliques totais</p>
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
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]/10">
                    <Flag className="h-5 w-5 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{totalReported}</p>
                    <p className="text-xs text-[var(--color-fg-tertiary)]">Reportados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Campaigns Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-surface-2)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Enviados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Abertos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Cliques
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                    Reportados
                  </th>
                  <th className="w-10 px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-noir-700)]">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[var(--color-fg-muted)]">
                        <Mail className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-sm font-medium">Nenhuma campanha encontrada</p>
                        <p className="text-xs mt-1 text-[var(--color-fg-tertiary)]">Crie sua primeira campanha para começar</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign, index) => (
                    <motion.tr
                      key={campaign.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="hover:bg-[var(--color-surface-2)]/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-surface-2)]">
                            <Mail className="h-5 w-5 text-[var(--color-fg-tertiary)]" />
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-fg-primary)]">{campaign.name}</p>
                            <p className="text-xs text-[var(--color-fg-muted)]">{campaign.template}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', STATUS_CONFIG[campaign.status].color)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_CONFIG[campaign.status].dot)} />
                          {STATUS_CONFIG[campaign.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-fg-secondary)]">
                        {campaign.stats.sent > 0 ? campaign.stats.sent.toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-fg-secondary)]">
                        {campaign.stats.sent > 0 ? (
                          <span className="flex items-center gap-1">
                            {campaign.stats.opened}
                            <span className="text-[var(--color-fg-muted)] text-xs">
                              ({((campaign.stats.opened / campaign.stats.sent) * 100).toFixed(0)}%)
                            </span>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-fg-secondary)]">
                        {campaign.stats.sent > 0 ? (
                          <span className="flex items-center gap-1">
                            {campaign.stats.clicked}
                            <span className="text-[var(--color-fg-muted)] text-xs">
                              ({((campaign.stats.clicked / campaign.stats.sent) * 100).toFixed(1)}%)
                            </span>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-fg-secondary)]">
                        {campaign.stats.sent > 0 ? campaign.stats.reported : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <Link to={`/app/campanhas/${campaign.id}`} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Ver detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <MousePointer className="h-4 w-4" />
                              Ver relatório
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
