import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";

import { Portrait } from "@/components/story/Portrait";
import { TypewriterText } from "@/components/story/TypewriterText";
import { STORY_JOURNAL_CARD } from "@/src/constants/storyAssets";
import {
  isBracketedStageDirection,
  scaleDialogueTypography,
  storyFolioColors,
} from "@/src/constants/storyDialogueStyles";
import { fontFamilies } from "@/src/constants/theme";

type JournalFolioProps = {
  portrait: ImageSourcePropType | null;
  speaker?: string;
  dialogue: string;
  width: number;
  height: number;
  padTop: number;
  padLeft: number;
  padRight: number;
  padBottom: number;
  medallionSize: number;
  medallionGap: number;
  medallionTextGutter: number;
  medallionTopInset: number;
  dialogueFontSize: number;
  dialogueLineHeight: number;
  speakerFontSize: number;
  turnHintFontSize: number;
  typewriterMs: number;
  dialogueRevealDelayMs: number;
  typingDone: boolean;
  reducedMotion: boolean;
  onTypingComplete: () => void;
  /** Hide the “Turn the page” cue (interactive Part 2 lines). */
  showTurnHint?: boolean;
  animatedStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  portraitAnimatedStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  dialogueAnimatedStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  hintAnimatedStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
};

/**
 * Botanical journal card — irregular parchment sheet resting on the scene.
 * Source art is assets/ui/card.png (black keyed, reduced 60%).
 */
export function JournalFolio({
  portrait,
  speaker,
  dialogue,
  width,
  height,
  padTop,
  padLeft,
  padRight,
  padBottom,
  medallionSize,
  medallionGap,
  medallionTextGutter,
  medallionTopInset,
  dialogueFontSize,
  dialogueLineHeight,
  speakerFontSize,
  turnHintFontSize,
  typewriterMs,
  dialogueRevealDelayMs,
  typingDone,
  reducedMotion,
  onTypingComplete,
  showTurnHint = true,
  animatedStyle,
  portraitAnimatedStyle,
  dialogueAnimatedStyle,
  hintAnimatedStyle,
}: JournalFolioProps) {
  const showFullText = typingDone || reducedMotion;
  const isNarration = isBracketedStageDirection(dialogue);
  const dialogueType = scaleDialogueTypography(dialogueFontSize, dialogueLineHeight, dialogue);

  return (
    <View style={styles.offset}>
      <Animated.View style={[styles.shell, { width, height }, animatedStyle]}>
        {/* Soft warm lift — sheet resting on the table, not a UI card shadow */}
        <View style={styles.paperShadow} pointerEvents="none" />

        <Image
          source={STORY_JOURNAL_CARD}
          style={styles.cardArt}
          resizeMode="contain"
          accessible={false}
        />

        {portrait ? (
          <View
            style={[
              styles.portraitPaste,
              {
                top: medallionTopInset,
                left: padLeft,
              },
            ]}
            pointerEvents="none"
          >
            <Portrait
              source={portrait}
              size={medallionSize}
              animatedStyle={portraitAnimatedStyle}
            />
          </View>
        ) : null}

        <View
          style={[
            styles.content,
            {
              paddingTop: padTop,
              paddingLeft: padLeft,
              paddingRight: padRight,
              paddingBottom: padBottom,
            },
          ]}
        >
          <View
            style={[
              styles.row,
              {
                /** Half-medallion gutter — wider measure like an Edwardian picture book */
                marginLeft: portrait ? medallionTextGutter : 0,
              },
            ]}
          >
            <View style={styles.textColumn}>
              {speaker ? (
                <Text
                  style={[
                    styles.speaker,
                    {
                      fontSize: speakerFontSize,
                      lineHeight: Math.round(speakerFontSize * 1.4),
                      letterSpacing: speakerFontSize * 0.1,
                    },
                  ]}
                >
                  {speaker}
                </Text>
              ) : null}

              <Animated.View
                style={[
                  styles.dialogueReveal,
                  isNarration ? styles.narrationSlot : styles.dialogueSpoken,
                  dialogueAnimatedStyle,
                ]}
              >
                {showFullText ? (
                  <Text
                    style={[
                      styles.dialogue,
                      isNarration && styles.narration,
                      {
                        fontSize: dialogueType.fontSize,
                        lineHeight: dialogueType.lineHeight,
                      },
                    ]}
                  >
                    {dialogue}
                  </Text>
                ) : (
                  <TypewriterText
                    text={dialogue}
                    speed={typewriterMs}
                    delayMs={dialogueRevealDelayMs}
                    onComplete={onTypingComplete}
                    style={[
                      styles.dialogue,
                      isNarration && styles.narration,
                      {
                        fontSize: dialogueType.fontSize,
                        lineHeight: dialogueType.lineHeight,
                      },
                    ]}
                  />
                )}
              </Animated.View>

              {showTurnHint ? (
                <Animated.View style={[styles.hintRow, hintAnimatedStyle]}>
                  <Text style={[styles.hint, { fontSize: turnHintFontSize }]}>Turn the page</Text>
                  <MaterialCommunityIcons
                    name="leaf"
                    size={10}
                    color={storyFolioColors.turnHint}
                    style={styles.leaf}
                  />
                </Animated.View>
              ) : null}
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  offset: {
    marginLeft: 18,
    marginTop: 10,
  },
  shell: {
    alignSelf: "center",
    overflow: "visible",
  },
  paperShadow: {
    position: "absolute",
    top: "10%",
    right: "6%",
    bottom: "8%",
    left: "6%",
    backgroundColor: "rgba(43, 36, 29, 0.08)",
    borderRadius: 18,
    shadowColor: "#2B241D",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 1, height: 5 },
    elevation: 3,
  },
  cardArt: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  portraitPaste: {
    position: "absolute",
    zIndex: 6,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  textColumn: {
    flex: 1,
    width: "100%",
    maxWidth: "88%",
    alignSelf: "flex-start",
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  speaker: {
    fontFamily: fontFamilies.bodyMedium,
    textTransform: "uppercase",
    color: storyFolioColors.speaker,
    marginBottom: 8,
    marginTop: -5,
    marginLeft: 40,
    textAlign: "left",
    width: "100%",
  },
  dialogue: {
    fontFamily: fontFamilies.headingRegular,
    letterSpacing: -0.01 * 16,
    fontWeight: "400",
    color: storyFolioColors.ink,
    textAlign: "left",
    width: "100%",
  },
  dialogueReveal: {
    width: "100%",
    alignSelf: "stretch",
  },
  /** Spoken lines — left 9px / down 7px polish from kitchen Open Folio */
  dialogueSpoken: {
    marginLeft: -29,
    marginTop: 7,
  },
  narration: {
    color: "rgba(43, 36, 29, 0.78)",
  },
  /** Bracket stage directions — keep a mild inset; skip spoken offsets */
  narrationSlot: {
    marginLeft: 10,
    marginTop: 0,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
    minHeight: 44,
    alignSelf: "flex-end",
    transform: [{ translateX: -54 }],
  },
  hint: {
    fontFamily: fontFamilies.bodyMedium,
    color: storyFolioColors.turnHint,
    letterSpacing: 0.2,
    opacity: 0.68,
  },
  leaf: {
    marginLeft: 6,
    opacity: 0.68,
  },
});
