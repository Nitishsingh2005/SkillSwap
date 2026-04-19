/**
 * emailService.js
 * Sends transactional emails using nodemailer.
 *
 * - Production: set MAIL_USER + MAIL_PASS in .env (Gmail App Password)
 * - Development (default): no network needed — verification URL is printed
 *   to the console so you can test without any SMTP setup.
 */
const nodemailer = require("nodemailer");

let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  if (process.env.MAIL_USER && process.env.MAIL_PASS) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS, // Gmail App Password
      },
    });
    console.log("📧 Email: using Gmail SMTP →", process.env.MAIL_USER);
  } else {
    // Dev mode: create a no-op transport so nodemailer doesn't throw —
    // we log the link ourselves below.
    _transporter = nodemailer.createTransport({ jsonTransport: true });
    console.log("📧 Email: dev mode (no SMTP) — verification links printed to console");
  }

  return _transporter;
};

/**
 * Send an email verification link to a new user.
 * In dev mode (no MAIL_USER set), the link is logged to the console instead.
 */
const sendVerificationEmail = async (toEmail, toName, verificationToken) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;
  const isDev = !process.env.MAIL_USER;

  // ── Dev mode: just log the link, no network needed ──────────────────────
  if (isDev) {
    console.log("\n──────────────────────────────────────────────────");
    console.log(`📧  EMAIL VERIFICATION (dev mode)`);
    console.log(`    To:   ${toEmail}`);
    console.log(`    Link: ${verifyUrl}`);
    console.log("──────────────────────────────────────────────────\n");
    return; // done
  }

  // ── Production: send real email via Gmail ───────────────────────────────
  const transporter = getTransporter();
  const fromName  = process.env.MAIL_FROM_NAME || "SkillSwap";
  const fromEmail = process.env.MAIL_USER;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: "Verify your SkillSwap email address",
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background:linear-gradient(135deg,#06b6d4,#14b8a6);padding:36px 40px;text-align:center;">
                    <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                      <span style="color:#fff;font-weight:800;font-size:20px;letter-spacing:-1px;">SS</span>
                    </div>
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Verify your email</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">One quick step to activate your account</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${toName}</strong>,</p>
                    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                      Thanks for joining SkillSwap! Click the button below to verify your email address.
                    </p>
                    <div style="text-align:center;margin:32px 0;">
                      <a href="${verifyUrl}" style="background:linear-gradient(135deg,#06b6d4,#14b8a6);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">
                        Verify Email Address
                      </a>
                    </div>
                    <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;text-align:center;">Button not working? Copy this link:</p>
                    <p style="margin:0 0 24px;word-break:break-all;color:#06b6d4;font-size:12px;text-align:center;">${verifyUrl}</p>
                    <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />
                    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                      This link expires in <strong>24 hours</strong>. If you didn't create this account, ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  });
};

module.exports = { sendVerificationEmail };
