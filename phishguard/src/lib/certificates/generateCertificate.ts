/**
 * Certificate Generation Module
 *
 * Generates PDF certificates for training track completion using pdfkit.
 * Includes: organization logo, recipient name, track name, completion date,
 * expiry date, unique certificate number, and QR code for verification.
 */

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { createAdminClient } from '@/workers/_lib/supabase-admin';

// =============================================================================
// TYPES
// =============================================================================

export interface CertificateData {
  userId: string;
  trackId: string;
  recipientName: string;
  recipientEmail: string;
  trackName: string;
  trackCategory: string;
  companyName: string;
  companyLogoUrl?: string;
  completedAt: Date;
  expiresAt: Date;
  verificationUrl: string;
}

export interface CertificateGenerateResult {
  success: boolean;
  certificateId?: string;
  certificateNumber?: string;
  pdfUrl?: string;
  error?: string;
}

// =============================================================================
// CERTIFICATE NUMBER GENERATION
// =============================================================================

/**
 * Generate a unique certificate number.
 * Format: PG-YYYY-XXXXXX where YYYY is year and XXXXXX is random
 */
export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PG-${year}-${random}`;
}

// =============================================================================
// QR CODE GENERATION
// =============================================================================

/**
 * Generate QR code as data URL for embedding in PDF.
 */
async function generateQRCodeDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 100,
    margin: 1,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

// =============================================================================
// PDF GENERATION
// =============================================================================

/**
 * Generate PDF certificate as a Buffer.
 */
async function generatePDFBuffer(
  data: CertificateData,
  qrCodeDataUrl: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8fafc');

    // Border
    doc
      .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
      .lineWidth(2)
      .stroke('#1a1a2e');

    // Inner border
    doc
      .rect(40, 40, doc.page.width - 80, doc.page.height - 80)
      .lineWidth(1)
      .stroke('#e2e8f0');

    // Header accent bar
    doc.rect(40, 40, doc.page.width - 80, 8).fill('#3b82f6');

    // Organization name
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#64748b')
      .text('PHISHGUARD', 0, 70, { align: 'center' });

    // Certificate title
    doc
      .font('Helvetica-Bold')
      .fontSize(42)
      .fillColor('#1a1a2e')
      .text('CERTIFICADO', 0, 110, { align: 'center' });

    // Subtitle
    doc
      .font('Helvetica')
      .fontSize(16)
      .fillColor('#64748b')
      .text('de conclusão de treinamento', 0, 160, { align: 'center' });

    // Recipient name
    doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor('#1a1a2e')
      .text(data.recipientName, 0, 210, { align: 'center' });

    // "for successfully completing" text
    doc
      .font('Helvetica')
      .fontSize(14)
      .fillColor('#64748b')
      .text('por concluir com êxito o treinamento', 0, 250, { align: 'center' });

    // Track name
    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#3b82f6')
      .text(data.trackName, 0, 280, { align: 'center' });

    // Category badge
    const categoryText = `[ ${data.trackCategory} ]`;
    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor('#94a3b8')
      .text(categoryText, 0, 310, { align: 'center' });

    // Dates section
    const dateY = 360;
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#64748b');

    // Completion date
    const completedDateStr = data.completedAt.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    doc.text(`Data de conclusão:`, 100, dateY, { width: 200 });
    doc
      .font('Helvetica-Bold')
      .fillColor('#1a1a2e')
      .text(completedDateStr, 300, dateY, { width: 200 });

    // Expiry date
    doc
      .font('Helvetica')
      .fillColor('#64748b')
      .text(`Validade:`, 100, dateY + 20, { width: 200 });
    const expiresDateStr = data.expiresAt.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    doc
      .font('Helvetica-Bold')
      .fillColor('#1a1a2e')
      .text(expiresDateStr, 300, dateY + 20, { width: 200 });

    // QR Code
    if (qrCodeDataUrl) {
      doc.image(qrCodeDataUrl, doc.page.width - 170, doc.page.height - 170, {
        width: 100,
      });

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#94a3b8')
        .text('Verificar', doc.page.width - 170, doc.page.height - 65, {
          width: 100,
          align: 'center',
        });
    }

    // Certificate number (bottom)
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#94a3b8')
      .text(
        `Certificado nº: ${data.recipientEmail}-${data.trackId}`,
        0,
        doc.page.height - 60,
        { align: 'center' }
      );

    // Footer
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#cbd5e1')
      .text(
        'PhishGuard - Sistema de treinamento anti-phishing',
        0,
        doc.page.height - 40,
        { align: 'center' }
      );

    doc.end();
  });
}

// =============================================================================
// SUPABASE STORAGE UPLOAD (STUB)
// =============================================================================

/**
 * Upload PDF to Supabase Storage.
 * STUB: Requires bucket 'certificates' to be created in Supabase.
 */
async function uploadToSupabaseStorage(
  buffer: Buffer,
  certificateNumber: string,
  companyId: string
): Promise<string> {
  // TODO: Implement Supabase Storage upload
  // const supabase = createAdminClient(env);
  // const fileName = `certificates/${companyId}/${certificateNumber}.pdf`;
  //
  // const { data, error } = await supabase.storage
  //   .from('certificates')
  //   .upload(fileName, buffer, {
  //     contentType: 'application/pdf',
  //     upsert: true,
  //   });
  //
  // if (error) throw error;
  //
  // const { data: urlData } = supabase.storage
  //   .from('certificates')
  //   .getPublicUrl(fileName);
  //
  // return urlData.publicUrl;

  // Placeholder return until Supabase Storage is configured
  return `https://placeholder.supabase.co/storage/v1/object/public/certificates/${companyId}/${certificateNumber}.pdf`;
}

// =============================================================================
// MAIN CERTIFICATE GENERATION FUNCTION
// =============================================================================

/**
 * Generate a completion certificate for a training track.
 *
 * @param data - Certificate data including user, track, and company info
 * @param env - Cloudflare Workers environment with Supabase credentials
 * @returns Result with certificate details or error
 */
export async function generateCertificate(
  data: CertificateData,
  env: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
): Promise<CertificateGenerateResult> {
  try {
    // Generate unique certificate number
    const certificateNumber = generateCertificateNumber();

    // Generate QR code for verification
    const verificationUrl = `${data.verificationUrl}/verify/${certificateNumber}`;
    const qrCodeDataUrl = await generateQRCodeDataUrl(verificationUrl);

    // Generate PDF buffer
    const pdfBuffer = await generatePDFBuffer(data, qrCodeDataUrl);

    // Upload to Supabase Storage
    const pdfUrl = await uploadToSupabaseStorage(
      pdfBuffer,
      certificateNumber,
      data.recipientEmail // Using email as company identifier in stub
    );

    // Create admin client for database operations
    const supabase = createAdminClient(env);

    // Insert certificate record
    const { data: certificate, error: insertError } = await supabase
      .from('certificates')
      .insert({
        user_id: data.userId,
        track_id: data.trackId,
        certificate_number: certificateNumber,
        recipient_name: data.recipientName,
        recipient_email: data.recipientEmail,
        track_name: data.trackName,
        company_name: data.companyName,
        pdf_url: pdfUrl,
        completed_at: data.completedAt.toISOString(),
        expires_at: data.expiresAt.toISOString(),
        verification_url: verificationUrl,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to insert certificate record:', insertError);
      return {
        success: false,
        error: 'Failed to save certificate record',
      };
    }

    return {
      success: true,
      certificateId: certificate.id,
      certificateNumber,
      pdfUrl,
    };
  } catch (error) {
    console.error('Certificate generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// VERIFICATION LOOKUP
// =============================================================================

/**
 * Verify a certificate by its certificate number.
 */
export async function verifyCertificate(
  certificateNumber: string,
  env: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
): Promise<{
  valid: boolean;
  certificate?: {
    recipientName: string;
    trackName: string;
    completedAt: string;
    expiresAt: string;
    companyName: string;
  };
}> {
  const supabase = createAdminClient(env);

  const { data, error } = await supabase
    .from('certificates')
    .select(
      'recipient_name, track_name, completed_at, expires_at, company_name'
    )
    .eq('certificate_number', certificateNumber)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  // Check if expired
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    return { valid: false };
  }

  return {
    valid: true,
    certificate: {
      recipientName: data.recipient_name,
      trackName: data.track_name,
      completedAt: data.completed_at,
      expiresAt: data.expires_at,
      companyName: data.company_name,
    },
  };
}

// =============================================================================
// DATABASE TYPE EXTENSION (should match Supabase schema)
// =============================================================================

/**
 * Certificate record type - should align with certificates table schema.
 * Add this to supabase.ts Database type when creating the table.
 */
export interface CertificateRecord {
  id: string;
  user_id: string;
  track_id: string;
  certificate_number: string;
  recipient_name: string;
  recipient_email: string;
  track_name: string;
  company_name: string;
  pdf_url: string;
  completed_at: string;
  expires_at: string;
  verification_url: string;
  created_at: string;
}
