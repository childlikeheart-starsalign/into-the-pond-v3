import { forwardRef } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { fontFamilies, wellColors } from "@/src/constants/theme";
import { ATLAS_SAVED_LABEL } from "@/src/features/well/wellCopy";
import { WELL_ATLAS_SAVED_ICON } from "@/src/features/well/wellAssets";
import { routes } from "@/src/navigation/routes";

type WellAtlasSavedLabelProps = {
  entryId?: string;
};

export const WellAtlasSavedLabel = forwardRef<View, WellAtlasSavedLabelProps>(
  function WellAtlasSavedLabel({ entryId }, ref) {
    return (
      <Pressable
        ref={ref}
        accessibilityRole="link"
        accessibilityLabel={ATLAS_SAVED_LABEL}
        onPress={() => {
          if (entryId) {
            router.push(`/child-atlas?entryId=${encodeURIComponent(entryId)}`);
          } else {
            router.push(routes.childAtlas);
          }
        }}
        style={styles.wrap}
      >
        <Image source={WELL_ATLAS_SAVED_ICON} style={styles.icon} resizeMode="contain" />
        <Text style={styles.label}>{ATLAS_SAVED_LABEL}</Text>
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  icon: {
    width: 18,
    height: 18,
  },
  label: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    color: wellColors.sage,
  },
});
