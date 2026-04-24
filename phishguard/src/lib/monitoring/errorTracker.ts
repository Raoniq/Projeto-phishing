/**
 * Error Tracking Module
 *
 * Sentry integration wrapper with error boundary component,
 * error logging helpers, and user feedback messages.
 */

import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ErrorContext {
  userId?: string;
  campaignId?: string;
  organizationId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorWithContext extends Error {
  context?: ErrorContext;
  timestamp?: number;
  fingerprint?: string[];
}

export interface ErrorTrackerConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  enabled?: boolean;
}

export interface UserFeedbackMessage {
  title: string;
  description?: string;
  icon?: 'warning' | 'error' | 'info';
}

// ============================================================================
// Mock Sentry Integration
// ============================================================================

class MockSentryClient {
  private enabled: boolean;
  private dsn?: string;
  private environment?: string;
  private release?: string;

  constructor(config: ErrorTrackerConfig = {}) {
    this.enabled = config.enabled ?? true;
    this.dsn = config.dsn;
    this.environment = config.environment ?? 'development';
    this.release = config.release;
  }

  captureException(error: ErrorWithContext, context?: ErrorContext): string | null {
    if (!this.enabled) return null;

    const eventId = this.generateEventId();
    const enrichedError = this.enrichError(error, context);

    // In production, this would send to Sentry
    // For now, log to console in development
    if (this.environment !== 'production') {
      console.error('[ErrorTracker]', {
        eventId,
        error: enrichedError,
        context,
        timestamp: new Date().toISOString(),
      });
    }

    return eventId;
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'error', context?: ErrorContext): string | null {
    if (!this.enabled) return null;

    const eventId = this.generateEventId();

    if (this.environment !== 'production') {
      console.warn(`[ErrorTracker][${level}]`, {
        eventId,
        message,
        context,
        timestamp: new Date().toISOString(),
      });
    }

    return eventId;
  }

  setUser(userId: string, email?: string, username?: string): void {
    if (!this.enabled) return;
    console.debug('[ErrorTracker] User set:', { userId, email, username });
  }

  clearUser(): void {
    if (!this.enabled) return;
    console.debug('[ErrorTracker] User cleared');
  }

  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    if (!this.enabled) return;
    console.debug('[ErrorTracker] Breadcrumb:', { message, category, data });
  }

  private enrichError(error: ErrorWithContext, context?: ErrorContext): ErrorWithContext {
    error.timestamp = Date.now();
    error.context = { ...error.context, ...context };
    return error;
  }

  private generateEventId(): string {
    return `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ============================================================================
// Global Client Instance
// ============================================================================

let sentryClient: MockSentryClient | null = null;

export function initErrorTracker(config: ErrorTrackerConfig = {}): MockSentryClient {
  sentryClient = new MockSentryClient(config);
  return sentryClient;
}

export function getErrorTracker(): MockSentryClient {
  if (!sentryClient) {
    sentryClient = new MockSentryClient();
  }
  return sentryClient;
}

// ============================================================================
// Error Logging Helpers
// ============================================================================

export function logError(error: unknown, context?: ErrorContext): string | null {
  const client = getErrorTracker();

  if (error instanceof Error) {
    const errorWithContext = error as ErrorWithContext;
    return client.captureException(errorWithContext, context);
  }

  // Handle non-Error objects
  const genericError = new Error(String(error));
  return client.captureException(genericError, context);
}

export function logCampaignError(
  error: unknown,
  campaignId: string,
  organizationId: string,
  additionalContext?: Record<string, unknown>
): string | null {
  return logError(error, {
    campaignId,
    organizationId,
    action: 'campaign_execution',
    metadata: additionalContext,
  });
}

export function logAuthError(
  error: unknown,
  userId?: string,
  additionalContext?: Record<string, unknown>
): string | null {
  return logError(error, {
    userId,
    action: 'authentication',
    metadata: additionalContext,
  });
}

export function logApiError(
  error: unknown,
  endpoint: string,
  method: string,
  additionalContext?: Record<string, unknown>
): string | null {
  return logError(error, {
    action: 'api_request',
    component: endpoint,
    metadata: { method, ...additionalContext },
  });
}

export function logWarning(message: string, context?: ErrorContext): string | null {
  const client = getErrorTracker();
  return client.captureMessage(message, 'warning', context);
}

export function logInfo(message: string, context?: ErrorContext): string | null {
  const client = getErrorTracker();
  return client.captureMessage(message, 'info', context);
}

// ============================================================================
// Campaign Failure Alerting
// ============================================================================

export interface CampaignAlertConfig {
  campaignId: string;
  organizationId: string;
  failureType: 'email_failed' | 'sms_failed' | 'certificate_failed' | 'webhook_failed' | 'timeout';
  targetCount?: number;
  failureCount?: number;
  metadata?: Record<string, unknown>;
}

export function alertCampaignFailure(config: CampaignAlertConfig): string | null {
  const client = getErrorTracker();

  const message = `Campaign failure: ${config.failureType} for campaign ${config.campaignId}`;
  const context: ErrorContext = {
    campaignId: config.campaignId,
    organizationId: config.organizationId,
    action: 'campaign_alert',
    metadata: {
      failureType: config.failureType,
      targetCount: config.targetCount,
      failureCount: config.failureCount,
      ...config.metadata,
    },
  };

  return client.captureMessage(message, 'error', context);
}

// ============================================================================
// User Feedback Messages
// ============================================================================

const USER_FEEDBACK_MESSAGES: Record<string, UserFeedbackMessage> = {
  campaign_send_failed: {
    title: 'Falha ao enviar campanha',
    description: 'Ocorreu um erro ao enviar a campanha. Tente novamente ou entre em contato com o suporte.',
    icon: 'error',
  },
  session_expired: {
    title: 'Sessão expirada',
    description: 'Sua sessão expirou. Faça login novamente para continuar.',
    icon: 'warning',
  },
  network_error: {
    title: 'Erro de conexão',
    description: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
    icon: 'error',
  },
  generic_error: {
    title: 'Algo deu errado',
    description: 'Ocorreu um erro inesperado. Tente novamente em alguns momentos.',
    icon: 'error',
  },
  validation_error: {
    title: 'Dados inválidos',
    description: 'Verifique os dados preenchidos e tente novamente.',
    icon: 'warning',
  },
  unauthorized: {
    title: 'Acesso negado',
    description: 'Você não tem permissão para acessar este recurso.',
    icon: 'warning',
  },
  not_found: {
    title: 'Não encontrado',
    description: 'O recurso solicitado não foi encontrado.',
    icon: 'info',
  },
};

export function getUserFeedbackMessage(
  errorCode: keyof typeof USER_FEEDBACK_MESSAGES
): UserFeedbackMessage {
  return USER_FEEDBACK_MESSAGES[errorCode] ?? USER_FEEDBACK_MESSAGES.generic_error;
}

export function isUserFacingError(error: unknown): boolean {
  if (error instanceof Error) {
    const code = (error as ErrorWithContext).context?.metadata?.errorCode as string | undefined;
    return code !== undefined && code in USER_FEEDBACK_MESSAGES;
  }
  return false;
}

// ============================================================================
// React Error Boundary Component (for client-side use)
// ============================================================================

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: ErrorWithContext, errorInfo: React.ErrorInfo) => void;
  errorCode?: keyof typeof USER_FEEDBACK_MESSAGES;
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: ErrorWithContext, errorInfo: React.ErrorInfo): void {
    const enrichedError = { ...error, timestamp: Date.now() };
    logError(enrichedError, { component: errorInfo.componentStack });

    this.props.onError?.(enrichedError, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      const feedback = this.props.errorCode
        ? getUserFeedbackMessage(this.props.errorCode)
        : getUserFeedbackMessage('generic_error');

      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-4">
            {feedback.icon === 'error' && '⚠️'}
            {feedback.icon === 'warning' && '⚡'}
            {feedback.icon === 'info' && 'ℹ️'}
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">{feedback.title}</h2>
          {feedback.description && (
            <p className="mb-4 text-sm text-gray-600">{feedback.description}</p>
          )}
          <button
            onClick={this.resetError}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Module Exports
// ============================================================================
