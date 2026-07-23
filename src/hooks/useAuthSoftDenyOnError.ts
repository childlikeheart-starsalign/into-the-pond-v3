import { useEffect, useRef } from "react";

import { playAuthSoftDeny } from "@/src/services/audio/authSounds";

/** Plays soft deny SFX when any watched error transitions from null to a message. */
export function useAuthSoftDenyOnError(errors: ReadonlyArray<string | null | undefined>): void {
  const prevRef = useRef<(string | null | undefined)[]>([]);

  useEffect(() => {
    const prev = prevRef.current;
    let shouldPlay = false;

    for (let i = 0; i < errors.length; i++) {
      const next = errors[i];
      const prior = prev[i];
      if (next && !prior) {
        shouldPlay = true;
        break;
      }
    }

    prevRef.current = [...errors];

    if (shouldPlay) {
      void playAuthSoftDeny();
    }
  }, [errors]);
}
