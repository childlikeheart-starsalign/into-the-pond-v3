import { router, useLocalSearchParams } from "expo-router";

import { ChildAtlasScreen } from "@/src/features/childAtlas/ChildAtlasScreen";
import type { DiscoveryCategory } from "@/shared/sanctuary/well/types";

export default function ChildAtlasModalScreen() {
  const params = useLocalSearchParams<{ category?: string; entryId?: string }>();

  return (
    <ChildAtlasScreen
      onClose={() => router.back()}
      initialCategory={params.category as DiscoveryCategory | undefined}
      initialEntryId={params.entryId}
    />
  );
}
