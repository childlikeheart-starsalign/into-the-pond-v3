import type { DiscoveryCategory } from "@/shared/sanctuary/well/types";

const CATEGORY_DISPLAY_NAMES: Record<DiscoveryCategory, string> = {
  curiosity: "Curiosity",
  worries: "Worries",
  excitement: "Excitement",
  interests: "Interests",
  emotional: "Emotional",
  social: "Social",
  identity: "Identity",
  imagination: "Imagination",
};

export function atlasCategoryDisplayName(category: DiscoveryCategory): string {
  return CATEGORY_DISPLAY_NAMES[category];
}

export function atlasCategoryAccessibilityLabel(
  category: DiscoveryCategory,
  count: number,
  disabled: boolean,
): string {
  const name = atlasCategoryDisplayName(category);
  const discoveryWord = count === 1 ? "discovery" : "discoveries";
  const base = `${name}, ${count} ${discoveryWord}`;
  return disabled ? `${base}, unavailable` : base;
}
