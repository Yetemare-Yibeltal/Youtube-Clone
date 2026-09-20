import { readFile } from "node:fs/promises";
import { env } from "../config/environment.js";
import { mailer } from "../config/mailer.js";
import { logger } from "../utils/logger.js";

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const render = async (file, variables) => {
  let html = await readFile(
    new URL(`../templates/${file}`, import.meta.url),
    "utf8",
  );
  for (const [key, value] of Object.entries(variables)) {
    html = html.replaceAll(`{{${key}}}`, escapeHtml(value));
  }
  return html;
};

const buildLink = (pathname, token) => {
  const url = new URL(pathname, env.CLIENT_URL);
  url.searchParams.set("token", token);
  return url.toString();
};

const deliver = async ({ to, subject, html, text, link }) => {
  await mailer.sendMail({ from: env.EMAIL_FROM, to, subject, html, text });
  if (!env.SMTP_HOST && !env.isProd)
    logger.info(`[dev email] "${subject}" for ${to}: ${link}`);
};

export const sendVerificationEmail = async ({ to, name, token }) => {
  const link = buildLink("/verify-email", token);
  await deliver({
    to,
    link,
    subject: "Confirm your email address",
    html: await render("verifyEmail.html", { name, link }),
    text: `Hi ${name},\n\nConfirm your email address: ${link}\n\nThis link expires in 24 hours.`,
  });
};

export const sendPasswordResetEmail = async ({ to, name, token }) => {
  const link = buildLink("/reset-password", token);
  await deliver({
    to,
    link,
    subject: "Reset your password",
    html: await render("resetPassword.html", { name, link }),
    text: `Hi ${name},\n\nReset your password: ${link}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
  });
};
