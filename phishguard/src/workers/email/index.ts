// workers/email/index.ts — Email worker exports

export * from './types';
export { SmtpMockClient, smtpClient, createSmtpClient } from './smtp-mock';
export { EmailQueue, emailQueue, createEmailQueue } from './queue';
export { default as emailWorker } from './worker';

// Re-export worker for router
import emailWorker from './worker';
export { emailWorker };