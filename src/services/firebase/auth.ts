import {
  applyActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";

import { firebaseAuth } from "@/src/services/firebase/client";
import { buildAuthActionCodeSettings } from "@/src/services/firebase/authLinks";

export async function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(firebaseAuth, email, password);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function signOutCurrentUser() {
  return signOut(firebaseAuth);
}

export async function signInAnonymouslyUser() {
  return signInAnonymously(firebaseAuth);
}

export function subscribeToAuthState(listener: (user: User | null) => void) {
  return onAuthStateChanged(firebaseAuth, listener);
}

export async function sendPasswordReset(email: string) {
  const settings = buildAuthActionCodeSettings();
  await sendPasswordResetEmail(firebaseAuth, email.trim(), settings);
}

export async function confirmNewPassword(oobCode: string, newPassword: string) {
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
  await applyActionCode(firebaseAuth, oobCode);
}
