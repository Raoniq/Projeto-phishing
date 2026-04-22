// workers/email/smtp-mock.ts — Mock SMTP client (placeholder para Zeptomail)
import type { EmailJob, EmailSendResult } from './types';

// Mock configuration - logs instead of sending
const MOCK_DELAY_MS = 50; // Simulate network latency

interface MockSmtpConfig {
  mockMode: boolean;
  logToConsole: boolean;
  simulateFailures: boolean;
  failureRate: number; // 0-1
}

const config: MockSmtpConfig = {
  mockMode: true, // Always true for MVP
  logToConsole: true,
  simulateFailures: false,
  failureRate: 0.0,
};

// Generate unique message ID
function generateMessageId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@zeptomail.phishguard`;
}

// Simulate async send delay
async function simulateSendDelay(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
}

// Log email to console (dev mode)
function logEmail(job: EmailJob, result: EmailSendResult): void {
  const status = result.success ? '✅ SENT' : '❌ FAILED';
  const msgId = result.messageId ?? 'N/A';
  const bounceInfo = result.bounced ? ` [BOUNCE: ${result.bouncedReason}]` : '';

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  EMAIL MOCK SMTP                                             ║
╠══════════════════════════════════════════════════════════════╣
║  ID:      ${job.id}
║  To:      ${job.to}
║  From:    ${job.from}
║  Subject: ${job.subject}
║  Status:  ${status} (${msgId})${bounceInfo}
║  Target:  ${job.campaignTargetId}
║  Priority: ${job.priority}
╚══════════════════════════════════════════════════════════════╝
  `);
}

// Log bounce event
function logBounce(job: EmailJob, bounceType: 'hard' | 'soft', reason: string): void {
  console.log(`
┌─────────────────────────────────────────────────────────────┐
│  EMAIL BOUNCE MOCK                                          │
├─────────────────────────────────────────────────────────────┤
│  Type:   ${bounceType.toUpperCase()}                                                │
│  To:     ${job.to}                                        │
│  Reason: ${reason}                                        │
│  Job:    ${job.id}                                        │
└─────────────────────────────────────────────────────────────┘
  `);
}

// Simulate random failure (for testing rate limiting)
function shouldSimulateFailure(): boolean {
  return config.simulateFailures && Math.random() < config.failureRate;
}

/**
 * Mock SMTP client - placeholder for Zeptomail integration
 * 
 * In production, replace this with actual Zeptomail API:
 * - Zeptomail uses batch send API
 * - Authentication via API key (not SMTP)
 * - Supports templates, tracking, bounce handling
 */
export class SmtpMockClient {
  private apiKey: string;
  private fromAddress: string;

  constructor(apiKey: string = 'mock-api-key', fromAddress: string = 'noreply@phishguard.com.br') {
    this.apiKey = apiKey;
    this.fromAddress = fromAddress;
  }

  /**
   * Send email via mock SMTP
   * In production, this would call Zeptomail API
   */
  async send(job: EmailJob): Promise<EmailSendResult> {
    // Simulate network latency
    await simulateSendDelay();

    // Simulate random failures for testing (disabled by default)
    if (shouldSimulateFailure()) {
      return {
        success: false,
        messageId: generateMessageId(),
        error: 'Simulated network failure',
        bounced: false,
      };
    }

    // Generate message ID (would be returned by Zeptomail in production)
    const messageId = generateMessageId();

    // Determine bounce status (mock - 2% bounce rate for invalid emails)
    const isBounced = this.shouldBounce(job.to);

    if (isBounced) {
      const bounceType = job.to.includes('invalid') ? 'hard' : 'soft';
      const reason = bounceType === 'hard'
        ? 'Recipient mailbox does not exist'
        : 'Mailbox temporarily unavailable';

      logBounce(job, bounceType, reason);

      return {
        success: false,
        messageId,
        error: reason,
        bounced: true,
        bouncedReason: reason,
      };
    }

    // Success case
    const result: EmailSendResult = {
      success: true,
      messageId,
      bounced: false,
    };

    // Log to console in dev mode
    if (config.logToConsole) {
      logEmail(job, result);
    }

    return result;
  }

  /**
   * Determine if email should bounce (mock logic)
   * In production, Zeptomail handles bounce detection
   */
  private shouldBounce(email: string): boolean {
    // Hard bounce for invalid emails
    if (email.includes('invalid') || email.includes('test-invalid')) {
      return true;
    }
    // Soft bounce for temporary issues (2% random for simulation)
    if (email.includes('full') || email.includes('temp')) {
      return true;
    }
    // 0.5% random soft bounce for testing
    return Math.random() < 0.005;
  }

  /**
   * Validate email address format (basic validation)
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get mock client status
   */
  getStatus(): { connected: boolean; mode: string; provider: string } {
    return {
      connected: true,
      mode: config.mockMode ? 'mock' : 'live',
      provider: 'Zeptomail (Mock)',
    };
  }
}

// Singleton instance for convenience
export const smtpClient = new SmtpMockClient();

/**
 * Create a new mock SMTP client
 */
export function createSmtpClient(apiKey?: string, fromAddress?: string): SmtpMockClient {
  return new SmtpMockClient(apiKey, fromAddress);
}