# BSE data integration

The application uses the documented **read-only Upstox APIs**, not Yahoo scraping or BSE website endpoint bypasses. No authenticated provider data has yet been fetched in this implementation because credentials and public redistribution permission have not been supplied. The initial snapshot contains real BSE identifiers and selected public corporate-action announcements, but every price, TTM dividend and yield is null. Selected announcements are explicitly partial history, not proof of complete coverage.

## Credentials and public publishing

Generate an Analytics Token under Upstox Developer Apps → Analytics. The documented token is read-only, valid for one year, and does not require a static IP for market data/fundamentals. Plan annual rotation. Store it in the local/server environment or GitHub repository secret `UPSTOX_ANALYTICS_TOKEN`; never expose it as a `VITE_` variable, browser field, URL query parameter or committed file. No order endpoints are implemented. [1]

Free API access is not an open-data licence. Before displaying the authenticated data publicly, confirm the applicable Upstox/exchange public display and redistribution rights, then set `BSE_PUBLIC_DATA_REDISTRIBUTION_CONFIRMED=true` in the server environment and as a GitHub repository variable. The workflow and public-server provider path are deliberately blocked until this is affirmative. BSE describes licensed market-data and corporate-action products for website/mobile developers. [2] [6]

Set repository variable/environment `UPSTOX_DIVIDEND_HISTORY_CONFIRMED=true` **only after an authenticated coverage review establishes the full trailing twelve-month window for the chosen universe, currency/per-share units, and action dates**. Without this flag, real valid dividend events can be displayed but `dividendTTM` and `yieldPercent` remain null. The flag does not override split/bonus safety or malformed dividend-event safeguards. Upstox's documented endpoint does not guarantee historical depth or share-adjustment semantics. [4]

## Documented upstream requests

`GET https://assets.upstox.com/market-quote/instruments/exchange/BSE.json.gz` is the unauthenticated gzip JSON identifier registry. `public/data/bse-universe.json` records its download time and source, with twenty actual group-A BSE equities selected from that bulk file. BSE equities use `segment=BSE_EQ` and group `instrument_type=A`, **not `instrument_type=EQ`**. Names are verbatim source records and may be truncated. Sector is `Unclassified`; no sector claims or hardcoded financials are inserted. The universe is a recognizable candidate inventory, not a completed high-yield screen or recommendation. [3]

`GET https://api.upstox.com/v2/market-quote/quotes?instrument_key=<comma-separated instrument keys>` supports up to 500 instruments. This application uses one batch for twenty verified `BSE_EQ|ISIN` keys. It sends `Authorization: Bearer <token>` and maps each response by `instrument_token`, not the dictionary key. Positive finite `last_price` is the denominator; documented `ohlc.close` is previous close, used for daily change. `last_trade_time` is the price observation time; a recent API request or provider `timestamp` cannot rejuvenate an old trade. ISO and epoch seconds/milliseconds are normalized safely. [5]

`GET https://api.upstox.com/v2/fundamentals/{isin}/corporate-actions` uses the same header. A daily sweep makes at most twenty requests; minute-by-minute quote refresh does not rerun the sweep. Valid dividend amounts require INR/Rs and per-share evidence in the event details. Face-value dividend percentages and foreign currency are rejected. Explicit ex-dividend date is preferred, with documented `expiry_date` fallback. Known ordinary and special cash events are included; preference/non-cash/return-of-capital items are rejected. Split/bonus events are retained as calculation blockers rather than guessed adjustments. [4]

## Snapshot and freshness

`GET /api/bse/snapshot` returns the agreed `Snapshot` object directly. `?refresh=true` requests a refresh but cannot bypass the sixty-second minimum upstream request budget. Concurrent requests join a single refresh. No-key servers load the canonical published daily snapshot from `https://raw.githubusercontent.com/AiSathya/LiveBSEhighYield/main/public/data/bse-high-yield.json`, so successful future Actions updates reach the preview without rebuilding. If that request fails, the server uses its last successful/bundled dated copy. It reevaluates freshness at response time and never changes `quoteAsOf` to the fetch time.

A positive price without a valid last-trade timestamp is unavailable. A valid observation more than four calendar days old is stale, and its yield is withheld. Only an actual same-day trade less than fifteen minutes old within weekday 09:15–15:30 IST can be `live`; under sixty minutes can be `delayed`. Other observations up to four days old are labelled `eod` as dated last-trade data, **not a verified final settlement close**. No complete holiday calendar is asserted: old Friday/holiday trades remain dated rather than becoming live simply because the request succeeded. Data is attributed to Upstox, not called an official BSE exchange feed.

TTM uses **calendar-year subtraction** and the ex-date window `(quote observation date minus twelve months, quote observation date]`. The lower boundary is exclusive, upper boundary inclusive; future announcements do not count. The price date is interpreted in IST. The formula is `100 × dividendTTM / unadjusted last trade price`. No intermediate rounding is applied. A split/bonus inside this window withholds the TTM sum and yield because current-share-unit normalization is not implemented. An unparseable action date or invalid dividend in the window also withholds the affected metrics. Unknown empty history never becomes zero; zero is possible only with an explicitly confirmed successful complete history window containing no cash events.

Provider errors are sanitized: no response bodies, authorization headers, tokens or child-process error objects appear in logs or public errors. Missing credentials, network failures, invalid JSON/schema, and unavailable/stale provider snapshots exit nonzero without overwriting the existing public snapshot. Prices may be usable while dividends remain unknown. Optional fields with no supported source remain null rather than copying the current price into a 52-week high/low or manufacturing market cap.

## Running and scheduling

Run `python3 -m unittest discover -s tests -v` for the financial/parser/failure tests. Run `python3 scripts/update_bse_data.py --refresh-universe --public-output` only after configuring the token and public data-rights flag. Python 3.12 is used in Actions; the script needs only the standard library. A private normalized corporate-action cache defaults to `.cache/bse-actions.json`. `--quotes-only` uses same-day cache and never issues corporate-action requests. Server cache lives in the operating-system temporary directory and is never committed.

The configured workflow `.github/workflows/daily-bse-data.yml` runs at `45 12 * * *` UTC, **18:15 IST daily**, including non-trading days; GitHub may delay scheduled jobs. It also supports manual dispatch. Only the update job has `contents: write`, concurrency prevents overlapping jobs without cancelling an active update, and only successful public snapshot/universe files are committed. Missing token or missing rights confirmation fails visibly before publishing; prior data remains intact. Give repository Actions write permission and ensure branch protection allows this bot's ordinary non-force push, or arrange an approved pull-request process. The workflow uses reviewed major-version actions `checkout@v4` and `setup-python@v5`; no unverified SHA is invented. Configuring the file is not evidence of a successful remote run.

The source evaluation underlying these choices was completed on 3 November 2026. No anonymous quote-and-complete-dividend route was verified; the public registry supplies identifiers only. BSE public announcements are useful selected primary-source records but are not treated as a stable unattended full-history API. A future licensed adapter can replace the provider, but there is no undocumented Yahoo or BSE scraping fallback.

## References

[1]: https://upstox.com/developer/api-documentation/analytics-token "Upstox one-year read-only Analytics Token"
[2]: https://upstox.com/trading-api/ "Upstox API access and business integration"
[3]: https://upstox.com/developer/api-documentation/instruments/ "Upstox documented exchange instrument registry"
[4]: https://upstox.com/developer/api-documentation/get-corporate-actions "Upstox corporate actions by ISIN and dividend event details"
[5]: https://upstox.com/developer/api-documentation/get-full-market-quote "Upstox full market quote schema and batch endpoint"
[6]: https://www.bseindia.com/marketdata-products "BSE licensed market-data and corporate-action products"
[7]: https://www.bseindia.com/corporates/corporate_act "BSE selected public corporate-action announcements"
