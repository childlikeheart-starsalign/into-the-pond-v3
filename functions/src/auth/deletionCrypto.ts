import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export type AccountDeletionRestorePayload = {
  email: string;
  childBirthDate?: string;
  childArchetype?: string | null;
  hasCompletedDay1Narrative?: boolean;
  narrativeProgress?: {
    currentScene?: number;
    archetype?: string;
    completedAt?: string;
    lastUpdated?: string;
  };
  authProvider?: string;
};

function deletionSecretMaterial(): string {
  return (
    process.env.ACCOUNT_DELETION_SECRET ??
    (process.env.FUNCTIONS_EMULATOR === "true" ? "dev-account-deletion-secret-change-me" : "")
  );
}

function deriveKey(): Buffer {
  const material = deletionSecretMaterial();
  if (!material) {
    throw new Error("ACCOUNT_DELETION_SECRET is required for account deletion encryption.");
  }
  return createHash("sha256").update(material).digest();
}

export function encryptRestorePayload(payload: AccountDeletionRestorePayload): string {
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptRestorePayload(encryptedPayload: string): AccountDeletionRestorePayload {
  const raw = Buffer.from(encryptedPayload, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + TAG_LENGTH);
  const key = deriveKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  return JSON.parse(decrypted) as AccountDeletionRestorePayload;
}

export function hashWebConfirmToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashEmailForLookup(email: string): string {
  const material = deletionSecretMaterial();
  if (!material) {
    throw new Error("ACCOUNT_DELETION_SECRET is required for email lookup hashing.");
  }
  return createHmac("sha256", material).update(email.trim().toLowerCase()).digest("hex");
}

export function generateWebConfirmToken(): string {
  return randomBytes(32).toString("base64url");
}
