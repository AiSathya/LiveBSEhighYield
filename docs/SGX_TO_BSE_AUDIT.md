# SGX-to-BSE audit

The copied source contained Singapore stock identifiers, a `.SI` Yahoo quote map, SGX API routes, SGD formatting, fixed Singapore market metrics, extensive hardcoded dividend histories and schedules, default Singapore portfolio holdings, Singapore tax language, and SGX-branded report/calendar exports.

The BSE adaptation replaces the Singapore security dataset with real BSE security-code/ISIN mappings from Upstox's published instrument registry. The inherited unofficial Yahoo endpoint is removed in favour of documented, credentialed Upstox read-only APIs. BSE routes and the normalized snapshot schema are used throughout the frontend and updater. India time and INR replace Singapore locale and SGD.

The old illustrative dividend histories, future payout forecasts, health scores, benchmark levels and prefilled portfolio balances are removed rather than relabelled as Indian company data. Dividend dates and monetary amounts must come from a provider response or an explicitly attributed BSE announcement. Partial announcement data is not treated as a complete year of dividends.

The UI's useful rankings, dividend views, filtering, portfolio calculations and export features are retained in a smaller BSE-specific component structure. Missing or unverified fields display as unavailable. The previous tax-free Singapore claim is replaced by a qualified note about Indian income-tax/TDS applicability; no fixed tax rate is applied to portfolio projections.

The inherited local PIN/biometric 'vault' claims are not carried over as a promise of encryption or native biometric protection. User-entered portfolio data stays in local browser/app storage and is labelled as a planner, not a secure account balance.

Repository description, topics, HTML title/description, application metadata and export labels now refer to BSE High Yield. Historical SGX references in migration documentation and the original Git history are intentional and do not represent an active SGX data path.
