#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKIP_WEB=false
if [[ "${1:-}" == "--skip-web" ]]; then
  SKIP_WEB=true
  shift
fi
if [[ $# -ne 0 ]]; then
  echo 'Usage: bash scripts/build-android.sh [--skip-web]' >&2
  exit 2
fi
export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/android-sdk}}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export BSE_DEBUG_KEYSTORE="${BSE_DEBUG_KEYSTORE:-$HOME/.android/debug.keystore}"
OUT="${BSE_APK_OUTPUT_DIR:-$ROOT/output}"
TOOLS="$ANDROID_HOME/build-tools/35.0.0"

for cmd in java javac keytool python3; do
  command -v "$cmd" >/dev/null || { echo "Missing prerequisite: $cmd" >&2; exit 1; }
done
for tool in apksigner aapt; do
  [[ -x "$TOOLS/$tool" ]] || { echo "Install Android build-tools;35.0.0 in $ANDROID_HOME first." >&2; exit 1; }
done
[[ -f "$ANDROID_HOME/platforms/android-35/android.jar" ]] || {
  echo 'Install platforms;android-35 first.' >&2; exit 1;
}

cd "$ROOT"
if [[ "$SKIP_WEB" == false ]]; then
  command -v npm >/dev/null || { echo 'Node/npm are required for the Vite build.' >&2; exit 1; }
  npm run build
fi
python3 - "$ROOT/dist" <<'PY'
import json, pathlib, sys
root = pathlib.Path(sys.argv[1])
assert (root / 'index.html').is_file(), 'Missing real dist/index.html: run npm run build.'
assert list((root / 'assets').glob('*.js')), 'Missing compiled dashboard JavaScript.'
datasets = [root / 'data' / name for name in ('bse-high-yield.json', 'bse-announcements.json')]
datasets = [path for path in datasets if path.is_file()]
assert datasets, 'Offline BSE snapshot or official announcements JSON is required.'
for path in datasets:
    assert isinstance(json.loads(path.read_text()), dict), f'Invalid JSON: {path.name}'
print('Real dashboard assets and offline BSE JSON checked.')
PY

mkdir -p "$(dirname "$BSE_DEBUG_KEYSTORE")" "$OUT"
if [[ ! -f "$BSE_DEBUG_KEYSTORE" ]]; then
  keytool -genkeypair -noprompt -keystore "$BSE_DEBUG_KEYSTORE" \
    -storepass android -keypass android -alias androiddebugkey \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -dname 'CN=Android Debug,O=BSE High Yield,C=IN'
  chmod 600 "$BSE_DEBUG_KEYSTORE"
fi
# Official wrapper, pinned distribution checksum. No unsigned or placeholder APK is delivered.
"$ROOT/android/gradlew" -p "$ROOT/android" --no-daemon \
  -PwebDist="$ROOT/dist" :app:assembleDebug :app:lintDebug
APK="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
"$TOOLS/apksigner" verify --verbose --print-certs "$APK" | tee "$OUT/LiveBSEhighYield.signing.txt"
"$TOOLS/aapt" dump badging "$APK" > "$OUT/LiveBSEhighYield.metadata.txt"
"$TOOLS/aapt" dump permissions "$APK" >> "$OUT/LiveBSEhighYield.metadata.txt"
python3 - "$APK" "$ROOT/dist" "$OUT/LiveBSEhighYield.metadata.txt" <<'PY'
import pathlib, re, sys, zipfile
apk, dist, metadata = sys.argv[1:]
root = pathlib.Path(dist)
text = pathlib.Path(metadata).read_text()
assert "package: name='in.aisathya.bseyield'" in text, 'Wrong application ID.'
assert "versionCode='1'" in text, 'Wrong version.'
assert "sdkVersion:'26'" in text, 'Wrong minSDK.'
assert "targetSdkVersion:'35'" in text, 'Wrong targetSDK.'
permissions = set(re.findall(r"uses-permission: name='([^']+)'", text))
assert permissions == {'android.permission.INTERNET'}, f'Unexpected permissions: {permissions}'
with zipfile.ZipFile(apk) as z:
    datasets = [f'data/{name}' for name in ('bse-high-yield.json', 'bse-announcements.json')
                if (root / 'data' / name).is_file()]
    for relative in ['index.html', *datasets]:
        assert z.read('assets/' + relative) == (root / relative).read_bytes(), f'Stale bundled {relative}'
    assert z.read('assets/android-csv.js'), 'Missing Android CSV helper.'
    for asset in (root / 'assets').glob('*.js'):
        assert z.read('assets/assets/' + asset.name) == asset.read_bytes(), f'Stale script {asset.name}'
print('APK identity, Internet-only permissions, and exact bundled web build verified.')
PY
cp "$APK" "$OUT/LiveBSEhighYield.apk"
(cd "$OUT" && sha256sum LiveBSEhighYield.apk > LiveBSEhighYield.apk.sha256)
echo "Installable debug-signed APK: $OUT/LiveBSEhighYield.apk"
echo 'This is a sideload/test artifact, not a production Play Store release.'
