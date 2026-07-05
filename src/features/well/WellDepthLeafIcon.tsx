import Svg, { Path } from "react-native-svg";

const SAGE = "#7A9070";
const STONE = "#D8DCD0";

type WellDepthLeafIconProps = {
  filled?: boolean;
  size?: number;
};

/** Small garden leaf for depth rating row (SVG, not emoji). */
export function WellDepthLeafIcon({ filled = true, size = 9 }: WellDepthLeafIconProps) {
  const fill = filled ? SAGE : STONE;
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" accessibilityElementsHidden>
      <Path
        d="M6 1.1C4.4 3.6 3.4 6.4 4.8 9.6c-1.5-0.5-2.2-1.8-1.8-3.2C3.6 5.1 4.8 2.8 6 1.1Zm0 0c1.2 1.7 2.4 4 1.8 5.3-0.4 1.4-1.1 2.7-2.6 3.2C6.6 6.4 7.6 3.6 6 1.1Z"
        fill={fill}
      />
    </Svg>
  );
}
