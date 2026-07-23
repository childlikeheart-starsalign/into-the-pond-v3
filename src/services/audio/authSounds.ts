import { playOptionalOneShot } from "@/src/services/audio/playOptionalOneShot";

export function playAuthWelcome(): Promise<void> {
  return playOptionalOneShot("authWelcome", 0.25);
}

export function playAuthSoftDeny(): Promise<void> {
  return playOptionalOneShot("authSoftDeny", 0.2);
}

export function playProfilePlanted(): Promise<void> {
  return playOptionalOneShot("profilePlanted", 0.3);
}
