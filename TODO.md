# BSE High Yield

- [x] Inspect inherited SGX code and preserve useful dashboard behavior while replacing Singapore securities, exchange identifiers, SGD formatting, tax claims, labels and datasets with real BSE shares and INR. Active source scan contains no SGX quote/data path.
- [ ] Research and integrate an API for BSE shares; document credentials, coverage, rate limits and live-versus-delayed status. Calculate trailing dividend yield with missing values and provenance shown explicitly. **Adapter and documentation are implemented and tested; authenticated activation needs the user's read-only Analytics Token, permitted public display/redistribution, and confirmed dividend-history coverage.**
- [x] Update repository description/topics and dashboard metadata to BSE high-yield data.
- [ ] Configure GitHub Actions to refresh the dataset daily with secure credentials and visible failures. **Daily workflow registered and active on GitHub at 18:15 IST. Authenticated refresh remains blocked until the token and required repository variables are configured.**
- [x] Display a responsive working dashboard in Preview. Health, route manifest and BSE snapshot endpoint passed; browser rendering checked.
- [x] Produce an Android-installable APK preserving the dashboard and its data refresh behavior. **Final debug-signed APK built, linted and signature-verified. Bundled HTML/JavaScript/data match the final build. Android 8.0+; Internet-only permission; CSV supported and web-only PDF printing clearly disabled in native mode. No physical-device test is claimed.**
- [x] Show prominent source, freshness, missing-dividend and API-setup disclosures. No fabricated financial values or misleading tax/security claims.
