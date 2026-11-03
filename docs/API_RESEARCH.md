**For an unattended daily BSE dividend-yield dashboard, use Upstox as the first credentialed integration, with EODHD as the documented vendor fallback. No documented, no-key API covering both current BSE quotes and complete historical per-share dividends was verified.** Upstox now documents a free read-only Analytics Token valid for one year; market data and fundamentals do not require a static IP, so a GitHub-hosted Actions runner is compatible. This supersedes older guidance that Upstox necessarily requires daily OAuth reauthorization. Its corporate-actions endpoint explicitly supplies dividend amounts and ex-dates, but the documentation does not guarantee history depth or split-adjustment semantics; those require an authenticated coverage check before publishing TTM yields. [1] [2] [3]

Research date: 3 November 2026. Author: Manus AI. This report evaluates documented interfaces, not executable trading prices. No private API credentials were available, so authenticated BSE quote and dividend responses were not live-tested.

## Upstox: free API with one-year credential

The public instrument registry is `GET https://assets.upstox.com/market-quote/instruments/exchange/BSE.json.gz`. It is a documented, unauthenticated gzip-compressed JSON array, refreshed around 06:00 daily. Records provide `segment`, `instrument_type`, `trading_symbol`, `exchange_token`, `isin`, and `instrument_key`. Use the actual `instrument_key` and join corporate actions by ISIN. The downloaded registry on this research date contains real `BSE_EQ` mappings. **Do not filter BSE equities with `instrument_type == "EQ"`: BSE uses groups such as `A`, `B`, `X` and others; the requested large-company examples are group `A`.** The registry is identifiers, not a no-key quote or dividend feed. [4]

Quotes: `GET https://api.upstox.com/v2/market-quote/quotes?instrument_key=BSE_EQ%7CINE002A01018`. Supply `Authorization: Bearer <analytics_token>` and `Accept: application/json`. The comma-separated `instrument_key` parameter supports up to 500 instruments. The documented response is `{ "status": "success", "data": { "<segment>:<symbol>": { "instrument_token": "BSE_EQ|<ISIN>", "symbol": "...", "last_price": 123.45, "ohlc": {"open": 0, "high": 0, "low": 0, "close": 0}, "timestamp": "...", "last_trade_time": "<epoch milliseconds>", "volume": 0, "depth": {"buy": [], "sell": []} } } }`. The provider says snapshots are obtained directly from exchanges at request time. Map response values by `instrument_token`, not by assuming the response object key equals the request key. Preserve feed timestamp and last-trade time separately. The example `timestamp` is an ISO timestamp even though its field description calls it milliseconds, so inspect and parse the returned type rather than assuming. [5]

Historical dividends: `GET https://api.upstox.com/v2/fundamentals/{isin}/corporate-actions`, with the same headers. Response: `{ "status": "success", "data": [{ "name": "Dividend", "expiry_date": "14 Aug 2025", "amount": 5.5, "ratio": null, "event_details": [{"name": "Ex dividend date", "value": "14 Aug 2025"}, {"name": "Dividend type", "value": "Final"}, {"name": "Amount", "value": "5.5"}, {"name": "Details", "value": "Rs.5.5000 per share..."}] }] }`. Also returns `Bonus`, `Split`, and `Rights`. Filter dividend events, use explicit ex-dividend detail with `expiry_date` as documented ex-date fallback, parse `DD MMM YYYY`, and use monetary `amount`, never `Dividend %`, which is not market-price yield. The documented sample is INR per share. There is no explicit currency field, history guarantee, date-window parameter or pagination parameter documented. Validate INR and per-share units from each event detail and confirm the full TTM window is represented. [3]

The token must be generated through an Upstox account's Developer Apps Analytics tab; it is not anonymous access. It permits GET/read-only operations, lasts one year, and only one token is allowed per account. Store it as an Actions secret and plan annual rotation. All trading and data APIs are advertised as free, although account-related charges and public redistribution rights are separate questions. Businesses are directed to contact Upstox for integration. Free API access is not itself an open-data redistribution licence. [1] [2]

## EODHD: straightforward daily REST fallback, BSE mapping must be fetched

Daily prices: `GET https://eodhd.com/api/eod/{Code}.BSE?api_token=<token>&fmt=json&period=d&order=d&from=YYYY-MM-DD&to=YYYY-MM-DD`. Authentication is a query-string API token. The JSON array contains `date`, raw `open`, `high`, `low`, `close`, dividend-and-split-adjusted `adjusted_close`, and split-adjusted `volume`. Use the latest completed day's **raw `close`** as a current-price denominator, not dividend-adjusted close. `filter=last_close` is available but loses the date; fetching recent rows is safer. [6]

Dividends: `GET https://eodhd.com/api/div/{Code}.BSE?api_token=<token>&fmt=json&from=YYYY-MM-DD&to=YYYY-MM-DD`. JSON rows contain `date` as ex-dividend date, `value` as split-adjusted cash per share in today's share units, `unadjustedValue` as historical cash per share, `currency`, and nullable `declarationDate`, `recordDate`, `paymentDate`, `period`. The date filters are inclusive. For a present-day TTM yield, `value` matches today's share units; for historical as-of yields, do not use later split adjustments without reconstructing the as-of share basis. Indian sample coverage in the docs has null extended dates, so ex-date TTM is feasible in principle but payment-date TTM is not assured. Each dividend request costs one API call. [7]

Symbol discovery is `GET https://eodhd.com/api/exchange-symbol-list/BSE?api_token=<token>&fmt=json&type=common_stock`. Rows contain `Code`, `Name`, `Country`, `Exchange`, `Currency`, `Type`, and partially populated `Isin`; append `.BSE` to the returned `Code`. Do not mechanically append `.BSE` to an Upstox or NSE ticker. Fetch the bulk registry and join by ISIN, reconciling missing matches explicitly. `delisted=1` returns a separate, not cumulative, list. [8]

EODHD's pricing page currently lists a key-required free plan with 20 calls/day, 20 requests/minute, one year of time-series history, and dividends/splits included; the $19.99/month personal EOD Historical All-World plan has 100,000 calls/day, 1,000 requests/minute, and prices plus dividends/splits. The separate $59.99 fundamentals-only plan does **not** include these price/dividend feeds. The homepage/search marketing and detailed plan descriptions differ on free global coverage; do not assume free-plan BSE entitlement until a newly registered key is tested. The public `api_token=demo` is evaluation-only and limited to named US/global instruments, not BSE. No BSE anonymous access is documented. [6] [7] [9]

Personal pricing is not a public website distribution licence. Commercial/business use requires a commercial agreement. The provider's disclaimer calls prices indicative and not necessarily accurate or real-time, not exchange-confirmed execution quotes. [9] [10]

EODHD's own original Python tutorial explicitly requests `get_exchange_symbols(exchange='BSE')` and retrieves Infosys prices as **`500209.BSE`**, confirming that this is the Bombay venue and that numeric BSE scrip codes are used in the documented example. This is not `BSE.NSE`, which would be the exchange operator company's NSE listing. This verifies actual documented BSE price coverage, but not the completeness of every `.BSE` dividend series. The dividends documentation demonstrates Indian coverage using `ITC.NSE`, not a BSE-specific dividend sample. Therefore, require an authenticated `.BSE` history test and company/ISIN match before activating the BSE dividend adapter. [11] [7]

For delayed quotes, EODHD also supports `GET https://eodhd.com/api/real-time/{Code}.BSE?api_token=<token>&fmt=json`, optionally with `s=<additional fully suffixed symbols>`. Response fields are `code`, Unix-seconds `timestamp`, `gmtoffset`, `open`, `high`, `low`, `close`, `volume`, `previousClose`, `change`, `change_p`. Here `close` means latest delayed quote, **not** completed daily close. The documented stock delay is 15–20 minutes, updated roughly once per minute. Label this `delayed`, never `live`. Daily EOD response dates must be checked against the most recent completed BSE session rather than assuming a fetch after market close already contains that session. A BSE-specific finalization SLA was not established. [12]

## IndianAPI: keyed BSE quotes, weaker verified TTM contract

The public rendered OpenAPI reference identifies `https://stock.indianapi.in` as the server and `x-api-key` as required authentication. For Free/Hobby, use `GET https://stock.indianapi.in/stock?name=Reliance` with `x-api-key: <key>`. The provider's documented quote response contains `tickerId`, `companyName`, and `currentPrice: { "BSE": 2200.50, "NSE": 2195.75 }`. Read **only `currentPrice.BSE`** for this application. Verify resolved company identity because `name` is a fuzzy company-name search, not a strict BSE security identifier. The narrative sample includes `stockCorporateActionData` but leaves its structure as a placeholder. [13] [14]

The current rendered API reference also lists `GET /corporate_actions`, but a stable parameter/response contract and complete 12-month dividend coverage were not established in this quick review. Do not invent its query parameters or assume its rows can populate `dividends`. The narrative `GET /historical_data` documentation has a `stock_name` parameter but its example uses `symbol`; its shown Price dataset is labelled **Price on NSE**. It is not evidence for BSE historical-price support. `stock_forecasts` offers `DPS` and `Actuals`, but fiscal-year dividends per share are not equivalent to a dated trailing-12-month cash-dividend event series. [13] [14]

IndianAPI supplies a key after subscribing even to its free tier. The provider currently maps Developer to `https://dev.indianapi.in`, Growth Analyst to `https://analyst.indianapi.in`, and Pro to `https://pro.indianapi.in`; the key stays unchanged on upgrade unless reset. Exact numeric plan prices and credit quotas could not be verified from the dynamically rendered Pricing tab, so none are asserted here. Obtain them directly before relying on a paid plan. The FAQ says it aims for 99% uptime; that is not a documented guaranteed SLA. It markets real-time data, but a precise BSE delay and an observation timestamp in the `/stock` sample were not verified, so do not automatically classify fetched values as `live`. [14]

The provider's June 2026 general terms permit commercial/non-commercial integration but disclaim completeness, accuracy and availability, and reserve the right to change or discontinue APIs without notice. Those broad terms do not independently establish underlying exchange-data redistribution rights. This is a secondary prototype option, not the first production source for independently reconstructed TTM yield. [15]

## Official BSE public reports: authoritative validation, not a verified unattended no-key API

The original Bhav Copy page exposes current and historical public reports and links the UDiFF format workbook. It also explicitly says the old `EQDDMMYY.csv`, `EQ_ISINCODE_DDMMYY.csv` and older standardized equity formats were discontinued on 8 July 2024. Do not implement a remembered legacy URL pattern or apply the page's legacy `SC_CODE`/`CLOSE` field help to a current UDiFF file without reading its actual headers. Its old-format help says downloads are made available after 16:45, subject to delay; this is not a verified current UDiFF API publication SLA. The research fetch showed an as-of date of 31 October 2026, so fetching the page successfully did not establish current completed-session data. [16]

The original Corporate Actions page is publicly readable and includes security code, ex-date, textual purpose with per-share INR amounts, record date, and sometimes payment date. It supports date and purpose selection and advises downloading CSV for all records. This is useful primary-source validation, but it is **not a published stable API contract**, and the HTML page alone is not a guarantee of a complete TTM window or a predictable unattended CSV URL. Do not extract a 12-month yield from only its default visible rows. [17]

In the coordinating implementation tests, direct ordinary HTTP requests to the BSE page, current UDiFF CSV/ZIP, and a website quote endpoint returned HTTP 403 without attempting bypass. A browser/fetch-tool success does not demonstrate that a daily GitHub Actions script can fetch the same data. No bot-evasion or undocumented website endpoint is recommended. The official BSE market-data product page instead describes licensed real-time feeds, EOD files, corporate-actions XML, historical corporate data since 2006, and secure/login-protected internet delivery. It directs website/mobile developers to subscriptions and licensed vendors. For a public production application requiring exchange-authorized display rights, BSE or one of its listed licensed data vendors is the strongest contractual route, but there is no anonymous production endpoint/schema quoted here. [18]

**No verified credential-free unattended route meets both required fields.** The documented Upstox public BSE registry is usable without a key for identifiers only. BSE public reports may be a manually supplied or explicitly licensed EOD fallback if a stable legal delivery method is arranged, but should not be represented as an already working anonymous API.

## Backend implementation choice and failure rules

Implement the **Upstox quote adapter now**, with optional Upstox corporate actions and EODHD dividend/EOD adapters. Request `UPSTOX_ANALYTICS_TOKEN` from the user; it is preferable to a daily OAuth token for a read-only scheduled job. Request `EODHD_API_TOKEN` for the fallback and confirm BSE entitlement plus `.BSE` dividend coverage before using it. Neither key belongs in the browser bundle, committed JSON, logs, or public repository. If deploying a public dashboard, obtain explicit permitted-display/redistribution terms from the selected provider first. Upstox standard non-order limits are documented as 50 requests/second, 500/minute and 2,000/30 minutes; one quote batch and a small dividend refresh comfortably fit a 15-stock daily workload. [1] [9] [10] [19]

For the agreed `BSEStock` output, map a successful Upstox quote's positive finite `last_price` to `price`, keep its real observation time in `quoteAsOf`, and assign `live` only when the actual quote time and market context support that label. A daily cache is not continuously live: outside the completed fetch's freshness window label it appropriately in the UI or use a verified daily candle/close and `eod`. Upstox `ohlc.close` is described as most recent close and `net_change` compares last price with yesterday's close; do not assume intraday `ohlc.close` is the current session's final close. EODHD EOD rows map `close` to `price`, `date` to the actual quote date, and `eod` to status; EODHD snapshot rows map `close`, timestamp, and `delayed`.

Normalize dividend events as `{ "date": "YYYY-MM-DD", "amount": <INR cash per current share>, "currency": "INR" }`. For the chosen ex-date convention, set `dividendTTM = sum(amount for asOf minus 12 calendar months < date <= asOf)` and `yieldPercent = 100 * dividendTTM / price`. Use a calendar-month subtraction rather than blindly assuming 365 days, and explicitly label this **TTM ex-dividend yield**, not projected yield or cash-payment-date yield. Include both ordinary and special cash dividends, with any ordinary-only yield separately labelled. Exclude announced future ex-dates, preference-share dividends, REIT/InvIT return-of-capital distributions and unrelated corporate actions. Never use a face-value dividend percentage as yield.

Current-share-unit normalization matters after splits/bonus issues. EODHD `value` is documented as current-share split-adjusted; Upstox adjustment semantics are not documented. For Upstox, validate the event amount basis and reconstruct any subsequent split/bonus share factor or withhold the affected yield. Preserve raw event data privately for reproducibility and do not silently mix two amounts with different adjustment bases. If a corporate action changes ISIN, re-resolve the registry mapping instead of assuming a prior ISIN covers all needed history.

On absent keys, 401/403/429, schema mismatch, missing security, nonpositive/invalid price, stale quote, or insufficient dividend-history coverage, return explicit `unavailable` and affected nulls. Do not replace missing quote prices with stored demo prices. A quote can exist while `dividendTTM` and `yieldPercent` remain null. Conversely, valid dividend events can remain available while `price` and yield are null. Use `dividends: []` only as the event list container with an explicit failure/coverage flag when history is unknown; it must **not imply a verified zero dividend**. Set TTM to zero only after confirming the source successfully covers the full window and returns no qualifying dividend events. Preserve last successful data only as clearly dated/stale information, not a fresh successful status.

No undocumented Yahoo endpoints were accessed. A supported library does not automatically confer reliable BSE coverage, anonymous production access, or redistribution permission; there is no need to route this implementation through Yahoo/yfinance when a documented keyed vendor adapter is available.

## Suggested 15-stock BSE universe from one bulk registry

These are identifier mappings extracted from the documented Upstox BSE gzip JSON downloaded on 3 November 2026, not an investment recommendation or a high-yield screen. All shown records have `segment=BSE_EQ` and BSE group `instrument_type=A`. The source contains 28,269 instruments across BSE-related segments; it is not an equity-only file. Refresh and reconcile the registry instead of freezing share-class/ISIN assumptions indefinitely. Quotes and dividends were not authenticated-tested. [4]

```text
symbol       BSE code  ISIN          Upstox instrument_key
RELIANCE     500325    INE002A01018  BSE_EQ|INE002A01018
TCS          532540    INE467B01029  BSE_EQ|INE467B01029
INFY         500209    INE009A01021  BSE_EQ|INE009A01021
HDFCBANK     500180    INE040A01034  BSE_EQ|INE040A01034
ICICIBANK    532174    INE090A01021  BSE_EQ|INE090A01021
ITC          500875    INE154A01025  BSE_EQ|INE154A01025
HINDUNILVR   500696    INE030A01027  BSE_EQ|INE030A01027
SBIN         500112    INE062A01020  BSE_EQ|INE062A01020
LT           500510    INE018A01030  BSE_EQ|INE018A01030
HCLTECH      532281    INE860A01027  BSE_EQ|INE860A01027
POWERGRID    532898    INE752E01010  BSE_EQ|INE752E01010
NTPC         532555    INE733E01010  BSE_EQ|INE733E01010
COALINDIA    533278    INE522F01014  BSE_EQ|INE522F01014
ONGC         500312    INE213A01029  BSE_EQ|INE213A01029
TATASTEEL    500470    INE081A01020  BSE_EQ|INE081A01020
```

For EODHD, numeric codes such as `500209.BSE` are documented, but fetch its BSE bulk symbol list and match ISIN before assuming all fifteen codes are covered with dividend history. No separate company-by-company research was used.

## References

[1]: https://upstox.com/developer/api-documentation/analytics-token "Upstox Analytics Token: one-year read-only access and no-static-IP market data"
[2]: https://upstox.com/trading-api/ "Upstox free trading and market-data API access"
[3]: https://upstox.com/developer/api-documentation/get-corporate-actions "Upstox corporate actions by ISIN: dividend amounts and ex-dates"
[4]: https://upstox.com/developer/api-documentation/instruments/ "Upstox documented daily JSON instrument registry and BSE bulk file"
[5]: https://upstox.com/developer/api-documentation/get-full-market-quote "Upstox full market quote endpoint and response schema"
[6]: https://eodhd.com/financial-apis/api-for-historical-data-and-volumes "EODHD daily historical price API and adjustment basis"
[7]: https://eodhd.com/financial-apis/api-splits-dividends "EODHD dividends history, amounts, dates and Indian coverage limitations"
[8]: https://eodhd.com/financial-apis/exchanges-api-list-of-tickers-and-trading-hours "EODHD exchange symbol-list API and ISIN fields"
[9]: https://eodhd.com/pricing "EODHD current personal plan prices, quotas and feed entitlements"
[10]: https://eodhd.com/financial-apis/commercial-vs-personal-license-use "EODHD commercial versus personal licensing"
[11]: https://eodhd.com/financial-academy/how-to-get-stocks-data-examples/eod-historical-data-api-python-library-overview "EODHD original BSE bulk-symbol and numeric 500209.BSE price examples"
[12]: https://eodhd.com/financial-apis/live-ohlcv-stocks-api "EODHD delayed global quote API and 15–20-minute stock delay"
[13]: https://indianapi.in/documentation/indian-stock-market "IndianAPI stock response, BSE price field and historical-data limitations"
[14]: https://indianapi.in/indian-stock-market "IndianAPI rendered OpenAPI authentication, endpoint catalogue and plan server mapping"
[15]: https://indianapi.in/legal/terms "IndianAPI general terms, integration permission and no warranty"
[16]: https://www.bseindia.com/markets/marketinfo/bhavcopy "BSE original Bhav Copy page, UDiFF help and old-format discontinuation"
[17]: https://www.bseindia.com/corporates/corporates_act "BSE original public corporate actions page and dividend purposes"
[18]: https://www.bseindia.com/marketdata-products "BSE official licensed market data, corporate actions and secure delivery products"
[19]: https://upstox.com/developer/api-documentation/rate-limiting "Upstox standard API rate limits"
