import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { atlasColors, colors, fontFamilies, spacing } from "@/src/constants/theme";
import { ChildAtlasBackground } from "@/src/features/childAtlas/ChildAtlasBackground";
import { ChildAtlasEmptyState } from "@/src/features/childAtlas/ChildAtlasEmptyState";
import { ChildAtlasPileFocus } from "@/src/features/childAtlas/ChildAtlasPileFocus";
import type { PileOriginRect } from "@/src/features/childAtlas/atlasEntryCardLayout";
import { ChildAtlasPileGrid } from "@/src/features/childAtlas/ChildAtlasPileGrid";
import { findEntryIndex, useChildAtlas } from "@/src/hooks/useChildAtlas";
import { useActiveChild } from "@/src/features/childProfile/useActiveChild";
import type { DiscoveryCategory } from "@/shared/sanctuary/well/types";
import { firebaseAuth } from "@/src/services/firebase/client";

type ChildAtlasScreenProps = {
  onClose: () => void;
  initialCategory?: DiscoveryCategory;
  initialEntryId?: string;
};

export function ChildAtlasScreen({
  onClose,
  initialCategory,
  initialEntryId,
}: ChildAtlasScreenProps) {
  const uid = firebaseAuth.currentUser?.uid ?? null;
  const { childAwareId } = useActiveChild();
  const { entries, entriesByCategory, loading, error } = useChildAtlas(uid, childAwareId);

  const [focusCategory, setFocusCategory] = useState<DiscoveryCategory | null>(null);
  const [focusOrigin, setFocusOrigin] = useState<PileOriginRect | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (loading || entries.length === 0 || autoOpenedRef.current) return;
    if (focusCategory) return;

    if (initialCategory && (entriesByCategory[initialCategory]?.length ?? 0) > 0) {
      autoOpenedRef.current = true;
      setFocusCategory(initialCategory);
      return;
    }
    if (initialEntryId) {
      const match = entries.find((e) => e.id === initialEntryId);
      if (match) {
        autoOpenedRef.current = true;
        setFocusCategory(match.category);
      }
    }
  }, [loading, entries, entriesByCategory, initialCategory, initialEntryId, focusCategory]);

  const focusEntries = focusCategory ? (entriesByCategory[focusCategory] ?? []) : [];
  const focusIndex = findEntryIndex(focusEntries, initialEntryId);

  const handleSelectCategory = (category: DiscoveryCategory, origin: PileOriginRect) => {
    setFocusOrigin(origin);
    setFocusCategory(category);
  };

  const handleCloseFocus = () => {
    setFocusCategory(null);
    setFocusOrigin(null);
  };

  return (
    <ChildAtlasBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.backHit}>
            <Text style={styles.backText}>Close</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : entries.length === 0 ? (
          <ChildAtlasEmptyState />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <ChildAtlasPileGrid
              entriesByCategory={entriesByCategory}
              onSelectCategory={handleSelectCategory}
            />
          </ScrollView>
        )}

        {focusCategory && focusEntries.length > 0 ? (
          <ChildAtlasPileFocus
            category={focusCategory}
            entries={focusEntries}
            initialIndex={focusIndex}
            origin={focusOrigin}
            reduceMotion={reduceMotion}
            onClose={handleCloseFocus}
          />
        ) : null}
      </SafeAreaView>
    </ChildAtlasBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: spacing.inner,
  },
  backHit: {
    minHeight: 48,
    justifyContent: "center",
  },
  backText: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    color: atlasColors.inkMuted,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    color: atlasColors.inkMuted,
    paddingHorizontal: spacing.section,
    textAlign: "center",
  },
  scroll: {
    paddingBottom: spacing.section,
  },
});
