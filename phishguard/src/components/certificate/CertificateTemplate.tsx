/**
 * Premium Certificate Component
 * Print-ready certificate with QR verification
 */
import { useEffect, useRef, useState } from 'react';
import { Printer, Shield, Award, CheckCircle } from 'lucide-react';
import './certificate.css';

export interface CertificateData {
  id: string;
  userName: string;
  userEmail: string;
  courseName: string;
  courseDescription: string;
  completedAt: string;
  companyName: string;
  companyLogo?: string;
  duration: string;
  score?: number;
}

interface CertificateProps {
  data: CertificateData;
  showPrintButton?: boolean;
}

// QR code generation via API (no heavy library needed)
async function generateQRCode(url: string, size: number = 120): Promise<string> {
  // Using qrserver.com API for simple QR generation
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
  return apiUrl;
}

export function CertificateTemplate({ data, showPrintButton = true }: CertificateProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const certificateRef = useRef<HTMLDivElement>(null);

  const verifyUrl = `${window.location.origin}/verify/${data.id}`;

  useEffect(() => {
    generateQRCode(verifyUrl).then(url => {
      setQrCodeUrl(url);
      setLoading(false);
    });
  }, [verifyUrl]);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(data.completedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="certificate-wrapper">
      {/* Control buttons - hidden when printing */}
      {showPrintButton && (
        <div className="certificate-controls no-print">
          <button onClick={handlePrint} className="print-button" data-print-keep>
            <Printer className="w-4 h-4" />
            Imprimir certificado
          </button>
        </div>
      )}

      {/* Certificate template */}
      <div ref={certificateRef} className="certificate" id="certificate">
        {/* Decorative corners */}
        <div className="certificate-corner certificate-corner-tl" />
        <div className="certificate-corner certificate-corner-tr" />
        <div className="certificate-corner certificate-corner-bl" />
        <div className="certificate-corner certificate-corner-br" />

        {/* Header border pattern */}
        <div className="certificate-header-border" />

        {/* Header */}
        <header className="certificate-header">
          <div className="certificate-logo">
            <Shield className="logo-icon" />
            <span className="logo-text">PhishGuard</span>
          </div>
          <p className="certificate-subtitle">Certificado de Conclusão</p>
        </header>

        {/* Main content */}
        <main className="certificate-main">
          {/* Decorative line */}
          <div className="decorative-line">
            <span className="decorative-dot" />
            <span className="decorative-line-inner" />
            <span className="decorative-dot" />
          </div>

          <h1 className="certificate-title">Certificado de Treinamento</h1>
          <p className="certificate-presents">Prêmio outorgado a</p>

          <h2 className="certificate-name">{data.userName}</h2>

          <p className="certificate-for">Por ter concluído com êxito o programa de treinamento</p>

          <h3 className="certificate-course">{data.courseName}</h3>

          {data.courseDescription && (
            <p className="certificate-course-desc">{data.courseDescription}</p>
          )}

          {/* Decorative divider */}
          <div className="divider-pattern">
            <span className="divider-diamond" />
            <span className="divider-diamond" />
            <span className="divider-diamond" />
          </div>

          {/* Metadata grid */}
          <div className="certificate-meta">
            <div className="meta-item">
              <span className="meta-label">Data de conclusão</span>
              <span className="meta-value">{formattedDate}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Duração</span>
              <span className="meta-value">{data.duration}</span>
            </div>
            {data.score !== undefined && (
              <div className="meta-item">
                <span className="meta-label">Pontuação obtida</span>
                <span className="meta-value">{data.score}%</span>
              </div>
            )}
          </div>

          {/* Company attribution */}
          <p className="certificate-company">
            Treinamento realizado para
            <strong> {data.companyName}</strong>
          </p>
        </main>

        {/* Footer with QR code */}
        <footer className="certificate-footer">
          <div className="footer-content">
            <div className="qr-section">
              {loading ? (
                <div className="qr-placeholder" />
              ) : (
                <img src={qrCodeUrl} alt="QR Code para verificação" className="qr-code" />
              )}
              <div className="qr-text">
                <span className="qr-label">Verifique este certificado em</span>
                <span className="qr-url">phishguard.com.br/verify</span>
              </div>
            </div>

            <div className="footer-seal">
              <div className="seal-icon">
                <Award className="w-8 h-8" />
              </div>
              <span className="seal-text">Certificado Verificado</span>
              <CheckCircle className="seal-check w-4 h-4" />
            </div>
          </div>

          <div className="certificate-id">
            <span className="id-label">ID do Certificado</span>
            <span className="id-value">{data.id}</span>
          </div>
        </footer>

        {/* Bottom border */}
        <div className="certificate-footer-border" />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=Geist&display=swap');

        @page {
          size: A4 landscape;
          margin: 10mm;
        }
      `}</style>
    </div>
  );
}

export default CertificateTemplate;
