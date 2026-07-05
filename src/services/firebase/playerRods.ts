import { collection, doc, onSnapshot, type Timestamp } from "firebase/firestore";

import type { FishingRodId } from "@/shared/sanctuary/types";
import type { PlayerRodRecord } from "@/shared/sanctuary/progression";
import { moduleIdForRareRod } from "@/shared/sanctuary/progression";
import { isPlayableUserDoc } from "@/src/services/auth/sanctuaryPlayable";
import { firestore } from "@/src/services/firebase/client";
import type { PlayerRodDoc, UserDoc } from "@/src/services/firebase/types";
import {
  setRodProgressionSnapshot,
  setUserDocStatus,
  type RodProgressionSnapshot,
} from "@/src/state/rodProgressionStore";
import { persistRodProgression } from "@/src/state/rodProgressionPersistence";
import { Sentry } from "@/src/services/sentry/init";

function mapPlayerRodDoc(rodId: FishingRodId, data: PlayerRodDoc): PlayerRodRecord {
  return {
    rodId,
    state: data.state,
    craftStartedAt: data.craftStartedAt?.toMillis() ?? null,
    craftCompletedAt: data.craftCompletedAt?.toMillis() ?? null,
    wonderInvested: data.wonderInvested ?? 0,
    partsSpentOnCraft: data.partsSpentOnCraft ?? 0,
    sourceModule:
      data.sourceModule ?? (moduleIdForRareRod(rodId) as PlayerRodRecord["sourceModule"]),
    giftSource: data.giftSource ?? null,
  };
}

type Unsubscribe = () => void;

function handleListenerError(error: Error, onError?: (error: Error) => void): void {
  Sentry.captureException(error, { tags: { area: "user_doc_hydration" } });
  setUserDocStatus("error", error.message);
  onError?.(error);
}

export function subscribeRodProgression(
  uid: string,
  onError?: (error: Error) => void,
): Unsubscribe {
  const userRef = doc(firestore, "users", uid);
  const rodsRef = collection(firestore, "users", uid, "playerRods");

  let latestUser: UserDoc | null = null;
  let latestRods: Partial<Record<FishingRodId, PlayerRodRecord>> = {};

  const publish = () => {
    if (!latestUser) return;
    const initialized = isPlayableUserDoc(latestUser);
    if (!initialized) {
      setUserDocStatus("pending");
      return;
    }
    const snapshot: RodProgressionSnapshot = {
      playerRods: latestRods,
      parts: latestUser.inventory?.parts ?? 0,
      storedWonder: latestUser.storedWonder ?? latestUser.totalWonder ?? 0,
      equippedRodId: latestUser.equippedRodId,
    };
    setRodProgressionSnapshot(snapshot);
    setUserDocStatus("ready");
    void persistRodProgression(uid, snapshot);
  };

  const userUnsub = onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        latestUser = snap.data() as UserDoc;
        publish();
      } else {
        latestUser = null;
        setUserDocStatus("missing");
      }
    },
    (error) => handleListenerError(error, onError),
  );

  const rodsUnsub = onSnapshot(
    rodsRef,
    (snap) => {
      const rods: Partial<Record<FishingRodId, PlayerRodRecord>> = {};
      snap.forEach((rodDoc) => {
        const rodId = rodDoc.id as FishingRodId;
        rods[rodId] = mapPlayerRodDoc(rodId, rodDoc.data() as PlayerRodDoc);
      });
      latestRods = rods;
      publish();
    },
    (error) => handleListenerError(error, onError),
  );

  return () => {
    userUnsub();
    rodsUnsub();
  };
}

export function timestampToMillis(value: Timestamp | null | undefined): number | null {
  return value?.toMillis() ?? null;
}
