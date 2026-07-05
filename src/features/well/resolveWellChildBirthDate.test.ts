import { mergeWellChildBirthDate, shouldShowWellBirthDateGate } from "./resolveWellChildBirthDate";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runResolveWellChildBirthDateSelfTest(): void {
  assert(
    mergeWellChildBirthDate({ local: null, remote: null, sessionConfirmed: null }) === null,
    "all empty → null",
  );

  assert(
    mergeWellChildBirthDate({ local: "2020-06-01", remote: null }) === "2020-06-01",
    "local wins when remote missing",
  );

  assert(
    mergeWellChildBirthDate({ local: null, remote: "2019-03-01" }) === "2019-03-01",
    "remote wins when local missing",
  );

  assert(
    mergeWellChildBirthDate({
      local: "2020-06-01",
      remote: "2019-03-01",
    }) === "2019-03-01",
    "remote preferred over local",
  );

  assert(
    mergeWellChildBirthDate({
      local: "2020-06-01",
      remote: null,
      sessionConfirmed: "2018-01-01",
    }) === "2018-01-01",
    "session confirmed wins over local and remote",
  );

  // Snapshot null must not clobber session submit
  assert(
    mergeWellChildBirthDate({
      local: null,
      remote: null,
      sessionConfirmed: "2018-01-01",
    }) === "2018-01-01",
    "stale null snapshot does not clear session confirmed",
  );

  // Local AsyncStorage fallback when Firestore returns null
  assert(
    mergeWellChildBirthDate({
      local: "2020-06-01",
      remote: null,
      sessionConfirmed: null,
    }) === "2020-06-01",
    "local persists when remote snapshot is null",
  );

  assert(
    shouldShowWellBirthDateGate(true, null, false) === true,
    "gate shows when ready, no birthdate, session not completed",
  );

  assert(
    shouldShowWellBirthDateGate(true, "2020-06-01", false) === false,
    "gate hidden when birthdate present",
  );

  assert(
    shouldShowWellBirthDateGate(true, null, true) === false,
    "gate hidden after session submit even if birthdate cleared",
  );

  assert(
    shouldShowWellBirthDateGate(false, null, false) === false,
    "gate hidden while profile not ready",
  );
}
