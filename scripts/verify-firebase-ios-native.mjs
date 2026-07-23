#!/usr/bin/env node
/**
 * Verifies iOS native Firebase wiring after `expo prebuild`.
 * Run from repo root: npm run verify:firebase-ios-native
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iosRoot = path.join(repoRoot, "ios");

function fail(message) {
  console.error(`verify:firebase-ios-native: ${message}`);
  process.exit(1);
}

function findAppDelegateSwift() {
  if (!fs.existsSync(iosRoot)) {
    fail("ios/ not found — run `npm run prebuild` from the repo root first.");
  }

  for (const ent of fs.readdirSync(iosRoot, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const candidate = path.join(iosRoot, ent.name, "AppDelegate.swift");
    if (fs.existsSync(candidate)) return candidate;
  }

  fail("AppDelegate.swift not found under ios/ — run `npm run prebuild` first.");
}

function findPbxproj() {
  for (const ent of fs.readdirSync(iosRoot, { withFileTypes: true })) {
    if (!ent.isDirectory() || !ent.name.endsWith(".xcodeproj")) continue;
    const candidate = path.join(iosRoot, ent.name, "project.pbxproj");
    if (fs.existsSync(candidate)) return candidate;
  }
  fail("project.pbxproj not found under ios/*.xcodeproj");
}

const appDelegatePath = findAppDelegateSwift();
const appDelegate = fs.readFileSync(appDelegatePath, "utf8");

if (!appDelegate.includes("import FirebaseCore")) {
  fail(`${appDelegatePath} is missing \`import FirebaseCore\`.`);
}

if (!appDelegate.includes("FirebaseApp.configure()")) {
  fail(`${appDelegatePath} is missing \`FirebaseApp.configure()\`.`);
}

const configureIndex = appDelegate.indexOf("FirebaseApp.configure()");
const rnDelegateIndex = appDelegate.indexOf("ReactNativeDelegate");
const startRnIndex = appDelegate.indexOf("startReactNative");

if (rnDelegateIndex >= 0 && configureIndex > rnDelegateIndex) {
  fail("`FirebaseApp.configure()` must run before `ReactNativeDelegate` in AppDelegate.");
}

if (startRnIndex >= 0 && configureIndex > startRnIndex) {
  fail("`FirebaseApp.configure()` must run before `startReactNative` in AppDelegate.");
}

const podfilePath = path.join(iosRoot, "Podfile");
if (!fs.existsSync(podfilePath)) {
  fail("ios/Podfile not found.");
}

const podfile = fs.readFileSync(podfilePath, "utf8");
if (/pod\s+['"]Firebase/i.test(podfile)) {
  fail("ios/Podfile must not declare Firebase CocoaPods (iOS Firebase uses SPM).");
}

const pbxprojPath = findPbxproj();
const pbxproj = fs.readFileSync(pbxprojPath, "utf8");
if (!pbxproj.includes("firebase-ios-sdk")) {
  fail("project.pbxproj is missing firebase-ios-sdk Swift Package reference.");
}

if (!pbxproj.includes("GoogleService-Info.plist in Resources")) {
  fail(
    "project.pbxproj is missing GoogleService-Info.plist in Copy Bundle Resources — run `npx expo prebuild --platform ios` from repo root.",
  );
}

const googleServicePlistPath = path.join(path.dirname(appDelegatePath), "GoogleService-Info.plist");
if (!fs.existsSync(googleServicePlistPath)) {
  fail(
    `${googleServicePlistPath} not found — ensure assets/GoogleService-Info.plist exists and run prebuild.`,
  );
}

const requiredSpmProducts = [
  "FirebaseAnalytics",
  "FirebaseAuth",
  "FirebaseFirestore",
  "FirebaseCore",
  "FirebaseDatabase",
];
for (const product of requiredSpmProducts) {
  if (!pbxproj.includes(product)) {
    fail(`project.pbxproj is missing SPM product link: ${product}.`);
  }
}

const androidRoot = path.join(repoRoot, "android");
const googleServicesJson = path.join(repoRoot, "assets", "google-services.json");
if (fs.existsSync(androidRoot) && fs.existsSync(googleServicesJson)) {
  const gradleCandidates = [
    path.join(androidRoot, "app", "build.gradle"),
    path.join(androidRoot, "app", "build.gradle.kts"),
  ].filter((p) => fs.existsSync(p));

  if (gradleCandidates.length === 0) {
    fail("android/app/build.gradle(.kts) not found — run `npm run prebuild` first.");
  }

  const gradle = gradleCandidates.map((p) => fs.readFileSync(p, "utf8")).join("\n");
  if (!gradle.includes("firebase-database")) {
    fail("android app build.gradle is missing firebase-database dependency.");
  }
}

console.log("verify:firebase-ios-native: OK");
console.log(`  AppDelegate: ${path.relative(repoRoot, appDelegatePath)}`);
console.log("  FirebaseApp.configure() runs before React Native startup");
console.log("  Podfile: no Firebase pods");
console.log("  SPM: firebase-ios-sdk linked");
console.log(`  SPM products: ${requiredSpmProducts.join(", ")}`);
if (fs.existsSync(androidRoot) && fs.existsSync(googleServicesJson)) {
  console.log("  Android: firebase-database in app build.gradle");
}
