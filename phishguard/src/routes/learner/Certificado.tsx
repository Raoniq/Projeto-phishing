import { useState } from 'react';
import { CertificateTemplate, type CertificateData } from '@/components/certificate';

export default function CertificadoPage() {
  const [selectedCert, setSelectedCert] = useState<string | null>(null);

  // Mock certificates - in production, fetch from API based on logged user
  const certificados: CertificateData[] = [
    {
      id: 'cert_demo_001',
      userName: 'João Silva',
      userEmail: 'joao.silva@empresa.com.br',
      courseName: 'Treinamento Contra Phishing',
      courseDescription: 'Programa completo de conscientização em segurança digital para colaboradores',
      completedAt: '2026-04-15',
      companyName: 'Empresa Demo Ltda',
      duration: '8 horas',
      score: 95,
    },
    {
      id: 'cert_demo_002',
      userName: 'João Silva',
      userEmail: 'joao.silva@empresa.com.br',
      courseName: 'Phishing: Recognize and Report',
      courseDescription: 'Identificação e reporte de tentativas de phishing',
      completedAt: '2026-03-20',
      companyName: 'Empresa Demo Ltda',
      duration: '4 horas',
      score: 88,
    },
  ];

  const selectedCertificate = certificados.find(c => c.id === selectedCert);

  return (
    <div className="min-h-screen bg-noir-950 text-white py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-display font-bold">Certificados</h1>
        <p className="mt-4 text-noir-400">
          Seus certificados de conclusão de treinamentos
        </p>

        <div className="mt-8 space-y-6">
          {certificados.map((cert) => (
            <div
              key={cert.id}
              className="group relative overflow-hidden rounded-xl border border-noir-700 bg-noir-900 p-8"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full" />
              <div className="relative">
                <span className="text-amber-500 text-sm font-semibold">
                  CERTIFICADO DE CONCLUSÃO
                </span>
                <h2 className="mt-2 text-2xl font-display font-bold">
                  {cert.courseName}
                </h2>
                <div className="mt-6 flex flex-wrap gap-6 text-sm text-noir-400">
                  <div>
                    <span className="block text-xs text-noir-500">Emitido em</span>
                    <span className="font-medium text-white">
                      {new Date(cert.completedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-noir-500">Duração</span>
                    <span className="font-medium text-white">{cert.duration}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-noir-500">Pontuação</span>
                    <span className="font-medium text-white">{cert.score}%</span>
                  </div>
                  <div>
                    <span className="block text-xs text-noir-500">ID da credencial</span>
                    <span className="font-mono text-white">{cert.id}</span>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedCert(cert.id)}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-noir-950 hover:bg-amber-400 transition-colors"
                  >
                    Ver Certificado
                  </button>
                  <a
                    href={`/verify/${cert.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-noir-600 px-4 py-2 text-sm font-medium hover:bg-noir-800 transition-colors"
                  >
                    Verificar Autenticidade
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificate preview modal */}
      {selectedCertificate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedCert(null)}
        >
          <div
            className="max-h-[90vh] overflow-auto rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CertificateTemplate
              data={selectedCertificate}
              showPrintButton={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
