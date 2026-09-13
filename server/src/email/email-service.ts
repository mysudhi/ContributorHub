import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: string;
}

let transporter: Transporter | null = null;
let emailEnabled = false;
let defaultFrom = "ContributorHub <noreply@contributorhub.org>";

export function getEmailEnabled(): boolean {
  return emailEnabled;
}

export function initEmailService(config?: Partial<SmtpConfig>): void {
  const host = config?.host ?? process.env.SMTP_HOST;
  const port = config?.port ?? Number(process.env.SMTP_PORT || "587");
  const secure = config?.secure ?? process.env.SMTP_SECURE === "true";
  const user = config?.auth?.user ?? process.env.SMTP_USER;
  const pass = config?.auth?.pass ?? process.env.SMTP_PASS;
  const from = config?.from ?? process.env.SMTP_FROM ?? defaultFrom;

  if (!host) {
    console.log("[Email] SMTP_HOST not configured — email notifications disabled");
    emailEnabled = false;
    return;
  }

  defaultFrom = from;

  const transportOptions: Record<string, unknown> = {
    host,
    port,
    secure,
  };

  if (user && pass) {
    transportOptions.auth = { user, pass };
  }

  transporter = nodemailer.createTransport(transportOptions);
  emailEnabled = true;
  console.log(`[Email] Email service initialized (host=${host}, port=${port})`);
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!emailEnabled || !transporter) {
    console.log(`[Email] Skipped (disabled): "${options.subject}" → ${options.to}`);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: defaultFrom,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text ?? stripHtml(options.html),
    });

    console.log(`[Email] Sent: "${options.subject}" → ${options.to} (messageId=${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed: "${options.subject}" → ${options.to}`, err);
    return false;
  }
}

export async function verifyConnection(): Promise<boolean> {
  if (!transporter) return false;
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function _getTransporter(): Transporter | null {
  return transporter;
}

export function _resetForTesting(): void {
  transporter = null;
  emailEnabled = false;
  defaultFrom = "ContributorHub <noreply@contributorhub.org>";
}
