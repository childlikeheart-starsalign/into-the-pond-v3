/**
 * Local notification when a fishing cast becomes ready.
 * Device-scheduled at createCast success; cleared on cancel/claim.
 * Permission denied → silent no-op (landmark cue covers re-engagement).
 *
 * Multi-device: orphaned schedules are cancelled on reconcile when server
 * activeCast no longer matches (device B after A claimed/cancelled).
 *
 * Requires a native rebuild after adding `expo-notifications`. Stale dev
 * clients skip scheduling (soft-fail) so the app still boots.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

import {
  CAST_READY_NOTIF_STORAGE_PREFIX,
  castIdsFromNotifStorageKeys,
  orphanedCastReadyCastIds,
} from "@/src/features/fishing/castReadyNotificationLogic";

export {
  CAST_READY_NOTIF_STORAGE_PREFIX,
  orphanedCastReadyCastIds,
} from "@/src/features/fishing/castReadyNotificationLogic";

/** Calm re-engagement register — matches landmark cue “Something has been waiting.” */
export const CAST_READY_NOTIFICATION_BODY = "Something's waiting at the pond";

type NotificationsModule = typeof import("expo-notifications");

let notificationsModule: NotificationsModule | null | undefined;

/** True when this binary includes the native modules expo-notifications needs. */
export function hasExpoNotificationsNativeModules(): boolean {
  const scheduler = requireOptionalNativeModule("ExpoNotificationScheduler");
  const pushToken = requireOptionalNativeModule("ExpoPushTokenManager");
  const permissions = requireOptionalNativeModule("ExpoNotificationPermissionsModule");
  return Boolean(scheduler && pushToken && permissions);
}

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (notificationsModule !== undefined) return notificationsModule;

  // Importing `expo-notifications` eagerly loads PushTokenManager.native.js, which
  // throws if the native module is missing. Probe first so stale builds soft-fail.
  if (!hasExpoNotificationsNativeModules()) {
    console.warn(
      "[Fishing] expo-notifications native modules missing — rebuild the dev client to enable cast-ready alerts.",
    );
    notificationsModule = null;
    return null;
  }

  try {
    notificationsModule = await import("expo-notifications");
    return notificationsModule;
  } catch (error) {
    console.warn("[Fishing] Could not load expo-notifications", error);
    notificationsModule = null;
    return null;
  }
}

function storageKey(castId: string): string {
  return `${CAST_READY_NOTIF_STORAGE_PREFIX}${castId}`;
}

export async function listRegisteredCastReadyCastIds(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return castIdsFromNotifStorageKeys(keys);
  } catch {
    return [];
  }
}

export async function hasScheduledCastReadyNotification(castId: string): Promise<boolean> {
  try {
    const existing = await AsyncStorage.getItem(storageKey(castId));
    return Boolean(existing);
  } catch {
    return false;
  }
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("fishing-cast-ready", {
    name: "Pond casts",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0],
  });
}

/**
 * Request permission once (no re-prompt loop). Schedule at readyAt if granted.
 */
export async function scheduleCastReadyNotification(input: {
  castId: string;
  readyAt: number;
}): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  const delayMs = input.readyAt - Date.now();
  if (delayMs <= 0) return;

  try {
    const existing = await AsyncStorage.getItem(storageKey(input.castId));
    if (existing) {
      try {
        await Notifications.cancelScheduledNotificationAsync(existing);
      } catch {
        /* ignore */
      }
    }

    const permissions = await Notifications.getPermissionsAsync();
    let status = permissions.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") return;

    await ensureAndroidChannel(Notifications);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Into the Pond",
        body: CAST_READY_NOTIFICATION_BODY,
        data: { type: "cast_ready", castId: input.castId },
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.ceil(delayMs / 1000)),
        channelId: Platform.OS === "android" ? "fishing-cast-ready" : undefined,
      },
    });
    await AsyncStorage.setItem(storageKey(input.castId), id);
  } catch (error) {
    console.warn("[Fishing] Could not schedule cast-ready notification", error);
  }
}

export async function cancelCastReadyNotification(castId: string): Promise<void> {
  const Notifications = await loadNotifications();
  const key = storageKey(castId);
  const existing = await AsyncStorage.getItem(key);
  await AsyncStorage.removeItem(key);
  if (!Notifications || !existing) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(existing);
  } catch {
    /* ignore */
  }
}

/**
 * Cancel local schedules that do not match server activeCast.
 * When `activeCastId` is null, cancel all registered cast-ready notifications.
 */
export async function cancelOrphanedCastReadyNotifications(
  activeCastId: string | null,
): Promise<string[]> {
  const registered = await listRegisteredCastReadyCastIds();
  const orphans = orphanedCastReadyCastIds(registered, activeCastId);
  for (const castId of orphans) {
    await cancelCastReadyNotification(castId);
  }
  return orphans;
}

/**
 * After reconcile: drop orphans; if server still has a future-ready cast and
 * this device has no schedule, schedule one (covers multi-device gap).
 */
export async function syncCastReadyNotificationsWithServer(input: {
  activeCastId: string | null;
  readyAt?: number;
}): Promise<void> {
  await cancelOrphanedCastReadyNotifications(input.activeCastId);
  if (!input.activeCastId || input.readyAt == null) return;
  if (input.readyAt <= Date.now()) return;
  const hasLocal = await hasScheduledCastReadyNotification(input.activeCastId);
  if (hasLocal) return;
  await scheduleCastReadyNotification({
    castId: input.activeCastId,
    readyAt: input.readyAt,
  });
}
