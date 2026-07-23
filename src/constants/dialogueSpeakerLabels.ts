import type { DialogueSpeaker } from "@/src/data/dialogues";

const SPEAKER_LABELS: Record<DialogueSpeaker, string | undefined> = {
  spirit: "The Old Spirit",
  parent: "You",
  child: "Your Child",
  none: undefined,
};

/** Display label for Open Folio speaker line; undefined for narration. */
export function dialogueSpeakerLabel(speaker: DialogueSpeaker): string | undefined {
  return SPEAKER_LABELS[speaker];
}
