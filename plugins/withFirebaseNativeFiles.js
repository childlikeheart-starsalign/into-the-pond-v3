const { withDangerousMod, withXcodeProject, withAppDelegate } = require("@expo/config-plugins");
const {
  addResourceFileToGroup,
  getProjectName,
} = require("@expo/config-plugins/build/ios/utils/Xcodeproj");
const { mergeContents, removeContents } = require("@expo/config-plugins/build/utils/generateCode");
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

function hasGoogleServiceInfoPlist(projectRoot) {
  return fs.existsSync(path.join(projectRoot, "assets", "GoogleService-Info.plist"));
}

/** Matches Firebase Android docs; Groovy classpath ↔ Kotlin `plugins { id(...) version ... apply false }`. */
const GOOGLE_SERVICES_GRADLE_PLUGIN_VERSION = "4.4.4";

/** Firebase Android BoM — library versions come from the BoM, not per-artifact. */
const FIREBASE_ANDROID_BOM_VERSION = "34.12.0";

const FIREBASE_IOS_SPM_REPO_URL = "https://github.com/firebase/firebase-ios-sdk";
const FIREBASE_IOS_SPM_REPO_NAME = "firebase-ios-sdk";
const FIREBASE_IOS_SPM_MIN_VERSION = "11.0.0";
const FIREBASE_IOS_SPM_PRODUCTS = [
  "FirebaseAnalytics",
  "FirebaseAuth",
  "FirebaseFirestore",
  "FirebaseCore",
  "FirebaseDatabase",
];

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
    implementation "com.google.firebase:firebase-database"
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
    implementation("com.google.firebase:firebase-analytics")
    implementation("com.google.firebase:firebase-database")`,
    );
  }
  return `${contents.trimEnd()}

dependencies {
    implementation(platform("com.google.firebase:firebase-bom:${FIREBASE_ANDROID_BOM_VERSION}"))
    implementation("com.google.firebase:firebase-analytics")
    implementation("com.google.firebase:firebase-database")
}
`;
}

/** Idempotent: add firebase-database when BoM already present from a prior prebuild. */
function ensureFirebaseDatabaseAndroidDepGroovy(contents) {
  if (contents.includes("firebase-database")) {
    return contents;
  }
  if (/implementation "com\.google\.firebase:firebase-analytics"/.test(contents)) {
    return contents.replace(
      /implementation "com\.google\.firebase:firebase-analytics"\n/,
      `implementation "com.google.firebase:firebase-analytics"\n    implementation "com.google.firebase:firebase-database"\n`,
    );
  }
  return contents;
}

function ensureFirebaseDatabaseAndroidDepKts(contents) {
  if (contents.includes("firebase-database")) {
    return contents;
  }
  if (/implementation\("com\.google\.firebase:firebase-analytics"\)/.test(contents)) {
    return contents.replace(
      /implementation\("com\.google\.firebase:firebase-analytics"\)\n/,
      `implementation("com.google.firebase:firebase-analytics")\n    implementation("com.google.firebase:firebase-database")\n`,
    );
  }
  return contents;
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
  c = ensureFirebaseDatabaseAndroidDepKts(c);
  return c;
}

function ensureGoogleServicesAppBuildGradle(contents) {
  let c = ensureFirebaseAndroidSdkAppBuildGradle(contents);
  c = ensureFirebaseDatabaseAndroidDepGroovy(c);
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

function findFirebaseSpmPackageRefKey(objects) {
  const refs = objects.XCRemoteSwiftPackageReference || {};
  for (const [key, value] of Object.entries(refs)) {
    if (typeof value !== "object" || !value) continue;
    if (value.repositoryURL?.includes("firebase-ios-sdk")) {
      return key;
    }
  }
  return null;
}

function isFirebaseSpmProductLinked(objects, productName) {
  const deps = objects.XCSwiftPackageProductDependency || {};
  return Object.values(deps).some(
    (value) => typeof value === "object" && value?.productName === productName,
  );
}

function findMainApplicationTarget(objects) {
  return Object.entries(objects.PBXNativeTarget || {}).find(
    ([, value]) =>
      typeof value === "object" && value?.productType === '"com.apple.product-type.application"',
  );
}

function findMainFrameworksBuildPhase(objects, appTarget) {
  const phaseIds = appTarget?.buildPhases || [];
  for (const phaseRef of phaseIds) {
    const phaseId = typeof phaseRef === "object" ? phaseRef.value : phaseRef.split(" ")[0];
    const phase = objects.PBXFrameworksBuildPhase?.[phaseId];
    if (phase?.isa === "PBXFrameworksBuildPhase") {
      return phaseId;
    }
  }

  return Object.entries(objects.PBXFrameworksBuildPhase || {}).find(
    ([key, value]) =>
      key !== "isa" && typeof value === "object" && value?.isa === "PBXFrameworksBuildPhase",
  )?.[0];
}

/** Add firebase-ios-sdk package reference to PBXProject (idempotent). */
function ensureFirebaseSpmPackageReference(xcodeProject) {
  const objects = xcodeProject.hash.project.objects;
  objects.XCRemoteSwiftPackageReference ??= {};

  const existingKey = findFirebaseSpmPackageRefKey(objects);
  if (existingKey) {
    return existingKey;
  }

  const packageReferenceUUID = xcodeProject.generateUuid();
  const packageRefKey = `${packageReferenceUUID} /* XCRemoteSwiftPackageReference "${FIREBASE_IOS_SPM_REPO_NAME}" */`;

  objects.XCRemoteSwiftPackageReference[packageRefKey] = {
    isa: "XCRemoteSwiftPackageReference",
    repositoryURL: FIREBASE_IOS_SPM_REPO_URL,
    requirement: {
      kind: "upToNextMajorVersion",
      minimumVersion: FIREBASE_IOS_SPM_MIN_VERSION,
    },
  };

  const rootProject = objects.PBXProject[xcodeProject.hash.project.rootObject];
  rootProject.packageReferences ??= [];
  const hasPackageRef = rootProject.packageReferences.some((ref) => {
    const id = typeof ref === "object" ? ref.value : String(ref).split(" ")[0];
    return id === packageReferenceUUID;
  });
  if (!hasPackageRef) {
    rootProject.packageReferences.push({
      value: packageReferenceUUID,
      comment: `XCRemoteSwiftPackageReference "${FIREBASE_IOS_SPM_REPO_NAME}"`,
    });
  }

  return packageRefKey;
}

/** Link Firebase SPM products to the main app target and Frameworks build phase. */
function linkFirebaseSpmProductsToAppTarget(xcodeProject, packageRefKey, productNames) {
  const objects = xcodeProject.hash.project.objects;
  const appTargetEntry = findMainApplicationTarget(objects);
  if (!appTargetEntry) {
    console.warn(
      "[withFirebaseNativeFiles] Could not find main iOS application target — skipping Firebase SPM products.",
    );
    return;
  }

  const [, appTarget] = appTargetEntry;
  objects.XCSwiftPackageProductDependency ??= {};
  objects.PBXBuildFile ??= {};
  appTarget.packageProductDependencies ??= [];

  const frameworksPhaseId = findMainFrameworksBuildPhase(objects, appTarget);
  const frameworksPhase = frameworksPhaseId
    ? objects.PBXFrameworksBuildPhase[frameworksPhaseId]
    : null;
  if (frameworksPhase) {
    frameworksPhase.files ??= [];
  }

  for (const productName of productNames) {
    if (isFirebaseSpmProductLinked(objects, productName)) {
      continue;
    }

    const packageUUID = xcodeProject.generateUuid();
    const productDepKey = `${packageUUID} /* ${productName} */`;

    objects.XCSwiftPackageProductDependency[productDepKey] = {
      isa: "XCSwiftPackageProductDependency",
      package: packageRefKey,
      productName,
    };

    appTarget.packageProductDependencies.push({ value: packageUUID, comment: productName });

    if (!frameworksPhase) {
      continue;
    }

    const frameworkUUID = xcodeProject.generateUuid();
    const buildFileKey = `${frameworkUUID} /* ${productName} in Frameworks */`;

    objects.PBXBuildFile[buildFileKey] = {
      isa: "PBXBuildFile",
      productRef: packageUUID,
      productRef_comment: productName,
    };

    if (!frameworksPhase.files.includes(buildFileKey)) {
      frameworksPhase.files.push(buildFileKey);
    }
  }
}

function applyFirebaseIosSpm(xcodeProject) {
  const packageRefKey = ensureFirebaseSpmPackageReference(xcodeProject);
  linkFirebaseSpmProductsToAppTarget(xcodeProject, packageRefKey, FIREBASE_IOS_SPM_PRODUCTS);
  return xcodeProject;
}

/** Link GoogleService-Info.plist into Copy Bundle Resources (required for FirebaseApp.configure()). */
function ensureGoogleServicePlistInXcodeProject(xcodeProject, projectRoot) {
  const projectName = getProjectName(projectRoot);
  const plistFilePath = `${projectName}/GoogleService-Info.plist`;
  if (xcodeProject.hasFile(plistFilePath)) {
    return xcodeProject;
  }
  return addResourceFileToGroup({
    filepath: plistFilePath,
    groupName: projectName,
    project: xcodeProject,
    isBuildFile: true,
    verbose: true,
  });
}

function addFirebaseAppDelegateImport(src) {
  if (
    src.includes("import FirebaseCore") ||
    src.includes("@generated begin firebase-native-import")
  ) {
    return { contents: src, didMerge: false, didClear: false };
  }
  return mergeContents({
    tag: "firebase-native-import",
    src,
    newSrc: "import FirebaseCore",
    anchor: /@UIApplicationMain/,
    offset: 0,
    comment: "//",
  });
}

function removeFirebaseAppDelegateImport(src) {
  return removeContents({ src, tag: "firebase-native-import" });
}

function addFirebaseAppDelegateInit(src) {
  if (
    src.includes("@generated begin firebase-native-init") ||
    src.includes("FirebaseApp.configure()")
  ) {
    return { contents: src, didMerge: false, didClear: false };
  }
  return mergeContents({
    tag: "firebase-native-init",
    src,
    newSrc: "    FirebaseApp.configure()",
    anchor: /let delegate = ReactNativeDelegate\(\)/,
    offset: 0,
    comment: "//",
  });
}

function removeFirebaseAppDelegateInit(src) {
  return removeContents({ src, tag: "firebase-native-init" });
}

function withFirebaseAppDelegateMod(config) {
  return withAppDelegate(config, (cfg) => {
    const projectRoot = cfg.modRequest.projectRoot;

    if (!hasGoogleServiceInfoPlist(projectRoot)) {
      let contents = cfg.modResults.contents;
      contents = removeFirebaseAppDelegateInit(contents).contents;
      contents = removeFirebaseAppDelegateImport(contents).contents;
      cfg.modResults.contents = contents;
      return cfg;
    }

    if (cfg.modResults.language !== "swift") {
      throw new Error(
        `[withFirebaseNativeFiles] Firebase native iOS requires Swift AppDelegate; got: ${cfg.modResults.language}`,
      );
    }

    try {
      let contents = cfg.modResults.contents;
      contents = addFirebaseAppDelegateImport(contents).contents;
      contents = addFirebaseAppDelegateInit(contents).contents;
      cfg.modResults.contents = contents;
    } catch (error) {
      if (error.code === "ERR_NO_MATCH") {
        throw new Error(
          `[withFirebaseNativeFiles] Could not patch AppDelegate for Firebase — Expo template may have changed: ${error.message}`,
        );
      }
      throw error;
    }

    return cfg;
  });
}

function applyIosFirebasePlistCopy(projectRoot, iosRoot) {
  if (!hasGoogleServiceInfoPlist(projectRoot)) {
    return;
  }

  const appDir = findIosAppDirectory(iosRoot);
  if (!appDir) {
    console.warn(
      "[withFirebaseNativeFiles] Could not locate iOS app directory — skipping plist copy.",
    );
    return;
  }

  const dest = path.join(appDir, "GoogleService-Info.plist");
  fs.copyFileSync(path.join(projectRoot, "assets", "GoogleService-Info.plist"), dest);
}

/** @type {import('@expo/config-plugins').ConfigPlugin} */
module.exports = function withFirebaseNativeFiles(config) {
  config = withFirebaseAppDelegateMod(config);

  config = withXcodeProject(config, (cfg) => {
    if (!hasGoogleServiceInfoPlist(cfg.modRequest.projectRoot)) {
      return cfg;
    }
    cfg.modResults = applyFirebaseIosSpm(cfg.modResults);
    cfg.modResults = ensureGoogleServicePlistInXcodeProject(
      cfg.modResults,
      cfg.modRequest.projectRoot,
    );
    return cfg;
  });

  config = withDangerousMod(config, [
    "ios",
    async (cfg) => {
      applyIosFirebasePlistCopy(cfg.modRequest.projectRoot, cfg.modRequest.platformProjectRoot);
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
