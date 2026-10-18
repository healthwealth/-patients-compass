import { ENV } from "./env";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

const DEFAULT_FROM_EMAIL = process.env.RESEND_SENDER_EMAIL || "noreply@thepatientscompass.com";
const APP_URL = process.env.APP_URL || "https://thepatientscompass.com";

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!ENV.resendApiKey) {
    console.warn("[Email] Resend API key not configured");
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${ENV.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: options.from || DEFAULT_FROM_EMAIL, to: options.to, subject: options.subject, html: options.html, reply_to: options.replyTo }),
    });
    if (!response.ok) {
      const detail = typeof response.text === "function" ? await response.text() : JSON.stringify(await response.json().catch(() => ({})));
      console.error("[Email] Resend API error:", detail);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

const escapeHtml = (value: string) => value.replace(/[&<>\"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
const emailShell = (title: string, body: string) => `<!doctype html><html lang="en"><head><meta name="x-apple-disable-message-reformatting"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{margin:0;background:#F7F4EF;font-family:Arial,Helvetica,sans-serif;color:#2C2A29}.card{width:100%;max-width:600px}.button{display:inline-block;padding:14px 22px;border-radius:8px;font-weight:700;text-decoration:none}.footer{font-size:12px;line-height:1.6;color:#817B74}@media(max-width:620px){.outer{padding:16px!important}.inner{padding:26px 20px!important}}</style></head><body><div style="display:none;max-height:0;overflow:hidden">Secure account message from The Patient's Compass</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td class="outer" align="center" style="padding:32px 16px"><table role="presentation" class="card" cellspacing="0" cellpadding="0" border="0" style="background:#fff;border:1px solid #EBE6DC;border-radius:16px;overflow:hidden"><tr><td style="padding:22px 28px;background:#7E9A85;color:#fff"><div style="font-size:18px;font-weight:700;letter-spacing:.04em">◈ The Patient's Compass</div><div style="margin-top:5px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.9">Health intelligence system</div></td></tr><tr><td class="inner" style="padding:34px 32px"><div style="display:inline-block;padding:6px 10px;border-radius:999px;background:#F3F8F3;color:#51715B;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Account security</div><h1 style="margin:18px 0 14px;font-family:Georgia,serif;font-size:28px;line-height:1.2;color:#2C2A29">${title}</h1><div style="color:#5C5A59;line-height:1.7;font-size:15px">${body}</div><div style="margin-top:28px;padding:14px 16px;border-left:3px solid #D48C70;background:#FFF8F3;color:#6E5A4D;font-size:12px;line-height:1.6">For your security, our team will never ask for your password or one-time token by email.</div></td></tr><tr><td style="padding:20px 32px;background:#FBFAF8;border-top:1px solid #EBE6DC"><p class="footer" style="margin:0">This is an account-security message. If you did not request it, you can safely ignore it.<br>© 2026 The Patient's Compass · Educational technology, not medical advice.</p></td></tr></table></td></tr></table></body></html>`;

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
  const url = `${APP_URL}/signup?verificationToken=${encodeURIComponent(token)}`;
  return sendEmail({ to: email, subject: "Verify your Patients Compass email", html: emailShell("Verify your email", `<p>Hi ${escapeHtml(name || "there")},</p><p>Confirm your email address to finish creating your Patients Compass account.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#7E9A85;color:#fff;text-decoration:none;border-radius:8px">Verify email</a></p><p>This link expires when a new verification message is requested.</p>`) });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
  const url = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return sendEmail({ to: email, subject: "Reset your Patients Compass password", html: emailShell("Reset your password", `<p>Hi ${escapeHtml(name || "there")},</p><p>We received a request to reset your Patients Compass password. This link expires in one hour.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#2C2A29;color:#fff;text-decoration:none;border-radius:8px">Choose a new password</a></p><p>If you did not request this, no changes will be made unless the link is used.</p>`) });
}

export async function sendPasswordChangedEmail(email: string, name: string): Promise<boolean> {
  return sendEmail({ to: email, subject: "Your Patients Compass password was changed", html: emailShell("Password updated", `<p>Hi ${escapeHtml(name || "there")},</p><p>Your Patients Compass password was successfully changed. If this was not you, contact support immediately and secure your email account.</p>`) });
}

export async function sendWaitlistConfirmation(email: string): Promise<boolean> {
  return sendEmail({ to: email, subject: "Welcome to The Patient's Compass Waitlist", html: emailShell("You're on the list", `<p>Thank you for joining our waitlist. We'll send sign-in help and service updates when available.</p>`) });
}

export async function sendReEngagementEmail(email: string): Promise<boolean> {
  return sendEmail({ to: email, subject: "Sign-In is Back Online — Welcome Back!", html: emailShell("Sign-In is Back Online", `<p>You can now create your account and sign in securely.</p><p><a href="${APP_URL}/signin">Sign in now</a></p>`) });
}

export async function sendBulkReEngagement(emails: string[]): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  for (const email of emails) {
    if (await sendReEngagementEmail(email)) sent++;
    else failed++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return { sent, failed };
}

export async function sendEmailLoginLink(email: string, name: string, token: string): Promise<boolean> {
  const url = `${APP_URL}/signin?emailToken=${encodeURIComponent(token)}`;
  return sendEmail({
    to: email,
    subject: "Your Patients Compass sign-in link",
    html: emailShell("Sign in with your email", `<p>Hi ${escapeHtml(name || "there")},</p><p>We couldn't complete provider sign-in, so here is a secure one-time link to access your Patients Compass account.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#2C2A29;color:#fff;text-decoration:none;border-radius:8px">Sign in securely</a></p><p>This link expires in 15 minutes and can be used once.</p>`),
  });
}

export async function sendNewDeviceLoginEmail(email: string, name: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "New device signed in to Patients Compass",
    html: emailShell("New device sign-in", `<p>Hi ${escapeHtml(name || "there")},</p><p>A new browser or device just signed in to your Patients Compass account using an email sign-in link.</p><p>If this was you, no action is needed. If you do not recognize this activity, change your email password and contact support immediately.</p>`),
  });
}
