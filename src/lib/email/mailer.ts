import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const from = process.env.MAIL_FROM ?? "HelpDesk <noreply@example.com>";
  
  if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_KEY) {
    console.warn("[email] Skipping send — Brevo credentials not configured");
    console.log(`[email] Would send to=${to} subject="${subject}"`);
    return;
  }

  try {
    await transporter.sendMail({ from, to, subject, html });
    console.log(`[email] Sent to=${to} subject="${subject}"`);
  } catch (error) {
    console.error(`[email] Failed to send to=${to}:`, error);
  }
}