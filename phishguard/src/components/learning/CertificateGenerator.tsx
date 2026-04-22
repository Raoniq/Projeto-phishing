import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface CertificateData {
  userId: string;
  userName: string;
  userEmail: string;
  trilhaId: string;
  trilhaName: string;
  completedAt: string;
  certificateId?: string;
}

export interface CertificateGeneratorProps {
  data: CertificateData;
  onDownload?: () => void;
  className?: string;
}

// Capture timestamp once at module load to avoid impure function calls during render
const INITIAL_TIMESTAMP = Date.now();

export function CertificateGenerator({
  data,
  onDownload,
  className,
}: CertificateGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);

    // Simulate certificate generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsGenerating(false);
    setIsGenerated(true);
    onDownload?.();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Generate unique certificate ID
  const certificateId = useMemo(() => {
    return data.certificateId || `CERT-${INITIAL_TIMESTAMP.toString(36).toUpperCase()}`;
  }, [data.certificateId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-6', className)}
    >
      {/* Certificate Preview */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-noir-900 via-noir-800 to-noir-900 p-8 text-center',
          isGenerated ? 'border-amber-500/50' : 'border-noir-700'
        )}
      >
        {/* Decorative corners */}
        <div className="absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-amber-500/30" />
        <div className="absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-amber-500/30" />
        <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-amber-500/30" />
        <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-amber-500/30" />

        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D97757' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative">
          {/* Logo */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
            <svg className="h-8 w-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="font-display text-3xl font-bold text-white">
            Certificado de Conclusão
          </h2>
          <p className="mt-2 text-sm text-noir-400 max-w-sm">
            PhishGuard Academy
          </p>

          {/* Decorative line */}
          <div className="mx-auto mt-6 h-px w-32 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

          {/* Certificate content */}
          <div className="mt-8 space-y-4">
            <p className="text-sm text-noir-400 max-w-sm">Certificamos que</p>
            <h3 className="font-display text-2xl font-bold text-amber-500">
              {data.userName}
            </h3>
            <p className="text-sm text-noir-400 max-w-sm">completou com sucesso a trilha</p>
            <h4 className="font-display text-xl font-semibold text-white">
              {data.trilhaName}
            </h4>
          </div>

          {/* Date and ID */}
          <div className="mt-8 flex items-center justify-between border-t border-noir-700 pt-6">
            <div className="text-left">
              <p className="text-xs text-noir-500">Data de conclusão</p>
              <p className="text-sm text-white">{formatDate(data.completedAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-noir-500">ID do Certificado</p>
              <p className="font-mono text-sm text-noir-300">{certificateId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        {!isGenerated ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
              'flex items-center gap-3 rounded-xl px-8 py-4 font-semibold transition-all',
              isGenerating
                ? 'bg-noir-700 text-noir-400 cursor-wait'
                : 'bg-gradient-to-r from-amber-600 to-amber-500 text-noir-950 hover:shadow-lg hover:shadow-amber-500/25'
            )}
          >
            {isGenerating ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Gerando...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar Certificado
              </>
            )}
          </motion.button>
        ) : (
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2"
            >
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-500">Certificado disponível</span>
            </motion.div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg bg-noir-800 px-4 py-2 text-sm text-white hover:bg-noir-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}