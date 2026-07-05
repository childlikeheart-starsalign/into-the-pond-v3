import AsyncStorage from "@react-native-async-storage/async-storage";

export type WellCardStatus = "pending" | "asked" | "answered";

function askedKey(uid: string, localDate: string, questionId: string) {
  return `wellCardAsked:${uid}:${localDate}:${questionId}`;
}

export async function getWellAskedFlag(
  uid: string,
  localDate: string,
  questionId: string,
): Promise<boolean> {
  const value = await AsyncStorage.getItem(askedKey(uid, localDate, questionId));
  return value === "1";
}

export async function markWellAsked(
  uid: string,
  localDate: string,
  questionId: string,
): Promise<void> {
  await AsyncStorage.setItem(askedKey(uid, localDate, questionId), "1");
}

export async function clearWellAsked(
  uid: string,
  localDate: string,
  questionId: string,
): Promise<void> {
  await AsyncStorage.removeItem(askedKey(uid, localDate, questionId));
}

export function deriveWellCardStatus(hasAnsweredToday: boolean, asked: boolean): WellCardStatus {
  if (hasAnsweredToday) return "answered";
  if (asked) return "asked";
  return "pending";
}
