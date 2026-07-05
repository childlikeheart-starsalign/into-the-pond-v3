export type WellChildBirthDateSources = {
  /** AsyncStorage narrative onboarding value. */
  local?: string | null;
  /** Firestore users/{uid}.childBirthDate; undefined until first snapshot. */
  remote?: string | null | undefined;
  /** ISO date set after successful gate submit in this modal session. */
  sessionConfirmed?: string | null;
};

/** Merge birth-date sources; prefer session, then remote, then local. Never returns empty when any source has a value. */
export function mergeWellChildBirthDate(sources: WellChildBirthDateSources): string | null {
  const { local, remote, sessionConfirmed } = sources;

  if (sessionConfirmed) return sessionConfirmed;
  if (remote) return remote;
  if (local) return local;
  return null;
}

export function shouldShowWellBirthDateGate(
  profileReady: boolean,
  childBirthDate: string | null | undefined,
  gateCompletedInSession: boolean,
): boolean {
  return profileReady && !childBirthDate && !gateCompletedInSession;
}
