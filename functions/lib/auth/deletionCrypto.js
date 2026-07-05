"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptRestorePayload = encryptRestorePayload;
exports.decryptRestorePayload = decryptRestorePayload;
exports.hashWebConfirmToken = hashWebConfirmToken;
exports.hashEmailForLookup = hashEmailForLookup;
exports.generateWebConfirmToken = generateWebConfirmToken;
const node_crypto_1 = require("node:crypto");
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
function deletionSecretMaterial() {
  return (
    process.env.ACCOUNT_DELETION_SECRET ??
    (process.env.FUNCTIONS_EMULATOR === "true" ? "dev-account-deletion-secret-change-me" : "")
  );
}
function deriveKey() {
  const material = deletionSecretMaterial();
  if (!material) {
    throw new Error("ACCOUNT_DELETION_SECRET is required for account deletion encryption.");
  }
  return (0, node_crypto_1.createHash)("sha256").update(material).digest();
}
function encryptRestorePayload(payload) {
  const iv = (0, node_crypto_1.randomBytes)(IV_LENGTH);
  const key = deriveKey();
  const cipher = (0, node_crypto_1.createCipheriv)(ALGORITHM, key, iv);
  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}
function decryptRestorePayload(encryptedPayload) {
  const raw = Buffer.from(encryptedPayload, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + TAG_LENGTH);
  const key = deriveKey();
  const decipher = (0, node_crypto_1.createDecipheriv)(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  return JSON.parse(decrypted);
}
function hashWebConfirmToken(token) {
  return (0, node_crypto_1.createHash)("sha256").update(token).digest("hex");
}
function hashEmailForLookup(email) {
  const material = deletionSecretMaterial();
  if (!material) {
    throw new Error("ACCOUNT_DELETION_SECRET is required for email lookup hashing.");
  }
  return (0, node_crypto_1.createHmac)("sha256", material)
    .update(email.trim().toLowerCase())
    .digest("hex");
}
function generateWebConfirmToken() {
  return (0, node_crypto_1.randomBytes)(32).toString("base64url");
}
