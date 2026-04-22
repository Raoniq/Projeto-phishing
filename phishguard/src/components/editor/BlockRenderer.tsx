import type { Block, TextBlock, ImageBlock, ButtonBlock, SpacerBlock, DividerBlock } from './types';
import { sanitizeHtml } from './types';

// Text Block Renderer
export function TextBlockRenderer({ block }: { block: TextBlock }) {
  return (
    <div
      className="w-full"
      style={{
        fontSize: `${block.fontSize}px`,
        fontWeight: block.fontWeight,
        color: block.color,
        textAlign: block.align,
        padding: `${block.padding}px`,
      }}
    >
      {block.content}
    </div>
  );
}

// Image Block Renderer
export function ImageBlockRenderer({ block }: { block: ImageBlock }) {
  const Wrapper = block.href ? 'a' : 'div';
  const wrapperProps = block.href ? { href: block.href, target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <div className="w-full" style={{ padding: block.type === 'image' ? '8px' : 0 }}>
      <Wrapper {...wrapperProps} className="block">
        {block.src ? (
          <img
            src={block.src}
            alt={sanitizeHtml(block.alt)}
            style={{ width: block.width, height: block.height }}
            className="max-w-full h-auto rounded"
          />
        ) : (
          <div
            className="flex items-center justify-center bg-noir-800 border-2 border-dashed border-noir-600 rounded"
            style={{ width: block.width, height: block.height || 150 }}
          >
            <span className="text-noir-500 text-sm">Clique para adicionar imagem</span>
          </div>
        )}
      </Wrapper>
    </div>
  );
}

// Button Block Renderer
export function ButtonBlockRenderer({ block }: { block: ButtonBlock }) {
  return (
    <div
      className="w-full"
      style={{ textAlign: block.align, padding: '8px' }}
    >
      <a
        href={block.href || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block font-medium transition-opacity hover:opacity-80"
        style={{
          backgroundColor: block.backgroundColor,
          color: block.color,
          borderRadius: `${block.borderRadius}px`,
          padding: `${block.paddingY}px ${block.paddingX}px`,
          textDecoration: 'none',
        }}
      >
        {block.text}
      </a>
    </div>
  );
}

// Spacer Block Renderer
export function SpacerBlockRenderer({ block }: { block: SpacerBlock }) {
  return (
    <div
      className="w-full bg-noir-800/30 border border-dashed border-noir-700 rounded"
      style={{ height: block.height }}
    >
      <div className="h-full flex items-center justify-center text-noir-600 text-xs">
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        {block.height}px
      </div>
    </div>
  );
}

// Divider Block Renderer
export function DividerBlockRenderer({ block }: { block: DividerBlock }) {
  return (
    <div className="w-full" style={{ padding: '8px 0' }}>
      <hr
        style={{
          borderWidth: `${block.thickness}px`,
          borderColor: block.color,
          width: block.width,
          margin: '0 auto',
        }}
      />
    </div>
  );
}

// Main Block Renderer
export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'text':
      return <TextBlockRenderer block={block} />;
    case 'image':
      return <ImageBlockRenderer block={block} />;
    case 'button':
      return <ButtonBlockRenderer block={block} />;
    case 'spacer':
      return <SpacerBlockRenderer block={block} />;
    case 'divider':
      return <DividerBlockRenderer block={block} />;
    default:
      return null;
  }
}

// Block Editor Panel (for editing selected block properties)
interface BlockEditorPanelProps {
  block: Block;
  onChange: (block: Block) => void;
}

export function BlockEditorPanel({ block, onChange }: BlockEditorPanelProps) {
  return (
    <div className="space-y-4 p-4 bg-noir-900 rounded-lg border border-noir-700">
      <h3 className="text-sm font-medium text-amber-500 uppercase tracking-wider">
        Editar {block.type}
      </h3>

      {block.type === 'text' && (
        <TextBlockEditor block={block} onChange={onChange} />
      )}
      {block.type === 'image' && (
        <ImageBlockEditor block={block} onChange={onChange} />
      )}
      {block.type === 'button' && (
        <ButtonBlockEditor block={block} onChange={onChange} />
      )}
      {block.type === 'spacer' && (
        <SpacerBlockEditor block={block} onChange={onChange} />
      )}
      {block.type === 'divider' && (
        <DividerBlockEditor block={block} onChange={onChange} />
      )}
    </div>
  );
}

// Individual block editors
function TextBlockEditor({ block, onChange }: { block: TextBlock; onChange: (b: Block) => void }) {
  return (
    <>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Conteúdo</label>
        <textarea
          value={block.content}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white resize-y"
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Tamanho</label>
          <input
            type="number"
            value={block.fontSize}
            onChange={(e) => onChange({ ...block, fontSize: Number(e.target.value) })}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
            min={10}
            max={72}
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Peso</label>
          <select
            value={block.fontWeight}
            onChange={(e) => onChange({ ...block, fontWeight: e.target.value })}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          >
            <option value="300">Light</option>
            <option value="400">Regular</option>
            <option value="500">Medium</option>
            <option value="600">Semibold</option>
            <option value="700">Bold</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Cor</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={block.color}
            onChange={(e) => onChange({ ...block, color: e.target.value })}
            className="w-10 h-10 rounded border border-noir-700 cursor-pointer"
          />
          <input
            type="text"
            value={block.color}
            onChange={(e) => onChange({ ...block, color: e.target.value })}
            className="flex-1 bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white font-mono"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Alinhamento</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => onChange({ ...block, align })}
              className={`flex-1 py-2 rounded text-xs ${
                block.align === align
                  ? 'bg-amber-500 text-noir-950'
                  : 'bg-noir-800 text-noir-400 hover:text-white'
              }`}
            >
              {align === 'left' && '←'}
              {align === 'center' && '↔'}
              {align === 'right' && '→'}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function ImageBlockEditor({ block, onChange }: { block: ImageBlock; onChange: (b: Block) => void }) {
  return (
    <>
      <div>
        <label className="block text-xs text-noir-400 mb-1">URL da Imagem</label>
        <input
          type="url"
          value={block.src}
          onChange={(e) => onChange({ ...block, src: e.target.value })}
          placeholder="https://..."
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Texto Alternativo</label>
        <input
          type="text"
          value={block.alt}
          onChange={(e) => onChange({ ...block, alt: e.target.value })}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Link (opcional)</label>
        <input
          type="url"
          value={block.href}
          onChange={(e) => onChange({ ...block, href: e.target.value })}
          placeholder="https://..."
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Largura</label>
          <input
            type="text"
            value={block.width}
            onChange={(e) => onChange({ ...block, width: e.target.value })}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Altura</label>
          <input
            type="text"
            value={block.height}
            onChange={(e) => onChange({ ...block, height: e.target.value })}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
    </>
  );
}

function ButtonBlockEditor({ block, onChange }: { block: ButtonBlock; onChange: (b: Block) => void }) {
  return (
    <>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Texto do Botão</label>
        <input
          type="text"
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">URL do Link</label>
        <input
          type="url"
          value={block.href}
          onChange={(e) => onChange({ ...block, href: e.target.value })}
          placeholder="https://..."
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Cor de Fundo</label>
          <input
            type="color"
            value={block.backgroundColor}
            onChange={(e) => onChange({ ...block, backgroundColor: e.target.value })}
            className="w-10 h-10 rounded border border-noir-700 cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Cor do Texto</label>
          <input
            type="color"
            value={block.color}
            onChange={(e) => onChange({ ...block, color: e.target.value })}
            className="w-10 h-10 rounded border border-noir-700 cursor-pointer"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Raio</label>
          <input
            type="number"
            value={block.borderRadius}
            onChange={(e) => onChange({ ...block, borderRadius: Number(e.target.value) })}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
            min={0}
            max={50}
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Padding X</label>
          <input
            type="number"
            value={block.paddingX}
            onChange={(e) => onChange({ ...block, paddingX: Number(e.target.value) })}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Padding Y</label>
          <input
            type="number"
            value={block.paddingY}
            onChange={(e) => onChange({ ...block, paddingY: Number(e.target.value) })}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Alinhamento</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => onChange({ ...block, align })}
              className={`flex-1 py-2 rounded text-xs ${
                block.align === align
                  ? 'bg-amber-500 text-noir-950'
                  : 'bg-noir-800 text-noir-400 hover:text-white'
              }`}
            >
              {align === 'left' && '←'}
              {align === 'center' && '↔'}
              {align === 'right' && '→'}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function SpacerBlockEditor({ block, onChange }: { block: SpacerBlock; onChange: (b: Block) => void }) {
  return (
    <div>
      <label className="block text-xs text-noir-400 mb-1">Altura (px)</label>
      <input
        type="number"
        value={block.height}
        onChange={(e) => onChange({ ...block, height: Number(e.target.value) })}
        className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        min={10}
        max={200}
      />
    </div>
  );
}

function DividerBlockEditor({ block, onChange }: { block: DividerBlock; onChange: (b: Block) => void }) {
  return (
    <>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Cor</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={block.color}
            onChange={(e) => onChange({ ...block, color: e.target.value })}
            className="w-10 h-10 rounded border border-noir-700 cursor-pointer"
          />
          <input
            type="text"
            value={block.color}
            onChange={(e) => onChange({ ...block, color: e.target.value })}
            className="flex-1 bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white font-mono"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Espessura (px)</label>
          <input
            type="number"
            value={block.thickness}
            onChange={(e) => onChange({ ...block, thickness: Number(e.target.value) })}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
            min={1}
            max={10}
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Largura</label>
          <input
            type="text"
            value={block.width}
            onChange={(e) => onChange({ ...block, width: e.target.value })}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
    </>
  );
}