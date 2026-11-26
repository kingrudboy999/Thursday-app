#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Installing dependencies..."
npm install

if [ "${1:-eas}" = "local" ]; then
  echo "==> Prebuilding slim Android native project (ABI splits + R8 + shrinkResources)..."
  npx expo prebuild --platform android --clean
  cd android
  ./gradlew assembleRelease
  echo "==> Built split APKs (~22–26 MB per ABI):"
  ls -lh app/build/outputs/apk/release/*.apk
else
  echo "==> Triggering EAS Android preview APK build (~22–26 MB per device ABI)..."
  npx eas build --platform android --profile preview
fi
