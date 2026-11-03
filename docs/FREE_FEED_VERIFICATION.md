**Upstox is a verified free, account-based choice for the app's BSE quote adapter.** Its official pages state that both market-data APIs and the one-year read-only Analytics Token cost ₹0. The existing `LiveBSEhighYield` adapter already uses its documented BSE instrument keys, quote endpoint and INR formatting. No paid data subscription is needed for that API access, but an account-owner credential is still required. No authenticated BSE price was retrieved during this recheck because a token was not supplied. [1] [2] [3]

Rechecked: 3 November 2026. Author: Manus AI.

## Activating the free provider

Generate the token in Upstox Developer Apps → Analytics and supply it through protected environment input or the repository's Actions secret `UPSTOX_ANALYTICS_TOKEN`. Do not put it in chat, public Git files or the Android app. The documented read-only token lasts one year and requires no static IP for market quotes, fundamentals or WebSockets. The app does not place trades. API access is free; account-related charges and permission to display or redistribute exchange data publicly are separate matters. [1] [2]

Before public display, confirm the applicable provider/exchange permissions and set `BSE_PUBLIC_DATA_REDISTRIBUTION_CONFIRMED=true`. Without complete validated dividend history, quotes may become available while trailing dividend yield remains unknown. The existing history-confirmation safeguard is retained; the request for a free price feed is not permission to invent dividends.

## Anonymous alternatives were not verified

The community `0xramm/Indian-Stock-Market-API` advertises free anonymous BSE/NSE prices, but its source uses unofficial Yahoo quote endpoints and a cookie/crumb handshake rather than an independent documented BSE feed. Its inspected README does not supply a hosted API base URL, and its code defaults missing currency to INR. Those facts are not evidence of a working, genuinely live INR quote service. It was not used. The other reviewed client libraries either wrap the already-blocked BSE website service or document localhost installation only. No working anonymous live BSE option was established. [4] [5]

NSE's official no-auth MCP is a real public interface, but its coverage is NSE rather than BSE and its documentation states a 1–3 minute delay. Substituting it would fail the requested exchange and strict live-data requirements. [6]

Dhan's official support page requires a ₹499-plus-tax monthly Data API subscription for live feeds and quote snapshots. Twelve Data's free Basic plan covers real-time US stocks and trial international symbols, while its India coverage is shown as end-of-day data in paid tiers. Neither was substituted as a free live BSE feed. [7] [8]

## Existing APK workflow correction

The cloud APK build failed before compiling the app because `setup-android@v3` requested Google's discontinued SDK `tools` package. The workflow was corrected to the documented `setup-android@v4` with explicit `packages: platform-tools`. This does not invalidate the separately compiled, linted and signature-verified local APK. Successful cloud execution is not claimed until a new run completes. [9]

## References

[1]: https://upstox.com/trading-api/ "Upstox ₹0 trading and market-data API access"
[2]: https://upstox.com/developer/api-documentation/analytics-token/ "Free one-year read-only Analytics Token and supported APIs"
[3]: https://upstox.com/developer/api-documentation/get-full-market-quote "Documented Upstox BSE market quote endpoint"
[4]: https://github.com/0xramm/Indian-Stock-Market-API "Community no-key API claims and local setup"
[5]: https://raw.githubusercontent.com/0xramm/Indian-Stock-Market-API/main/src/yahoo.js "Community API's unofficial upstream and currency fallback"
[6]: https://www.nseindia.com/nse-mcp "Official NSE MCP exchange coverage and stated delay"
[7]: https://dhan.co/support/platforms/dhanhq-api/how-can-i-access-live-market-data-through-dhan/ "Dhan live-data subscription fee"
[8]: https://twelvedata.com/stocks "Twelve Data free US coverage and Indian EOD tier"
[9]: https://github.com/android-actions/setup-android "Supported SDK setup and deprecated tools package"
