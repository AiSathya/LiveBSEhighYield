package in.aisathya.bseyield;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** A bundled website, not a general-purpose browser. No addJavascriptInterface is used. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String ORIGIN = "https://" + HOST;
    private static final String START_URL = ORIGIN + "/index.html";
    private static final int SAVE_CSV = 100;
    private static final int MAX_CSV_BYTES = 5 * 1024 * 1024;
    private final ExecutorService fileWriter = Executors.newSingleThreadExecutor();
    private WebView webView;
    private byte[] pendingCsv;
    private String csvHook;

    @Override
    @SuppressWarnings("deprecation")
    public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(16, 23, 25));
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(16, 23, 25));
        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(
                        WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
        setContentView(root);
        root.requestApplyInsets();

        WebView.setWebContentsDebuggingEnabled(false);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSafeBrowsingEnabled(true);
        settings.setUserAgentString(settings.getUserAgentString() + " BSEHighYieldAndroid");
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);
        webView.setWebChromeClient(new WebChromeClient());

        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setHttpAllowed(false)
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isLocal(uri)) {
                    WebResourceResponse response = loader.shouldInterceptRequest(uri);
                    if (response == null) return blocked(404, "Not Found");
                    Map<String, String> headers = new HashMap<>();
                    headers.put("X-Content-Type-Options", "nosniff");
                    headers.put("Cache-Control", "no-cache");
                    if ("text/html".equals(response.getMimeType())) {
                        headers.put("Content-Security-Policy", "default-src 'self'; script-src 'self'; "
                                + "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                                + "font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; "
                                + "connect-src 'self' https://raw.githubusercontent.com; "
                                + "object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'none'");
                    }
                    response.setResponseHeaders(headers);
                    return response;
                }
                if (!"https".equals(uri.getScheme())) return blocked(403, "Forbidden");
                return null; // HTTPS-only data fetches; certificate failures retain WebView's default rejection.
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isLocal(uri)) return false;
                if (request.isForMainFrame()) openExternalHttps(uri);
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (isLocal(Uri.parse(url)) && csvHook != null) view.evaluateJavascript(csvHook, null);
            }
        });
        setupCsvExport();
        webView.setDownloadListener((url, agent, disposition, mime, length) -> {
            if (url.startsWith("blob:")) {
                toast("CSV export requires an updated Android System WebView. Other downloads are not supported.");
            } else {
                openExternalHttps(Uri.parse(url));
            }
        });
        if (state == null || webView.restoreState(state) == null) webView.loadUrl(START_URL);
    }

    private static boolean isLocal(Uri uri) {
        return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost())
                && (uri.getPort() == -1 || uri.getPort() == 443) && uri.getUserInfo() == null;
    }

    private static WebResourceResponse blocked(int status, String reason) {
        return new WebResourceResponse("text/plain", "UTF-8", status, reason,
                Collections.singletonMap("Cache-Control", "no-store"),
                new ByteArrayInputStream(reason.getBytes(StandardCharsets.UTF_8)));
    }

    private void openExternalHttps(Uri uri) {
        if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null) {
            toast("Only HTTPS browser links are allowed.");
            return;
        }
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            startActivity(intent);
        } catch (ActivityNotFoundException ignored) {
            toast("No browser is installed to open this link.");
        }
    }

    private void setupCsvExport() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return;
        // Exact HTTPS origin only, no wildcard. Subframes and nonlocal current documents are rejected.
        // The only supported operation is bounded CSV text followed by the system's user-selected file picker.
        WebViewCompat.addWebMessageListener(webView, "BSEAndroidCsv",
                Collections.singleton(ORIGIN), (view, message, origin, mainFrame, reply) -> {
                    if (!mainFrame || !isLocal(origin) || view.getUrl() == null
                            || !isLocal(Uri.parse(view.getUrl()))) return;
                    String payload = message.getData();
                    if (payload == null || payload.length() > MAX_CSV_BYTES + 4096) return;
                    if (pendingCsv != null) {
                        toast("Finish or cancel the current save first.");
                        return;
                    }
                    try {
                        JSONObject json = new JSONObject(payload);
                        if (!"csv".equals(json.optString("type"))) return;
                        String content = json.getString("text");
                        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
                        if (bytes.length > MAX_CSV_BYTES) {
                            toast("CSV exceeds the 5 MB Android export limit.");
                            return;
                        }
                        String name = json.optString("name", "bse-high-yield.csv")
                                .replaceAll("[^a-zA-Z0-9._-]", "_");
                        if (name.length() > 100) name = name.substring(0, 100);
                        if (!name.toLowerCase(java.util.Locale.ROOT).endsWith(".csv")) name += ".csv";
                        pendingCsv = bytes;
                        Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                        save.addCategory(Intent.CATEGORY_OPENABLE);
                        save.setType("text/csv");
                        save.putExtra(Intent.EXTRA_TITLE, name);
                        startActivityForResult(save, SAVE_CSV);
                    } catch (Exception error) {
                        pendingCsv = null;
                        toast("Unable to start CSV export.");
                    }
                });
        try (java.io.InputStream input = getAssets().open("android-csv.js")) {
            java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
            byte[] chunk = new byte[4096];
            int count;
            while ((count = input.read(chunk)) != -1) buffer.write(chunk, 0, count);
            csvHook = new String(buffer.toByteArray(), StandardCharsets.UTF_8);
        } catch (IOException error) {
            toast("CSV export helper is missing from this app build.");
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request != SAVE_CSV) return;
        byte[] bytes = pendingCsv;
        pendingCsv = null;
        if (result != RESULT_OK || data == null || data.getData() == null || bytes == null) return;
        Uri uri = data.getData();
        if (!"content".equals(uri.getScheme())) {
            toast("Invalid destination selected.");
            return;
        }
        fileWriter.execute(() -> {
            try (OutputStream output = getContentResolver().openOutputStream(uri, "wt")) {
                if (output == null) throw new IOException("No output stream");
                output.write(bytes);
                runOnUiThread(() -> toast("CSV saved."));
            } catch (IOException | SecurityException error) {
                runOnUiThread(() -> toast("CSV could not be saved. Choose another destination."));
            }
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle state) {
        webView.saveState(state);
        super.onSaveInstanceState(state);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        fileWriter.shutdown();
        super.onDestroy();
    }

    private void toast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }
}
