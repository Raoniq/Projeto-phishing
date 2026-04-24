import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'learner';
  status: 'active' | 'inactive';
  lastActivity: string;
}

export default function UsuariosPage() {
  const [search, setSearch] = useState('');

  const users: User[] = [
    {
      id: '1',
      name: 'Ana Silva',
      email: 'ana.silva@empresa.com',
      role: 'admin',
      status: 'active',
      lastActivity: '2026-04-21',
    },
    {
      id: '2',
      name: 'Carlos Santos',
      email: 'carlos.santos@empresa.com',
      role: 'manager',
      status: 'active',
      lastActivity: '2026-04-20',
    },
    {
      id: '3',
      name: 'Maria Oliveira',
      email: 'maria.oliveira@empresa.com',
      role: 'learner',
      status: 'active',
      lastActivity: '2026-04-19',
    },
    {
      id: '4',
      name: 'João Costa',
      email: 'joao.costa@empresa.com',
      role: 'learner',
      status: 'inactive',
      lastActivity: '2026-04-10',
    },
  ];

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)] p-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
              Usuários
            </h1>
            <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
              Gerencie usuários e permissões
            </p>
          </div>
          <Button variant="primary" size="sm">
            + Convidar usuário
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <input
            type="search"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] px-4 py-2 text-sm text-[var(--color-fg-primary)] placeholder-[var(--color-fg-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-[var(--color-noir-800)] overflow-hidden"
        >
          <table className="w-full">
            <thead className="bg-[var(--color-surface-2)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-secondary)] uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-secondary)] uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-secondary)] uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-secondary)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-fg-secondary)] uppercase tracking-wider">
                  Última atividade
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-noir-800)]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-[var(--color-fg-secondary)]">
                      <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-sm font-medium text-[var(--color-fg-primary)]">
                        {search ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                      </p>
                      <p className="text-xs mt-1 text-[var(--color-fg-muted)]">
                        {search ? 'Tente buscar por outro termo' : 'Convidе um usuário para começar'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.03 }}
                    className="hover:bg-[var(--color-surface-2)]/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-[var(--color-fg-primary)]">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-fg-secondary)]">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-400'
                            : user.role === 'manager'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-[var(--color-surface-3)] text-[var(--color-fg-secondary)]'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-fg-secondary)]">
                      {user.lastActivity}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}