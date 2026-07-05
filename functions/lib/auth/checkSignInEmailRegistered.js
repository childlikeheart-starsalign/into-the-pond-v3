"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSignInEmailRegisteredCallable = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const EMAIL_FORMAT_RE = /^\S+@\S+\.\S+$/;
/**
 * Unauthenticated lookup for login artboard routing (22 vs 23).
 * Rate limiting should be added before broad public launch if abuse appears.
 */
exports.checkSignInEmailRegisteredCallable = (0, https_1.onCall)(async (request) => {
  const email = typeof request.data?.email === "string" ? request.data.email.trim() : "";
  if (!email || !EMAIL_FORMAT_RE.test(email)) {
    throw new https_1.HttpsError("invalid-argument", "A valid email address is required.");
  }
  try {
    await firebase_admin_1.default.auth().getUserByEmail(email);
    return { registered: true };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "auth/user-not-found") {
      return { registered: false };
    }
    throw new https_1.HttpsError("internal", "Unable to verify email registration.");
  }
});
