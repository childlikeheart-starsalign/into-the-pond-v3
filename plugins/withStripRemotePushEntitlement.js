const { withEntitlementsPlist, withInfoPlist } = require("@expo/config-plugins");

/**
 * `expo-notifications` adds `aps-environment` even for local-only alerts.
 * Ad Hoc preview profiles often lack the Push Notifications capability, which
 * then fails Xcode signing. Cast-ready alerts use local scheduling only — remote
 * push is not required for preview. Strip the entitlement (and any remote
 * background mode) so Ad Hoc builds can sign.
 *
 * Before shipping remote push / production Push, enable Push Notifications on
 * the App ID, regenerate the provisioning profile, and remove this plugin.
 */
function withStripRemotePushEntitlement(config) {
  config = withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults["aps-environment"];
    return cfg;
  });

  config = withInfoPlist(config, (cfg) => {
    const modes = cfg.modResults.UIBackgroundModes;
    if (Array.isArray(modes)) {
      cfg.modResults.UIBackgroundModes = modes.filter((m) => m !== "remote-notification");
      if (cfg.modResults.UIBackgroundModes.length === 0) {
        delete cfg.modResults.UIBackgroundModes;
      }
    }
    return cfg;
  });

  return config;
}

module.exports = withStripRemotePushEntitlement;
