# Android APK

The existing BSE dashboard is packaged as a native Java Android WebView application, not an Expo application. The app is **BSE High Yield**, package `in.aisathya.bseyield`, version name `1.0`, version code `1`. It supports Android 8.0 and newer, with minSDK 26 and target/compile SDK 35.

## Build on this sandbox

Use the full Java development kit, not a runtime-only installation. The installed tools are under `/home/ubuntu/android-sdk` and `/usr/lib/jvm/java-21-openjdk-amd64`.

After the parent-owned dashboard build is final:

```bash
cd /home/ubuntu/bseyield
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 \
ANDROID_HOME=/home/ubuntu/android-sdk \
BSE_APK_OUTPUT_DIR=/home/ubuntu/output \
bash scripts/build-android.sh --skip-web
```

To also rebuild the dashboard, omit `--skip-web`. That calls the existing `npm run build` script; dependencies must already be installed. The repository's normal dependency installation uses its pinned pnpm package manager:

```bash
pnpm install --frozen-lockfile
pnpm build
```

The Android script refuses to package an absent web build. It requires `dist/index.html`, compiled JavaScript, and either `dist/data/bse-high-yield.json` or the real official-announcements dataset `dist/data/bse-announcements.json`. It bundles the entire `dist/` tree and the Android CSV helper. It then runs Android compilation and lint, verifies APK signing with `apksigner`, checks app identity and Internet-only permissions using `aapt`, and compares the bundled HTML, scripts, and offline datasets byte-for-byte with `dist/`.

Outputs are `LiveBSEhighYield.apk`, `LiveBSEhighYield.apk.sha256`, `LiveBSEhighYield.signing.txt`, and `LiveBSEhighYield.metadata.txt` in the selected output directory. The default output directory is the repository's `output/` directory; the sandbox command above uses the requested `/home/ubuntu/output/` directory.

## Clean-machine prerequisites

Install a full Java 17 or 21 JDK, Node.js 22 or newer, Python 3, and the pnpm version declared in `package.json`. Download Android SDK command-line tools from the official Android website, check their published SHA-256, and install them under `$ANDROID_HOME/cmdline-tools/latest`. [4]

Install the needed Android components after reviewing and accepting the standard Android SDK license:

```bash
export ANDROID_HOME="$HOME/android-sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
sdkmanager 'platforms;android-35' 'build-tools;35.0.0' 'platform-tools'
```

The checked-in official Gradle wrapper downloads Gradle 8.11.1 and verifies its pinned SHA-256. The distribution checksum is `f397b287023acdba1e9f6fc5ea72d22dd63669d59ed4a289a29b1a76eee151c6`. The official wrapper JAR checksum is `2db75c40782f5e8ba1fc278a5574bab070adccb2d21ca5a6e5ed840888448046`. Both were verified during setup. [3]

Android Gradle Plugin 8.9.2, AndroidX WebKit 1.12.1, and build-tools 35.0.0 are pinned. AGP 8.9 officially supports API 35 and requires Gradle 8.11.1 and Java 17 or newer. [2]

## Installation and signing

Transfer `LiveBSEhighYield.apk` to an Android phone, open it, and allow installation from that browser/file manager when Android asks. This is sideloading, not installation from Google Play. With USB debugging already authorized on your own device, use:

```bash
adb install -r /home/ubuntu/output/LiveBSEhighYield.apk
```

**This APK is debug-signed for sideload/test use, not a production store artifact.** The debug build has application debugging and WebView remote debugging disabled. Its key is generated locally at `$HOME/.android/debug.keystore`, or at `BSE_DEBUG_KEYSTORE` if explicitly configured. The private keystore is outside the source repository and must not be committed. Locally rebuilding with the same key allows same-signature updates. Back up the key privately if continued upgrades matter.

The GitHub Actions workflow `.github/workflows/android-apk.yml` uses the ordinary Ubuntu runner, full Java 21, `setup-android`, the pinned pnpm lockfile, Gradle wrapper validation, and `upload-artifact`. It does not use a paid APK build provider. Run **Build Android APK** manually in the repository's Actions tab and download its artifact. Each fresh CI runner generates a different debug key: its APK usually cannot upgrade a differently signed local/previous-CI installation without uninstalling it. Uninstalling clears app-local saved portfolio settings. Standard GitHub Actions account quotas still apply. No private key is uploaded as an artifact.

## Data and offline behavior

The WebView appends `BSEHighYieldAndroid` to its user agent so the dashboard can detect native mode. Native mode is configured in the dashboard to fetch the daily snapshot from `https://raw.githubusercontent.com/AiSathya/LiveBSEhighYield/main/public/data/bse-high-yield.json`. No Upstox token or provider credential is bundled by the Android wrapper.

The compiled dashboard and its bundled data load without a server. The actual dataset determines offline availability: the official-announcements bundle provides selected real BSE dividend events, while daily price/yield data are available only when a valid snapshot has been provided or cached by the dashboard. The APK itself does not invent prices, dividends, or yields. Refreshing remote data requires connectivity and a published daily snapshot; changing the UI requires rebuilding and reinstalling the APK.

## WebView security and CSV export

Bundled content is served using AndroidX `WebViewAssetLoader` at `https://appassets.androidplatform.net/`, not insecure `file://` URLs. File/content access, universal file access, mixed HTTP content, pop-ups, and WebView debugging are disabled. The only Android permission is Internet. The wrapper does not override TLS certificate errors, expose `addJavascriptInterface`, accept external deep links, request storage/camera/location access, or load external web pages into the trusted WebView. External navigation opens HTTPS URLs in a browser; non-HTTPS and credential-containing links are blocked. The HTML receives a content security policy that limits scripts to the bundle, prevents frames, and allows data connections only to the bundled origin and GitHub raw content. [1]

CSV downloads are supported through a narrowly scoped AndroidX WebMessage listener: exact HTTPS app origin only, main frame only, bounded CSV text only. [5] Blob CSV links are intercepted without modifying the React source, and Android's system **Save as** document picker asks the user where to save. Files are limited to 5 MB, filenames are sanitized, and writing uses only the picker-selected content URI, so no storage permission is needed. The listener cannot execute native commands, read files, or fetch native network resources. Unsupported/outdated Android System WebView versions should be updated for CSV export. Other blob download types are not supported by this wrapper.

Print/save-PDF reports are available in the web dashboard. That action is visibly disabled in native Android mode because the wrapper does not implement an Android print adapter; CSV export remains available.

The deterministic rupee launcher icon is source-only Android vector artwork. No generated image asset or image service is involved.

Compilation, lint, APK metadata, and signature verification are build checks; they are not a claim of physical-phone testing. Confirm first launch, remote refresh, offline viewing, and the CSV picker on the intended Android device before wider distribution.

## References

[1]: https://developer.android.com/develop/ui/views/layout/webapps/load-local-content "Android load in-app content"
[2]: https://developer.android.com/build/releases/agp-8-9-0-release-notes "Android Gradle Plugin 8.9 compatibility"
[3]: https://docs.gradle.org/current/userguide/gradle_wrapper.html "Gradle wrapper verification"
[4]: https://developer.android.com/studio "Android SDK command-line-tools downloads"
[5]: https://developer.android.com/reference/androidx/webkit/WebViewCompat "AndroidX origin-scoped WebMessage listener"
