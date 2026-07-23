const { withDangerousMod } = require("@expo/config-plugins");
const { mergeContents } = require("@expo/config-plugins/build/utils/generateCode");
const fs = require("fs");
const path = require("path");

/**
 * Google Sign-In pulls AppCheckCore (Swift), which needs modular headers on
 * GoogleUtilities + RecaptchaInterop when Expo links pods as static libraries.
 * Without this, `pod install` fails on EAS with:
 *   "The following Swift pods cannot yet be integrated as static libraries"
 */
function withGoogleSignInModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      let contents = fs.readFileSync(podfilePath, "utf8");

      if (contents.includes("google-signin-modular-headers")) {
        return cfg;
      }

      const snippet = [
        "  pod 'GoogleUtilities', :modular_headers => true",
        "  pod 'RecaptchaInterop', :modular_headers => true",
      ].join("\n");

      const merged = mergeContents({
        tag: "google-signin-modular-headers",
        src: contents,
        newSrc: snippet,
        anchor: /use_expo_modules!/,
        offset: 1,
        comment: "#",
      });

      if (!merged.didMerge) {
        throw new Error(
          "[withGoogleSignInModularHeaders] Could not find use_expo_modules! in Podfile to insert modular headers",
        );
      }

      fs.writeFileSync(podfilePath, merged.contents);
      return cfg;
    },
  ]);
}

module.exports = withGoogleSignInModularHeaders;
