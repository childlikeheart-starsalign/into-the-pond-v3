import assert from "node:assert/strict";
import test from "node:test";

import {
  chapterStepFromIndex,
  formatChapterLabel,
  usesRomanChapterNumerals,
} from "@/src/components/journal/formatChapterNumber";
import {
  formatClaimMarginDate,
  formatObservedMarginDate,
} from "@/src/components/journal/formatJournalMarginDate";
import { FIELD_ENTRY_MARGIN_LABEL } from "@/src/components/journal/journalMarginCopy";

test("FIELD ENTRY is a static category label", () => {
  assert.equal(FIELD_ENTRY_MARGIN_LABEL, "FIELD ENTRY");
});

test("formatChapterLabel uses Roman numerals for en locales", () => {
  assert.equal(formatChapterLabel("name", "en-US"), "Chapter I — The Name");
  assert.equal(formatChapterLabel("age", "en"), "Chapter II — The Season");
  assert.equal(formatChapterLabel("companion", "en-GB"), "Chapter III — The Companion");
  assert.equal(formatChapterLabel("interests", "en_AU"), "Chapter IV — The Curiosities");
  assert.equal(usesRomanChapterNumerals("en-US"), true);
});

test("formatChapterLabel uses Arabic numerals for non-en locales", () => {
  assert.equal(formatChapterLabel("name", "fr-FR"), "Chapter 1 — The Name");
  assert.equal(formatChapterLabel("age", "de-DE"), "Chapter 2 — The Season");
  assert.equal(formatChapterLabel("companion", "ja-JP"), "Chapter 3 — The Companion");
  assert.equal(formatChapterLabel("interests", "zh-Hans"), "Chapter 4 — The Curiosities");
  assert.equal(usesRomanChapterNumerals("fr-FR"), false);
});

test("chapterStepFromIndex maps 1–4 and rejects ceremony outside", () => {
  assert.equal(chapterStepFromIndex(1), "name");
  assert.equal(chapterStepFromIndex(4), "interests");
  assert.equal(chapterStepFromIndex(0), null);
  assert.equal(chapterStepFromIndex(5), null);
});

test("formatClaimMarginDate formats a real epoch ms", () => {
  const formatted = formatClaimMarginDate(Date.UTC(2026, 6, 20), "en-US");
  assert.ok(formatted.length > 0);
  assert.match(formatted, /2026/);
  assert.equal(formatClaimMarginDate(Number.NaN), "");
});

test("formatObservedMarginDate prefixes Observed", () => {
  const formatted = formatObservedMarginDate("2026-03-01T00:00:00.000Z", "en-US");
  assert.match(formatted, /^Observed /);
  assert.match(formatted, /2026/);
  assert.equal(formatObservedMarginDate(""), "");
  assert.equal(formatObservedMarginDate("not-a-date"), "");
});
