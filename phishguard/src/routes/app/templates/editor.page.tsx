import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmailEditor } from '@/components/editor/EmailEditor';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import type { EmailTemplate, Block } from '@/components/editor/types';
import type { Database } from '@/lib/supabase';

type CampaignTemplate = Database['public']['Tables']['campaign_templates']['Row'];

export default function TemplateEditorPage() {
  const [searchParams] = useSearchParams();
  const { company } = useAuth();
  const templateId = searchParams.get('id');

  const [initialTemplate, setInitialTemplate] = useState<EmailTemplate | undefined>();
  const [templateType, setTemplateType] = useState<'global' | 'company' | null>(null);
  const [originalCompanyId, setOriginalCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGlobalBlocked, setIsGlobalBlocked] = useState(false);

  // Load template from Supabase when ID is present
  useEffect(() => {
    if (!templateId || !company?.id) return;

    const loadTemplate = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('campaign_templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (error) throw error;
        if (data) {
          // Block editing for global templates
          if (data.template_type === 'global') {
            setIsGlobalBlocked(true);
            setIsLoading(false);
            return;
          }
          
          setTemplateType(data.template_type || 'company');
          setOriginalCompanyId(data.company_id);
          
          // Convert stored template to EmailTemplate format
          const template: EmailTemplate = {
            id: data.id,
            name: data.name,
            description: '',
            blocks: [],
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          setInitialTemplate(template);
        }
      } catch (error) {
        console.error('[TemplateEditor] Error loading template:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [templateId, company?.id]);

  // Serialize blocks to HTML
  const blocksToHtml = (blocks: Block[]): string => {
    return blocks.map(block => {
      switch (block.type) {
        case 'text':
          return `<div style="font-size:${block.fontSize}px;font-weight:${block.fontWeight};color:${block.color};text-align:${block.align};padding:${block.padding}px;">${block.content}</div>`;
        case 'image':
          return `<img src="${block.src}" alt="${block.alt}" style="width:${block.width};height:${block.height};" />`;
        case 'button':
          return `<a href="${block.href}" style="display:inline-block;background-color:${block.backgroundColor};color:${block.color};border-radius:${block.borderRadius}px;padding:${block.paddingY}px ${block.paddingX}px;text-align:${block.align};">${block.text}</a>`;
        case 'spacer':
          return `<div style="height:${block.height}px;"></div>`;
        case 'divider':
          return `<hr style="color:${block.color};thickness:${block.thickness}px;width:${block.width};" />`;
        default:
          return '';
      }
    }).join('\n');
  };

  const handleSave = useCallback(async (template: EmailTemplate) => {
    if (!company?.id) return;

    try {
      const bodyHtml = blocksToHtml(template.blocks);
      const templateData = {
        name: template.name,
        subject: template.name, // Use name as subject if no subject field
        body_html: bodyHtml,
        body_text: template.description || null,
        category: 'general' as const,
        difficulty_level: 'medium' as const,
        clickbait_score: 0,
        is_active: true,
      };

      if (templateId) {
        // Update existing template - preserve original company_id and template_type
        const { error } = await supabase
          .from('campaign_templates')
          .update(templateData)
          .eq('id', templateId);

        if (error) throw error;
      } else {
        // Insert new template - use company scope
        const { error } = await supabase
          .from('campaign_templates')
          .insert({
            ...templateData,
            company_id: company.id,
            template_type: 'company',
          });

        if (error) throw error;
      }

      // Show success feedback
      const event = new CustomEvent('toast', { detail: { message: 'Template salvo com sucesso!', type: 'success' } });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('[TemplateEditor] Error saving template:', error);
      const event = new CustomEvent('toast', { detail: { message: 'Erro ao salvar template', type: 'error' } });
      window.dispatchEvent(event);
    }
  }, [company?.id, templateId]);

  // Block editing of global templates
  if (isGlobalBlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] gap-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-display font-semibold text-[var(--color-fg-primary)]">Template Global</h2>
          <p className="mt-2 text-sm text-[var(--color-fg-secondary)] max-w-md">
            Templates globais não podem ser editados diretamente. Clone o template para criar uma cópia própria que você pode modificar.
          </p>
        </div>
        <Button variant="primary" onClick={() => window.history.back()}>
          Voltar
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="animate-pulse-glow text-accent">Carregando template...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <EmailEditor initialTemplate={initialTemplate} onSave={handleSave} />
    </div>
  );
}