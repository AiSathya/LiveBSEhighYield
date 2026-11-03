# BSE High Yield

An India-focused dividend dashboard for a selected watchlist of BSE-listed equities. Prices and per-share dividends are in INR. This repository replaces the copied app's Singapore listings, SGX feed, SGD formatting, illustrative payout histories and Singapore-specific tax claims. The original `AiSathya/LiveSGXhighYield` repository remains unchanged.

## Data connection

The documented provider is **Upstox**, using a **read-only Analytics Token**. Its public BSE instrument registry resolves BSE security codes and ISINs. Authenticated market-quote and corporate-action endpoints supply prices and dividend events. A token is required: the app does not fabricate market prices or pretend to be connected without one.

Generate a token in Upstox Developer Apps → Analytics. It is documented as valid for one year. See [API coverage, data quality and setup](docs/DATA_API.md) and [API research](docs/API_RESEARCH.md). Only read-only market-data and fundamentals calls are implemented; this app never places trades.

Provider API access is not automatically a licence to redistribute data publicly. Review the provider/exchange terms for your usage before publishing market-data snapshots. Do not put a token in a browser variable, Android APK, public file, issue, commit or log.

## Run the dashboard

Use Node.js 22, Python 3.11 or newer, and the pinned pnpm version.

```bash
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
cp .env.example .env
# Set UPSTOX_ANALYTICS_TOKEN in .env for a local server connection.
# Set BSE_PUBLIC_DATA_REDISTRIBUTION_CONFIRMED=true only after rights review.
# Set UPSTOX_DIVIDEND_HISTORY_CONFIRMED=true only after TTM history review.
pnpm dev
```

The dashboard listens on port 3000. `pnpm lint`, `pnpm test:data`, and `pnpm build` check and compile the app. Production uses `NODE_ENV=production pnpm start` after the build, or the included Dockerfile. Environment variable `PORT` sets the server port.

The interface retains yield rankings, price changes, search/filtering, selected dividend history, current ex-dates, an INR portfolio planner and CSV/report export. Missing prices and dividends are shown as unavailable rather than zero. There are no invented health scores, dividend forecasts, government bond benchmarks or default portfolio holdings. Local portfolio data is not represented as an encrypted biometric vault.

## Daily GitHub Actions refresh

The workflow [daily-bse-data.yml](.github/workflows/daily-bse-data.yml) runs at **18:15 India time every day** (`12:45 UTC`), including non-trading days. It also supports manual dispatch. GitHub's scheduler may run late; exchange holidays and stale last trades are labelled, not converted into fresh quotes.

Add `UPSTOX_ANALYTICS_TOKEN` under **Settings → Secrets and variables → Actions → Secrets**. Set repository variable `BSE_PUBLIC_DATA_REDISTRIBUTION_CONFIRMED=true` only after confirming that your provider/exchange permissions permit the public snapshot use. Follow the additional dividend-history coverage controls documented in [DATA_API.md](docs/DATA_API.md).

The updater writes `public/data/bse-high-yield.json`. Successful refreshes commit only generated data; failed or missing credentials are visible in Actions and must not overwrite a valid snapshot with fabricated prices. The public raw JSON is the Android daily data channel. No credential is needed in the APK.

Repository Secrets require a permission not supplied by every GitHub connector. If the connector cannot manage them, add them yourself in GitHub Settings. Committing a workflow and confirming an enabled schedule is not evidence of a successful authenticated data refresh.

## Android APK

See [Android packaging and build instructions](docs/ANDROID.md). `pnpm build:android` bundles the real dashboard into a native Android WebView application. The APK uses HTTPS-origin bundled assets, an internet permission for snapshot refresh and no trading/account permissions. The supplied installable build is **debug-signed for sideloading**, not a Play Store release; a production signing key and release process are separate.

The Android build workflow uploads its APK as an Actions artifact. By default, the app refreshes from this repository's public daily JSON rather than embedding API credentials. Internet access is necessary for updated snapshots. Frontend changes require a new APK; daily data changes do not.

## Dividend-yield methodology

Cash per-share dividends with ex-dates in the trailing twelve-month window are compared with the latest available price in the same currency and share basis. Only provider-supported history is used. Incomplete history, unknown units and unadjusted corporate actions are not silently treated as full-year cash dividends. See the API documentation for exactly when yields are calculated or withheld.

The selected watchlist is not the full BSE market and is not an investment recommendation. High historical yield does not imply a future dividend or financial safety. Dividends may be subject to Indian income-tax and TDS rules depending on the investor's circumstances. Research information only, not tax or investment advice.

## Source and preview

The source repository is [AiSathya/LiveBSEhighYield](https://github.com/AiSathya/LiveBSEhighYield). The Manus dashboard preview contains the same application source in a separate deployment workspace. See [repository and snapshot synchronization](docs/REPOSITORY.md).
