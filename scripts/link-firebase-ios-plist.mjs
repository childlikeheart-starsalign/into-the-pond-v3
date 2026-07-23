#!/usr/bin/env node
/**
 * Ensures GoogleService-Info.plist is in the iOS app bundle (Copy Bundle Resources).
 * The Firebase config plugin copies the file to disk but historically did not link it in pbxproj.
 * Run from repo root: node scripts/link-firebase-ios-plist.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  addResourceFileToGroup,
  getPbxproj,
  getProjectName,
} from "@expo/config-plugins/build/ios/utils/Xcodeproj.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsPlist = path.join(repoRoot, "assets", "GoogleService-Info.plist");
const iosRoot = path.join(repoRoot, "ios");

function findIosAppDirectory() {
  for (const ent of fs.readdirSync(iosRoot, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const name = ent.name;
    if (name === "Pods" || name === "build" || name.endsWith(".xcworkspace") || name.endsWith(".xcodeproj")) {
      continue;
    }
    const dir = path.join(iosRoot, name);
    if (fs.existsSync(path.join(dir, "Info.plist"))) return dir;
  }
  return null;
}

if (!fs.existsSync(assetsPlist)) {
  console.log("link-firebase-ios-plist: skip (no assets/GoogleService-Info.plist)");
  process.exit(0);
}

if (!fs.existsSync(iosRoot)) {
  console.log("link-firebase-ios-plist: skip (no ios/ — run prebuild first)");
  process.exit(0);
}

const appDir = findIosAppDirectory();
if (!appDir) {
  console.warn("link-firebase-ios-plist: could not find iOS app directory");
  process.exit(0);
}

fs.copyFileSync(assetsPlist, path.join(appDir, "GoogleService-Info.plist"));

const projectName = getProjectName(repoRoot);
const plistFilePath = `${projectName}/GoogleService-Info.plist`;
const project = getPbxproj(repoRoot);
const alreadyLinked = project.hasFile(plistFilePath);

if (alreadyLinked) {
  console.log("link-firebase-ios-plist: OK (already in Copy Bundle Resources)");
  process.exit(0);
}

addResourceFileToGroup({
  filepath: plistFilePath,
  groupName: projectName,
  project,
  isBuildFile: true,
  verbose: true,
});

fs.writeFileSync(project.filepath, project.writeSync());
console.log("link-firebase-ios-plist: linked GoogleService-Info.plist to Copy Bundle Resources");
