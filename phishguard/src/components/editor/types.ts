// Email Template Editor Types
// Lightweight drag-and-drop email template system

export type BlockType = 'text' | 'image' | 'button' | 'spacer' | 'divider';

export interface TextBlock {
  id: string;
  type: 'text';
  content: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  align: 'left' | 'center' | 'right';
  padding: number;
}

export interface ImageBlock {
  id: string;
  type: 'image';
  src: string;
  alt: string;
  width: string;
  height: string;
  href: string;
}

export interface ButtonBlock {
  id: string;
  type: 'button';
  text: string;
  href: string;
  backgroundColor: string;
  color: string;
  borderRadius: number;
  paddingX: number;
  paddingY: number;
  align: 'left' | 'center' | 'right';
}

export interface SpacerBlock {
  id: string;
  type: 'spacer';
  height: number;
}

export interface DividerBlock {
  id: string;
  type: 'divider';
  color: string;
  thickness: number;
  width: string;
}

export type Block = TextBlock | ImageBlock | ButtonBlock | SpacerBlock | DividerBlock;

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
}

export interface EditorState {
  template: EmailTemplate;
  selectedBlockId: string | null;
  isDragging: boolean;
  previewMode: 'desktop' | 'mobile';
  hasUnsavedChanges: boolean;
}

// Block defaults
export const defaultTextBlock = (id: string): TextBlock => ({
  id,
  type: 'text',
  content: 'Digite seu texto aqui...',
  fontSize: 16,
  fontWeight: '400',
  color: '#ECE8E1',
  align: 'left',
  padding: 16,
});

export const defaultImageBlock = (id: string): ImageBlock => ({
  id,
  type: 'image',
  src: '',
  alt: 'Imagem',
  width: '100%',
  height: 'auto',
  href: '',
});

export const defaultButtonBlock = (id: string): ButtonBlock => ({
  id,
  type: 'button',
  text: 'Clique aqui',
  href: '#',
  backgroundColor: '#D97757',
  color: '#FFFFFF',
  borderRadius: 8,
  paddingX: 24,
  paddingY: 12,
  align: 'center',
});

export const defaultSpacerBlock = (id: string): SpacerBlock => ({
  id,
  type: 'spacer',
  height: 40,
});

export const defaultDividerBlock = (id: string): DividerBlock => ({
  id,
  type: 'divider',
  color: '#363C48',
  thickness: 1,
  width: '100%',
});

// Generate unique ID
export function generateId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Sanitize HTML to prevent XSS
export function sanitizeHtml(html: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return html.replace(/[&<>"']/g, (char) => map[char]);
}

// Validate URL
export function isValidUrl(url: string): boolean {
  if (!url) return true; // Empty is OK (no link)
  try {
    const parsed = new URL(url, 'https://example.com');
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}