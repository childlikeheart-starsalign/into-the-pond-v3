/**
 * Removes empty simulator scheme-approval plists that crash Expo CLI on `expo start` → i.
 * Expo reads this file in updateSimulatorLinkingPermissionsAsync; a 0-byte file makes
 * parsePlistBuffer call contents[0].toString(16) on undefined.
 */
import fs from "fs";
import os from "os";
import path from "path";

const devicesRoot = path.join(
  os.homedir(),
  "Library/Developer/CoreSimulator/Devices"
);

if (!fs.existsSync(devicesRoot)) {
  process.exit(0);
}

const removed = [];

for (const deviceId of fs.readdirSync(devicesRoot)) {
  const plistPath = path.join(
    devicesRoot,
    deviceId,
    "data/Library/Preferences/com.apple.launchservices.schemeapproval.plist"
  );
  if (!fs.existsSync(plistPath)) continue;

  const { size } = fs.statSync(plistPath);
  if (size === 0) {
    fs.unlinkSync(plistPath);
    removed.push({ deviceId, plistPath });
  }
}

if (removed.length > 0) {
  console.log(
    `Removed ${removed.length} empty simulator scheme plist(s) that block Expo iOS launch.`
  );
}
