import { useState, useCallback } from 'react';
import { EmailEditor } from '@/components/editor/EmailEditor';
import type { EmailTemplate } from '@/components/editor/types';

export default function TemplateEditorPage() {
  const [, setSavedTemplates] = useState<EmailTemplate[]>([]);
  const [, setLastSaved] = useState<Date | null>(null);

  const handleSave = useCallback((template: EmailTemplate) => {
    setSavedTemplates(prev => {
      const existing = prev.findIndex(t => t.id === template.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = template;
        return updated;
      }
      return [...prev, template];
    });
    setLastSaved(new Date());
  }, []);

  return (
    <div className="h-[calc(100vh-120px)]">
      <EmailEditor onSave={handleSave} />
    </div>
  );
}