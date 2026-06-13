export type BreathingHotspot = {
  /** Normalized center X (0–1) */
  x: number;
  /** Normalized center Y (0–1) */
  y: number;
  /** Normalized horizontal radius */
  rx: number;
  /** Normalized vertical radius */
  ry: number;
  color: string;
};

export type FieldJournalSpread = {
  id: string;
  /** Full 576×1024 scene spread (tabs, desk, creatures). */
  asset: number;
  /** Page-only crop with transparent padding for curl sampling. */
  pageAsset?: number;
  hotspots: BreathingHotspot[];
};

export type FieldJournalChapterId = "stillwater" | "deep-current" | "charged-depths";

export type FieldJournalChapter = {
  id: FieldJournalChapterId;
  label: string;
  /** First net-slot index in this chapter (inclusive). */
  creatureStart: number;
  /** Last net-slot index in this chapter (inclusive). */
  creatureEnd: number;
  spreads: FieldJournalSpread[];
};
