# BSE High Yield

- [x] Inspect inherited SGX code and preserve useful dashboard behavior while replacing Singapore securities, exchange identifiers, SGD formatting, tax claims, labels and datasets with real BSE shares and INR. Active source scan contains no SGX quote/data path.
- [ ] Research and integrate an API for BSE shares; document credentials, coverage, rate limits and live-versus-delayed status. Calculate trailing dividend yield with missing values and provenance shown explicitly. **Adapter and documentation are implemented and tested; authenticated activation needs the user's read-only Analytics Token, permitted public display/redistribution, and confirmed dividend-history coverage.**
- [x] Update repository description/topics and dashboard metadata to BSE high-yield data.
- [ ] Configure GitHub Actions to refresh the dataset daily with secure credentials and visible failures. **Daily workflow implemented at 18:15 IST; remote registration is being verified. Authenticated refresh is blocked until the token and required repository variables are configured.**
- [x] Display a responsive working dashboard in Preview. Health, route manifest and BSE snapshot endpoint passed; browser rendering checked.
- [ ] Produce an Android-installable APK preserving the dashboard and its data refresh behavior. **Native build and signature checks passed; final bundle is being rebuilt after stale-yield and native-print corrections.**
- [x] Show prominent source, freshness, missing-dividend and API-setup disclosures. No fabricated financial values or misleading tax/security claims.
