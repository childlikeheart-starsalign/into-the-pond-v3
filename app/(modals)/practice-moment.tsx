import { router } from "expo-router";

import { PracticeMomentScreen } from "@/src/features/sanctuary/PracticeMomentScreen";

/** Practice Moment — dedicated sanctuary modal */
export default function PracticeMomentModalScreen() {
  return <PracticeMomentScreen onClose={() => router.back()} />;
}
