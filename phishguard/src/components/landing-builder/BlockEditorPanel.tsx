// Block Editor Panel - for editing block properties
import type { Block, HeaderBlock, ParagraphBlock, ButtonBlock, InputBlock, ImageBlock, DividerBlock, SpacerBlock, HtmlBlock, LoginFormBlock, PasswordFieldBlock, TwoFactorInputBlock, PhoneInputBlock } from './types';

interface Props {
  block: Block;
  onChange: (block: Block) => void;
}

export default function BlockEditorPanel({ block, onChange }: Props) {
  const props = block.props as Record<string, unknown>;

  const updateProp = (key: string, value: unknown) => {
    onChange({ ...block, props: { ...props, [key]: value } });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-amber-500 uppercase tracking-wider">
        Editar {block.type}
      </h3>

      {block.type === 'header' && (
        <HeaderBlockEditor props={props as HeaderBlock['props']} onChange={updateProp} />
      )}
      {block.type === 'paragraph' && (
        <ParagraphBlockEditor props={props as ParagraphBlock['props']} onChange={updateProp} />
      )}
      {block.type === 'button' && (
        <ButtonBlockEditor props={props as ButtonBlock['props']} onChange={updateProp} />
      )}
      {block.type === 'input' && (
        <InputBlockEditor props={props as InputBlock['props']} onChange={updateProp} />
      )}
      {block.type === 'image' && (
        <ImageBlockEditor props={props as ImageBlock['props']} onChange={updateProp} />
      )}
      {block.type === 'divider' && (
        <DividerBlockEditor props={props as DividerBlock['props']} onChange={updateProp} />
      )}
      {block.type === 'spacer' && (
        <SpacerBlockEditor props={props as SpacerBlock['props']} onChange={updateProp} />
      )}
      {block.type === 'html' && (
        <HtmlBlockEditor props={props as HtmlBlock['props']} onChange={updateProp} />
      )}
      {block.type === 'loginForm' && (
        <LoginFormBlockEditor props={props as LoginFormBlock['props']} onChange={updateProp} />
      )}
      {block.type === 'passwordField' && (
        <PasswordFieldBlockEditor props={props as PasswordFieldBlock['props']} onChange={updateProp} />
      )}
      {block.type === 'twoFactorInput' && (
        <TwoFactorInputBlockEditor props={props as TwoFactorInputBlock['props']} onChange={updateProp} />
      )}
      {block.type === 'phoneInput' && (
        <PhoneInputBlockEditor props={props as PhoneInputBlock['props']} onChange={updateProp} />
      )}
    </div>
  );
}

function HeaderBlockEditor({ props, onChange }: { props: HeaderBlock['props']; onChange: (k: string, v: unknown) => void }) {
  return (
    <>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Conteúdo</label>
        <input
          type="text"
          value={props.content}
          onChange={(e) => onChange('content', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Nível</label>
          <select
            value={props.level}
            onChange={(e) => onChange('level', Number(e.target.value))}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
            <option value={4}>H4</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Tamanho</label>
          <input
            type="number"
            value={props.fontSize}
            onChange={(e) => onChange('fontSize', Number(e.target.value))}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
            min={10}
            max={72}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Cor</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={props.color}
            onChange={(e) => onChange('color', e.target.value)}
            className="w-10 h-10 rounded border border-noir-700 cursor-pointer"
          />
          <input
            type="text"
            value={props.color}
            onChange={(e) => onChange('color', e.target.value)}
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
              onClick={() => onChange('align', align)}
              className={`flex-1 py-2 rounded text-xs ${
                props.align === align
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

function ParagraphBlockEditor({ props, onChange }: { props: ParagraphBlock['props']; onChange: (k: string, v: unknown) => void }) {
  return (
    <>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Conteúdo</label>
        <textarea
          value={props.content}
          onChange={(e) => onChange('content', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white resize-y"
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Tamanho</label>
          <input
            type="number"
            value={props.fontSize}
            onChange={(e) => onChange('fontSize', Number(e.target.value))}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
            min={10}
            max={36}
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Peso</label>
          <select
            value={props.fontWeight}
            onChange={(e) => onChange('fontWeight', Number(e.target.value))}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          >
            <option value={300}>Light</option>
            <option value={400}>Regular</option>
            <option value={500}>Medium</option>
            <option value={600}>Semibold</option>
            <option value={700}>Bold</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Cor</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={props.color}
            onChange={(e) => onChange('color', e.target.value)}
            className="w-10 h-10 rounded border border-noir-700 cursor-pointer"
          />
          <input
            type="text"
            value={props.color}
            onChange={(e) => onChange('color', e.target.value)}
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
              onClick={() => onChange('align', align)}
              className={`flex-1 py-2 rounded text-xs ${
                props.align === align
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

function ButtonBlockEditor({ props, onChange }: { props: ButtonBlock['props']; onChange: (k: string, v: unknown) => void }) {
  return (
    <>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Texto do Botão</label>
        <input
          type="text"
          value={props.text}
          onChange={(e) => onChange('text', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">URL do Link</label>
        <input
          type="url"
          value={props.href}
          onChange={(e) => onChange('href', e.target.value)}
          placeholder="https://..."
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Cor de Fundo</label>
          <input
            type="color"
            value={props.backgroundColor}
            onChange={(e) => onChange('backgroundColor', e.target.value)}
            className="w-10 h-10 rounded border border-noir-700 cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Cor do Texto</label>
          <input
            type="color"
            value={props.color}
            onChange={(e) => onChange('color', e.target.value)}
            className="w-10 h-10 rounded border border-noir-700 cursor-pointer"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Raio</label>
          <input
            type="number"
            value={props.borderRadius}
            onChange={(e) => onChange('borderRadius', Number(e.target.value))}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
            min={0}
            max={50}
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Padding X</label>
          <input
            type="number"
            value={props.paddingX}
            onChange={(e) => onChange('paddingX', Number(e.target.value))}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Padding Y</label>
          <input
            type="number"
            value={props.paddingY}
            onChange={(e) => onChange('paddingY', Number(e.target.value))}
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
              onClick={() => onChange('align', align)}
              className={`flex-1 py-2 rounded text-xs ${
                props.align === align
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
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="fullWidth"
          checked={props.fullWidth}
          onChange={(e) => onChange('fullWidth', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="fullWidth" className="text-sm text-noir-400">Largura completa</label>
      </div>
    </>
  );
}

function InputBlockEditor({ props, onChange }: { props: InputBlock['props']; onChange: (k: string, v: unknown) => void }) {
  return (
    <>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Label</label>
        <input
          type="text"
          value={props.label}
          onChange={(e) => onChange('label', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Nome (name)</label>
        <input
          type="text"
          value={props.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Tipo</label>
          <select
            value={props.type}
            onChange={(e) => onChange('type', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          >
            <option value="text">Texto</option>
            <option value="email">Email</option>
            <option value="password">Senha</option>
            <option value="tel">Telefone</option>
            <option value="number">Número</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Placeholder</label>
          <input
            type="text"
            value={props.placeholder}
            onChange={(e) => onChange('placeholder', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Autocomplete</label>
          <input
            type="text"
            value={props.autocomplete}
            onChange={(e) => onChange('autocomplete', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Largura</label>
          <input
            type="text"
            value={props.width}
            onChange={(e) => onChange('width', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="required"
          checked={props.required}
          onChange={(e) => onChange('required', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="required" className="text-sm text-noir-400">Obrigatório</label>
      </div>
    </>
  );
}

function ImageBlockEditor({ props, onChange }: { props: ImageBlock['props']; onChange: (k: string, v: unknown) => void }) {
  return (
    <>
      <div>
        <label className="block text-xs text-noir-400 mb-1">URL da Imagem</label>
        <input
          type="url"
          value={props.src}
          onChange={(e) => onChange('src', e.target.value)}
          placeholder="https://..."
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Texto Alternativo</label>
        <input
          type="text"
          value={props.alt}
          onChange={(e) => onChange('alt', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Link (opcional)</label>
        <input
          type="url"
          value={props.href}
          onChange={(e) => onChange('href', e.target.value)}
          placeholder="https://..."
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Largura</label>
          <input
            type="text"
            value={props.width}
            onChange={(e) => onChange('width', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Altura</label>
          <input
            type="text"
            value={props.height}
            onChange={(e) => onChange('height', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
    </>
  );
}

function DividerBlockEditor({ props, onChange }: { props: DividerBlock['props']; onChange: (k: string, v: unknown) => void }) {
  return (
    <>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Cor</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={props.color}
            onChange={(e) => onChange('color', e.target.value)}
            className="w-10 h-10 rounded border border-noir-700 cursor-pointer"
          />
          <input
            type="text"
            value={props.color}
            onChange={(e) => onChange('color', e.target.value)}
            className="flex-1 bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white font-mono"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Espessura (px)</label>
          <input
            type="number"
            value={props.thickness}
            onChange={(e) => onChange('thickness', Number(e.target.value))}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
            min={1}
            max={10}
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Largura</label>
          <input
            type="text"
            value={props.width}
            onChange={(e) => onChange('width', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Estilo</label>
        <select
          value={props.style}
          onChange={(e) => onChange('style', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        >
          <option value="solid">Sólido</option>
          <option value="dashed">Tracejado</option>
          <option value="dotted">Pontilhado</option>
        </select>
      </div>
    </>
  );
}

function SpacerBlockEditor({ props, onChange }: { props: SpacerBlock['props']; onChange: (k: string, v: unknown) => void }) {
  return (
    <div>
      <label className="block text-xs text-noir-400 mb-1">Altura (px)</label>
      <input
        type="number"
        value={props.height}
        onChange={(e) => onChange('height', Number(e.target.value))}
        className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        min={10}
        max={300}
      />
    </div>
  );
}

function HtmlBlockEditor({ props, onChange }: { props: HtmlBlock['props']; onChange: (k: string, v: unknown) => void }) {
  return (
    <div>
      <label className="block text-xs text-noir-400 mb-1">Conteúdo HTML</label>
      <textarea
        value={props.content}
        onChange={(e) => onChange('content', e.target.value)}
        className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white font-mono resize-y"
        rows={8}
      />
      <p className="mt-1 text-xs text-amber-500/70">⚠️ HTML personalizado pode causar vulnerabilidades XSS.</p>
    </div>
  );
}

function LoginFormBlockEditor({ props, onChange }: { props: LoginFormBlock['props']; onChange: (k: string, v: unknown) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Label Username</label>
          <input
            type="text"
            value={props.usernameLabel}
            onChange={(e) => onChange('usernameLabel', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Placeholder Username</label>
          <input
            type="text"
            value={props.usernamePlaceholder}
            onChange={(e) => onChange('usernamePlaceholder', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Nome Username</label>
        <input
          type="text"
          value={props.usernameName}
          onChange={(e) => onChange('usernameName', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Label Password</label>
          <input
            type="text"
            value={props.passwordLabel}
            onChange={(e) => onChange('passwordLabel', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Placeholder Password</label>
          <input
            type="text"
            value={props.passwordPlaceholder}
            onChange={(e) => onChange('passwordPlaceholder', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Nome Password</label>
        <input
          type="text"
          value={props.passwordName}
          onChange={(e) => onChange('passwordName', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Texto do Botão</label>
        <input
          type="text"
          value={props.submitText}
          onChange={(e) => onChange('submitText', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showRememberMe"
            checked={props.showRememberMe}
            onChange={(e) => onChange('showRememberMe', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="showRememberMe" className="text-sm text-noir-400">Mostrar "Lembrar"</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showForgotPassword"
            checked={props.showForgotPassword}
            onChange={(e) => onChange('showForgotPassword', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="showForgotPassword" className="text-sm text-noir-400">Mostrar "Esqueci"</label>
        </div>
      </div>
    </>
  );
}

function PasswordFieldBlockEditor({ props, onChange }: { props: PasswordFieldBlock['props']; onChange: (k: string, v: unknown) => void }) {
  return (
    <>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Label</label>
        <input
          type="text"
          value={props.label}
          onChange={(e) => onChange('label', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Nome (name)</label>
        <input
          type="text"
          value={props.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Placeholder</label>
        <input
          type="text"
          value={props.placeholder}
          onChange={(e) => onChange('placeholder', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Largura</label>
          <input
            type="text"
            value={props.width}
            onChange={(e) => onChange('width', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id="showStrengthMeter"
            checked={props.showStrengthMeter}
            onChange={(e) => onChange('showStrengthMeter', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="showStrengthMeter" className="text-sm text-noir-400">Medidor</label>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="required"
          checked={props.required}
          onChange={(e) => onChange('required', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="required" className="text-sm text-noir-400">Obrigatório</label>
      </div>
    </>
  );
}

function TwoFactorInputBlockEditor({ props, onChange }: { props: TwoFactorInputBlock['props']; onChange: (k: string, v: unknown) => void }) {
  return (
    <>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Label</label>
        <input
          type="text"
          value={props.label}
          onChange={(e) => onChange('label', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Nome (name)</label>
          <input
            type="text"
            value={props.name}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Tamanho do Código</label>
          <input
            type="number"
            value={props.codeLength}
            onChange={(e) => onChange('codeLength', Number(e.target.value))}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
            min={4}
            max={8}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Placeholder</label>
        <input
          type="text"
          value={props.placeholder}
          onChange={(e) => onChange('placeholder', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Largura</label>
        <input
          type="text"
          value={props.width}
          onChange={(e) => onChange('width', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="required"
          checked={props.required}
          onChange={(e) => onChange('required', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="required" className="text-sm text-noir-400">Obrigatório</label>
      </div>
    </>
  );
}

function PhoneInputBlockEditor({ props, onChange }: { props: PhoneInputBlock['props']; onChange: (k: string, v: unknown) => void }) {
  return (
    <>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Label</label>
        <input
          type="text"
          value={props.label}
          onChange={(e) => onChange('label', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-noir-400 mb-1">Nome (name)</label>
          <input
            type="text"
            value={props.name}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-noir-400 mb-1">Código Padrão</label>
          <input
            type="text"
            value={props.defaultCountryCode}
            onChange={(e) => onChange('defaultCountryCode', e.target.value)}
            className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Placeholder</label>
        <input
          type="text"
          value={props.placeholder}
          onChange={(e) => onChange('placeholder', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-noir-400 mb-1">Largura</label>
        <input
          type="text"
          value={props.width}
          onChange={(e) => onChange('width', e.target.value)}
          className="w-full bg-noir-800 border border-noir-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showCountrySelect"
          checked={props.showCountrySelect}
          onChange={(e) => onChange('showCountrySelect', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="showCountrySelect" className="text-sm text-noir-400">Mostrar seletor de país</label>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="required"
          checked={props.required}
          onChange={(e) => onChange('required', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="required" className="text-sm text-noir-400">Obrigatório</label>
      </div>
    </>
  );
}