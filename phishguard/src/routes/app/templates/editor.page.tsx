import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmailEditor } from '@/components/editor/EmailEditor';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import type { EmailTemplate, Block } from '@/components/editor/types';
import type { Database } from '@/lib/supabase';

type CampaignTemplate = Database['public']['Tables']['campaign_templates']['Row'];

export default function TemplateEditorPage() {
  const [searchParams] = useSearchParams();
  const { company } = useAuth();
  const templateId = searchParams.get('id');

  const [initialTemplate, setInitialTemplate] = useState<EmailTemplate | undefined>();
  const [isLoading, setIsLoading] = useState(false);

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
          .eq('company_id', company.id)
          .single();

        if (error) throw error;
        if (data) {
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
        company_id: company.id,
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
        // Update existing template
        const { error } = await supabase
          .from('campaign_templates')
          .update(templateData)
          .eq('id', templateId)
          .eq('company_id', company.id);

        if (error) throw error;
      } else {
        // Insert new template
        const { error } = await supabase
          .from('campaign_templates')
          .insert(templateData);

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