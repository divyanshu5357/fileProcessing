import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendOtpEmail(email: string, otp: string) {
  const fromEmail = process.env.EMAIL_FROM || 'PixelKit Security <no-reply@pixelkit.app>';

  if (!resend) {
    console.info(`\n======================================================`);
    console.info(`[PIXELKIT DEV AUTH] Email OTP for ${email}: ${otp}`);
    console.info(`(Set RESEND_API_KEY to send real transactional emails)`);
    console.info(`======================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Your PixelKit Verification Code: ${otp}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; margin: 0; padding: 40px 20px; }
            .card { max-width: 480px; margin: 0 auto; background-color: #1E293B; border-radius: 16px; padding: 36px; border: 1px solid #334155; }
            .logo { font-size: 22px; font-weight: 800; color: #3B82F6; margin-bottom: 24px; text-align: center; }
            .otp-box { background: #0F172A; border: 2px dashed #3B82F6; border-radius: 12px; padding: 20px; font-size: 36px; letter-spacing: 8px; font-weight: 800; text-align: center; color: #60A5FA; margin: 28px 0; font-family: monospace; }
            .footer { font-size: 12px; color: #94A3B8; text-align: center; margin-top: 24px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">⚡ PixelKit Cloud Platform</div>
            <h2 style="font-size: 18px; color: #F8FAFC; margin-bottom: 8px; text-align: center;">Your Login Verification Code</h2>
            <p style="font-size: 14px; color: #CBD5E1; text-align: center; margin: 0;">Use the code below to log in to your PixelKit workspace. This code expires in 10 minutes.</p>
            <div class="otp-box">${otp}</div>
            <p style="font-size: 13px; color: #94A3B8; text-align: center;">If you did not request this email, you can safely ignore it. Never share this code with anyone.</p>
            <div class="footer">
              PixelKit Platform &copy; ${new Date().getFullYear()} &bull; Private & Scalable SaaS Architecture
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error('[Resend Error]', error);
    throw error;
  }
}
