import { router } from "expo-router";

import { WellModalContent } from "@/src/features/well/WellModalContent";

/** Well of Questions — full-screen modal landmark (DOB collected in prologue). */
export default function WellModalScreen() {
  return <WellModalContent onClose={() => router.back()} />;
}
