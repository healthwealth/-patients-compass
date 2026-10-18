import { TRPCError } from "@trpc/server";
import { ENV } from "./env";
import { sendEmail } from "./email";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/**
 * Sends a project-owner notification by email (replaces the Manus Notification
 * Service). Delivered through Resend to OWNER_EMAIL (or the first ADMIN_EMAILS
 * entry). Returns `true` when the email was accepted, `false` when email is not
 * configured or delivery failed, so callers can continue without blocking users.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);
  const to = ENV.ownerEmail;
  if (!to) {
    console.warn(`[Notification] OWNER_EMAIL not configured; notification skipped: ${title}`);
    return false;
  }
  const escape = (value: string) =>
    value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
  try {
    return await sendEmail({
      to,
      subject: `[Patient's Compass] ${title}`.slice(0, 200),
      html: `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#2C2A29"><h2 style="font-family:Georgia,serif">${escape(title)}</h2><pre style="white-space:pre-wrap;font-family:inherit">${escape(content)}</pre></div>`,
    });
  } catch (error) {
    console.warn("[Notification] Error sending owner notification:", error);
    return false;
  }
}
