"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDeletionConfirmUrl = buildDeletionConfirmUrl;
exports.sendDeletionConfirmEmail = sendDeletionConfirmEmail;
const firebase_functions_1 = require("firebase-functions");
const RESEND_API = "https://api.resend.com/emails";
const DEFAULT_FROM = "Into the Pond <noreply@intothepond.app>";
const CONFIRM_BASE =
  process.env.ACCOUNT_DELETION_CONFIRM_BASE_URL?.trim() || "https://intothepond.app/delete-account";
function buildDeletionConfirmUrl(params) {
  const url = new URL(CONFIRM_BASE);
  url.searchParams.set("uid", params.uid);
  url.searchParams.set("token", params.token);
  url.searchParams.set("requestId", params.requestId);
  return url.toString();
}
/**
 * Sends the web account-deletion confirmation email via Resend.
 * Throws on missing API key or non-2xx Resend response.
 */
async function sendDeletionConfirmEmail(params) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send account deletion confirmation email.");
  }
  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
  const confirmUrl = buildDeletionConfirmUrl(params);
  const subject = "Confirm account deletion — Into the Pond";
  const text = [
    "You asked to delete your Into the Pond account.",
    "",
    "If this was you, open the link below to confirm. Your journal and profile will be cleared,",
    "and you will have 30 days to sign back in and keep your sanctuary if you change your mind.",
    "",
    confirmUrl,
    "",
    "If you did not request this, you can ignore this email — nothing changes until you confirm.",
    "",
    "— Into the Pond",
  ].join("\n");
  const html = `
    <p>You asked to delete your Into the Pond account.</p>
    <p>If this was you, confirm below. Your journal and profile will be cleared, and you will have
    <strong>30 days</strong> to sign back in and keep your sanctuary if you change your mind.</p>
    <p><a href="${confirmUrl}">Confirm account deletion</a></p>
    <p style="color:#5B514A;font-size:14px">If you did not request this, ignore this email — nothing
    changes until you confirm.</p>
    <p style="color:#5B514A;font-size:14px">— Into the Pond</p>
  `.trim();
  const response = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject,
      text,
      html,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    firebase_functions_1.logger.error("resend_deletion_confirm_failed", {
      status: response.status,
      bodyPreview: body.slice(0, 200),
    });
    throw new Error(`Resend email failed with status ${response.status}`);
  }
  firebase_functions_1.logger.info("resend_deletion_confirm_sent", { requestId: params.requestId });
}
