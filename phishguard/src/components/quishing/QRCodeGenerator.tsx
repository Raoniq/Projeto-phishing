import { useState, useCallback, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Share2, QrCode, Image, Palette } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface QRCodeSettings {
  foregroundColor: string;
  backgroundColor: string;
  size: number;
  logoUrl: string | null;
  margin: number;
}

interface QRCodeGeneratorProps {
  url: string;
  trackingId: string;
  settings?: Partial<QRCodeSettings>;
  onSettingsChange?: (settings: QRCodeSettings) => void;
  showControls?: boolean;
  className?: string;
}

const DEFAULT_SETTINGS: QRCodeSettings = {
  foregroundColor: '#1a1a2e',
  backgroundColor: '#ffffff',
  size: 300,
  logoUrl: null,
  margin: 2,
};

const PRESET_COLORS = [
  { fg: '#1a1a2e', bg: '#ffffff', name: 'Classic' },
  { fg: '#f59e0b', bg: '#1a1a2e', name: 'Amber Dark' },
  { fg: '#3b82f6', bg: '#ffffff', name: 'Azure' },
  { fg: '#10b981', bg: '#ffffff', name: 'Emerald' },
  { fg: '#6366f1', bg: '#ffffff', name: 'Indigo' },
  { fg: '#ec4899', bg: '#ffffff', name: 'Pink' },
  { fg: '#000000', bg: '#ffffff', name: 'Black White' },
  { fg: '#ffffff', bg: '#000000', name: 'White Black' },
];

export function QRCodeGenerator({
  url,
  trackingId,
  settings: initialSettings,
  onSettingsChange,
  showControls = true,
  className,
}: QRCodeGeneratorProps) {
  const [settings, setSettings] = useState<QRCodeSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const trackingUrl = `${url}/qr/${trackingId}`;

  // Generate QR code as data URL (PNG)
  const generateQRDataUrl = useCallback(async () => {
    if (!trackingUrl) return;

    setIsGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(trackingUrl, {
        width: settings.size,
        margin: settings.margin,
        color: {
          dark: settings.foregroundColor,
          light: settings.backgroundColor,
        },
        errorCorrectionLevel: 'H', // High error correction for logo support
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [trackingUrl, settings.size, settings.margin, settings.foregroundColor, settings.backgroundColor]);

  // Generate QR code as SVG string
  const generateQRSvg = useCallback(async () => {
    if (!trackingUrl) return;

    try {
      const svgString = await QRCode.toString(trackingUrl, {
        type: 'svg',
        width: settings.size,
        margin: settings.margin,
        color: {
          dark: settings.foregroundColor,
          light: settings.backgroundColor,
        },
        errorCorrectionLevel: 'H',
      });
      setQrSvgString(svgString);
    } catch (err) {
      console.error('Failed to generate SVG:', err);
    }
  }, [trackingUrl, settings.size, settings.margin, settings.foregroundColor, settings.backgroundColor]);

  useEffect(() => {
    generateQRDataUrl();
    generateQRSvg();
  }, [generateQRDataUrl, generateQRSvg]);

  const updateSetting = useCallback(<K extends keyof QRCodeSettings>(key: K, value: QRCodeSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  }, [settings, onSettingsChange]);

  const downloadPNG = useCallback(() => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = `qr-${trackingId.slice(0, 8)}.png`;
    link.href = qrDataUrl;
    link.click();
  }, [qrDataUrl, trackingId]);

  const downloadSVG = useCallback(() => {
    if (!qrSvgString) return;

    const blob = new Blob([qrSvgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `qr-${trackingId.slice(0, 8)}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [qrSvgString, trackingId]);

  const copyToClipboard = useCallback(async () => {
    if (!qrDataUrl) return;

    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [qrDataUrl]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* QR Code Display */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative rounded-xl border-4 border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-4 shadow-xl"
          style={{ borderColor: settings.backgroundColor }}
        >
          {isGenerating ? (
            <div className="flex h-[300px] w-[300px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            </div>
          ) : (
            <div className="relative">
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="h-full w-full"
                style={{
                  width: settings.size,
                  height: settings.size,
                }}
              />
              {settings.logoUrl && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ pointerEvents: 'none' }}
                >
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="rounded-lg bg-white p-1 shadow-md"
                    style={{
                      width: settings.size * 0.2,
                      height: settings.size * 0.2,
                      objectFit: 'contain',
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tracking URL */}
        <div className="max-w-full break-all">
          <p className="mb-1 text-center text-xs font-medium text-[var(--color-fg-tertiary)]">
            URL de rastreamento
          </p>
          <code className="rounded bg-[var(--color-surface-2)] px-3 py-1.5 text-sm text-[var(--color-accent)]">
            {trackingUrl}
          </code>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <>
          {/* Color Presets */}
          <div className="space-y-2">
            <Label className="text-xs text-[var(--color-fg-tertiary)]">Predefinições de cor</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    updateSetting('foregroundColor', preset.fg);
                    updateSetting('backgroundColor', preset.bg);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs transition-all',
                    settings.foregroundColor === preset.fg && settings.backgroundColor === preset.bg
                      ? 'border-[var(--color-accent)]'
                      : 'border-[var(--color-noir-700)] hover:border-[var(--color-noir-600)]'
                  )}
                  style={{ backgroundColor: preset.bg, color: preset.fg }}
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: preset.fg }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fgColor" className="text-xs">
                Cor do QR (primeiro plano)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="fgColor"
                  value={settings.foregroundColor}
                  onChange={(e) => updateSetting('foregroundColor', e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border border-[var(--color-noir-700)]"
                />
                <Input
                  value={settings.foregroundColor}
                  onChange={(e) => updateSetting('foregroundColor', e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bgColor" className="text-xs">
                Cor de fundo
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="bgColor"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border border-[var(--color-noir-700)]"
                />
                <Input
                  value={settings.backgroundColor}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label htmlFor="qrSize" className="text-xs">
              Tamanho: {settings.size}px
            </Label>
            <Input
              id="qrSize"
              type="range"
              min={150}
              max={600}
              step={50}
              value={settings.size}
              onChange={(e) => updateSetting('size', Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[var(--color-fg-tertiary)]">
              <span>150px</span>
              <span>600px</span>
            </div>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logoUrl" className="text-xs">
              URL do logo (opcional)
            </Label>
            <Input
              id="logoUrl"
              type="url"
              value={settings.logoUrl || ''}
              onChange={(e) => updateSetting('logoUrl', e.target.value || null)}
              placeholder="https://exemplo.com/logo.png"
            />
            <p className="text-xs text-[var(--color-fg-tertiary)]">
              Adiciona um logo central ao QR code. Use imagens com fundo transparente.
            </p>
          </div>
        </>
      )}

      {/* Download Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={downloadPNG}
          disabled={!qrDataUrl || isGenerating}
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar PNG
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={downloadSVG}
          disabled={!qrSvgString || isGenerating}
          className="flex-1"
        >
          <Image className="h-4 w-4 mr-2" />
          Baixar SVG
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          disabled={!qrDataUrl}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Hidden canvas for additional processing if needed */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default QRCodeGenerator;