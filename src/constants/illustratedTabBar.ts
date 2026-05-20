/** Left-to-right slots on the baked-in sanctuary artboard tab bar (576×1024). */
export type IllustratedTabId = "net" | "classroom" | "sanctuary" | "store" | "gate";

export type IllustratedTabSlot = {
  id: IllustratedTabId;
  label: string;
  /** Width share of the bottom bar (sum = 1). */
  widthShare: number;
};

export const ILLUSTRATED_TAB_BAR_HEIGHT = 88;

/** Fish collection → Classroom → Sanctuary → Store → Gate (settings) */
export const ILLUSTRATED_TABS: IllustratedTabSlot[] = [
  { id: "net", label: "Fish collection", widthShare: 0.2 },
  { id: "classroom", label: "Classroom", widthShare: 0.2 },
  { id: "sanctuary", label: "Sanctuary", widthShare: 0.2 },
  { id: "store", label: "Store", widthShare: 0.2 },
  { id: "gate", label: "Gate", widthShare: 0.2 },
];
