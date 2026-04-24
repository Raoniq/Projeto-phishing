import { useState, useEffect, useCallback } from 'react'
import { supabase, type Database } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { cn } from '@/lib/utils'

type CampaignTemplate = Database['public']['Tables']['campaign_templates']['Row']

const CATEGORIES = ['Banco', 'RH', 'TI', 'Governo', 'Logística', 'E-commerce', 'Social']

const CATEGORY_COLORS: Record<string, string> = {
  Banco: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  RH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  TI: 'bg-green-500/20 text-green-400 border-green-500/30',
  Governo: 'bg-red-500/20 text-red-400 border-red-500/30',
  Logística: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'E-commerce': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  Social: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

interface TemplatePreview {
  id: string
  name: string
  category: string
  subject: string
  body_html: string
}

export default function BibliotecaPage() {
  const { profile } = useUser()
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<CampaignTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<TemplatePreview | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    if (!profile?.company_id) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
      setFilteredTemplates(data || [])
    } catch (error) {
      console.error('[Biblioteca] Error fetching templates:', error)
    } finally {
      setIsLoading(false)
    }
  }, [profile?.company_id])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Filter templates
  useEffect(() => {
    let result = templates

    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.subject.toLowerCase().includes(query)
      )
    }

    setFilteredTemplates(result)
  }, [templates, searchQuery, categoryFilter])

  // Clone template
  const cloneTemplate = async (template: CampaignTemplate) => {
    try {
      const { data, error } = await supabase
        .from('campaign_templates')
        .insert({
          company_id: template.company_id,
          name: `Cópia de ${template.name}`,
          category: template.category,
          subject: template.subject,
          body_html: template.body_html,
          body_text: template.body_text,
        })
        .select()
        .single()

      if (error) throw error

      setTemplates(prev => [data, ...prev])
    } catch (error) {
      console.error('[Biblioteca] Error cloning template:', error)
    }
  }

  // Export template
  const exportTemplate = (template: CampaignTemplate) => {
    const exportData = {
      name: template.name,
      category: template.category,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text,
      exported_at: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/\s+/g, '_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export all templates
  const exportAllTemplates = () => {
    const exportData = filteredTemplates.map(t => ({
      name: t.name,
      category: t.category,
      subject: t.subject,
      body_html: t.body_html,
      body_text: t.body_text,
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `templates_biblioteca_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  }

  // Import templates
  const importTemplates = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile?.company_id) return

    try {
      const text = await file.text()
      const imported = JSON.parse(text)

      const templatesToImport = Array.isArray(imported) ? imported : [imported]

      for (const item of templatesToImport) {
        if (!item.name || !item.category) continue

        await supabase.from('campaign_templates').insert({
          company_id: profile.company_id,
          name: item.name,
          category: item.category,
          subject: item.subject || '',
          body_html: item.body_html || '',
          body_text: item.body_text || '',
        })
      }

      await fetchTemplates()
    } catch (error) {
      console.error('[Biblioteca] Error importing templates:', error)
    }

    event.target.value = ''
  }

  // Open preview
  const openPreview = (template: CampaignTemplate) => {
    setPreviewTemplate({
      id: template.id,
      name: template.name,
      category: template.category,
      subject: template.subject,
      body_html: template.body_html,
    })
    setIsPreviewOpen(true)
  }

  // Extract plain text from HTML for preview
  const htmlToPreview = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse-glow text-accent">Carregando templates...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-fg-primary)]">
            Biblioteca de Templates
          </h1>
          <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
            Gerencie seus templates de камpanhas de phishing
          </p>
        </div>
        <div className="flex gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={importTemplates}
              className="hidden"
            />
            <span className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] border border-[var(--color-noir-600)] bg-transparent text-[var(--color-fg-primary)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importar
            </span>
          </label>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportAllTemplates}
            disabled={filteredTemplates.length === 0}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar Todos
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-fg-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            type="text"
            placeholder="Buscar por nome, categoria ou assunto..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-noir-600)]">
          <svg className="w-12 h-12 text-[var(--color-fg-muted)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-[var(--color-fg-secondary)]">Nenhum template encontrado</p>
          <p className="text-sm text-[var(--color-fg-muted)]">Importe um arquivo JSON para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className={cn(
                'group relative rounded-[var(--radius-lg)] border bg-[var(--color-surface-1)] overflow-hidden transition-all duration-300',
                'hover:border-[var(--color-accent)]/50 hover:shadow-[0_0_30px_rgba(217,119,87,0.15)]',
                hoveredCard === template.id && 'border-[var(--color-accent)]/50 shadow-[0_0_30px_rgba(217,119,87,0.15)]'
              )}
              onMouseEnter={() => setHoveredCard(template.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Thumbnail Preview */}
              <div
                className="h-32 cursor-pointer overflow-hidden relative"
                onClick={() => openPreview(template)}
              >
                <div className="absolute inset-0 bg-[var(--color-surface-2)] flex items-center justify-center">
                  <div className="text-center p-3">
                    <div className="text-xs text-[var(--color-fg-muted)] line-clamp-2">
                      {htmlToPreview(template.body_html) || 'Preview não disponível'}
                    </div>
                  </div>
                </div>
                {/* Hover overlay */}
                <div className={cn(
                  'absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-200',
                  hoveredCard === template.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}>
                  <span className="text-sm text-white font-medium">Clique para visualizar</span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3
                    className="font-medium text-[var(--color-fg-primary)] truncate cursor-pointer"
                    onClick={() => openPreview(template)}
                  >
                    {template.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      'shrink-0 text-[10px] px-2 py-0',
                      CATEGORY_COLORS[template.category] || 'bg-[var(--color-surface-2)] text-[var(--color-fg-secondary)] border-[var(--color-noir-600)]'
                    )}
                  >
                    {template.category}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--color-fg-muted)] line-clamp-1 mb-3">
                  {template.subject}
                </p>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={() => openPreview(template)}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={() => cloneTemplate(template)}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Clonar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={() => exportTemplate(template)}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    JSON
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              <Badge
                variant="outline"
                className={cn(
                  'mt-1 text-xs',
                  previewTemplate?.category && CATEGORY_COLORS[previewTemplate.category]
                    ? CATEGORY_COLORS[previewTemplate.category]
                    : ''
                )}
              >
                {previewTemplate?.category}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--color-fg-muted)] uppercase tracking-wide">
                Assunto
              </label>
              <p className="text-sm text-[var(--color-fg-primary)] mt-1">
                {previewTemplate?.subject || 'Sem assunto'}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-fg-muted)] uppercase tracking-wide">
                Conteúdo HTML
              </label>
              <div
                className="mt-2 p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-0)] border border-[var(--color-noir-700)] max-h-64 overflow-auto"
                dangerouslySetInnerHTML={{ __html: previewTemplate?.body_html || '' }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-noir-700)]">
            <Button variant="secondary" onClick={() => setIsPreviewOpen(false)}>
              Fechar
            </Button>
            {previewTemplate && (
              <Button variant="primary" onClick={() => {
                cloneTemplate(templates.find(t => t.id === previewTemplate.id)!)
                setIsPreviewOpen(false)
              }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Clonar Template
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}