import type { ImageSourcePropType } from "react-native";

import type { StorybookIllustrationKey } from "@/src/features/childProfile/prepareStorybookMessages";

const PREPARE_STORYBOOK_ILLUSTRATIONS = {
  closedJournal: require("@/assets/journal/cover_sanctuary_field_journal.png"),
  /** Interim art — dedicated lantern+journal watercolor pending. */
  foggyPath: require("@/assets/journal/open_book_scene.png"),
  spiritGuide: require("@/assets/portraits/spirit.png"),
} as const satisfies Record<StorybookIllustrationKey, ImageSourcePropType>;

export function resolvePrepareStorybookIllustration(
  key: StorybookIllustrationKey,
): ImageSourcePropType {
  return PREPARE_STORYBOOK_ILLUSTRATIONS[key];
}
