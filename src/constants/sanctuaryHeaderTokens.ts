import { fontFamilies } from "@/src/constants/theme";

export const sanctuaryHeaderTokens = {
  month: {
    color: "#3D3026",
    opacity: 0.75,
    fontFamily: fontFamilies.headingSemi,
    fontSize: 18,
  },
  displayName: {
    color: "#2F241D",
    fontFamily: fontFamilies.gateTitleSemi,
    fontSize: 13.2,
  },
  wonder: {
    color: "#66574D",
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
  },
  wonderPreviewMarker: {
    fontSize: 9,
    opacity: 0.65,
  },
  avatarPlaceholder: {
    color: "#F8F4EB",
  },
} as const;
