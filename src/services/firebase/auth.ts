import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";

import { firebaseAuth } from "@/src/services/firebase/client";
import { buildAuthActionCodeSettings } from "@/src/services/firebase/authLinks";

function invalidActionCodeError(): Error {
  const err = new Error("Invalid action code");
  (err as { code?: string }).code = "auth/invalid-action-code";
  return err;
}

export async function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(firebaseAuth, email, password);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function signOutCurrentUser() {
  return signOut(firebaseAuth);
}

export function isAnonymousAuthUser(user: User | null): boolean {
  return user?.isAnonymous === true;
}

export function subscribeToAuthState(listener: (user: User | null) => void) {
  return onAuthStateChanged(firebaseAuth, listener);
}

export async function sendPasswordReset(email: string) {
  const settings = buildAuthActionCodeSettings();
  await sendPasswordResetEmail(firebaseAuth, email.trim(), settings);
}

export async function confirmNewPassword(oobCode: string, newPassword: string) {
  const info = await checkActionCode(firebaseAuth, oobCode);
  if (info.operation !== "PASSWORD_RESET") {
    throw invalidActionCodeError();
  }
  await confirmPasswordReset(firebaseAuth, oobCode, newPassword);
}

export async function sendEmailVerificationForCurrentUser() {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("No signed-in user");
  await sendEmailVerification(user, buildAuthActionCodeSettings());
}

export async function reloadCurrentUser() {
  const user = firebaseAuth.currentUser;
  if (!user) return;
  await reload(user);
}

export async function applyEmailActionCode(oobCode: string) {
  const info = await checkActionCode(firebaseAuth, oobCode);
  if (info.operation !== "VERIFY_EMAIL") {
    throw invalidActionCodeError();
  }
  await applyActionCode(firebaseAuth, oobCode);
}
