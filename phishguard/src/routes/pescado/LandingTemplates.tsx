import { useState } from 'react';

const templates = [
  {
    id: '1',
    name: 'Black Friday Promo',
    category: 'E-commerce',
    preview: '🎉 Black Friday chegou! Ganhe 50% OFF em todos os produtos...',
    clicks: 234,
    reported: 3,
  },
  {
    id: '2',
    name: 'QR Code Package',
    category: 'Logística',
    preview: '📦 Seu pacote está parado! Confirme seus dados para...',
    clicks: 189,
    reported: 5,
  },
  {
    id: '3',
    name: 'Banking Alert',
    category: 'Financeiro',
    preview: '⚠️ Atividade suspeita detectada em sua conta. Clique...',
    clicks: 456,
    reported: 12,
  },
  {
    id: '4',
    name: 'IT Support Reset',
    category: 'TI',
    preview: '🔐 Sua senha expira em 24h. Reset agora para evitar...',
    clicks: 312,
    reported: 8,
  },
  {
    id: '5',
    name: 'HR Policy Update',
    category: 'RH',
    preview: '📋 Atualização de política corporativa. Leia e assine...',
    clicks: 145,
    reported: 2,
  },
];

export default function LandingTemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(templates.map((t) => t.category))];

  const filteredTemplates = selectedCategory
    ? templates.filter((t) => t.category === selectedCategory)
    : templates;

  return (
    <div className="min-h-screen bg-noir-950 text-white p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-display font-bold">Templates de Landing Pages</h1>
        <p className="mt-4 text-noir-400">
          Modelos prontos para suas campanhas de phishing simulado
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-amber-500 text-noir-950'
                : 'bg-noir-800 text-noir-300 hover:bg-noir-700'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-noir-950'
                  : 'bg-noir-800 text-noir-300 hover:bg-noir-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group rounded-xl border border-noir-700 bg-noir-900 overflow-hidden hover:border-amber-500/50 transition-colors cursor-pointer"
            >
              <div className="h-32 bg-gradient-to-br from-noir-800 to-noir-900 flex items-center justify-center p-4">
                <p className="text-sm text-center text-noir-300 line-clamp-2">
                  {template.preview}
                </p>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold group-hover:text-amber-500 transition-colors">
                    {template.name}
                  </h3>
                  <span className="text-xs text-noir-500">{template.category}</span>
                </div>
                <div className="mt-4 flex gap-4 text-sm text-noir-400">
                  <span>{template.clicks} cliques</span>
                  <span className="text-red-400">{template.reported} reportados</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
