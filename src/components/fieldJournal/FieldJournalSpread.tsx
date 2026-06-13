import { Canvas, Image, useImage } from "@shopify/react-native-skia";
import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { fitJournalSceneRect, type FitRect } from "@/src/features/fieldJournal/fitContainRect";
import { retainSpreadImage } from "@/src/features/fieldJournal/spreadImageCache";
import type { FieldJournalSpread } from "@/src/features/fieldJournal/types";

/** Loads spread textures into GPU cache without painting. */
export function SpreadImagePreloader({ spread }: { spread: FieldJournalSpread }) {
  const sceneImage = useImage(spread.asset);
  const pageImage = useImage(spread.pageAsset ?? null);

  useEffect(() => {
    if (sceneImage) {
      retainSpreadImage(`${spread.id}-scene`, sceneImage);
    }
  }, [sceneImage, spread.id]);

  useEffect(() => {
    if (pageImage) {
      retainSpreadImage(`${spread.id}-page`, pageImage);
    }
  }, [pageImage, spread.id]);

  return null;
}

type FieldJournalSpreadProps = {
  spread: FieldJournalSpread;
  width: number;
  height: number;
  active: boolean;
  /** Horizontal offset for page peel drag */
  translateX?: number;
  zIndex?: number;
  onImageRectChange?: (rect: FitRect) => void;
};

export function FieldJournalSpreadView({
  spread,
  width,
  height,
  active,
  translateX = 0,
  zIndex = 0,
  onImageRectChange,
}: FieldJournalSpreadProps) {
  const image = useImage(spread.asset);

  /** All reader spreads use 576×1024 — cover-fit scene artboard in the frame. */
  const imageRect = useMemo(() => fitJournalSceneRect(width, height), [height, width]);

  useEffect(() => {
    if (image) {
      retainSpreadImage(spread.id, image);
    }
  }, [image, spread.id]);

  useEffect(() => {
    if (image && onImageRectChange) {
      onImageRectChange(imageRect);
    }
  }, [image, imageRect, onImageRectChange]);

  return (
    <View
      style={[
        styles.layer,
        {
          width,
          height,
          zIndex,
          transform: [{ translateX }],
        },
      ]}
      pointerEvents="none"
    >
      {image && imageRect ? (
        <Canvas style={{ width, height }}>
          <Image
            image={image}
            x={imageRect.x}
            y={imageRect.y}
            width={imageRect.width}
            height={imageRect.height}
            fit="fill"
          />
        </Canvas>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
