// Landing Builder Types

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
}

export interface DeployResult {
  success: boolean;
  url?: string;
  error?: string;
  deploymentId?: string;
}