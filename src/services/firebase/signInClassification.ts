import { fetchSignInMethodsForEmail, signInWithEmailAndPassword } from "firebase/auth";

import { firebaseAuth } from "@/src/services/firebase/client";
import { checkSignInEmailRegistered } from "@/src/services/firebase/serverActions";
import {
  signInWithEmailForLoginScreen as signInWithEmailForLoginScreenCore,
  type SignInClassificationDeps,
} from "@/src/services/firebase/signInClassificationCore";

export {
  SignInEmailNotFoundError,
  SignInWrongPasswordError,
  isEmailFormatValid,
  mapSignInScreenError,
} from "@/src/services/firebase/signInClassificationCore";

const defaultDeps: SignInClassificationDeps = {
  fetchSignInMethods: (email) => fetchSignInMethodsForEmail(firebaseAuth, email),
  checkEmailRegistered: checkSignInEmailRegistered,
  signIn: (email, password) => signInWithEmailAndPassword(firebaseAuth, email, password),
};

export function signInWithEmailForLoginScreen(email: string, password: string) {
  return signInWithEmailForLoginScreenCore(email, password, defaultDeps);
}
