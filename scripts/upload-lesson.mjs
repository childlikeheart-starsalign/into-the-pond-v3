#!/usr/bin/env node
/**
 * Upload encoded lesson MP4 to Firebase Storage.
 *
 * Usage:
 *   node scripts/upload-lesson.mjs --lesson=1.1 --version=v2
 *   node scripts/upload-lesson.mjs --lesson=1.1 --version=v2 --file=curriculum/encoded/1.1/v2/lesson.mp4
 *   node scripts/upload-lesson.mjs --lesson=1.1 --version=v2 --file="/path/to/lesson 1.1_v2.mp4"
 *   node scripts/upload-lesson.mjs --lesson=1.1 --version=v2 --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { buildDownloadUrl, initFirebaseAdmin } from "./lib/firebaseAdmin.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  let lessonId = null;
  let version = "v1";
  let file = null;
  let dryRun = false;

  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    if (arg.startsWith("--lesson=")) lessonId = arg.slice("--lesson=".length).trim();
    if (arg.startsWith("--version=")) version = arg.slice("--version=".length).trim();
    if (arg.startsWith("--file=")) file = arg.slice("--file=".length).trim();
  }

  if (!lessonId) throw new Error("Missing --lesson=1.1");
  const localPath =
    file != null
      ? path.isAbsolute(file)
        ? file
        : path.resolve(root, file)
      : path.join(root, "curriculum", "encoded", lessonId, version, "lesson.mp4");

  if (!fs.existsSync(localPath)) {
    throw new Error(`Encoded file not found: ${localPath}\nRun: node scripts/encode-lesson.mjs --lesson=${lessonId} --version=${version} --source=...`);
  }

  return { lessonId, version, localPath, dryRun };
}

async function main() {
  const { lessonId, version, localPath, dryRun } = parseArgs(process.argv.slice(2));
  const objectPath = `curriculum/lessons/${lessonId}/${version}/lesson.mp4`;
  const stat = fs.statSync(localPath);

  if (dryRun) {
    console.log("DRY RUN — no Storage upload");
    console.log({ lessonId, version, localPath, objectPath, bytes: stat.size });
    return;
  }

  const { bucket } = initFirebaseAdmin();
  const token = randomUUID();
  const file = bucket.file(objectPath);

  const [exists] = await bucket.exists();
  if (!exists) {
    throw new Error(
      `Firebase Storage bucket "${bucket.name}" is not provisioned yet. Open Firebase Console → Storage → Get started, then re-run this command.`,
    );
  }

  await file.save(fs.readFileSync(localPath), {
    resumable: true,
    metadata: {
      contentType: "video/mp4",
      cacheControl: "public, max-age=31536000, immutable",
      metadata: {
        firebaseStorageDownloadTokens: token,
        lessonId,
        version,
      },
    },
  });

  const downloadUrl = buildDownloadUrl(bucket.name, objectPath, token);
  console.log(JSON.stringify({ lessonId, version, objectPath, downloadUrl, bytes: stat.size }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
