# Thursday Mobile (React Native · Expo SDK 52)

Native iOS & Android client for **Thursday — A quieter place to share**, sharing design parity with the web app.

## Quick start

```bash
cd mobile
npm install
npx expo start
```

## Slim Android APK (~22–26 MB instead of ~65 MB)

By default, React Native compiles a ~65 MB universal APK bundling native `.so` binaries for all 4 CPU architectures (`arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`) plus unshrunk resources.

`app.json` + `./plugins/withSmallApk.js` configure a slim release build:

| Optimization | Size Impact |
| --- | --- |
| Per-ABI splits (`arm64-v8a` + `armeabi-v7a`, `universalApk false`) | Saves ~35–40 MB |
| R8 full mode (`enableProguardInReleaseBuilds` + `enableR8.fullMode`) | Strips unused Java/Kotlin bytecode |
| Resource shrinking (`enableShrinkResourcesInReleaseBuilds`) | Strips unused drawables & layouts |
| `resourceConfigurations += ["en"]` | Drops unused locale tables |
| `useLegacyPackaging: false` | Compressed native libraries |

### Build with EAS

```bash
cd mobile
npm install
npx eas build --platform android --profile preview
```

### Build via GitHub Actions (No local Android SDK needed)

Push to `main` or manually run the **Build Slim Android APK** workflow under the repository's **Actions** tab on GitHub to download the ~24 MB `app-arm64-v8a-release.apk` artifact directly.
