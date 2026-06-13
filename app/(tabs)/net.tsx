import { FieldJournalScreen } from "@/src/components/fieldJournal/FieldJournalScreen";

/** Sanctuary Field Journal — creature collection memory artifact (Net tab) */
export default function NetScreen() {
  return <FieldJournalScreen />;
}

/** Disable iOS edge-swipe back while in the journal */
export const options = {
  gestureEnabled: false as const,
};
