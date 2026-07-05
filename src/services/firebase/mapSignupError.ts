import { AUTH_INVALID_EMAIL_FORMAT, AUTH_UNKNOWN_ERROR } from "@/src/constants/authCopy";

export function mapSignupError(code: string): {
  field: "email" | "password" | "general";
  message: string;
} {
  switch (code) {
    case "auth/email-already-in-use":
      return { field: "email", message: "email-in-use" };
    case "auth/invalid-email":
      return {
        field: "email",
        message: AUTH_INVALID_EMAIL_FORMAT,
      };
    case "auth/weak-password":
      return { field: "password", message: "Please use at least 8 characters." };
    case "auth/too-many-requests":
      return {
        field: "general",
        message: "Too many attempts — please wait a moment and try again.",
      };
    default:
      return {
        field: "general",
        message: AUTH_UNKNOWN_ERROR,
      };
  }
}
