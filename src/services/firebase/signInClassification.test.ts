import {
  isEmailFormatValid,
  isEmailRegisteredForPasswordSignIn,
  mapSignInScreenError,
  SignInEmailNotFoundError,
  SignInWrongPasswordError,
  signInWithEmailForLoginScreen,
  type SignInClassificationDeps,
} from "@/src/services/firebase/signInClassificationCore";
import { AUTH_INVALID_EMAIL_FORMAT, AUTH_WRONG_PASSWORD } from "@/src/constants/authCopy";

function expectEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function expectThrowsAsync(
  fn: () => Promise<unknown>,
  ErrorClass: new (...args: never[]) => Error,
) {
  return fn().then(
    () => {
      throw new Error(`Expected ${ErrorClass.name} to be thrown`);
    },
    (error) => {
      if (!(error instanceof ErrorClass)) {
        throw new Error(`Expected ${ErrorClass.name}, got ${String(error)}`);
      }
    },
  );
}

export async function runSignInClassificationSelfTest(): Promise<void> {
  expectEqual(isEmailFormatValid("wrong@email.com"), true, "valid format");
  expectEqual(isEmailFormatValid("notanemail"), false, "invalid format");

  const unregisteredDeps: SignInClassificationDeps = {
    fetchSignInMethods: async () => [],
    checkEmailRegistered: async () => false,
    signIn: async () => {
      throw new Error("signIn should not run");
    },
  };

  await expectThrowsAsync(
    () => signInWithEmailForLoginScreen("wrong@email.com", "secret", unregisteredDeps),
    SignInEmailNotFoundError,
  );

  const wrongPasswordDeps: SignInClassificationDeps = {
    fetchSignInMethods: async () => ["password"],
    checkEmailRegistered: async () => true,
    signIn: async () => {
      const error = new Error("Invalid credential") as Error & { code: string };
      error.code = "auth/invalid-credential";
      throw error;
    },
  };

  await expectThrowsAsync(
    () => signInWithEmailForLoginScreen("real@email.com", "wrong", wrongPasswordDeps),
    SignInWrongPasswordError,
  );

  const registered = await isEmailRegisteredForPasswordSignIn("a@b.c", {
    fetchSignInMethods: async () => ["password"],
    checkEmailRegistered: async () => {
      throw new Error("callable should not run when methods non-empty");
    },
    signIn: async () => ({}) as never,
  });
  expectEqual(registered, true, "non-empty fetch methods → registered");

  const unregisteredViaFetch = await isEmailRegisteredForPasswordSignIn("a@b.c", {
    fetchSignInMethods: async () => [],
    checkEmailRegistered: async () => {
      const error = new Error("not found") as Error & { code: string };
      error.code = "functions/not-found";
      throw error;
    },
    signIn: async () => ({}) as never,
  });
  expectEqual(
    unregisteredViaFetch,
    true,
    "empty fetch + callable unavailable → attempt sign-in (degraded)",
  );

  const permissionDeniedCallable = await isEmailRegisteredForPasswordSignIn("a@b.c", {
    fetchSignInMethods: async () => [],
    checkEmailRegistered: async () => {
      const error = new Error("permission-denied") as Error & { code: string };
      error.code = "functions/permission-denied";
      throw error;
    },
    signIn: async () => ({}) as never,
  });
  expectEqual(
    permissionDeniedCallable,
    true,
    "empty fetch + callable permission-denied → attempt sign-in (degraded)",
  );

  const unregisteredViaCallable = await isEmailRegisteredForPasswordSignIn("a@b.c", {
    fetchSignInMethods: async () => [],
    checkEmailRegistered: async () => false,
    signIn: async () => ({}) as never,
  });
  expectEqual(unregisteredViaCallable, false, "empty fetch + callable false → unregistered");

  const blockedFetchUsesCallable = await isEmailRegisteredForPasswordSignIn("a@b.c", {
    fetchSignInMethods: async () => {
      const error = new Error("blocked") as Error & { code: string };
      error.code = "auth/operation-not-allowed";
      throw error;
    },
    checkEmailRegistered: async () => true,
    signIn: async () => ({}) as never,
  });
  expectEqual(blockedFetchUsesCallable, true, "blocked fetch falls back to callable");

  const iosClientBlockedSkipsToSignIn = await isEmailRegisteredForPasswordSignIn("a@b.c", {
    fetchSignInMethods: async () => {
      const error = new Error("ios blocked") as Error & { code: string };
      error.code = "auth/requests-from-this-ios-client-application-<empty>-are-blocked.";
      throw error;
    },
    checkEmailRegistered: async () => {
      throw new Error("callable should not run when ios client blocked");
    },
    signIn: async () => ({}) as never,
  });
  expectEqual(
    iosClientBlockedSkipsToSignIn,
    true,
    "ios client blocked → skip enumeration, attempt sign-in",
  );

  const iosBlockedSignIn = await signInWithEmailForLoginScreen("a@b.c", "secret", {
    fetchSignInMethods: async () => {
      const error = new Error("ios blocked") as Error & { code: string };
      error.code = "auth/requests-from-this-ios-client-application-<empty>-are-blocked.";
      throw error;
    },
    checkEmailRegistered: async () => {
      throw new Error("callable should not run");
    },
    signIn: async () => ({ user: { uid: "u1" } }) as never,
  });
  expectEqual(iosBlockedSignIn.user.uid, "u1", "ios blocked enumeration still signs in");

  const emailMapped = mapSignInScreenError(new SignInEmailNotFoundError());
  expectEqual(emailMapped.emailError, AUTH_INVALID_EMAIL_FORMAT, "email error mapped");
  expectEqual(emailMapped.passwordError, null, "no password error");
  expectEqual(emailMapped.generalError, null, "no general error");

  const passwordMapped = mapSignInScreenError(new SignInWrongPasswordError());
  expectEqual(passwordMapped.passwordError, AUTH_WRONG_PASSWORD, "password error mapped");
  expectEqual(passwordMapped.emailError, null, "no email error");
  expectEqual(passwordMapped.generalError, null, "no general error");
}
