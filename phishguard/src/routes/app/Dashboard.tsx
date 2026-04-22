import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();

  const stats = [
    { label: 'Campanhas ativas', value: '3', change: '+1 este mês' },
    { label: 'Usuários treinados', value: '247', change: '+12 esta semana' },
    { label: 'Taxa de phishing', value: '2.3%', change: '-0.5% vs média' },
    { label: 'Certificados emitidos', value: '89', change: '+5 hoje' },
  ];

  const recentCampaigns = [
    { name: 'Black Friday 2026', status: 'active', sent: 150, opened: 89, clicked: 12 },
    { name: 'Novo template QR Code', status: 'draft', sent: 0, opened: 0, clicked: 0 },
    { name: 'Reminder LGPD', status: 'completed', sent: 200, opened: 180, clicked: 8 },
  ];

  return (
    <div className="text-white p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="mt-2 text-noir-400">
            Visão geral da sua plataforma de treinamento
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-noir-800 bg-noir-900 p-6"
            >
              <p className="text-sm text-noir-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              <p className="mt-1 text-sm text-amber-500">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Campanhas recentes</h2>
            <button
              onClick={() => navigate('/app/campanhas')}
              className="text-sm text-amber-500 hover:underline"
            >
              Ver todas
            </button>
          </div>

          <div className="rounded-xl border border-noir-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-noir-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-noir-400 uppercase">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-noir-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-noir-400 uppercase">
                    Enviados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-noir-400 uppercase">
                    Abertos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-noir-400 uppercase">
                    Cliques
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-noir-800">
                {recentCampaigns.map((campaign) => (
                  <tr key={campaign.name} className="hover:bg-noir-900/50">
                    <td className="px-6 py-4 font-medium">{campaign.name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          campaign.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : campaign.status === 'draft'
                            ? 'bg-noir-600 text-noir-300'
                            : 'bg-noir-700 text-noir-400'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-noir-400">
                      {campaign.sent}
                    </td>
                    <td className="px-6 py-4 text-noir-400">
                      {campaign.opened}
                    </td>
                    <td className="px-6 py-4 text-noir-400">
                      {campaign.clicked}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
