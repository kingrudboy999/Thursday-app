const { withAppBuildGradle, withGradleProperties } = require("@expo/config-plugins");

/**
 * Expo Config Plugin for slimming the release APK from ~65 MB down to ~22–26 MB:
 * 1. Per-ABI splits (arm64-v8a + armeabi-v7a) with universalApk = false
 * 2. English-only resource configurations
 * 3. Explicit R8 full mode, minifyEnabled, and shrinkResources on release builds
 */
function withSmallApk(config) {
  config = withGradleProperties(config, (mod) => {
    const setProp = (key, value) => {
      const idx = mod.modResults.findIndex((item) => item.type === "property" && item.key === key);
      const entry = { type: "property", key, value };
      if (idx >= 0) mod.modResults[idx] = entry;
      else mod.modResults.push(entry);
    };
    setProp("android.enableProguardInReleaseBuilds", "true");
    setProp("android.enableShrinkResourcesInReleaseBuilds", "true");
    setProp("android.enableR8.fullMode", "true");
    setProp("reactNativeArchitectures", "arm64-v8a,armeabi-v7a");
    return mod;
  });

  config = withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;

    if (!contents.includes("universalApk false")) {
      const splitsBlock = `
    splits {
        abi {
            enable true
            reset()
            include "arm64-v8a", "armeabi-v7a"
            universalApk false
        }
    }
`;
      contents = contents.replace(/android\s*\{/, `android {${splitsBlock}`);
    }

    if (!contents.includes('resourceConfigurations += ["en"]')) {
      contents = contents.replace(
        /defaultConfig\s*\{/,
        `defaultConfig {\n        resourceConfigurations += ["en"]`,
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });

  return config;
}

module.exports = withSmallApk;
