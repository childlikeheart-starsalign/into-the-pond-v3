const { IOSConfig, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const FRAMES_DIR = path.join("assets", "images", "splash-frames");
const FRAME_1X = "splash-frame.png";
const FRAME_2X = "splash-frame@2x.png";
const FRAME_3X = "splash-frame@3x.png";

const IOS_IMAGESET_NAMES = ["SplashScreenLegacy.imageset", "SplashScreenLogo.imageset"];
const IOS_IMAGE_BASENAME = "image";

const ANDROID_DENSITY_MAP = {
  "drawable-mdpi": FRAME_1X,
  "drawable-hdpi": FRAME_1X,
  "drawable-xhdpi": FRAME_2X,
  "drawable-xxhdpi": FRAME_3X,
  "drawable-xxxhdpi": FRAME_3X,
};

const ANDROID_SPLASH_FILENAME = "splashscreen_logo.png";

async function copyIfExists(src, dest) {
  try {
    await fs.promises.access(src);
  } catch {
    return false;
  }
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.copyFile(src, dest);
  return true;
}

function findIosSplashImageset(iosNamedProjectRoot) {
  const assetsRoot = path.join(iosNamedProjectRoot, "Images.xcassets");
  for (const imagesetName of IOS_IMAGESET_NAMES) {
    const imagesetPath = path.join(assetsRoot, imagesetName);
    if (fs.existsSync(imagesetPath)) {
      return imagesetPath;
    }
  }
  return null;
}

/**
 * After expo-splash-screen prebuild, overwrite generated splash bitmaps with designer frames.
 */
function withSplashFrameDensities(config) {
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const framesRoot = path.join(projectRoot, FRAMES_DIR);
      const iosNamedProjectRoot = IOSConfig.Paths.getSourceRoot(projectRoot);
      const imagesetPath = findIosSplashImageset(iosNamedProjectRoot);
      if (!imagesetPath) {
        return config;
      }

      await Promise.all([
        copyIfExists(
          path.join(framesRoot, FRAME_1X),
          path.join(imagesetPath, `${IOS_IMAGE_BASENAME}.png`),
        ),
        copyIfExists(
          path.join(framesRoot, FRAME_2X),
          path.join(imagesetPath, `${IOS_IMAGE_BASENAME}@2x.png`),
        ),
        copyIfExists(
          path.join(framesRoot, FRAME_3X),
          path.join(imagesetPath, `${IOS_IMAGE_BASENAME}@3x.png`),
        ),
      ]);

      return config;
    },
  ]);

  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const framesRoot = path.join(projectRoot, FRAMES_DIR);
      const androidResRoot = path.join(projectRoot, "android", "app", "src", "main", "res");

      await Promise.all(
        Object.entries(ANDROID_DENSITY_MAP).map(async ([folder, frameFile]) => {
          const dest = path.join(androidResRoot, folder, ANDROID_SPLASH_FILENAME);
          await copyIfExists(path.join(framesRoot, frameFile), dest);
        }),
      );

      return config;
    },
  ]);

  return config;
}

module.exports = withSplashFrameDensities;
