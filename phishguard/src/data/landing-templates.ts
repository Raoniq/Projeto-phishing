// Ultra-Realistic Phishing Landing Page Templates
// For security awareness training - educational purpose only
// All brands are GENERIC/FICTIOUS - no real company branding used

import type { LandingTemplate } from '../components/landing-builder/types';

// ============================================================
// EXTENDED TYPES FOR TEMPLATES
// ============================================================

export type PhishingCategory = 
  | 'banco' 
  | 'microsoft' 
  | 'google' 
  | 'ti' 
  | 'rh' 
  | 'linkedin' 
  | 'ecommerce' 
  | 'streaming';

export interface Block {
  id: string;
  type: 'header' | 'paragraph' | 'button' | 'input' | 'image' | 'divider' | 'spacer' | 'html' | 'loginForm' | 'passwordField' | 'twoFAInput' | 'phoneInput' | 'alertBox';
  props: Record<string, string | number | boolean | string[]>;
}

export interface CSSVariable {
  name: string;
  value: string;
}

export interface SuspiciousIndicator {
  type: 'url' | 'ssl' | 'domain' | 'content' | 'urgency';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface LandingPageTemplate {
  id: string;
  name: string;
  category: PhishingCategory;
  description: string;
  target_audience: string;
  blocks: Block[];
  cssVariables: CSSVariable[];
  suspiciousIndicators: SuspiciousIndicator[];
  previewColors: {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
  };
  educationalRedFlags: {
    title: string;
    bullets: string[];
  };
}

// ============================================================
// TEMPLATE 1: BANK LOGIN - Generic Banking Interface
// ============================================================

export const bankLoginTemplate: LandingPageTemplate = {
  id: 'bank-login-001',
  name: 'Bank Login - Generic Banking',
  category: 'banco',
  description: 'Ultra-realistic generic bank login page with subtle phishing indicators',
  target_audience: 'Financial department employees, accounting team',
  blocks: [
    { id: 'header-logo', type: 'image', props: { src: '/bank-logo-placeholder.png', alt: 'Bank Logo', width: 120, height: 40 } },
    { id: 'domain-bar', type: 'html', props: { content: '<div class="domain-bar">🔒 secure-banco-nacional.com | Secure Connection</div>' } },
    { id: 'header', type: 'header', props: { text: 'Banco Nacional', level: 1 } },
    { id: 'alert-urgent', type: 'alertBox', props: { variant: 'warning', icon: '⚠️', message: 'Your account has been temporarily blocked. Update your data to continue.' } },
    { id: 'subheader', type: 'paragraph', props: { text: 'Security Update Required', align: 'center' } },
    { id: 'description', type: 'paragraph', props: { text: 'We detected unusual activity on your account. To protect your funds, please verify your identity.', align: 'center' } },
    { id: 'form-agency', type: 'input', props: { label: 'Agency Number', name: 'agencia', type: 'text', placeholder: '0000', required: true } },
    { id: 'form-account', type: 'input', props: { label: 'Account Number', name: 'conta', type: 'text', placeholder: '00000-0', required: true } },
    { id: 'form-cpf', type: 'input', props: { label: 'CPF of Holder', name: 'cpf', type: 'text', placeholder: '000.000.000-00', required: true } },
    { id: 'form-password', type: 'passwordField', props: { label: 'Account Password', name: 'senha', placeholder: '••••••••', required: true } },
    { id: 'submit-btn', type: 'button', props: { text: 'Update Security Data', variant: 'primary', fullWidth: true } },
    { id: 'footer', type: 'paragraph', props: { text: '© 2026 Banco Nacional. All rights reserved. | Contact: 0800-BANCO-NAC', align: 'center', size: 'small' } },
  ],
  cssVariables: [
    { name: '--primary', value: '#1a365d' },
    { name: '--secondary', value: '#2563eb' },
    { name: '--accent', value: '#f59e0b' },
    { name: '--background', value: '#f1f5f9' },
    { name: '--text', value: '#1e293b' },
    { name: '--danger', value: '#dc2626' },
    { name: '--warning', value: '#f59e0b' },
  ],
  suspiciousIndicators: [
    { type: 'domain', message: 'Domain is "secure-banco-nacional.com" instead of official "bancnacional.com.br"', severity: 'high' },
    { type: 'url', message: 'URL shows HTTP connection indicator instead of HTTPS with valid certificate', severity: 'medium' },
    { type: 'urgency', message: 'Creates artificial urgency with "account blocked" message', severity: 'medium' },
    { type: 'content', message: 'Asks for excessive personal information (CPF, agency, account, password)', severity: 'high' },
  ],
  previewColors: {
    primary: '#1a365d',
    secondary: '#2563eb',
    background: '#f1f5f9',
    accent: '#f59e0b',
  },
  educationalRedFlags: {
    title: '🚨 Red Flags in This Phishing Page',
    bullets: [
      'Fake domain: "secure-banco-nacional.com" is NOT the official bank domain',
      'Urgency tactics: Claims account is "blocked" to panic victim',
      'Requests excessive data: Agency + Account + CPF + Password all at once',
      'No proper HTTPS certificate indicator in browser',
      'Generic bank branding without official verification',
      'No multi-factor authentication offered',
    ],
  },
};

// ============================================================
// TEMPLATE 2: MICROSOFT 365 - O365 Login Clone
// ============================================================

export const microsoft365Template: LandingPageTemplate = {
  id: 'microsoft-365-001',
  name: 'Microsoft 365 - Corporate Login',
  category: 'microsoft',
  description: 'Fake Microsoft 365 login page mimicking corporate sign-in',
  target_audience: 'All employees, especially those using Microsoft services',
  blocks: [
    { id: 'header-logo', type: 'image', props: { src: '/ms-logo-placeholder.png', alt: 'Microsoft Logo', width: 100, height: 24 } },
    { id: 'domain-bar', type: 'html', props: { content: '<div class="ms-domain-bar">🌐 office-365-auth.microsoft-verify.com</div>' } },
    { id: 'header', type: 'header', props: { text: 'Sign in', level: 1 } },
    { id: 'subheader', type: 'paragraph', props: { text: 'to access your Microsoft 365 work account', align: 'left' } },
    { id: 'form-email', type: 'input', props: { label: 'Email or phone', name: 'email', type: 'email', placeholder: 'user@company.com', required: true } },
    { id: 'form-password', type: 'passwordField', props: { label: 'Password', name: 'password', placeholder: '', required: true } },
    { id: 'submit-btn', type: 'button', props: { text: 'Sign in', variant: 'primary', fullWidth: true } },
    { id: 'captcha-box', type: 'html', props: { content: '<div class="captcha-alert">🔐 Verify you are human to continue</div>' } },
    { id: 'divider', type: 'divider', props: {} },
    { id: 'footer-text', type: 'paragraph', props: { text: 'By signing in, you agree to the Terms of Use and Privacy Statement', align: 'center', size: 'small' } },
  ],
  cssVariables: [
    { name: '--ms-primary', value: '#0078d4' },
    { name: '--ms-secondary', value: '#106ebe' },
    { name: '--ms-background', value: '#ffffff' },
    { name: '--ms-text', value: '#323130' },
    { name: '--ms-border', value: '#605e5c' },
  ],
  suspiciousIndicators: [
    { type: 'domain', message: 'Domain is "office-365-auth.microsoft-verify.com" - NOT official Microsoft domain', severity: 'high' },
    { type: 'ssl', message: 'SSL certificate is issued to different domain, not matching the page domain', severity: 'high' },
    { type: 'content', message: 'Asks for password directly without company-specific login page', severity: 'medium' },
    { type: 'url', message: 'URL contains suspicious subdomains "microsoft-verify" trying to mimic Microsoft', severity: 'high' },
  ],
  previewColors: {
    primary: '#0078d4',
    secondary: '#106ebe',
    background: '#ffffff',
    accent: '#00a4ef',
  },
  educationalRedFlags: {
    title: '🚨 Red Flags in This Phishing Page',
    bullets: [
      'Fake Microsoft domain: "office-365-auth.microsoft-verify.com" is NOT microsoft.com',
      'Look-alike domain trying to trick with "microsoft-verify" subdomain',
      'No company logo or custom branding - pure generic Microsoft clone',
      'Weak visual fidelity - missing proper Microsoft design elements',
      'No "Stay signed in" checkbox with proper Microsoft styling',
      'Fake CAPTCHA to create false sense of security',
    ],
  },
};

// ============================================================
// TEMPLATE 3: GOOGLE - Google Sign-in Clone
// ============================================================

export const googleLoginTemplate: LandingPageTemplate = {
  id: 'google-login-001',
  name: 'Google - Account Sign-in',
  category: 'google',
  description: 'Fake Google sign-in page mimicking Google authentication',
  target_audience: 'Anyone with Google/Gmail accounts, remote workers',
  blocks: [
    { id: 'google-logo', type: 'image', props: { src: '/google-logo-placeholder.svg', alt: 'Google', width: 75, height: 24 } },
    { id: 'domain-bar', type: 'html', props: { content: '<div class="g-domain-bar">👁️ accounts-google-secure.com</div>' } },
    { id: 'header', type: 'header', props: { text: 'Sign in to Google', level: 1 } },
    { id: 'subheader', type: 'paragraph', props: { text: 'Continue to Google Services', align: 'center' } },
    { id: 'form-email', type: 'input', props: { label: 'Email or phone', name: 'email', type: 'email', placeholder: 'email@gmail.com', required: true } },
    { id: 'submit-next', type: 'button', props: { text: 'Next', variant: 'primary', fullWidth: true } },
    { id: 'divider', type: 'divider', props: { text: 'or' } },
    { id: 'create-account', type: 'button', props: { text: 'Create account', variant: 'secondary', fullWidth: true } },
    { id: 'footer', type: 'paragraph', props: { text: 'By continuing, you agree to Google Terms of Service and Privacy Policy', align: 'center', size: 'small' } },
  ],
  cssVariables: [
    { name: '--google-primary', value: '#4285f4' },
    { name: '--google-secondary', value: '#34a853' },
    { name: '--google-background', value: '#ffffff' },
    { name: '--google-text', value: '#202124' },
    { name: '--google-gray', value: '#9aa0a6' },
  ],
  suspiciousIndicators: [
    { type: 'domain', message: 'Domain "accounts-google-secure.com" is NOT google.com or accounts.google.com', severity: 'high' },
    { type: 'url', message: 'URL shows suspicious domain instead of accounts.google.com', severity: 'high' },
    { type: 'content', message: 'Missing typical Google design elements and proper logo quality', severity: 'low' },
    { type: 'ssl', message: 'Certificate does not match expected Google domain', severity: 'high' },
  ],
  previewColors: {
    primary: '#4285f4',
    secondary: '#34a853',
    background: '#ffffff',
    accent: '#fbbc05',
  },
  educationalRedFlags: {
    title: '🚨 Red Flags in This Phishing Page',
    bullets: [
      'Fake Google domain: "accounts-google-secure.com" is NOT accounts.google.com',
      'Incorrect URL in browser address bar - always check for "google.com" exactly',
      'Misspelled or look-alike domains with extra words like "-secure"',
      'No secure HTTPS with valid Google certificate',
      'Poor image quality of Google logo (if used as image)',
      'Generic design without proper Google product styling',
    ],
  },
};

// ============================================================
// TEMPLATE 4: IT HELP DESK - Password Reset Portal
// ============================================================

export const itHelpDeskTemplate: LandingPageTemplate = {
  id: 'it-helpdesk-001',
  name: 'IT Help Desk - Password Reset',
  category: 'ti',
  description: 'Fake IT help desk portal with urgent security update theme',
  target_audience: 'All employees, IT support teams',
  blocks: [
    { id: 'header-logo', type: 'image', props: { src: '/it-logo-placeholder.png', alt: 'IT Support', width: 100, height: 40 } },
    { id: 'domain-bar', type: 'html', props: { content: '<div class="it-domain-bar">🔐 support.internal-it-reset.net</div>' } },
    { id: 'alert-critical', type: 'alertBox', props: { variant: 'danger', icon: '🚨', message: 'CRITICAL: Your password expires in 24 hours!' } },
    { id: 'header', type: 'header', props: { text: 'Password Reset Portal', level: 1 } },
    { id: 'subheader', type: 'paragraph', props: { text: 'Corporate IT Security Department', align: 'center' } },
    { id: 'description', type: 'paragraph', props: { text: 'Your corporate password has expired. Reset now to maintain access to all company systems including email, VPN, and shared drives.', align: 'left' } },
    { id: 'form-user', type: 'input', props: { label: 'Windows Username', name: 'username', type: 'text', placeholder: 'DOMAIN\\username', required: true } },
    { id: 'form-email', type: 'input', props: { label: 'Corporate Email', name: 'email', type: 'email', placeholder: 'user@company.com', required: true } },
    { id: 'form-code', type: 'input', props: { label: 'Verification Code', name: 'code', type: 'text', placeholder: 'Enter 6-digit code', required: true } },
    { id: 'form-new-pass', type: 'passwordField', props: { label: 'New Password', name: 'new_password', placeholder: 'Min 8 characters', required: true } },
    { id: 'form-confirm-pass', type: 'passwordField', props: { label: 'Confirm New Password', name: 'confirm_password', placeholder: 'Repeat password', required: true } },
    { id: 'submit-btn', type: 'button', props: { text: 'Reset Password Now', variant: 'primary', fullWidth: true } },
    { id: 'help-text', type: 'paragraph', props: { text: 'Need help? Contact IT Support: internal-support@company-ti.com', align: 'center', size: 'small' } },
  ],
  cssVariables: [
    { name: '--it-primary', value: '#1e1e1e' },
    { name: '--it-secondary', value: '#0078d4' },
    { name: '--it-accent', value: '#ffb900' },
    { name: '--it-background', value: '#f3f3f3' },
    { name: '--it-text', value: '#323130' },
    { name: '--it-danger', value: '#a80000' },
  ],
  suspiciousIndicators: [
    { type: 'domain', message: 'Domain "support.internal-it-reset.net" - not official company IT domain', severity: 'high' },
    { type: 'urgency', message: 'Artificial urgency with 24-hour password expiration threat', severity: 'medium' },
    { type: 'content', message: 'Requests domain\\username format combined with email and new password', severity: 'high' },
    { type: 'url', message: 'Internal IT would use internal company domain, not external reset service', severity: 'medium' },
  ],
  previewColors: {
    primary: '#1e1e1e',
    secondary: '#0078d4',
    background: '#f3f3f3',
    accent: '#ffb900',
  },
  educationalRedFlags: {
    title: '🚨 Red Flags in This Phishing Page',
    bullets: [
      'Fake IT domain: "support.internal-it-reset.net" - NOT official company IT',
      'Real IT never asks for password through external forms',
      'Fake urgency: Real IT gives advance notice and doesn\'t block suddenly',
      'Requests multiple credentials at once (username, email, new password)',
      'External domain instead of company-internal portal',
      'No proper IT ticketing system reference number',
    ],
  },
};

// ============================================================
// TEMPLATE 5: HR PORTAL - Employee Document Portal
// ============================================================

export const hrPortalTemplate: LandingPageTemplate = {
  id: 'hr-portal-001',
  name: 'HR Portal - Document Access',
  category: 'rh',
  description: 'Fake HR portal with employee ID and urgent policy message',
  target_audience: 'All employees, HR department',
  blocks: [
    { id: 'hr-logo', type: 'image', props: { src: '/hr-logo-placeholder.png', alt: 'HR Portal', width: 120, height: 40 } },
    { id: 'domain-bar', type: 'html', props: { content: '<div class="hr-domain-bar">📋 hr-portal-corporate.com</div>' } },
    { id: 'alert-new', type: 'alertBox', props: { variant: 'info', icon: '📢', message: 'NEW: Updated Employee Handbook 2026 - Action Required' } },
    { id: 'header', type: 'header', props: { text: 'HR Employee Portal', level: 1 } },
    { id: 'subheader', type: 'paragraph', props: { text: 'Confidential Employee Document Access', align: 'center' } },
    { id: 'description', type: 'paragraph', props: { text: 'You have pending documents to review and acknowledge. Please verify your identity to access the new employee policies and benefits updates.', align: 'left' } },
    { id: 'timer-banner', type: 'html', props: { content: '<div class="deadline-banner">⏰ Deadline: You have 48 hours to acknowledge - failure may affect payroll</div>' } },
    { id: 'form-employee-id', type: 'input', props: { label: 'Employee ID', name: 'employee_id', type: 'text', placeholder: 'EMP-000000', required: true } },
    { id: 'form-email', type: 'input', props: { label: 'Corporate Email', name: 'email', type: 'email', placeholder: 'name.lastname@company.com', required: true } },
    { id: 'form-password', type: 'passwordField', props: { label: 'HR Portal Password', name: 'password', placeholder: '••••••••', required: true } },
    { id: 'submit-btn', type: 'button', props: { text: 'Access Employee Portal', variant: 'primary', fullWidth: true } },
    { id: 'footer', type: 'paragraph', props: { text: 'Human Resources Department © 2026 | Confidential - Internal Use Only', align: 'center', size: 'small' } },
  ],
  cssVariables: [
    { name: '--hr-primary', value: '#0f766e' },
    { name: '--hr-secondary', value: '#14b8a6' },
    { name: '--hr-background', value: '#f0fdfa' },
    { name: '--hr-text', value: '#1e293b' },
    { name: '--hr-accent', value: '#f59e0b' },
  ],
  suspiciousIndicators: [
    { type: 'domain', message: 'Domain "hr-portal-corporate.com" - not official company HR domain', severity: 'high' },
    { type: 'urgency', message: 'Threat to affect payroll to force quick compliance', severity: 'high' },
    { type: 'content', message: 'HR would never ask for password through external form - internal portal only', severity: 'high' },
    { type: 'url', message: 'External HR portal is suspicious - company HR should be internal', severity: 'medium' },
  ],
  previewColors: {
    primary: '#0f766e',
    secondary: '#14b8a6',
    background: '#f0fdfa',
    accent: '#f59e0b',
  },
  educationalRedFlags: {
    title: '🚨 Red Flags in This Phishing Page',
    bullets: [
      'Fake HR domain: "hr-portal-corporate.com" - NOT official company HR',
      'Real HR uses internal company portal with company email only',
      'Threat to affect payroll is a pressure tactic - real HR gives proper notice',
      'External HR form is always suspicious - company HR is internal',
      'No specific employee name or department - generic blast',
      'Fake deadline to prevent careful examination',
    ],
  },
};

// ============================================================
// TEMPLATE 6: LINKEDIN - LinkedIn Login Clone
// ============================================================

export const linkedInLoginTemplate: LandingPageTemplate = {
  id: 'linkedin-login-001',
  name: 'LinkedIn - Professional Network',
  category: 'linkedin',
  description: 'Fake LinkedIn login page mimicking professional network',
  target_audience: 'Business professionals, job seekers, recruiters',
  blocks: [
    { id: 'linkedin-logo', type: 'image', props: { src: '/linkedin-logo-placeholder.png', alt: 'LinkedIn', width: 120, height: 34 } },
    { id: 'domain-bar', type: 'html', props: { content: '<div class="li-domain-bar">🔒 linkedin-secure-auth.com</div>' } },
    { id: 'header', type: 'header', props: { text: 'Sign in', level: 1 } },
    { id: 'subheader', type: 'paragraph', props: { text: 'to continue to LinkedIn', align: 'center' } },
    { id: 'form-email', type: 'input', props: { label: 'Email or phone', name: 'email', type: 'email', placeholder: 'email@example.com', required: true } },
    { id: 'form-password', type: 'passwordField', props: { label: 'Password', name: 'password', placeholder: '', required: true } },
    { id: 'forgot-password', type: 'html', props: { content: '<a href="#" class="forgot-link">Forgot password?</a>' } },
    { id: 'submit-btn', type: 'button', props: { text: 'Sign in', variant: 'primary', fullWidth: true } },
    { id: 'divider', type: 'divider', props: { text: 'New to LinkedIn?' } },
    { id: 'join-btn', type: 'button', props: { text: 'Join now', variant: 'secondary', fullWidth: true } },
    { id: 'footer', type: 'paragraph', props: { text: '© 2026 LinkedIn Corporation. All rights reserved.', align: 'center', size: 'small' } },
  ],
  cssVariables: [
    { name: '--li-primary', value: '#0a66c2' },
    { name: '--li-secondary', value: '#0077b5' },
    { name: '--li-background', value: '#f4f2ee' },
    { name: '--li-text', value: '#000000' },
    { name: '--li-gray', value: '#666666' },
  ],
  suspiciousIndicators: [
    { type: 'domain', message: 'Domain "linkedin-secure-auth.com" is NOT linkedin.com', severity: 'high' },
    { type: 'url', message: 'URL does not contain linkedin.com - always verify in browser', severity: 'high' },
    { type: 'ssl', message: 'SSL certificate mismatch - real LinkedIn uses proper certificates', severity: 'high' },
    { type: 'content', message: 'Slightly off color or typography compared to real LinkedIn', severity: 'low' },
  ],
  previewColors: {
    primary: '#0a66c2',
    secondary: '#0077b5',
    background: '#f4f2ee',
    accent: '#0a66c2',
  },
  educationalRedFlags: {
    title: '🚨 Red Flags in This Phishing Page',
    bullets: [
      'Fake LinkedIn domain: "linkedin-secure-auth.com" - NOT linkedin.com',
      'Always check browser URL bar for exact "linkedin.com" domain',
      'Look-alike domains with extra words like "-secure" are fake',
      'Real LinkedIn uses proper HTTPS with valid certificate for linkedin.com',
      'Professional networking sites are common phishing targets',
      'Never enter LinkedIn credentials from email links - go directly to linkedin.com',
    ],
  },
};

// ============================================================
// TEMPLATE 7: E-COMMERCE CHECKOUT - Payment Verification
// ============================================================

export const ecommerceCheckoutTemplate: LandingPageTemplate = {
  id: 'ecommerce-checkout-001',
  name: 'E-commerce - Checkout Verification',
  category: 'ecommerce',
  description: 'Fake e-commerce checkout page with identity verification prompt',
  target_audience: 'Online shoppers, anyone making purchases',
  blocks: [
    { id: 'store-logo', type: 'image', props: { src: '/store-logo-placeholder.png', alt: 'MegaStore', width: 120, height: 40 } },
    { id: 'domain-bar', type: 'html', props: { content: '<div class="ec-domain-bar">🛒 checkout.megastore-secure.com</div>' } },
    { id: 'alert-order', type: 'alertBox', props: { variant: 'warning', icon: '📦', message: 'Order #ORD-2026-8934 - Action Required: Verify your identity to ship' } },
    { id: 'header', type: 'header', props: { text: 'Verify Your Identity', level: 1 } },
    { id: 'subheader', type: 'paragraph', props: { text: 'Complete identity verification to receive your order', align: 'center' } },
    { id: 'description', type: 'paragraph', props: { text: 'We detected unusual activity on your account. For your security, please verify your identity to complete this purchase and avoid order cancellation.', align: 'left' } },
    { id: 'form-name', type: 'input', props: { label: 'Full Name on Card', name: 'full_name', type: 'text', placeholder: 'John Doe', required: true } },
    { id: 'form-card', type: 'input', props: { label: 'Card Number', name: 'card_number', type: 'text', placeholder: '0000 0000 0000 0000', required: true } },
    { id: 'form-expiry', type: 'input', props: { label: 'Expiry Date', name: 'expiry', type: 'text', placeholder: 'MM/YY', required: true } },
    { id: 'form-cvv', type: 'input', props: { label: 'CVV', name: 'cvv', type: 'text', placeholder: '000', required: true } },
    { id: 'form-email', type: 'input', props: { label: 'Billing Email', name: 'email', type: 'email', placeholder: 'billing@email.com', required: true } },
    { id: 'form-password', type: 'passwordField', props: { label: 'Account Password (to verify identity)', name: 'password', placeholder: '••••••••', required: false } },
    { id: 'submit-btn', type: 'button', props: { text: 'Verify & Complete Purchase', variant: 'primary', fullWidth: true } },
    { id: 'security-badge', type: 'html', props: { content: '<div class="security-info">🔒 256-bit SSL Encrypted | Secure Checkout</div>' } },
    { id: 'footer', type: 'paragraph', props: { text: '© 2026 MegaStore Brasil. All rights reserved. | Privacy Policy | Terms of Service', align: 'center', size: 'small' } },
  ],
  cssVariables: [
    { name: '--ec-primary', value: '#ea580c' },
    { name: '--ec-secondary', value: '#c2410c' },
    { name: '--ec-background', value: '#fff7ed' },
    { name: '--ec-text', value: '#1e293b' },
    { name: '--ec-accent', value: '#f97316' },
  ],
  suspiciousIndicators: [
    { type: 'domain', message: 'Domain "checkout.megastore-secure.com" - not official MegaStore domain', severity: 'high' },
    { type: 'content', message: 'Asking for account password along with payment card details', severity: 'high' },
    { type: 'urgency', message: 'Creating fake urgency about order cancellation to prevent careful review', severity: 'medium' },
    { type: 'ssl', message: 'Fake SSL badge - real sites have proper certificates from known authorities', severity: 'medium' },
  ],
  previewColors: {
    primary: '#ea580c',
    secondary: '#c2410c',
    background: '#fff7ed',
    accent: '#f97316',
  },
  educationalRedFlags: {
    title: '🚨 Red Flags in This Phishing Page',
    bullets: [
      'Fake store domain: "checkout.megastore-secure.com" - NOT official store',
      'Legitimate stores NEVER ask for your account password during checkout',
      'Real stores use their official domain for checkout, not subdomains',
      'Fake urgency about order cancellation is a pressure tactic',
      'Never combine payment info with account password requests',
      'Check URL carefully - legitimate stores have proper domain names',
    ],
  },
};

// ============================================================
// TEMPLATE 8: NETFLIX-STYLE - Streaming Service Login
// ============================================================

export const streamingLoginTemplate: LandingPageTemplate = {
  id: 'streaming-login-001',
  name: 'Streaming Service - Login',
  category: 'streaming',
  description: 'Fake streaming service login page mimicking Netflix-style platforms',
  target_audience: 'Consumers who use streaming services, entertainment teams',
  blocks: [
    { id: 'streaming-logo', type: 'image', props: { src: '/streaming-logo-placeholder.png', alt: 'StreamFlix', width: 120, height: 40 } },
    { id: 'domain-bar', type: 'html', props: { content: '<div class="stream-domain-bar">🎬 streamflix-account.com</div>' } },
    { id: 'header', type: 'header', props: { text: 'Sign In', level: 1 } },
    { id: 'subheader', type: 'paragraph', props: { text: 'to access your StreamFlix account', align: 'center' } },
    { id: 'alert-payment', type: 'alertBox', props: { variant: 'warning', icon: '💳', message: 'Payment verification required: Update your billing information to continue watching' } },
    { id: 'form-email', type: 'input', props: { label: 'Email', name: 'email', type: 'email', placeholder: 'email@example.com', required: true } },
    { id: 'form-password', type: 'passwordField', props: { label: 'Password', name: 'password', placeholder: '', required: true } },
    { id: 'submit-btn', type: 'button', props: { text: 'Sign In', variant: 'primary', fullWidth: true } },
    { id: 'forgot-password', type: 'html', props: { content: '<a href="#" class="forgot-link">Forgot password?</a>' } },
    { id: 'divider', type: 'divider', props: {} },
    { id: 'new-account', type: 'paragraph', props: { text: 'New to StreamFlix? Sign up now', align: 'center' } },
    { id: 'footer', type: 'paragraph', props: { text: 'By signing in, you agree to our Terms of Use and Privacy Policy.', align: 'center', size: 'small' } },
  ],
  cssVariables: [
    { name: '--stream-primary', value: '#e50914' },
    { name: '--stream-secondary', value: '#b81d24' },
    { name: '--stream-background', value: '#141414' },
    { name: '--stream-text', value: '#ffffff' },
    { name: '--stream-gray', value: '#8c8c8c' },
  ],
  suspiciousIndicators: [
    { type: 'domain', message: 'Domain "streamflix-account.com" - NOT official streaming service', severity: 'high' },
    { type: 'urgency', message: 'Fake payment verification to steal billing information', severity: 'high' },
    { type: 'url', message: 'URL does not match official streaming service domain', severity: 'high' },
    { type: 'content', message: 'Dark background similar to real streaming services to appear authentic', severity: 'low' },
  ],
  previewColors: {
    primary: '#e50914',
    secondary: '#b81d24',
    background: '#141414',
    accent: '#e50914',
  },
  educationalRedFlags: {
    title: '🚨 Red Flags in This Phishing Page',
    bullets: [
      'Fake streaming domain: "streamflix-account.com" - NOT official service',
      'Real streaming services use proper domain names with valid certificates',
      'Fake payment verification alerts are common phishing tactics',
      'Entertainment accounts are high-value targets for credential theft',
      'Always navigate directly to streaming sites, never through email links',
      'Check URL carefully - legitimate services use proper domain names',
    ],
  },
};

// ============================================================
// EXPORTS - All Templates Array
// ============================================================

export const LANDING_TEMPLATES: LandingPageTemplate[] = [
  bankLoginTemplate,
  microsoft365Template,
  googleLoginTemplate,
  itHelpDeskTemplate,
  hrPortalTemplate,
  linkedInLoginTemplate,
  ecommerceCheckoutTemplate,
  streamingLoginTemplate,
];

export const TEMPLATE_CATEGORIES: Record<PhishingCategory, string> = {
  banco: '🏦 Bank',
  microsoft: '📧 Microsoft 365',
  google: '🔍 Google',
  ti: '💻 IT Help Desk',
  rh: '👥 HR Portal',
  linkedin: '💼 LinkedIn',
  ecommerce: '🛒 E-commerce',
  streaming: '🎬 Streaming',
};

export function getTemplateById(id: string): LandingPageTemplate | undefined {
  return LANDING_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: PhishingCategory): LandingPageTemplate[] {
  return LANDING_TEMPLATES.filter(t => t.category === category);
}

// ============================================================
// COMPATIBILITY EXPORT - Converts to legacy LandingTemplate format
// ============================================================

export function toLegacyTemplate(template: LandingPageTemplate): LandingTemplate {
  return {
    id: template.id,
    name: template.name,
    category: 'banco', // falls back to banco for compatibility
    description: template.description,
    target_audience: template.target_audience,
    colorScheme: {
      primary: template.previewColors.primary,
      secondary: template.previewColors.secondary,
      accent: template.previewColors.accent,
      background: template.previewColors.background,
      text: '#1e293b',
    },
    fields: template.blocks
      .filter(b => b.type === 'input' || b.type === 'passwordField')
      .map(b => ({
        id: b.id,
        label: (b.props.label as string) || '',
        name: (b.props.name as string) || '',
        type: b.type === 'passwordField' ? 'password' : ((b.props.type as string) || 'text'),
        placeholder: (b.props.placeholder as string) || '',
        required: (b.props.required as boolean) ?? true,
        autocomplete: 'off',
      })),
    branding: {
      companyName: template.name.split(' - ')[0] || template.name,
      fakeDomain: template.suspiciousIndicators.find(s => s.type === 'domain')?.message.split('is "')[1]?.split('"')[0] || 'unknown-domain.com',
    },
    content: {
      headline: template.blocks.find(b => b.type === 'header')?.props.text as string || template.name,
      subheadline: template.blocks.find(b => b.type === 'paragraph')?.props.text as string || '',
      body: template.blocks.find(b => b.type === 'alertBox')?.props.message as string || '',
      ctaText: template.blocks.find(b => b.type === 'button')?.props.text as string || 'Submit',
      footerText: '© 2026 PhishGuard Simulation',
    },
    elements: [],
  };
}