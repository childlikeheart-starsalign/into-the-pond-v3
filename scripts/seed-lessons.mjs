#!/usr/bin/env node
/**
 * Seed / update Firestore `lessons/{lessonId}` from curriculum/lessons-manifest.json.
 *
 * Usage:
 *   node scripts/seed-lessons.mjs --dry-run
 *   node scripts/seed-lessons.mjs --lesson=1.1
 *   node scripts/seed-lessons.mjs --all
 *   node scripts/seed-lessons.mjs --lesson=1.1 --video-url="https://..."
 *   node scripts/seed-lessons.mjs --lesson=1.1 --upload   # upload encoded MP4 first
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_PATH in functions/.env.local for real writes.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { initFirebaseAdmin } from "./lib/firebaseAdmin.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "curriculum", "lessons-manifest.json");

function parseArgs(argv) {
  let lessonId = null;
  let all = false;
  let dryRun = false;
  let upload = false;
  let videoUrl = null;

  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    if (arg === "--all") all = true;
    if (arg === "--upload") upload = true;
    if (arg.startsWith("--lesson=")) lessonId = arg.slice("--lesson=".length).trim();
    if (arg.startsWith("--video-url=")) videoUrl = arg.slice("--video-url=".length).trim();
  }

  if (!all && !lessonId) {
    throw new Error("Pass --lesson=1.1 or --all");
  }
  if (all && lessonId) {
    throw new Error("Pass either --lesson=1.1 or --all, not both");
  }

  return { lessonId, all, dryRun, upload, videoUrl };
}

function loadManifest() {
  const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(raw.lessons)) {
    throw new Error("lessons-manifest.json must have a lessons array");
  }
  return raw.lessons;
}

function toFirestoreDoc(entry, videoUrlOverride) {
  const videoUrl = videoUrlOverride ?? entry.videoUrl ?? "";
  return {
    lessonId: entry.lessonId,
    order: entry.order,
    module: entry.module,
    title: entry.title,
    content: entry.content,
    videoUrl,
    commitmentMessage: entry.commitmentMessage,
    diaryPrompts: entry.diaryPrompts,
    isPlaceholder: entry.isPlaceholder ?? !videoUrl,
  };
}

function uploadLesson(entry) {
  const version = entry.storageVersion ?? "v1";
  const result = spawnSync(
    "node",
    [path.join(root, "scripts", "upload-lesson.mjs"), `--lesson=${entry.lessonId}`, `--version=${version}`],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `upload failed for ${entry.lessonId}`);
  }
  const lines = result.stdout.trim().split("\n");
  const jsonLine = lines[lines.length - 1];
  const payload = JSON.parse(jsonLine);
  return payload.downloadUrl;
}

async function main() {
  const { lessonId, all, dryRun, upload, videoUrl } = parseArgs(process.argv.slice(2));
  const manifest = loadManifest();
  const selected = all ? manifest : manifest.filter((row) => row.lessonId === lessonId);

  if (selected.length === 0) {
    throw new Error(`Lesson ${lessonId} not found in manifest`);
  }

  const writes = [];
  for (const entry of selected) {
    let resolvedUrl = videoUrl;
    if (!resolvedUrl && upload && !entry.isPlaceholder) {
      resolvedUrl = uploadLesson(entry);
    }
    const doc = toFirestoreDoc(entry, resolvedUrl);
    writes.push({ id: entry.lessonId, doc });
  }

  if (dryRun) {
    console.log("DRY RUN — no Firestore writes");
    for (const row of writes) {
      console.log(`Would write lessons/${row.id}`);
      console.log(JSON.stringify(row.doc, null, 2));
    }
    return;
  }

  const { db } = initFirebaseAdmin();
  for (const row of writes) {
    await db.collection("lessons").doc(row.id).set(row.doc, { merge: true });
    const snap = await db.collection("lessons").doc(row.id).get();
    console.log(`Wrote lessons/${row.id}`);
    console.log(JSON.stringify(snap.data(), null, 2));
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
