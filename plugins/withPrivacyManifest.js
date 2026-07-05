const { withDangerousMod, withXcodeProject } = require("@expo/config-plugins");
const {
  addResourceFileToGroup,
  getProjectName,
} = require("@expo/config-plugins/build/ios/utils/Xcodeproj");
const fs = require("fs");
const path = require("path");

const MANIFEST_SOURCE = path.join("assets", "ios", "PrivacyInfo.xcprivacy");
const MANIFEST_FILENAME = "PrivacyInfo.xcprivacy";

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

function copyPrivacyManifest(projectRoot, iosRoot) {
  const src = path.join(projectRoot, MANIFEST_SOURCE);
  if (!fs.existsSync(src)) {
    console.warn(
      `[withPrivacyManifest] Missing ${MANIFEST_SOURCE} — skipping PrivacyInfo.xcprivacy copy.`,
    );
    return;
  }

  const appDir = findIosAppDirectory(iosRoot);
  if (!appDir) {
    console.warn(
      "[withPrivacyManifest] Could not locate iOS app directory — skipping PrivacyInfo.xcprivacy copy.",
    );
    return;
  }

  fs.copyFileSync(src, path.join(appDir, MANIFEST_FILENAME));
}

function ensurePrivacyManifestInXcodeProject(xcodeProject, projectRoot) {
  const projectName = getProjectName(projectRoot);
  const manifestFilePath = `${projectName}/${MANIFEST_FILENAME}`;
  if (xcodeProject.hasFile(manifestFilePath)) {
    return xcodeProject;
  }
  return addResourceFileToGroup({
    filepath: manifestFilePath,
    groupName: projectName,
    project: xcodeProject,
    isBuildFile: true,
    verbose: true,
  });
}

/** Writes PrivacyInfo.xcprivacy at prebuild and links it into the iOS app target. */
function withPrivacyManifest(config) {
  config = withXcodeProject(config, (cfg) => {
    cfg.modResults = ensurePrivacyManifestInXcodeProject(
      cfg.modResults,
      cfg.modRequest.projectRoot,
    );
    return cfg;
  });

  config = withDangerousMod(config, [
    "ios",
    async (cfg) => {
      copyPrivacyManifest(cfg.modRequest.projectRoot, cfg.modRequest.platformProjectRoot);
      return cfg;
    },
  ]);

  return config;
}

module.exports = withPrivacyManifest;
