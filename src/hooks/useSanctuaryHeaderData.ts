import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, type ImageSourcePropType } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import {
  formatWonderAccessibilityLabel,
  formatWonderLabel,
} from "@/src/features/sanctuary/formatSanctuaryHeaderWonder";
import {
  getDevPreviewWonder,
  reconcileDevPreviewWonder,
  subscribeDevPreviewWonder,
} from "@/src/features/sanctuary/devPreviewWonder";
import { resolveHeaderChildName } from "@/src/features/childProfile/dualRead";
import type { ChildrenSummaryEntry } from "@/src/features/childProfile/types";
import { syncDevPreviewWonderFromWellState } from "@/src/features/well/wellDevPreview";
import { firebaseAuth, firestore } from "@/src/services/firebase/client";
import type { UserDoc } from "@/src/services/firebase/types";

export type SanctuaryHeaderData = {
  month: string;
  wonderLabel: string;
  wonderAccessibilityLabel: string;
  displayName: string;
  avatarSource?: ImageSourcePropType;
  disableAnimations: boolean;
  childrenSummary: ChildrenSummaryEntry[];
  activeChildId: string | null;
};

function formatHeaderMonth(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale, { month: "long" });
}

const DEFAULT_CHILD_NAME = "Friend";

/**
 * Assembles presentational header props at the route/container layer.
 * Name prefers childrenSummary for the active child (plan §9).
 */
export function useSanctuaryHeaderData(): SanctuaryHeaderData {
  const [firestoreWonder, setFirestoreWonder] = useState(0);
  const [previewWonder, setPreviewWonder] = useState(0);
  const [displayName, setDisplayName] = useState(DEFAULT_CHILD_NAME);
  const [legacyDisplayName, setLegacyDisplayName] = useState<string | null>(null);
  const [childrenSummary, setChildrenSummary] = useState<ChildrenSummaryEntry[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [disableAnimations, setDisableAnimations] = useState(false);
  const [uid, setUid] = useState<string | undefined>(
    () => firebaseAuth.currentUser?.uid ?? undefined,
  );
  const prevFirestoreWonderRef = useRef(0);

  const month = formatHeaderMonth(new Date());

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(firebaseAuth, (user) => {
      setUid(user?.uid ?? undefined);
      setAvatarUrl(user?.photoURL ?? undefined);
      setLegacyDisplayName(user?.displayName?.trim() || null);
      if (!user) {
        setFirestoreWonder(0);
        setPreviewWonder(0);
        prevFirestoreWonderRef.current = 0;
        setChildrenSummary([]);
        setActiveChildId(null);
        setDisplayName(DEFAULT_CHILD_NAME);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!uid || !__DEV__) {
      setPreviewWonder(0);
      return;
    }

    let mounted = true;
    const refreshPreviewWonder = () => {
      void getDevPreviewWonder(uid).then((balance) => {
        if (mounted) setPreviewWonder(balance);
      });
    };

    void syncDevPreviewWonderFromWellState(uid).finally(refreshPreviewWonder);
    const unsubPreview = subscribeDevPreviewWonder(refreshPreviewWonder);

    return () => {
      mounted = false;
      unsubPreview();
    };
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      prevFirestoreWonderRef.current = 0;
      return;
    }

    const userRef = doc(firestore, "users", uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          prevFirestoreWonderRef.current = 0;
          setFirestoreWonder(0);
          return;
        }

        const data = snap.data() as UserDoc;
        const nextFirestore = data.currentWonder ?? data.totalWonder ?? 0;
        const prevFirestore = prevFirestoreWonderRef.current;

        if (__DEV__ && nextFirestore > prevFirestore) {
          void reconcileDevPreviewWonder(uid, nextFirestore - prevFirestore).then(() =>
            getDevPreviewWonder(uid).then(setPreviewWonder),
          );
        }

        prevFirestoreWonderRef.current = nextFirestore;
        setFirestoreWonder(nextFirestore);

        const summary = Array.isArray(data.childrenSummary)
          ? (data.childrenSummary as ChildrenSummaryEntry[])
          : [];
        const active = typeof data.activeChildId === "string" ? data.activeChildId : null;
        setChildrenSummary(summary);
        setActiveChildId(active);
        setDisplayName(
          resolveHeaderChildName({
            summary,
            activeChildId: active,
            legacyDisplayName,
          }),
        );
      },
      (error) => {
        console.warn("[SanctuaryHeader] Firestore user snapshot failed", error);
        prevFirestoreWonderRef.current = 0;
        setFirestoreWonder(0);
      },
    );

    return unsub;
  }, [uid, legacyDisplayName]);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setDisableAnimations(enabled);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setDisableAnimations);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const totalWonder = firestoreWonder + (__DEV__ ? previewWonder : 0);
  const wonderPreviewOffset = __DEV__ && previewWonder > 0 ? previewWonder : undefined;

  useEffect(() => {
    if (!__DEV__) return;
    console.log(
      `[SanctuaryHeader] wonder firestore=${firestoreWonder} preview=${previewWonder} total=${totalWonder}`,
    );
  }, [firestoreWonder, previewWonder, totalWonder]);

  const wonderLabel = useMemo(
    () => formatWonderLabel(totalWonder, wonderPreviewOffset),
    [totalWonder, wonderPreviewOffset],
  );

  const wonderAccessibilityLabel = useMemo(
    () => formatWonderAccessibilityLabel(totalWonder, wonderPreviewOffset),
    [totalWonder, wonderPreviewOffset],
  );

  const avatarSource = useMemo(
    (): ImageSourcePropType | undefined => (avatarUrl ? { uri: avatarUrl } : undefined),
    [avatarUrl],
  );

  return {
    month,
    wonderLabel,
    wonderAccessibilityLabel,
    displayName,
    avatarSource,
    disableAnimations,
    childrenSummary,
    activeChildId,
  };
}
