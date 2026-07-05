/** Canonical idempotency key builders — keep in sync with economy callables. */

export function lessonCompleteKey(lessonId: string): string {
  return `lesson_complete:${lessonId}`;
}

export function wellAnswerKey(localDate: string): string {
  return `well_answer:${localDate}`;
}

export function fishingClaimKey(castId: string): string {
  return `fishing_claim:${castId}`;
}

export function craftStartKey(rodId: string): string {
  return `craft_start:${rodId}`;
}

export function craftCollectKey(rodId: string): string {
  return `craft_collect:${rodId}`;
}

export function rodEquipKey(rodId: string): string {
  return `rod_equip:${rodId}`;
}

export function practiceKey(localDate: string, kind: string): string {
  return `practice:${localDate}:${kind}`;
}

export function baitCraftKey(requestId: string): string {
  return `bait_craft:${requestId}`;
}

export function diaryKey(requestId: string): string {
  return `diary:${requestId}`;
}

export function castCreateKey(requestId: string): string {
  return `cast_create:${requestId}`;
}

export function wellAssignKey(localDate: string): string {
  return `well_assign:${localDate}`;
}

export function wellRerollKey(localDate: string, requestId: string): string {
  return `well_reroll:${localDate}:${requestId}`;
}

export function purchaseVerifyKey(transactionId: string): string {
  return `purchase_verify:${transactionId}`;
}

export function fishingResetKey(utcDate: string): string {
  return `fishing_reset:${utcDate}`;
}
