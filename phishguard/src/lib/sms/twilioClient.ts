/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Twilio SMS Client
 *
 * Provides SMS sending capabilities via Twilio REST API.
 * All API calls are stubbed - implement actual HTTP requests when ready.
 *
 * Rate Limiting Notes (Twilio 10DLC):
 * - US 10DLC: 1 SMS/second per phone number, 10 CPS aggregate
 * - International: Varies by country
 * - Implement exponential backoff on 429 responses
 * - Queue messages if approaching rate limits
 */

// ============================================================================
// Types
// ============================================================================

export interface TwilioConfig {
  accountSid: string;
  authToken: string; // Should be encrypted at rest
  fromNumber: string; // E.164 format, e.g., +15551234567
}

export interface SendSMSOptions {
  to: string; // E.164 format
  message: string;
  config: TwilioConfig;
  /**
   * Optional campaign ID for tracking.
   * Maps to Twilio Messaging Service SID for routing.
   */
  campaignId?: string;
  /**
   * Optional status callback URL for delivery receipts.
   * If not provided, uses default webhook configured in Twilio console.
   */
  statusCallback?: string;
}

export interface SendSMSResult {
  messageSid: string; // Twilio Message SID (SM...)
  status: 'queued' | 'sent' | 'failed';
  errorCode?: string;
  errorMessage?: string;
}

export type DeliveryStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'undelivered'
  | 'failed'
  | 'receiving'
  | 'received';

export interface DeliveryWebhookPayload {
  MessageSid: string;
  MessageStatus: DeliveryStatus;
  To: string;
  From: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  /**
   * Unix timestamp when the status changed.
   */
  DateUpdated?: string;
}

export interface DeliveryWebhookResult {
  messageSid: string;
  status: DeliveryStatus;
  isError: boolean;
  errorCode?: string;
  processedAt: string;
}

export interface OptOutResult {
  phoneNumber: string;
  optedOut: boolean;
  reason: 'stop_keyword' | 'blocked' | 'unsubscribed';
}

// ============================================================================
// Rate Limiting State
// ============================================================================

/**
 * Simple in-memory rate limiter.
 * For production, use Redis or similar distributed store.
 */
let lastSentTime = 0;
const MIN_INTERVAL_MS = 1000; // 1 message per second (10DLC limit)

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Send an SMS via Twilio REST API.
 *
 * @example
 * ```typescript
 * const result = await sendSMS({
 *   to: '+5511987654321',
 *   message: 'Your security training is ready',
 *   config: {
 *     accountSid: process.env.TWILIO_ACCOUNT_SID!,
 *     authToken: process.env.TWILIO_AUTH_TOKEN!,
 *     fromNumber: process.env.TWILIO_FROM_NUMBER!,
 *   },
 *   campaignId: 'MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
 * });
 * ```
 *
 * TODO: Implement actual Twilio API call
 * POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
 *
 * Request body:
 * - To: recipient phone in E.164
 * - From: Twilio phone number
 * - Body: message content
 * - MessagingServiceSid: if using messaging service
 * - StatusCallback: webhook URL for delivery updates
 */
export async function sendSMS(options: SendSMSOptions): Promise<SendSMSResult> {

  // Validate E.164 format
  if (!/^\+[1-9]\d{1,14}$/.test(to)) {
    return {
      messageSid: '',
      status: 'failed',
      errorCode: 'INVALID_PHONE_NUMBER',
      errorMessage: 'Phone number must be in E.164 format',
    };
  }

  // Rate limiting: ensure minimum interval between messages
  const now = Date.now();
  const timeSinceLastSend = now - lastSentTime;
  if (timeSinceLastSend < MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - timeSinceLastSend));
  }

  // TODO: Replace with actual Twilio API call
  // const response = await fetch(
  //   `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
  //   {
  //     method: 'POST',
  //     headers: {
  //       'Authorization': `Basic ${btoa(`${config.accountSid}:${config.authToken}`)}`,
  //       'Content-Type': 'application/x-www-form-urlencoded',
  //     },
  //     body: new URLSearchParams({
  //       To: to,
  //       From: config.fromNumber,
  //       Body: message,
  //       ...(campaignId && { MessagingServiceSid: campaignId }),
  //       ...(statusCallback && { StatusCallback: statusCallback }),
  //     }),
  //   }
  // );
  //
  // if (!response.ok) {
  //   const error = await response.json();
  //   return {
  //     messageSid: '',
  //     status: 'failed',
  //     errorCode: error.code?.toString(),
  //     errorMessage: error.message,
  //   };
  // }
  //
  // const data = await response.json();
  // lastSentTime = Date.now();
  //
  // return {
  //   messageSid: data.sid,
  //   status: data.status,
  // };

  // Stubbed response for development
  lastSentTime = Date.now();
  return {
    messageSid: `SM${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    status: 'queued',
  };
}

/**
 * Handle incoming delivery status webhook from Twilio.
 *
 * Twilio sends status callbacks to your StatusCallback URL when message
 * status changes (queued, sent, delivered, undelivered, failed).
 *
 * @example
 * ```typescript
 * // In your webhook handler:
 * app.post('/webhooks/twilio/delivery', async (req, res) => {
 *   const result = handleDeliveryWebhook(req.body);
 *   // Update campaign_target status in database
 *   await updateTargetStatus(result.messageSid, result.status);
 *   res.sendStatus(200);
 * });
 * ```
 *
 * TODO: Verify webhook signature to ensure authenticity:
 * - Extract X-Twilio-Signature header
 * - Compute HMAC-SHA1 of request URL + form params
 * - Compare with signature using authToken
 */
export function handleDeliveryWebhook(
  payload: DeliveryWebhookPayload
): DeliveryWebhookResult {
  const {
    MessageSid,
    MessageStatus,
    ErrorCode,

  } = payload;

  const isError = MessageStatus === 'failed' || MessageStatus === 'undelivered';

  // TODO: Validate webhook signature
  // TODO: Persist status update to database
  // TODO: Trigger notifications if needed (e.g., failed delivery alert)

  return {
    messageSid: MessageSid,
    status: MessageStatus,
    isError,
    errorCode: ErrorCode,
    processedAt: new Date().toISOString(),
  };
}

/**
 * Handle opt-out (STOP keyword) from SMS recipients.
 *
 * When a recipient texts "STOP", "UNSUBSCRIBE", "CANCEL", etc.,
 * Twilio forwards this to your messaging service's callback URL.
 *
 * Per TCPA and Twilio 10DLC requirements:
 * - Immediately stop all messaging to this number
 * - Add to do-not-contact list
 * - Maintain opt-out record for compliance (7+ years)
 *
 * @example
 * ```typescript
 * // In your opt-out webhook handler:
 * app.post('/webhooks/twilio/optout', async (req, res) => {
 *   const result = handleOptOut(req.body.From);
 *   // Remove from campaign target lists
 *   // Add to company do-not-contact list
 *   await addToDoNotContact(result.phoneNumber);
 *   res.sendStatus(200);
 * });
 * ```
 *
 * TODO: Implement actual suppression:
 * - POST to Twilio's Do Not Contact API
 * - Update local database
 * - Remove from active campaign queues
 */
export async function handleOptOut(phoneNumber: string): Promise<OptOutResult> {
  // Validate E.164 format
  if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
    throw new Error('Invalid phone number format');
  }

  // TODO: Implement actual suppression
  // 1. Add to Twilio's Do Not Contact list:
  //    POST https://api.twilio.com/.../Accounts/{AccountSid}/Services/{ServiceSid}/DoNotContact
  //
  // 2. Remove from all active campaign queues in local DB
  //
  // 3. Add to company-level do-not-contact list for compliance
  //
  // 4. Log the opt-out for audit trail

  // TODO: For now, just return stub. Implement actual suppression.
  console.log(`[TwilioClient] Opt-out received for: ${phoneNumber}`);

  return {
    phoneNumber,
    optedOut: true,
    reason: 'stop_keyword',
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a phone number is in E.164 format.
 *
 * E.164 format: +[country code][subscriber number]
 * Examples: +15551234567, +5511987654321
 */
export function isValidE164(phoneNumber: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phoneNumber);
}

/**
 * Format a phone number to E.164 if not already formatted.
 *
 * @param phoneNumber - Local or international format
 * @param countryCode - ISO 3166-1 alpha-2 code (e.g., 'BR', 'US')
 */
export function formatToE164(phoneNumber: string, countryCode: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Already has + prefix
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }

  // US/Canada: assume +1
  if (countryCode === 'US' || countryCode === 'CA') {
    return `+1${cleaned}`;
  }

  // TODO: Implement country-code mapping for other countries
  return `+${cleaned}`;
}

// ============================================================================
// Default Export
// ============================================================================

const twilioClient = {
  sendSMS,
  handleDeliveryWebhook,
  handleOptOut,
  isValidE164,
  formatToE164,
};

export default twilioClient;
