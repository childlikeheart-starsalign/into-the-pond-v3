import Svg, { Path } from "react-native-svg";

type WellLinkIconProps = {
  size: number;
  color: string;
};

/** Tabler-style refresh (ti-refresh). */
export function WellRefreshIcon({ size, color }: WellLinkIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
      <Path
        d="M20 11a8.1 8.1 0 0 0-15.5-2m-.5-4v4h4"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Tabler-style bookmark (ti-bookmark). */
export function WellBookmarkIcon({ size, color }: WellLinkIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
      <Path
        d="M9 4h6a2 2 0 0 1 2 2v14l-5-3-5 3V6a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
