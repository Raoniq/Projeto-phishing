// routes/app/Configuracoes.tsx — Settings page with tabs
import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { PermissionMatrix } from '@/components/rbac/PermissionMatrix';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Settings, Shield, Bell, Globe, Users, FileText, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ConfiguracoesPage() {
  const location = useLocation();
  const { company } = useAuth();
  const [companyData, setCompanyData] = useState({ name: '', domain: '' });
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'domains' | 'admins' | 'audit' | 'permissions'>('general');

  // Fetch real company data
  useEffect(() => {
    if (company) {
      setCompanyData({
        name: company.name || '',
        domain: company.domain || '',
      });
    }
  }, [company]);

  // Determine active tab from URL
  const currentPath = location.pathname;
  if (currentPath.includes('/admins') && activeTab !== 'admins') setActiveTab('admins');
  if (currentPath.includes('/audit-log') && activeTab !== 'audit') setActiveTab('audit');

  const tabs = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'admins', label: 'Administradores', icon: Users },
    { id: 'audit', label: 'Log de Auditoria', icon: FileText },
    { id: 'permissions', label: 'Permissões', icon: Shield },
    { id: 'security', label: 'Segurança', icon: Lock },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'domains', label: 'Domínios', icon: Globe },
  ] as const;

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-[var(--color-noir-700)] bg-[var(--color-surface-1)]"
      >
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-fg-primary)]">
                Configurações
              </h1>
              <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                Gerencie as configurações da sua conta e plataforma
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 flex gap-2 overflow-x-auto border-b border-[var(--color-noir-700)] pb-0"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.id === 'general' || tab.id === 'security' || tab.id === 'notifications' || tab.id === 'permissions' ? '/app/configuracoes' : `/app/configuracoes/${tab.id === 'audit' ? 'audit-log' : tab.id === 'domains' ? 'dominios' : tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)] hover:border-[var(--color-noir-600)]'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {activeTab === 'permissions' && <PermissionMatrix />}

          {activeTab === 'general' && (
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-[var(--color-fg-primary)] mb-4">Perfil da empresa</h2>
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5 block">
                      Nome da empresa
                    </label>
                    <input
                      type="text"
                      defaultValue={companyData.name}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-4 py-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5 block">
                      Domínio de email
                    </label>
                    <input
                      type="text"
                      defaultValue={companyData.domain}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-4 py-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--color-accent)]/10">
                    <Lock className="h-6 w-6 text-[var(--color-accent)]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-[var(--color-fg-primary)]">Autenticação em dois fatores</h2>
                    <p className="mt-2 text-sm text-[var(--color-fg-secondary)] max-w-md">
                      Adicione uma camada extra de segurança à sua conta
                    </p>
                    <Button variant="primary" size="sm" className="mt-4">
                      Ativar 2FA
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-[var(--color-fg-primary)] mb-4">Preferências de email</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Relatórios semanais', desc: 'Receba um resumo semanal do desempenho' },
                    { label: 'Alertas de campanha', desc: 'Notificações quando campanhas terminam' },
                    { label: 'Dicas de segurança', desc: 'Conteúdo educativo mensal' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[var(--color-fg-primary)]">{item.label}</p>
                        <p className="text-sm text-[var(--color-fg-secondary)] max-w-lg">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-5 w-5 rounded border-[var(--color-noir-600)] bg-[var(--color-surface-2)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-surface-0)]"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'domains' && (
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/10">
                    <Globe className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-[var(--color-fg-primary)]">Pool de Domínios de Isca</h2>
                    <p className="mt-2 text-sm text-[var(--color-fg-secondary)] max-w-md">
                      Gerencie os domínios usados para simulações de phishing
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] p-4">
                        <div>
                          <p className="font-medium text-[var(--color-fg-primary)]">Domínios ativos</p>
                          <p className="text-sm text-[var(--color-fg-tertiary)]">20 domínios no pool</p>
                        </div>
                        <span className="text-2xl font-bold text-green-400">20</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] p-4">
                        <div>
                          <p className="font-medium text-[var(--color-fg-primary)]">Reputação média</p>
                          <p className="text-sm text-[var(--color-fg-tertiary)]">Saúde geral do pool</p>
                        </div>
                        <span className="text-2xl font-bold text-amber-400">78%</span>
                      </div>
                    </div>
                    <Link
                      to="/app/configuracoes/dominios"
                      className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-surface-0)] hover:bg-[var(--color-accent)]/90 transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      Gerenciar Domínios
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(activeTab === 'admins' || activeTab === 'audit') && <Outlet />}
        </motion.div>

        {/* Save Button */}
        {(activeTab === 'general' || activeTab === 'security' || activeTab === 'notifications') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex justify-end"
          >
            <Button variant="primary">
              Salvar alterações
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
