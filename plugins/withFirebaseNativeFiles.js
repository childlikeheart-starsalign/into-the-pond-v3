const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Finds the main application folder under ios/ (contains AppDelegate.* or Info.plist).
 */
function findIosAppDirectory(iosRoot) {
  let entries;
  try {
    entries = fs.readdirSync(iosRoot, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const name = ent.name;
    if (
      name === "Pods" ||
      name === "build" ||
      name.endsWith(".xcworkspace") ||
      name.endsWith(".xcodeproj")
    ) {
      continue;
    }
    const dir = path.join(iosRoot, name);
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch {
      continue;
    }
    const looksLikeApp =
      files.some((f) => f.startsWith("AppDelegate.")) || files.includes("Info.plist");
    if (looksLikeApp) return dir;
  }
  return null;
}

/** Matches Firebase Android docs; Groovy classpath ↔ Kotlin `plugins { id(...) version ... apply false }`. */
const GOOGLE_SERVICES_GRADLE_PLUGIN_VERSION = "4.4.4";

/** Firebase Android BoM — library versions come from the BoM, not per-artifact. */
const FIREBASE_ANDROID_BOM_VERSION = "34.12.0";

/**
 * Project-level: register Google Services Gradle plugin (Kotlin DSL).
 * Equivalent Groovy: classpath('com.google.gms:google-services:…') in buildscript.dependencies.
 */
function ensureGoogleServicesProjectBuildGradleKts(contents) {
  if (contents.includes("com.google.gms.google-services")) {
    return contents;
  }
  if (/plugins\s*\{/.test(contents)) {
    return contents.replace(
      /plugins\s*\{/,
      `plugins {\n    id("com.google.gms.google-services") version "${GOOGLE_SERVICES_GRADLE_PLUGIN_VERSION}" apply false`,
    );
  }
  return `plugins {\n    id("com.google.gms.google-services") version "${GOOGLE_SERVICES_GRADLE_PLUGIN_VERSION}" apply false\n}\n\n${contents}`;
}

/**
 * Project-level Groovy template from Expo / RN prebuild.
 */
function ensureGoogleServicesProjectBuildGradle(contents) {
  if (contents.includes("com.google.gms:google-services")) {
    return contents;
  }
  return contents.replace(
    /classpath\('com.facebook.react:react-native-gradle-plugin'\)/,
    `classpath('com.facebook.react:react-native-gradle-plugin')\n    classpath('com.google.gms:google-services:${GOOGLE_SERVICES_GRADLE_PLUGIN_VERSION}')`,
  );
}

function patchProjectLevelGoogleServices(androidRoot) {
  const ktsPath = path.join(androidRoot, "build.gradle.kts");
  const groovyPath = path.join(androidRoot, "build.gradle");
  if (fs.existsSync(ktsPath)) {
    const next = ensureGoogleServicesProjectBuildGradleKts(fs.readFileSync(ktsPath, "utf8"));
    fs.writeFileSync(ktsPath, next);
    return;
  }
  if (fs.existsSync(groovyPath)) {
    const next = ensureGoogleServicesProjectBuildGradle(fs.readFileSync(groovyPath, "utf8"));
    fs.writeFileSync(groovyPath, next);
  }
}

/** App module: Firebase BoM + Analytics (Groovy `app/build.gradle`). */
function ensureFirebaseAndroidSdkAppBuildGradle(contents) {
  if (contents.includes("com.google.firebase:firebase-bom")) {
    return contents;
  }
  return contents.replace(
    /^dependencies\s*\{/m,
    `dependencies {
    // Firebase Android SDKs (BoM pins versions; see https://firebase.google.com/docs/android/setup#available-libraries)
    implementation platform("com.google.firebase:firebase-bom:${FIREBASE_ANDROID_BOM_VERSION}")
    implementation "com.google.firebase:firebase-analytics"
`,
  );
}

/** App module: Firebase BoM + Analytics (Kotlin DSL `app/build.gradle.kts`). */
function ensureFirebaseAndroidSdkAppBuildGradleKts(contents) {
  if (contents.includes("firebase-bom")) {
    return contents;
  }
  if (/dependencies\s*\{/.test(contents)) {
    return contents.replace(
      /dependencies\s*\{/,
      `dependencies {
    implementation(platform("com.google.firebase:firebase-bom:${FIREBASE_ANDROID_BOM_VERSION}"))
    implementation("com.google.firebase:firebase-analytics")`,
    );
  }
  return `${contents.trimEnd()}

dependencies {
    implementation(platform("com.google.firebase:firebase-bom:${FIREBASE_ANDROID_BOM_VERSION}"))
    implementation("com.google.firebase:firebase-analytics")
}
`;
}

/** App module: Google Services plugin + Firebase SDKs (Kotlin DSL). */
function ensureGoogleServicesAppBuildGradleKts(contents) {
  let c = contents;
  if (!c.includes("com.google.gms.google-services")) {
    if (/plugins\s*\{/.test(c)) {
      c = c.replace(/plugins\s*\{/, `plugins {\n    id("com.google.gms.google-services")`);
    }
  }
  c = ensureFirebaseAndroidSdkAppBuildGradleKts(c);
  return c;
}

function ensureGoogleServicesAppBuildGradle(contents) {
  let c = ensureFirebaseAndroidSdkAppBuildGradle(contents);
  if (/apply\s+plugin:\s*["']com\.google\.gms\.google-services["']/.test(c)) {
    return c;
  }
  return `${c.trimEnd()}\n\napply plugin: "com.google.gms.google-services"\n`;
}

function patchAppLevelGoogleServices(androidRoot) {
  const ktsPath = path.join(androidRoot, "app", "build.gradle.kts");
  const groovyPath = path.join(androidRoot, "app", "build.gradle");
  if (fs.existsSync(ktsPath)) {
    const next = ensureGoogleServicesAppBuildGradleKts(fs.readFileSync(ktsPath, "utf8"));
    fs.writeFileSync(ktsPath, next);
    return;
  }
  if (fs.existsSync(groovyPath)) {
    const next = ensureGoogleServicesAppBuildGradle(fs.readFileSync(groovyPath, "utf8"));
    fs.writeFileSync(groovyPath, next);
  }
}

/** @type {import('@expo/config-plugins').ConfigPlugin} */
module.exports = function withFirebaseNativeFiles(config) {
  config = withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const iosRoot = cfg.modRequest.platformProjectRoot;
      const src = path.join(projectRoot, "assets", "GoogleService-Info.plist");

      if (!fs.existsSync(src)) {
        console.warn(
          "[withFirebaseNativeFiles] assets/GoogleService-Info.plist not found — skipping iOS copy.",
        );
        return cfg;
      }

      const appDir = findIosAppDirectory(iosRoot);
      if (!appDir) {
        console.warn(
          "[withFirebaseNativeFiles] Could not locate iOS app directory — skipping plist copy.",
        );
        return cfg;
      }

      const dest = path.join(appDir, "GoogleService-Info.plist");
      fs.copyFileSync(src, dest);
      return cfg;
    },
  ]);

  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const androidRoot = cfg.modRequest.platformProjectRoot;
      const src = path.join(projectRoot, "assets", "google-services.json");

      if (!fs.existsSync(src)) {
        return cfg;
      }

      const dest = path.join(androidRoot, "app", "google-services.json");
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      patchProjectLevelGoogleServices(androidRoot);
      patchAppLevelGoogleServices(androidRoot);
      return cfg;
    },
  ]);

  return config;
};
