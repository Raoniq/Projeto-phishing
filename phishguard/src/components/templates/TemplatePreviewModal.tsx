import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: {
    name: string;
    subject: string;
    preview_text: string;
    body_html: string;
  } | null;
}

type PreviewMode = 'desktop' | 'mobile';

const DESKTOP_WIDTH = 600;
const MOBILE_WIDTH = 375;

export function TemplatePreviewModal({
  isOpen,
  onClose,
  template,
}: TemplatePreviewModalProps) {
  const { company } = useAuth();
  const [templateData, setTemplateData] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch real template variables from database
  useEffect(() => {
    async function fetchTemplateVariables() {
      if (!company?.id) return;

      try {
        // Fetch company data for variables
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('name, industry, employee_count')
          .eq('id', company.id)
          .single();

        if (companyError) throw companyError;

        // Fetch campaigns for CampaignName variable
        const { data: campaignData } = await supabase
          .from('campaigns')
          .select('name')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Fetch a sample user for template variables
        const { data: userData } = await supabase
          .from('users')
          .select('first_name, last_name, email, department')
          .eq('company_id', company.id)
          .limit(1)
          .single();

        setTemplateData({
          '{{.FirstName}}': userData?.first_name || 'Usuario',
          '{{.LastName}}': userData?.last_name || '',
          '{{.Email}}': userData?.email || 'usuario@empresa.com',
          '{{.CompanyName}}': companyData?.name || company?.name || 'Empresa',
          '{{.CampaignName}}': campaignData?.name || 'Campanha',
          '{{.Department}}': userData?.department || 'Geral',
        });
      } catch (error) {
        console.error('Error fetching template variables:', error);
        // Fallback to basic values
        setTemplateData({
          '{{.FirstName}}': 'Usuario',
          '{{.LastName}}': '',
          '{{.Email}}': 'usuario@empresa.com',
          '{{.CompanyName}}': company?.name || 'Empresa',
          '{{.CampaignName}}': 'Campanha',
          '{{.Department}}': 'Geral',
        });
      }
    }

    fetchTemplateVariables();
  }, [company]);

  // Interpolate variables in HTML content
  const interpolateVariables = useCallback((html: string): string => {
    let result = html;
    for (const [variable, value] of Object.entries(templateData)) {
      result = result.split(variable).join(value);
    }
    return result;
  }, [templateData]);

  // Inject styles and intercept CTA clicks
  const processHtmlContent = useCallback((html: string): string => {
    // First interpolate variables
    let content = interpolateVariables(html);

    // Create click interceptor script
    const clickInterceptor = `
      <script>
        document.addEventListener('click', function(e) {
          var target = e.target;
          // Find closest anchor or button
          while (target && target.tagName !== 'A' && target.tagName !== 'BUTTON' && target.tagName !== 'INPUT') {
            target = target.parentElement;
          }
          if (target) {
            e.preventDefault();
            e.stopPropagation();
            var href = target.tagName === 'A' ? target.href : (target.tagName === 'BUTTON' || target.tagName === 'INPUT') ? target.getAttribute('data-href') || target.value : '';
            var rect = target.getBoundingClientRect();
            window.parent.postMessage({
              type: 'CTA_CLICK',
              data: {
                tag: target.tagName,
                text: target.innerText || target.value || 'Button',
                href: href,
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
              }
            }, '*');
          }
        });
        // Also intercept form submissions
        document.querySelectorAll('form').forEach(function(form) {
          form.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.parent.postMessage({
              type: 'FORM_SUBMIT_ATTEMPT',
              data: { action: form.action }
            }, '*');
          });
        });
      </script>
    `;

    // Inject styles to make email responsive
    const responsiveStyles = `
      <style>
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        table {
          border-collapse: collapse;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        @media (max-width: 480px) {
          .email-container {
            width: 100% !important;
          }
        }
      </style>
    `;

    // Check if content already has head/body tags
    if (content.includes('<head')) {
      content = content.replace('</head>', responsiveStyles + '</head>');
      content = content.replace('</head>', clickInterceptor + '</head>');
    } else if (content.includes('<body')) {
      content = content.replace('<body', responsiveStyles + '<body');
      content = content.replace('<body', clickInterceptor + '<body');
    } else {
      // Wrap content if no body tag
      content = responsiveStyles + clickInterceptor + content;
    }

    return content;
  }, [interpolateVariables]);

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CTA_CLICK' || event.data?.type === 'FORM_SUBMIT_ATTEMPT') {
        const { x, y } = event.data.data;
        setTooltipState({
          visible: true,
          x,
          y,
        });

        // Clear existing timeout
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
        }

        // Auto-hide tooltip after 4 seconds
        tooltipTimeoutRef.current = setTimeout(() => {
          setTooltipState({ visible: false, x: 0, y: 0 });
        }, 4000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Get iframe content
  const getIframeContent = useCallback((): string => {
    if (!template?.body_html) {
      return '<html><body><div style="padding: 40px; text-align: center; color: #666;">No content to preview</div></body></html>';
    }
    return processHtmlContent(template.body_html);
  }, [template, processHtmlContent]);

  const previewWidth = previewMode === 'mobile' ? MOBILE_WIDTH : DESKTOP_WIDTH;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="!max-w-[90vw] !max-h-[90vh] p-0 overflow-hidden"
        style={{ width: previewMode === 'mobile' ? 420 : 720 }}
      >
        {/* Header with toolbar */}
        <DialogHeader className="px-6 py-4 bg-noir-900 border-b border-noir-700">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-display font-semibold text-white truncate">
                {template?.name || 'Template Preview'}
              </DialogTitle>
              {template?.subject && (
                <DialogDescription className="text-sm text-noir-400 mt-1 truncate">
                  Assunto: {template.subject}
                </DialogDescription>
              )}
            </div>

            {/* Desktop/Mobile Toggle */}
            <div className="flex items-center gap-1 bg-noir-800 rounded-lg p-1 shrink-0">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={cn(
                  'px-3 py-1.5 rounded text-sm transition-all duration-200 flex items-center gap-2',
                  previewMode === 'desktop'
                    ? 'bg-amber-500 text-noir-950 font-medium shadow-lg'
                    : 'text-noir-400 hover:text-white hover:bg-noir-700'
                )}
                title="Visualização desktop (600px)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={cn(
                  'px-3 py-1.5 rounded text-sm transition-all duration-200 flex items-center gap-2',
                  previewMode === 'mobile'
                    ? 'bg-amber-500 text-noir-950 font-medium shadow-lg'
                    : 'text-noir-400 hover:text-white hover:bg-noir-700'
                )}
                title="Visualização mobile (375px)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Area */}
        <div
          className="relative bg-noir-950 overflow-auto"
          style={{ height: 'calc(90vh - 140px)', minHeight: 500 }}
        >
          {/* Preview frame container */}
          <div className="absolute inset-0 flex justify-center p-6">
            <div
              className="relative bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ease-out"
              style={{
                width: previewWidth,
                maxWidth: '100%',
              }}
            >
              {/* Phone frame for mobile */}
              {previewMode === 'mobile' && (
                <div className="bg-noir-800 px-3 py-2 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-noir-600" />
                  <div className="w-20 h-6 rounded-full bg-noir-700 border border-noir-600" />
                  <div className="w-2 h-2 rounded-full bg-noir-600" />
                </div>
              )}

              {/* Email iframe */}
              <iframe
                ref={iframeRef}
                srcDoc={getIframeContent()}
                title="Email Preview"
                className="w-full bg-white"
                style={{
                  height: previewMode === 'mobile' ? 580 : 600,
                  border: 'none',
                }}
                sandbox="allow-same-origin"
                loading="lazy"
              />
            </div>
          </div>

          {/* Educational Tooltip Overlay */}
          {tooltipState.visible && (
            <div
              className="fixed inset-0 z-[100] pointer-events-none"
              onClick={() => setTooltipState({ visible: false, x: 0, y: 0 })}
            >
              <div
                className="absolute bg-noir-900 border border-amber-500/50 rounded-lg p-4 shadow-2xl max-w-sm animate-scale-in pointer-events-auto"
                style={{
                  left: Math.min(tooltipState.x, window.innerWidth - 320),
                  top: Math.min(tooltipState.y, window.innerHeight - 150),
                  transform: 'translate(-50%, -100%)',
                }}
              >
                {/* Tooltip arrow */}
                <div
                  className="absolute w-3 h-3 bg-noir-900 border-amber-500/50 border-l border-t"
                  style={{
                    bottom: -7,
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                  }}
                />

                {/* Warning icon */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-amber-500 text-sm mb-1">
                      Simulação de Phishing
                    </h4>
                    <p className="text-sm text-noir-300 leading-relaxed">
                      Este é um botão simulado de uma campanha de phishing. Em um ataque real, este botão levaria a uma página de coleta de credenciais.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with preview text */}
        {template?.preview_text && (
          <div className="px-6 py-3 bg-noir-900 border-t border-noir-700">
            <div className="flex items-center gap-2 text-xs text-noir-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">
                Preview: {template.preview_text}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default TemplatePreviewModal;
