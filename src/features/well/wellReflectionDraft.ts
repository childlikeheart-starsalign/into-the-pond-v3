import AsyncStorage from "@react-native-async-storage/async-storage";

function draftKey(uid: string, localDate: string, questionId: string) {
  return `wellReflectionDraft:${uid}:${localDate}:${questionId}`;
}

export async function getWellReflectionDraft(
  uid: string,
  localDate: string,
  questionId: string,
): Promise<string | null> {
  return AsyncStorage.getItem(draftKey(uid, localDate, questionId));
}

export async function setWellReflectionDraft(
  uid: string,
  localDate: string,
  questionId: string,
  text: string,
): Promise<void> {
  await AsyncStorage.setItem(draftKey(uid, localDate, questionId), text);
}

export async function clearWellReflectionDraft(
  uid: string,
  localDate: string,
  questionId: string,
): Promise<void> {
  await AsyncStorage.removeItem(draftKey(uid, localDate, questionId));
}
