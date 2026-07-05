import { StyleSheet, View } from "react-native";

import { WellDepthLeafIcon } from "@/src/features/well/WellDepthLeafIcon";

type WellDepthRatingProps = {
  rating: 1 | 2 | 3 | 4 | 5;
  size?: number;
};

export function WellDepthRating({ rating, size = 9 }: WellDepthRatingProps) {
  return (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={`Depth ${rating} of 5`}>
      {([1, 2, 3, 4, 5] as const).map((index) => (
        <WellDepthLeafIcon key={index} filled={index <= rating} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
});
