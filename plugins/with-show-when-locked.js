// Expo config plugin: makes MainActivity show on the lock screen and
// turn the screen on when the activity is launched. Required so that a
// notifee fullScreenAction (USAGE_ALARM) actually surfaces the alarm UI
// when the device is locked.
const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

module.exports = function withShowWhenLocked(config) {
  return withAndroidManifest(config, (cfg) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    const mainActivity =
      application.activity &&
      application.activity.find((a) => a.$ && a.$['android:name'] === '.MainActivity');

    if (mainActivity && mainActivity.$) {
      mainActivity.$['android:showWhenLocked'] = 'true';
      mainActivity.$['android:turnScreenOn'] = 'true';
    }

    return cfg;
  });
};
