#!/usr/bin/env node
/**
 * Encode a lesson source file to mobile-ready MP4 (720p H.264 + AAC, faststart).
 *
 * Accepts MP4 (re-encode) or MP3/audio-only (wraps with warm brand background for expo-av).
 *
 * Usage:
 *   node scripts/encode-lesson.mjs --lesson=1.1 --version=v2 --source="/path/to/source.mp4"
 *   node scripts/encode-lesson.mjs --lesson=1.1 --version=v2 --source="/path/to/source.MP3"
 *
 * Output: curriculum/encoded/{lessonId}/{version}/lesson.mp4
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BRAND_BG = "0xFAF7F2";

function parseArgs(argv) {
  let lessonId = null;
  let version = "v1";
  let source = null;

  for (const arg of argv) {
    if (arg.startsWith("--lesson=")) lessonId = arg.slice("--lesson=".length).trim();
    if (arg.startsWith("--version=")) version = arg.slice("--version=".length).trim();
    if (arg.startsWith("--source=")) source = arg.slice("--source=".length).trim();
  }

  if (!lessonId) throw new Error("Missing --lesson=1.1");
  if (!source) throw new Error("Missing --source=/path/to/file");
  if (!fs.existsSync(source)) throw new Error(`Source not found: ${source}`);

  return { lessonId, version, source: path.resolve(source) };
}

function probeHasVideo(source) {
  const result = spawnSync(
    "ffprobe",
    ["-v", "quiet", "-select_streams", "v:0", "-show_entries", "stream=codec_type", "-of", "csv=p=0", source],
    { encoding: "utf8" },
  );
  if (result.status !== 0) return false;
  return result.stdout.trim() === "video";
}

function encodeVideoSource({ source, outPath }) {
  const args = [
    "-y",
    "-i",
    source,
    "-vf",
    "scale='min(1280,iw)':-2:flags=lanczos",
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-level",
    "4.1",
    "-preset",
    "slow",
    "-crf",
    "23",
    "-maxrate",
    "1800k",
    "-bufsize",
    "3600k",
    "-g",
    "60",
    "-keyint_min",
    "60",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ac",
    "2",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    outPath,
  ];
  return spawnSync("ffmpeg", args, { stdio: "inherit" });
}

function encodeAudioSource({ source, outPath }) {
  const args = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=${BRAND_BG}:s=1280x720:r=30`,
    "-i",
    source,
    "-shortest",
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-level",
    "4.1",
    "-preset",
    "slow",
    "-crf",
    "28",
    "-maxrate",
    "500k",
    "-bufsize",
    "1000k",
    "-g",
    "60",
    "-keyint_min",
    "60",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ac",
    "2",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    outPath,
  ];
  return spawnSync("ffmpeg", args, { stdio: "inherit" });
}

function main() {
  const { lessonId, version, source } = parseArgs(process.argv.slice(2));
  const outDir = path.join(root, "curriculum", "encoded", lessonId, version);
  const outPath = path.join(outDir, "lesson.mp4");
  fs.mkdirSync(outDir, { recursive: true });

  const hasVideo = probeHasVideo(source);
  console.log(`Encoding ${lessonId} (${version}) from ${hasVideo ? "video" : "audio"} source…`);
  if (!hasVideo) {
    console.warn(
      "WARNING: Source has no video track — output will be a solid background with audio only.",
    );
    console.warn("If you have an MP4 with video (e.g. lesson 1.1_v2.mp4), use that instead of MP3.");
  }
  const result = hasVideo ? encodeVideoSource({ source, outPath }) : encodeAudioSource({ source, outPath });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  const stat = fs.statSync(outPath);
  console.log(`Wrote ${outPath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
}

main();
