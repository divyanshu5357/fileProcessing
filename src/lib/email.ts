import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface DeliveryStatus {
  success: boolean;
  error?: string;
  messageId?: string;
  timestamp: number;
}

const deliveryStatusMap = new Map<string, DeliveryStatus>();

export function getRecentDeliveryStatus(email: string): DeliveryStatus | null {
  const norm = email.toLowerCase().trim();
  const entry = deliveryStatusMap.get(norm);
  if (!entry) return null;
  // Expire after 3 minutes
  if (Date.now() - entry.timestamp > 180_000) {
    deliveryStatusMap.delete(norm);
    return null;
  }
  return entry;
}

export function recordDeliveryStatus(email: string, status: { success: boolean; error?: string; messageId?: string }) {
  const norm = email.toLowerCase().trim();
  deliveryStatusMap.set(norm, {
    ...status,
    timestamp: Date.now(),
  });
}

export function clearDeliveryStatus(email: string) {
  deliveryStatusMap.delete(email.toLowerCase().trim());
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}***@${domain}`;
}

export async function sendOtpEmail(
  email: string,
  otp: string,
  type: string = 'sign-in'
): Promise<{ success: boolean; messageId?: string }> {
  const fromEmail =
    process.env.EMAIL_FROM || 'Gyanvatsala Security <fileprocess@gyanvatsala.in>';

  if (!resend) {
    console.error('[Resend Error] RESEND_API_KEY is not configured on the server.');
    recordDeliveryStatus(email, {
      success: false,
      error: 'Email delivery service is currently not configured. Please configure RESEND_API_KEY.',
    });
    throw new Error('Email delivery service is currently not configured. Please contact support.');
  }

  const subject = 'Your Gyanvatsala verification code';
  const formattedOtp = otp.length === 8 ? `${otp.slice(0, 4)} ${otp.slice(4)}` : otp;

  const plainText = `Gyanvatsala - Your Digital Document Workspace\n\nYour Verification Code: ${otp}\n\nUse this 4-digit code to complete authentication for your Gyanvatsala account. This code expires in 5 minutes.\n\nSecurity Notice: If you did not request this verification code, please ignore this email. Never share this code with anyone.\n\nNeed assistance? Contact our support team at fileprocess@gyanvatsala.in\n\n(c) ${new Date().getFullYear()} Gyanvatsala. All rights reserved.`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { margin: 0; padding: 0; background-color: #0A0D14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC; }
        .wrapper { width: 100%; max-width: 540px; margin: 40px auto; background-color: #111622; border-radius: 20px; border: 1px solid #1E2536; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); }
        .header { padding: 36px 32px 24px; text-align: center; border-bottom: 1px solid #1E2536; }
        .logo-badge { display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background-color: #0D5C58; color: #FFFFFF; font-weight: 900; font-size: 24px; text-align: center; margin-bottom: 12px; }
        .brand-name { font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; }
        .brand-tagline { font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; font-weight: 600; }
        .content { padding: 36px 32px; text-align: center; }
        .title { font-size: 18px; font-weight: 700; color: #FFFFFF; margin: 0 0 8px 0; }
        .description { font-size: 13px; line-height: 1.6; color: #94A3B8; margin: 0 0 28px 0; }
        .otp-container { background: #0A0D14; border: 2px dashed #0D5C58; border-radius: 14px; padding: 20px 16px; margin: 0 auto 28px; max-width: 340px; }
        .otp-code { font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; padding-left: 10px; color: #5EEAD4; margin: 0; }
        .expiry-note { font-size: 12px; color: #F59E0B; margin-top: 8px; font-weight: 600; }
        .security-warning { background-color: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 10px; padding: 12px 16px; font-size: 11px; color: #FCA5A5; line-height: 1.5; margin: 0 auto 24px; text-align: left; }
        .footer { padding: 24px 32px; background-color: #0B0E16; border-top: 1px solid #1E2536; text-align: center; font-size: 11px; color: #64748B; line-height: 1.6; }
        .footer a { color: #5EEAD4; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="logo-badge">G</div>
          <div class="brand-name">Gyanvatsala</div>
          <div class="brand-tagline">Your Digital Document Workspace</div>
        </div>
        <div class="content">
          <h1 class="title">Verification One-Time Passcode</h1>
          <p class="description">
            Use the 4-digit verification code below to complete your authentication. This security code is valid for <strong>5 minutes</strong>.
          </p>
          <div class="otp-container">
            <div class="otp-code">${formattedOtp}</div>
            <div class="expiry-note">Valid for 5 minutes (single use)</div>
          </div>
          <div class="security-warning">
            <strong>Security Notice:</strong> Never share this code with anyone. Gyanvatsala staff will never ask for your verification code. If you did not initiate this request, no action is needed.
          </div>
        </div>
        <div class="footer">
          Need support? Contact us at <a href="mailto:fileprocess@gyanvatsala.in">fileprocess@gyanvatsala.in</a><br>
          &copy; ${new Date().getFullYear()} Gyanvatsala. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject,
      text: plainText,
      html,
    });

    if (data.error) {
      const errMsg = data.error.message || 'Email delivery failed.';
      console.error(`[Resend Error] Delivery rejected for ${maskEmail(email)}:`, errMsg);
      recordDeliveryStatus(email, {
        success: false,
        error: errMsg.includes('domain is not verified')
          ? 'Domain gyanvatsala.in is not yet verified on Resend. Please add and verify it in Resend DNS settings (resend.com/domains).'
          : errMsg,
      });
      throw new Error(data.error.message || 'Email delivery failed.');
    }

    console.info(`[Auth] Verification email dispatched to ${maskEmail(email)} (id: ${data.data?.id})`);
    recordDeliveryStatus(email, { success: true, messageId: data.data?.id });
    return { success: true, messageId: data.data?.id };
  } catch (error: any) {
    const msg = error?.message || 'Email delivery service error';
    console.error(`[Resend Exception] Dispatch failure for ${maskEmail(email)}:`, msg);
    recordDeliveryStatus(email, {
      success: false,
      error: msg.includes('domain is not verified')
        ? 'Domain gyanvatsala.in is not yet verified on Resend. Please add and verify it in Resend DNS settings (resend.com/domains).'
        : msg,
    });
    throw error;
  }
}
