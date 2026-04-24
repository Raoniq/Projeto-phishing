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

export default function CampanhasPage() {
  const campaigns: Campaign[] = [
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

  return (
    <div className="text-white p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Campanhas</h1>
            <p className="mt-2 text-noir-400">
              Gerencie suas campanhas de phishing simulado
            </p>
          </div>
          <button
            className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-noir-950 hover:bg-amber-400 transition-colors"
          >
            + Nova campanha
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
                  Template
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
                <th className="px-6 py-3 text-left text-xs font-medium text-noir-400 uppercase">
                  Reportados
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-noir-800">
              {campaigns.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center justify-center text-noir-400">
                  <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-sm font-medium">Nenhuma campanha encontrada</p>
                  <p className="text-xs mt-1 text-noir-500">Crie sua primeira campanha para começar</p>
                </div>
              </td>
            </tr>
          ) : (
            campaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="hover:bg-noir-900/50 cursor-pointer"
              >
                <td className="px-6 py-4 font-medium">{campaign.name}</td>
                <td className="px-6 py-4 text-noir-400">
                  {campaign.template}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      campaign.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : campaign.status === 'draft'
                        ? 'bg-noir-600 text-noir-300'
                        : campaign.status === 'scheduled'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-noir-700 text-noir-400'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-noir-400">
                  {campaign.stats.sent}
                </td>
                <td className="px-6 py-4 text-noir-400">
                  {campaign.stats.opened}
                </td>
                <td className="px-6 py-4 text-noir-400">
                  {campaign.stats.clicked}
                </td>
                <td className="px-6 py-4 text-noir-400">
                  {campaign.stats.reported}
                </td>
              </tr>
            ))
          )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
