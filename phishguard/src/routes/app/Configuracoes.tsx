import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PermissionMatrix } from '@/components/rbac/PermissionMatrix';

export default function ConfiguracoesPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'domains' | 'admins' | 'audit' | 'permissions'>('general');

  // Determine active tab from URL
  const currentPath = location.pathname;
  if (currentPath.includes('/admins') && activeTab !== 'admins') setActiveTab('admins');
  if (currentPath.includes('/audit-log') && activeTab !== 'audit') setActiveTab('audit');

  const tabs = [
    { id: 'general', label: 'Geral', path: '/app/configuracoes' },
    { id: 'admins', label: 'Administradores', path: '/app/configuracoes/admins' },
    { id: 'audit', label: 'Log de Auditoria', path: '/app/configuracoes/audit-log' },
    { id: 'permissions', label: 'Permissões', path: '/app/configuracoes' },
    { id: 'security', label: 'Segurança', path: '/app/configuracoes' },
    { id: 'notifications', label: 'Notificações', path: '/app/configuracoes' },
    { id: 'domains', label: 'Domínios', path: '/app/configuracoes/dominios' },
  ] as const;

  return (
    <div className="text-white p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-display font-bold">Configurações</h1>
        <p className="mt-2 text-noir-400">
          Gerencie as configurações da sua conta e plataforma
        </p>

        <div className="mt-8 flex gap-4 border-b border-noir-800 overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.path}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'pb-4 px-2 text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-amber-500 border-b-2 border-amber-500'
                  : 'text-noir-400 hover:text-white'
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="mt-8">
          {activeTab === 'permissions' && (
            <PermissionMatrix />
          )}

          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-noir-800 bg-noir-900 p-6">
                <h2 className="text-lg font-semibold">Perfil da empresa</h2>
                <div className="mt-4 grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-noir-300">
                      Nome da empresa
                    </label>
                    <input
                      type="text"
                      defaultValue="Acme Corp"
                      className="mt-1 block w-full rounded-lg border border-noir-700 bg-noir-800 px-4 py-3 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-noir-300">
                      Domínio de email
                    </label>
                    <input
                      type="text"
                      defaultValue="acme.com"
                      className="mt-1 block w-full rounded-lg border border-noir-700 bg-noir-800 px-4 py-3 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-noir-800 bg-noir-900 p-6">
                <h2 className="text-lg font-semibold">Autenticação em dois fatores</h2>
                <p className="mt-2 text-noir-400 text-sm max-w-xl">
                  Adicione uma camada extra de segurança à sua conta
                </p>
                <button className="mt-4 rounded-lg border border-amber-500 px-4 py-2 text-amber-500 hover:bg-amber-500/10 transition-colors">
                  Ativar 2FA
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-noir-800 bg-noir-900 p-6">
                <h2 className="text-lg font-semibold">Preferências de email</h2>
                <div className="mt-4 space-y-4">
                  {[
                    { label: 'Relatórios semanais', desc: 'Receba um resumo semanal do desempenho' },
                    { label: 'Alertas de campanha', desc: 'Notificações quando campanhas terminam' },
                    { label: 'Dicas de segurança', desc: 'Conteúdo educativo mensal' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-noir-400 max-w-lg">{item.desc}</p>
                      </div>
                      <input type="checkbox" className="h-5 w-5 rounded border-noir-600 bg-noir-800 text-amber-500 focus:ring-amber-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'domains' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-noir-800 bg-noir-900 p-6">
                <h2 className="text-lg font-semibold">Pool de Domínios de Isca</h2>
                <p className="mt-2 text-noir-400 text-sm max-w-xl">
                  Gerencie os domínios usados para simulações de phishing
                </p>
                <div className="mt-4 grid gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-noir-800/50">
                    <div>
                      <p className="font-medium">Domínios ativos</p>
                      <p className="text-sm text-noir-400">20 domínios no pool</p>
                    </div>
                    <span className="text-2xl font-bold text-emerald-400">20</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-noir-800/50">
                    <div>
                      <p className="font-medium">Reputação média</p>
                      <p className="text-sm text-noir-400">Saúde geral do pool</p>
                    </div>
                    <span className="text-2xl font-bold text-amber-400">78%</span>
                  </div>
                </div>
                <Link
                  to="/app/configuracoes/dominios"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-noir-950 hover:bg-amber-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Gerenciar Domínios
                </Link>
              </div>
            </div>
          )}

          {(activeTab === 'admins' || activeTab === 'audit') && (
            <Outlet />
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button className="rounded-lg bg-amber-500 px-6 py-2 font-semibold text-noir-950 hover:bg-amber-400 transition-colors">
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}
