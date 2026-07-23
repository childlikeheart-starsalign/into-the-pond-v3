import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  SANCTUARY_HEADER_LAYER_Z,
  sanctuaryHeaderAssets,
} from "@/src/constants/sanctuaryHeaderAssets";
import { HEADER_FADE_DURATION_MS } from "@/src/constants/sanctuaryHeaderMotion";
import { sanctuaryHeaderTokens } from "@/src/constants/sanctuaryHeaderTokens";
import { formatSanctuaryTimeOfDayLabel } from "@/src/constants/sanctuaryAssets";
import { JournalMargin } from "@/src/components/journal/JournalMargin";
import { splitWonderLabelForDisplay } from "@/src/features/sanctuary/formatSanctuaryHeaderWonder";
import {
  HEADER_COMPOSITE_BAND_HEIGHT,
  HEADER_COMPOSITE_BAND_UP_SHIFT_PT,
  buildSanctuaryHeaderCompositeLayout,
  type HeaderCompositeTuningOffsets,
} from "@/src/features/sanctuary/sanctuaryHeaderLayout";
import { useSanctuaryHeaderTuning } from "@/src/features/sanctuary/sanctuaryHeaderTuningContext";

import { absoluteImageStyle, compositeSlotStyle } from "./compositeStyles";
import type { SanctuaryHeaderProps } from "./types";

const ARTWORK_Z = SANCTUARY_HEADER_LAYER_Z.paperBackground;
const HEADER_Z_MONTH = 3;
const HEADER_Z_WONDER = 5;
const HEADER_Z_AVATAR = 0;
const HEADER_Z_AVATAR_HIT = 6;
const HEADER_Z_DISPLAY_NAME = 7;
const HEADER_Z_SETTINGS = 8;

export function SanctuaryHeader({
  month,
  timeOfDay,
  wonderLabel,
  wonderAccessibilityLabel,
  displayName,
  avatarSource,
  onPressSettings,
  onPressAvatar,
  disableAnimations = false,
  layoutWidth,
  onArtworkLoad,
}: SanctuaryHeaderProps) {
  const insets = useSafeAreaInsets();
  const { state: tuningState, togglePanel: toggleTuningPanel } = useSanctuaryHeaderTuning();
  const contentBandHeight = HEADER_COMPOSITE_BAND_HEIGHT;
  const bandTop = insets.top - HEADER_COMPOSITE_BAND_UP_SHIFT_PT;
  const rootHeight = contentBandHeight + insets.top - HEADER_COMPOSITE_BAND_UP_SHIFT_PT;

  const compositeTuningOffsets = useMemo(
    (): HeaderCompositeTuningOffsets => ({
      month: tuningState.slotOffsets.month,
      wonderBottle: tuningState.slotOffsets.wonderBottle,
      wonderCount: tuningState.slotOffsets.wonderCount,
      childName: tuningState.slotOffsets.childName,
      settings: tuningState.slotOffsets.settings,
      avatarHole: tuningState.slotOffsets.avatar,
    }),
    [tuningState.slotOffsets],
  );

  const compositeLayout = useMemo(() => {
    if (layoutWidth <= 0) {
      return null;
    }
    return buildSanctuaryHeaderCompositeLayout(
      layoutWidth,
      contentBandHeight,
      compositeTuningOffsets,
    );
  }, [compositeTuningOffsets, contentBandHeight, layoutWidth]);

  const avatarOpacity = useRef(new Animated.Value(avatarSource ? 0 : 1)).current;
  const wonderOpacity = useRef(new Animated.Value(1)).current;
  const prevWonderLabel = useRef(wonderLabel);

  useEffect(() => {
    if (!avatarSource) {
      avatarOpacity.setValue(1);
      return;
    }
    if (disableAnimations) {
      avatarOpacity.setValue(1);
      return;
    }
    avatarOpacity.setValue(0);
    Animated.timing(avatarOpacity, {
      toValue: 1,
      duration: HEADER_FADE_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [avatarOpacity, avatarSource, disableAnimations]);

  useEffect(() => {
    if (prevWonderLabel.current === wonderLabel) return;
    prevWonderLabel.current = wonderLabel;
    if (disableAnimations) {
      wonderOpacity.setValue(1);
      return;
    }
    wonderOpacity.setValue(0);
    Animated.timing(wonderOpacity, {
      toValue: 1,
      duration: HEADER_FADE_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [disableAnimations, wonderLabel, wonderOpacity]);

  const [monthLabel, setMonthLabel] = useState(month);
  const monthOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (monthLabel === month) return;
    if (disableAnimations) {
      setMonthLabel(month);
      return;
    }
    Animated.timing(monthOpacity, {
      toValue: 0,
      duration: HEADER_FADE_DURATION_MS / 2,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setMonthLabel(month);
      Animated.timing(monthOpacity, {
        toValue: 1,
        duration: HEADER_FADE_DURATION_MS / 2,
        useNativeDriver: true,
      }).start();
    });
  }, [disableAnimations, month, monthLabel, monthOpacity]);

  const { text: wonderText, showPreviewMarker } = splitWonderLabelForDisplay(wonderLabel);

  const displayNameTapCountRef = useRef(0);
  const displayNameTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDisplayNameDevPress = useCallback(() => {
    if (!__DEV__) return;
    displayNameTapCountRef.current += 1;
    if (displayNameTapTimerRef.current) clearTimeout(displayNameTapTimerRef.current);
    displayNameTapTimerRef.current = setTimeout(() => {
      displayNameTapCountRef.current = 0;
    }, 600);
    if (displayNameTapCountRef.current >= 3) {
      displayNameTapCountRef.current = 0;
      toggleTuningPanel();
    }
  }, [toggleTuningPanel]);

  if (layoutWidth <= 0 || !compositeLayout) return null;

  const avatarBorderRadius = compositeLayout.avatarHole.borderRadius ?? 38;

  return (
    <View
      style={[
        styles.artboardRoot,
        {
          width: layoutWidth,
          height: rootHeight,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.bandRoot,
          {
            top: bandTop,
            width: layoutWidth,
            height: contentBandHeight,
          },
        ]}
        pointerEvents="box-none"
      >
        <Image
          source={sanctuaryHeaderAssets.headerArtwork}
          style={[absoluteImageStyle(compositeLayout.overlay), { zIndex: ARTWORK_Z }]}
          resizeMode="stretch"
          accessible={false}
          importantForAccessibility="no"
          accessibilityElementsHidden
          onLoadEnd={onArtworkLoad}
        />

        <View
          style={[
            compositeSlotStyle(compositeLayout.month),
            styles.monthContent,
            { zIndex: HEADER_Z_MONTH },
          ]}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`Current month, ${monthLabel}`}
        >
          <Animated.Text style={[styles.monthText, { opacity: monthOpacity }]} numberOfLines={1}>
            {monthLabel}
          </Animated.Text>
        </View>

        <View
          style={[
            compositeSlotStyle(compositeLayout.wonderCount),
            styles.wonderContent,
            { zIndex: HEADER_Z_WONDER },
          ]}
          accessible
          accessibilityRole="text"
          accessibilityLabel={wonderAccessibilityLabel}
          accessibilityHint={
            showPreviewMarker
              ? "Preview-only wonder is included until Cloud Functions persist rewards"
              : undefined
          }
        >
          <Animated.Text style={[styles.wonderText, { opacity: wonderOpacity }]} numberOfLines={1}>
            {wonderText}
            {showPreviewMarker ? (
              <Text style={styles.wonderPreviewMarker} accessibilityElementsHidden>
                *
              </Text>
            ) : null}
          </Animated.Text>
        </View>

        <View
          style={[
            compositeSlotStyle(compositeLayout.avatarHole),
            styles.avatarClip,
            { borderRadius: avatarBorderRadius, zIndex: HEADER_Z_AVATAR },
          ]}
          accessibilityRole="image"
          accessibilityLabel="Child profile picture"
          {...(!onPressAvatar
            ? { accessible: true }
            : { importantForAccessibility: "no-hide-descendants" as const })}
          pointerEvents="none"
        >
          {avatarSource ? (
            <Animated.Image
              source={avatarSource}
              style={[
                styles.avatarImage,
                { opacity: avatarOpacity, borderRadius: avatarBorderRadius },
              ]}
              accessible={false}
              importantForAccessibility="no"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { borderRadius: avatarBorderRadius }]} />
          )}
        </View>

        {onPressAvatar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Child profile picture"
            onPress={onPressAvatar}
            style={[
              compositeSlotStyle(compositeLayout.avatarHole),
              { zIndex: HEADER_Z_AVATAR_HIT },
            ]}
          />
        ) : null}

        {__DEV__ ? (
          <Pressable
            accessibilityRole="text"
            accessibilityLabel={displayName}
            accessibilityHint="Triple tap to open header layout tuning in development"
            onPress={handleDisplayNameDevPress}
            style={[
              compositeSlotStyle(compositeLayout.childName),
              styles.centerContent,
              { zIndex: HEADER_Z_DISPLAY_NAME },
            ]}
          >
            <Text style={styles.displayNameText} numberOfLines={1} ellipsizeMode="tail">
              {displayName}
            </Text>
          </Pressable>
        ) : (
          <View
            style={[
              compositeSlotStyle(compositeLayout.childName),
              styles.centerContent,
              { zIndex: HEADER_Z_DISPLAY_NAME },
            ]}
            accessible
            accessibilityRole="text"
            accessibilityLabel={displayName}
          >
            <Text style={styles.displayNameText} numberOfLines={1} ellipsizeMode="tail">
              {displayName}
            </Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={onPressSettings}
          style={[
            compositeSlotStyle(compositeLayout.settingsHit),
            styles.settingsHit,
            { zIndex: HEADER_Z_SETTINGS },
          ]}
        />

        <JournalMargin
          position="bottom"
          content={`${monthLabel} · ${formatSanctuaryTimeOfDayLabel(timeOfDay)}`}
          variant="label"
          accessibilityGrouping="trailing"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  artboardRoot: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 4,
    overflow: "visible",
  },
  bandRoot: {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "hidden",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  monthContent: {
    alignItems: "flex-start",
    justifyContent: "center",
    opacity: sanctuaryHeaderTokens.month.opacity,
  },
  wonderContent: {
    alignItems: "flex-start",
    justifyContent: "center",
  },
  monthText: {
    fontFamily: sanctuaryHeaderTokens.month.fontFamily,
    fontSize: sanctuaryHeaderTokens.month.fontSize,
    color: sanctuaryHeaderTokens.month.color,
    textAlign: "left",
  },
  wonderText: {
    fontFamily: sanctuaryHeaderTokens.wonder.fontFamily,
    fontSize: sanctuaryHeaderTokens.wonder.fontSize,
    color: sanctuaryHeaderTokens.wonder.color,
    textAlign: "left",
  },
  wonderPreviewMarker: {
    fontFamily: sanctuaryHeaderTokens.wonder.fontFamily,
    fontSize: sanctuaryHeaderTokens.wonderPreviewMarker.fontSize,
    color: sanctuaryHeaderTokens.wonder.color,
    opacity: sanctuaryHeaderTokens.wonderPreviewMarker.opacity,
  },
  displayNameText: {
    fontFamily: sanctuaryHeaderTokens.displayName.fontFamily,
    fontSize: sanctuaryHeaderTokens.displayName.fontSize,
    color: sanctuaryHeaderTokens.displayName.color,
    textAlign: "center",
  },
  avatarClip: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: sanctuaryHeaderTokens.avatarPlaceholder.color,
  },
  settingsHit: {
    alignItems: "center",
    justifyContent: "center",
  },
});
