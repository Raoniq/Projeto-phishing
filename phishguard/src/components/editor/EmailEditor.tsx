import { useState, useCallback, useEffect } from 'react';
import type { Block, BlockType, EmailTemplate } from './types';
import { generateId, defaultTextBlock, defaultImageBlock, defaultButtonBlock, defaultSpacerBlock, defaultDividerBlock } from './types';
import { DragAndDropCanvas, BlockToolbar } from './DragAndDropCanvas';
import { BlockRenderer, BlockEditorPanel } from './BlockRenderer';
import { templateGallery, createTemplateFrom } from './templateGallery';
import { Button } from '@/components/ui/Button';
import { CategoryFilter, EmptyState, type CategoryKey } from '@/components/templates/CategoryFilter';
import { supabase } from '@/lib/supabase';

interface EmailEditorProps {
  initialTemplate?: EmailTemplate;
  onSave?: (template: EmailTemplate) => void;
}

export function EmailEditor({ initialTemplate, onSave }: EmailEditorProps) {
  const [template, setTemplate] = useState<EmailTemplate>(() => {
    if (initialTemplate) {
      return { ...initialTemplate };
    }
    return {
      id: generateId(),
      name: 'Novo Template',
      description: '',
      blocks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showGallery, setShowGallery] = useState(false);
  const [templateName, setTemplateName] = useState(template.name);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [companyId, setCompanyId] = useState<string>('');

  const selectedBlock = template.blocks.find(b => b.id === selectedBlockId) || null;

  // Fetch company ID for category stats
  useEffect(() => {
    const fetchCompanyId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single();
        if (userData?.company_id) {
          setCompanyId(userData.company_id);
        }
      }
    };
    fetchCompanyId();
  }, []);

  // Update template name when changed
  useEffect(() => {
    // Defer state update to avoid cascading renders
    requestAnimationFrame(() => {
      setTemplateName(template.name);
    });
  }, [template.name]);

  const handleBlocksChange = useCallback((newBlocks: Block[]) => {
    setTemplate(prev => ({
      ...prev,
      blocks: newBlocks,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleBlockChange = useCallback((updatedBlock: Block) => {
    setTemplate(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleAddBlock = useCallback((type: BlockType) => {
    const id = generateId();
    let newBlock: Block;

    switch (type) {
      case 'text':
        newBlock = defaultTextBlock(id);
        break;
      case 'image':
        newBlock = defaultImageBlock(id);
        break;
      case 'button':
        newBlock = defaultButtonBlock(id);
        break;
      case 'spacer':
        newBlock = defaultSpacerBlock(id);
        break;
      case 'divider':
        newBlock = defaultDividerBlock(id);
        break;
      default:
        return;
    }

    handleBlocksChange([...template.blocks, newBlock]);
    setSelectedBlockId(id);
  }, [template.blocks, handleBlocksChange]);

  const handleSelectTemplate = useCallback((tpl: EmailTemplate) => {
    const newTemplate = createTemplateFrom(tpl);
    setTemplate(newTemplate);
    setSelectedBlockId(null);
    setShowGallery(false);
  }, []);

  const handleSave = useCallback(() => {
    const templateToSave = {
      ...template,
      name: templateName,
      updatedAt: new Date().toISOString(),
    };
    setTemplate(templateToSave);
    onSave?.(templateToSave);
  }, [template, templateName, onSave]);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(template, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [template]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string) as EmailTemplate;
          if (imported.blocks && Array.isArray(imported.blocks)) {
            setTemplate({
              ...imported,
              id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch {
          alert('Arquivo inválido');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const handleTemplateNameChange = useCallback((name: string) => {
    setTemplateName(name);
    setTemplate(prev => ({
      ...prev,
      name,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const previewWidth = previewMode === 'mobile' ? 375 : '100%';

  // Filter templates by selected category
  const filteredAndFilteredTemplates = templateGallery.filter(() => {
    if (selectedCategory === 'all') return true;
    // For now, show all templates since we don't have category info in templateGallery
    // In production, you'd fetch templates from campaign_templates table with category
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-noir-950">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-noir-900 border-b border-noir-700">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={templateName}
            onChange={(e) => handleTemplateNameChange(e.target.value)}
            className="bg-transparent border-none text-xl font-display font-bold text-white focus:outline-none focus:ring-0"
            placeholder="Nome do template"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Preview Toggle */}
          <div className="flex items-center gap-1 bg-noir-800 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                previewMode === 'desktop'
                  ? 'bg-amber-500 text-noir-950'
                  : 'text-noir-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                previewMode === 'mobile'
                  ? 'bg-amber-500 text-noir-950'
                  : 'text-noir-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={() => setShowGallery(true)}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Templates
          </Button>

          <Button variant="ghost" size="sm" onClick={handleImport}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Importar
          </Button>

          <Button variant="ghost" size="sm" onClick={handleExport}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar
          </Button>

          <Button variant="primary" size="sm" onClick={handleSave}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Salvar
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Block Toolbar */}
        <div className="w-64 bg-noir-900 border-r border-noir-700 p-4 overflow-y-auto">
          <h3 className="text-xs font-medium text-noir-400 uppercase tracking-wider mb-3">
            Blocos
          </h3>
          <BlockToolbar onAddBlock={handleAddBlock} />

          {selectedBlock && (
            <div className="mt-6">
              <h3 className="text-xs font-medium text-noir-400 uppercase tracking-wider mb-3">
                Propriedades
              </h3>
              <BlockEditorPanel block={selectedBlock} onChange={handleBlockChange} />
            </div>
          )}
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 p-6 overflow-y-auto bg-noir-950">
          <div
            className="mx-auto transition-all duration-300"
            style={{ width: previewWidth, maxWidth: '100%' }}
          >
            <DragAndDropCanvas
              blocks={template.blocks}
              selectedBlockId={selectedBlockId}
              onBlocksChange={handleBlocksChange}
              onSelectBlock={setSelectedBlockId}
            >
              {(block, isSelected, onEdit) => (
                <div
                  onDoubleClick={onEdit}
                  className={`relative ${isSelected ? 'ring-2 ring-amber-500/50 rounded' : ''}`}
                >
                  <BlockRenderer block={block} />
                </div>
              )}
            </DragAndDropCanvas>
          </div>
        </div>
      </div>

      {/* Template Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-noir-900 rounded-xl border border-noir-700 w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-700">
              <h2 className="text-xl font-display font-bold text-white">Template Gallery</h2>
              <button
                onClick={() => setShowGallery(false)}
                className="text-noir-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Category Filter */}
            {companyId && (
              <div className="px-6 py-3 border-b border-noir-700 bg-noir-950/50">
                <CategoryFilter
                  companyId={companyId}
                  selectedCategory={selectedCategory}
                  onFilterChange={setSelectedCategory}
                />
              </div>
            )}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {filteredAndFilteredTemplates.length === 0 && selectedCategory !== 'all' ? (
                <EmptyState
                  category={selectedCategory}
                  onClearFilter={() => setSelectedCategory('all')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndFilteredTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className="
                      p-4 bg-noir-800 rounded-lg border border-noir-700
                      hover:border-amber-500/50 hover:bg-noir-700
                      transition-all duration-150 text-left
                    "
                  >
                    {/* Template Preview */}
                    <div className="bg-noir-950 rounded border border-noir-700 p-3 mb-3 min-h-[100px] overflow-hidden">
                      {tpl.blocks.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-noir-600 text-sm">
                          Template vazio
                        </div>
                      ) : (
                        <div className="space-y-1 transform scale-[0.4] origin-left w-[250%]">
                          {tpl.blocks.slice(0, 5).map((block) => (
                            <div
                              key={block.id}
                              className="bg-noir-800 rounded"
                              style={{
                                height: block.type === 'spacer' ? `${(block as { height?: number }).height ?? 20}px` : '20px',
                              }}
                            />
                          ))}
                          {tpl.blocks.length > 5 && (
                            <div className="text-xs text-noir-500 text-center">
                              +{tpl.blocks.length - 5} blocos
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-white mb-1">{tpl.name}</h4>
                    <p className="text-sm text-noir-400 max-w-sm">{tpl.description}</p>
                    <p className="text-xs text-noir-600 mt-2">{tpl.blocks.length} blocos</p>
                  </button>
                ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}