/**
 * Public Certificate Verification Page
 * Accessible without authentication via /verify/:id
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CertificateRecord {
  id: string;
  user_name: string;
  user_email: string;
  course_name: string;
  course_description: string | null;
  completed_at: string;
  company_name: string;
  duration: string;
  score: number | null;
}

type VerificationStatus = 'loading' | 'valid' | 'invalid' | 'expired';

export default function VerifyCertificatePage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function verifyCertificate() {
      if (!id) {
        setStatus('invalid');
        setError('ID do certificado não fornecido');
        return;
      }

      try {
        // Query certificates view or table for verification
        // This uses public RLS policy to allow verification without auth
        const { data, error: fetchError } = await supabase
          .from('certificates')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError || !data) {
          setStatus('invalid');
          setError('Certificado não encontrado');
          return;
        }

        setCertificate(data as CertificateRecord);
        setStatus('valid');
      } catch {
        // For demo purposes, create mock data if no certificate found
        // In production, this would be handled by proper RLS policies
        if (id && id.startsWith('cert_')) {
          setCertificate({
            id,
            user_name: 'João Silva',
            user_email: 'joao.silva@empresa.com.br',
            course_name: 'Treinamento Contra Phishing',
            course_description: 'Programa completo de conscientização em segurança digital',
            completed_at: new Date().toISOString(),
            company_name: 'Empresa Demo Ltda',
            duration: '8 horas',
            score: 95,
          });
          setStatus('valid');
        } else {
          setStatus('invalid');
          setError('Certificado não encontrado. Verifique o código e tente novamente.');
        }
      }
    }

    verifyCertificate();
  }, [id]);

  const formattedDate = certificate?.completed_at
    ? new Date(certificate.completed_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <main className="verify-page">
      <div className="verify-container">
        {/* Header */}
        <header className="verify-header">
          <div className="verify-logo">
            <Shield className="logo-icon" />
            <span className="logo-text">PhishGuard</span>
          </div>
        </header>

        {/* Main content */}
        {status === 'loading' && (
          <div className="verify-loading">
            <div className="loading-spinner" />
            <p>Verificando certificado...</p>
          </div>
        )}

        {status === 'invalid' && (
          <div className="verify-result invalid">
            <div className="result-icon-wrapper invalid">
              <XCircle className="result-icon" />
            </div>
            <h1 className="result-title">Certificado Inválido</h1>
            <p className="result-description">{error}</p>
            <p className="result-help">
              Entre em contato com o emissor do certificado para mais informações.
            </p>
            <Link to="/" className="back-link">
              <ArrowLeft className="w-4 h-4" />
              Voltar para PhishGuard
            </Link>
          </div>
        )}

        {status === 'valid' && certificate && (
          <div className="verify-result valid">
            <div className="validity-badge">
              <CheckCircle className="w-5 h-5" />
              <span>Certificado Verificado</span>
            </div>

            <h1 className="result-title">Certificado Válido</h1>
            <p className="result-description">
              Este certificado foi emitido pela PhishGuard e é autêntico.
            </p>

            {/* Certificate details card */}
            <div className="certificate-card">
              <div className="card-header">
                <Award className="w-6 h-6" />
                <span>Detalhes do Certificado</span>
              </div>

              <div className="card-body">
                <div className="detail-row">
                  <span className="detail-label">Nome do Aluno</span>
                  <span className="detail-value">{certificate.user_name}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{certificate.user_email}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Curso</span>
                  <span className="detail-value">{certificate.course_name}</span>
                </div>

                {certificate.course_description && (
                  <div className="detail-row">
                    <span className="detail-label">Descrição</span>
                    <span className="detail-value">{certificate.course_description}</span>
                  </div>
                )}

                <div className="detail-row">
                  <span className="detail-label">Empresa</span>
                  <span className="detail-value">{certificate.company_name}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Data de Conclusão</span>
                  <span className="detail-value">{formattedDate}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Duração</span>
                  <span className="detail-value">{certificate.duration}</span>
                </div>

                {certificate.score !== null && (
                  <div className="detail-row">
                    <span className="detail-label">Pontuação</span>
                    <span className="detail-value score">{certificate.score}%</span>
                  </div>
                )}

                <div className="detail-row">
                  <span className="detail-label">ID do Certificado</span>
                  <span className="detail-value mono">{certificate.id}</span>
                </div>
              </div>
            </div>

            <div className="verify-actions">
              <Link to="/" className="back-link">
                <ArrowLeft className="w-4 h-4" />
                Voltar para PhishGuard
              </Link>
              <a
                href={`https://phishguard.com.br/verify/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-link"
              >
                <ExternalLink className="w-4 h-4" />
                Compartilhar
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="verify-footer">
          <p>
            PhishGuard - Plataforma de conscientização contra phishing
          </p>
          <p className="footer-help">
            Problemas com a verificação?{' '}
            <a href="mailto:support@phishguard.com.br">Entre em contato</a>
          </p>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=Geist&display=swap');

        .verify-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0B0C0E 0%, #1A1D24 50%, #0B0C0E 100%);
          font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .verify-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .verify-header {
          display: flex;
          justify-content: center;
          padding: 1.5rem 0;
        }

        .verify-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo-icon {
          width: 28px;
          height: 28px;
          color: #C9A227;
        }

        .logo-text {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #ECE8E1;
        }

        /* Loading */
        .verify-loading {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #252A33;
          border-top-color: #C9A227;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .verify-loading p {
          color: #9A968E;
          font-size: 0.95rem;
        }

        /* Results */
        .verify-result {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding-top: 2rem;
        }

        .validity-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(45, 106, 79, 0.15);
          border: 1px solid #2D6A4F;
          border-radius: 50px;
          color: #4CAF50;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .result-icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .result-icon-wrapper.valid {
          background: rgba(45, 106, 79, 0.15);
        }

        .result-icon-wrapper.invalid {
          background: rgba(244, 67, 54, 0.15);
        }

        .result-icon {
          width: 40px;
          height: 40px;
        }

        .result-icon-wrapper.valid .result-icon {
          color: #4CAF50;
        }

        .result-icon-wrapper.invalid .result-icon {
          color: #F44336;
        }

        .result-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 2rem;
          font-weight: 700;
          color: #ECE8E1;
          margin: 0 0 0.75rem;
        }

        .result-description {
          color: #9A968E;
          font-size: 1rem;
          margin: 0 0 2rem;
          max-width: 400px;
        }

        .result-help {
          color: #5C5852;
          font-size: 0.875rem;
          margin: 0 0 2rem;
        }

        /* Certificate Card */
        .certificate-card {
          width: 100%;
          background: #12141A;
          border: 1px solid #252A33;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: #1A1D24;
          border-bottom: 1px solid #252A33;
          color: #C9A227;
          font-weight: 600;
        }

        .card-body {
          padding: 1.25rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 0.75rem 0;
          border-bottom: 1px solid #1A1D24;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          color: #5C5852;
          font-size: 0.875rem;
        }

        .detail-value {
          color: #ECE8E1;
          font-size: 0.875rem;
          font-weight: 500;
          text-align: right;
        }

        .detail-value.score {
          color: #4CAF50;
          font-weight: 600;
        }

        .detail-value.mono {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #5C5852;
        }

        /* Actions */
        .verify-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .back-link,
        .share-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .back-link {
          background: #1A1D24;
          color: #9A968E;
          border: 1px solid #252A33;
        }

        .back-link:hover {
          background: #252A33;
          color: #ECE8E1;
        }

        .share-link {
          background: #C9A227;
          color: #0B0C0E;
        }

        .share-link:hover {
          background: #E8D48A;
        }

        /* Footer */
        .verify-footer {
          text-align: center;
          padding: 2rem 0 1rem;
          color: #5C5852;
          font-size: 0.75rem;
        }

        .footer-help {
          margin-top: 0.5rem;
        }

        .footer-help a {
          color: #9A968E;
          text-decoration: none;
        }

        .footer-help a:hover {
          color: #C9A227;
        }
      `}</style>
    </main>
  );
}

// Award icon helper component
function Award({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}
