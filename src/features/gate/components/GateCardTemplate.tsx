import type { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, View, type ImageSourcePropType } from "react-native";

import type { CardFrame, CardLayout } from "@/src/features/gate/cardLayouts";
import { GateCardLayoutDebugOverlay } from "@/src/features/gate/components/GateCardLayoutDebugOverlay";
import { GateCardShell } from "@/src/features/gate/components/GateCardShell";
import { useGateLayoutDebug } from "@/src/features/gate/gateLayoutDebug";

export type GateCardTemplateSlots = {
  illustration?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  features?: ReactNode;
  pricing?: ReactNode;
  buttons?: ReactNode;
  /** Ribbons, wax seals — decorative overlays outside text frames. */
  overlays?: ReactNode;
  /** Extra labeled frames (e.g. active tier on current access). */
  extraTextFrames?: readonly { frame: CardFrame; node: ReactNode }[];
};

type GateCardTemplateProps = {
  layout: CardLayout;
  source: ImageSourcePropType;
  accessibilityLabel?: string;
  slots: GateCardTemplateSlots;
  /** Additional frames drawn in debug (button sub-slots). */
  debugButtonSlots?: readonly CardFrame[];
};

/**
 * Renders card artwork as a layout template.
 * All slot content is clipped to its assigned CardFrame via the layout engine.
 */
export function GateCardTemplate({
  layout,
  source,
  accessibilityLabel,
  slots,
  debugButtonSlots = [],
}: GateCardTemplateProps) {
  const debug = useGateLayoutDebug();

  return (
    <GateCardShell source={source} accessibilityLabel={accessibilityLabel}>
      {debug ? <GateCardLayoutDebugOverlay layout={layout} buttonSlots={debugButtonSlots} /> : null}

      {slots.overlays}

      <CardLayoutSlot frame={layout.illustrationFrame} clip>
        {slots.illustration}
      </CardLayoutSlot>

      <CardLayoutSlot frame={layout.titleFrame} clip>
        {slots.title}
      </CardLayoutSlot>

      <CardLayoutSlot frame={layout.descriptionFrame} clip>
        {slots.description}
      </CardLayoutSlot>

      {layout.featuresFrame ? (
        <CardLayoutSlot frame={layout.featuresFrame} clip>
          {slots.features}
        </CardLayoutSlot>
      ) : null}

      {layout.pricingFrame ? (
        <CardLayoutSlot frame={layout.pricingFrame} clip>
          {slots.pricing}
        </CardLayoutSlot>
      ) : null}

      {layout.buttonFrame ? (
        <CardLayoutSlot frame={layout.buttonFrame} clip>
          {slots.buttons}
        </CardLayoutSlot>
      ) : null}

      {slots.extraTextFrames?.map((entry, index) => (
        <CardLayoutSlot key={`extra-${index}`} frame={entry.frame} clip>
          {entry.node}
        </CardLayoutSlot>
      ))}
    </GateCardShell>
  );
}

type CardLayoutSlotProps = PropsWithChildren<{
  frame: CardFrame;
  clip?: boolean;
}>;

/** Single content frame from CardLayout — only positioning primitive in the gate card system. */
export function CardLayoutSlot({ frame, clip = false, children }: CardLayoutSlotProps) {
  if (!children) return null;

  return (
    <View style={[styles.slot, frameToGridStyle(frame), clip && styles.clip]}>{children}</View>
  );
}

/** Maps normalized CardFrame to percentage-based grid cell (declarative template positioning). */
export function frameToGridStyle(frame: CardFrame) {
  return {
    left: `${frame.left * 100}%`,
    top: `${frame.top * 100}%`,
    width: `${frame.width * 100}%`,
    height: `${frame.height * 100}%`,
  } as const;
}

const styles = StyleSheet.create({
  slot: {
    position: "absolute",
    overflow: "hidden",
  },
  clip: {
    overflow: "hidden",
  },
});
