#!/usr/bin/env python3
"""Read-only Upstox BSE snapshot updater. No trading endpoints or third-party scraping."""
from __future__ import annotations
import argparse
import calendar
from datetime import date, datetime, timedelta, timezone
import gzip
import json
import math
import os
from pathlib import Path
import re
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_URL = 'https://assets.upstox.com/market-quote/instruments/exchange/BSE.json.gz'
API_ROOT = 'https://api.upstox.com/v2'
IST = ZoneInfo('Asia/Kolkata')
SYMBOLS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'ITC', 'HINDUNILVR', 'SBIN', 'LT', 'HCLTECH', 'POWERGRID', 'NTPC', 'COALINDIA', 'ONGC', 'TATASTEEL', 'IOC', 'BPCL', 'GAIL', 'VEDL', 'HINDZINC']
METHODOLOGY = ('TTM ex-dividend yield = INR cash dividends per share with asOf minus 12 calendar months < ex-date <= quote observation date, divided by the unadjusted BSE last trade price, times 100. Ordinary and special cash dividends included; future events excluded. Upstox does not guarantee complete history or current-share adjustment. TTM is withheld unless the user confirms coverage, or reported action history extends before the cutoff with at least one qualifying dividend; the latter is reported-history TTM, not guaranteed complete TTM. Empty/unverified history is never assumed zero. Splits/bonus or malformed dividend events in the window withhold TTM and yield. Stale prices withhold yield. No exchange-authorized live-feed or investment-recommendation claim. EOD status means a dated last-trade snapshot outside the freshness window, not a verified final settlement close. Sector is unclassified because the instrument registry does not supply sector.')
METHODOLOGY = METHODOLOGY.replace('unless the user confirms coverage, or reported action history extends before the cutoff with at least one qualifying dividend; the latter is reported-history TTM, not guaranteed complete TTM', 'unless UPSTOX_DIVIDEND_HISTORY_CONFIRMED=true following an explicit coverage review; displayed events alone do not establish complete history')

class DataError(Exception):
    """Messages must be fixed/sanitized, never raw provider responses or URLs."""


def utcnow():
    return datetime.now(timezone.utc)


def iso(dt):
    return dt.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')


def number(value, positive=False):
    if isinstance(value, bool) or value is None:
        return None
    try:
        result = float(value)
    except (ValueError, TypeError, OverflowError):
        return None
    if not math.isfinite(result) or result < 0 or (positive and result <= 0):
        return None
    return result


def timestamp(value):
    """Support ISO, Unix seconds and milliseconds; naive ISO is not trusted."""
    if value is None or isinstance(value, bool):
        return None
    try:
        if isinstance(value, (int, float)) or (isinstance(value, str) and re.fullmatch(r'\d+(?:\.\d+)?', value.strip())):
            epoch = float(value)
            if epoch > 100000000000:
                epoch /= 1000
            dt = datetime.fromtimestamp(epoch, timezone.utc)
        else:
            dt = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
            if dt.tzinfo is None:
                return None
        if dt.year < 2000 or dt.year > 2100:
            return None
        return dt.astimezone(timezone.utc)
    except (ValueError, TypeError, OverflowError, OSError):
        return None


def event_date(value):
    if not isinstance(value, str):
        return None
    for fmt in ('%Y-%m-%d', '%d %b %Y', '%d %B %Y', '%d-%m-%Y'):
        try:
            return datetime.strptime(value.strip(), fmt).date()
        except ValueError:
            pass
    return None


def cutoff(asof):
    return date(asof.year - 1, asof.month, min(asof.day, calendar.monthrange(asof.year - 1, asof.month)[1]))


def quote_status(price, observed, now):
    if price is None or observed is None or observed > now + timedelta(minutes=2):
        return 'unavailable'
    if now - observed > timedelta(days=4):
        return 'stale'
    local, trade = now.astimezone(IST), observed.astimezone(IST)
    # No holiday calendar is asserted. Only recent actual trades can be live.
    market_hours = local.weekday() < 5 and (9, 15) <= (local.hour, local.minute) < (15, 30)
    if market_hours and local.date() == trade.date():
        if now - observed < timedelta(minutes=15):
            return 'live'
        if now - observed < timedelta(minutes=60):
            return 'delayed'
    return 'eod'


def request_json(path, token):
    if not token:
        raise DataError('UPSTOX_ANALYTICS_TOKEN is missing; configure a read-only Analytics Token.')
    # Only these two read-only URL families can be used.
    if not (path.startswith('/market-quote/quotes?') or re.fullmatch(r'/fundamentals/[A-Z0-9]{12}/corporate-actions', path)):
        raise DataError('Unsupported read-only provider path.')
    req = urllib.request.Request(API_ROOT + path, headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            raw = response.read(8 * 1024 * 1024 + 1)
        if len(raw) > 8 * 1024 * 1024:
            raise DataError('Provider response exceeded the size limit.')
        result = json.loads(raw)
    except urllib.error.HTTPError as err:
        raise DataError(f'Upstox request failed (HTTP {err.code}); check token, entitlement or rate limits.') from None
    except (urllib.error.URLError, TimeoutError, OSError):
        raise DataError('Upstox request failed: network or timeout.') from None
    except (ValueError, UnicodeError):
        raise DataError('Upstox returned invalid JSON.') from None
    if not isinstance(result, dict) or result.get('status') != 'success' or 'data' not in result:
        raise DataError('Upstox response schema/status is invalid.')
    return result['data']


def atomic_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w', dir=path.parent, delete=False, encoding='utf-8') as out:
        temp = Path(out.name)
        json.dump(data, out, ensure_ascii=False, indent=2, allow_nan=False)
        out.write('\n')
    temp.replace(path)


def make_universe(registry, downloaded_at):
    if not isinstance(registry, list):
        raise DataError('Instrument registry must be a JSON array.')
    entries = {}
    for record in registry:
        if not isinstance(record, dict):
            continue
        symbol = record.get('trading_symbol')
        if record.get('segment') == 'BSE_EQ' and record.get('instrument_type') == 'A' and symbol in SYMBOLS:
            isin = record.get('isin', '')
            code = str(record.get('exchange_token', ''))
            if not re.fullmatch(r'IN[A-Z0-9]{10}', isin) or not re.fullmatch(r'\d{6}', code) or record.get('instrument_key') != 'BSE_EQ|' + isin:
                raise DataError('Registry identifier validation failed.')
            if symbol in entries:
                raise DataError('Registry contains ambiguous equity mapping.')
            entries[symbol] = {'ticker': symbol, 'bseCode': code, 'isin': isin, 'instrumentKey': record['instrument_key'], 'name': record['name'], 'sector': 'Unclassified', 'segment': 'BSE_EQ', 'instrumentType': 'A'}
    if len(entries) != len(SYMBOLS):
        raise DataError('Registry is missing a selected BSE group-A instrument.')
    return {'schemaVersion': 1, 'source': REGISTRY_URL, 'downloadedAt': downloaded_at, 'selection': 'Recognizable dividend candidates selected by symbol from the bulk registry; not a yield ranking or investment recommendation. Names are verbatim provider registry names and may be truncated.', 'stocks': [entries[s] for s in SYMBOLS]}


def seed_stock(item):
    return {key: item[key] for key in ('ticker', 'bseCode', 'isin', 'name', 'sector')} | {'price': None, 'previousClose': None, 'dayChange': None, 'dayChangePercent': None, 'currency': 'INR', 'dividendTTM': None, 'yieldPercent': None, 'dividends': [], 'quoteAsOf': None, 'source': 'Upstox BSE instrument registry; quotes/dividends unavailable', 'dataStatus': 'unavailable', 'dividendStatus': 'unavailable', 'volume': None, 'marketCap': None, 'fiftyTwoWeekHigh': None, 'fiftyTwoWeekLow': None}


def initial_snapshot(universe):
    stocks = [seed_stock(s) for s in universe['stocks']]
    announcements = read_json(ROOT / 'public/data/bse-announcements.json', {})
    for stock in stocks:
        for event in announcements.get('events', []):
            if event.get('bseCode') == stock['bseCode'] and event.get('currency') == 'INR' and event_date(event.get('date')) and number(event.get('amount'), positive=True) is not None:
                stock['dividends'].append({key: event[key] for key in ('date', 'amount', 'currency', 'kind', 'paymentDate') if key in event})
                stock['source'] = 'Upstox BSE instrument registry; selected BSE public corporate-action announcements (partial history)'
    return {'schemaVersion': 1, 'generatedAt': None, 'market': 'BSE', 'currency': 'INR', 'provider': 'Upstox instrument registry / BSE selected announcements', 'status': 'unavailable', 'message': 'Instrument identifiers are verified against the Upstox BSE registry. Selected real BSE announcements are partial history only; future announced ex-dates may be displayed but are excluded from TTM. No authenticated quotes have been fetched. Configure the read-only Analytics Token and confirm public display/redistribution rights before publishing provider data.', 'stocks': stocks, 'errors': ['Provider credentials and public data rights are not configured.'], 'methodology': METHODOLOGY}


def normalize_actions(actions):
    if not isinstance(actions, list):
        raise DataError('Corporate-actions data must be an array.')
    dividends, action_dates, unsafe_dates, history_dates = [], [], [], []
    seen = set()
    for action in actions:
        if not isinstance(action, dict):
            unsafe_dates.append(None)
            continue
        details = {}
        for detail in action.get('event_details', []) if isinstance(action.get('event_details', []), list) else []:
            if isinstance(detail, dict) and isinstance(detail.get('name'), str):
                details[detail['name'].lower().strip()] = str(detail.get('value', ''))
        name = str(action.get('name', '')).lower().strip()
        exdate = event_date(details.get('ex dividend date') or details.get('ex-dividend date') or action.get('expiry_date'))
        if exdate:
            history_dates.append(exdate.isoformat())
        if name in ('split', 'bonus'):
            action_dates.append(exdate.isoformat() if exdate else None)
        if name != 'dividend':
            continue
        text = details.get('details', '')
        # Explicit foreign currency, non-cash/preference or no INR-per-share evidence: reject.
        unit_ok = bool(re.search(r'(?:\brs\.?|\binr\b|₹)', text, re.I)) and bool(re.search(r'per\s+(?:equity\s+)?share', text, re.I))
        excluded = bool(re.search(r'\b(?:USD|SGD|EUR|GBP|preference|return of capital|distribution|non.cash)\b|\$', text, re.I))
        amount = number(action.get('amount'), positive=True)
        if amount is None:
            amount = number(details.get('amount'), positive=True)
        cash_match = re.search(r'(?:\brs\.?|\binr\b|₹)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:/-\s*)?per\s+(?:equity\s+)?share', text, re.I)
        if cash_match:
            explicit = number(cash_match.group(1), positive=True)
            if amount is not None and explicit is not None and abs(amount - explicit) > 0.0001:
                unsafe_dates.append(exdate.isoformat() if exdate else None)
                continue
            amount = explicit
        if not exdate or amount is None or not unit_ok or excluded or (not cash_match and '%' in details.get('amount', '')):
            unsafe_dates.append(exdate.isoformat() if exdate else None)
            continue
        kind = details.get('dividend type', 'Cash')
        key = (exdate.isoformat(), amount, kind)
        if key not in seen:
            seen.add(key)
            dividends.append({'date': exdate.isoformat(), 'amount': amount, 'currency': 'INR', 'paymentDate': None, 'kind': kind})
    return {'dividends': sorted(dividends, key=lambda d: d['date'], reverse=True), 'adjustmentDates': action_dates, 'unsafeDates': unsafe_dates, 'historyDates': history_dates, 'success': True}


def compute_ttm(history, asof, confirmed=False):
    if not confirmed or not isinstance(history, dict) or history.get('success') is not True or asof is None:
        return None
    start = cutoff(asof)
    def affected(raw):
        d = event_date(raw)
        return d is None or start < d <= asof
    if any(affected(d) for d in history.get('adjustmentDates', [])) or any(affected(d) for d in history.get('unsafeDates', [])):
        return None
    events = [d for d in history.get('dividends', []) if d.get('currency') == 'INR' and event_date(d.get('date')) and start < event_date(d['date']) <= asof and number(d.get('amount'), positive=True) is not None]
    return math.fsum(d['amount'] for d in events)


def build_snapshot(universe, quotes, histories, now, confirmed=False, errors=None):
    if not isinstance(quotes, dict):
        raise DataError('Quote data must be an object.')
    mapped = {v.get('instrument_token'): v for v in quotes.values() if isinstance(v, dict)}
    stocks = []
    errors = list(errors or [])
    for item in universe['stocks']:
        stock = seed_stock(item)
        quote = mapped.get(item['instrumentKey'], {})
        price = number(quote.get('last_price'), positive=True)
        # Price is a last trade: never substitute a fresh request/feed timestamp for last_trade_time.
        observed = timestamp(quote.get('last_trade_time'))
        status = quote_status(price, observed, now)
        if status == 'unavailable':
            price = None
            observed = None
            errors.append(item['ticker'] + ': quote missing, malformed or lacking valid last-trade time.')
        previous = number(quote.get('ohlc', {}).get('close'), positive=True) if isinstance(quote.get('ohlc'), dict) else None
        change = price - previous if price is not None and previous is not None else None
        history = histories.get(item['isin'], {})
        dividend_events = history.get('dividends', []) if history.get('success') else []
        asof = observed.astimezone(IST).date() if observed else None
        ttm = compute_ttm(history, asof, confirmed)
        stock.update(price=price, previousClose=previous, dayChange=change, dayChangePercent=(100 * change / previous if change is not None else None), quoteAsOf=iso(observed) if observed else None, dataStatus=status, volume=number(quote.get('volume')), source='Upstox BSE quotes and corporate actions' if history.get('success') else 'Upstox BSE quotes; dividend history unavailable', dividends=dividend_events, dividendStatus='available' if history.get('success') and (dividend_events or confirmed) else 'unavailable', dividendTTM=ttm, yieldPercent=100 * ttm / price if ttm is not None and price is not None and status != 'stale' else None)
        stocks.append(stock)
    states = [s['dataStatus'] for s in stocks]
    valid = [s for s in states if s != 'unavailable']
    status = 'unavailable' if not valid else ('stale' if 'stale' in valid else ('eod' if 'eod' in valid else ('delayed' if 'delayed' in valid else 'live')))
    missing = sum(s == 'unavailable' for s in states)
    return {'schemaVersion': 1, 'generatedAt': iso(now), 'market': 'BSE', 'currency': 'INR', 'provider': 'Upstox', 'status': status, 'message': f'Upstox BSE last-trade snapshot; {missing} of {len(stocks)} prices unavailable. TTM is withheld until dividend-history coverage is explicitly confirmed; null means unknown, not zero. See methodology. Not an official BSE exchange feed.', 'stocks': stocks, 'errors': errors, 'methodology': METHODOLOGY}


def read_json(path, default=None):
    try:
        return json.loads(Path(path).read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return default


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default=str(ROOT / 'public/data/bse-high-yield.json'))
    parser.add_argument('--universe', default=str(ROOT / 'public/data/bse-universe.json'))
    parser.add_argument('--cache', default=str(ROOT / '.cache/bse-actions.json'))
    parser.add_argument('--quotes-only', action='store_true', help='Never request corporate actions; use the private daily cache.')
    parser.add_argument('--refresh-universe', action='store_true')
    parser.add_argument('--seed', action='store_true', help='Write identifier-only null snapshot without credentials.')
    parser.add_argument('--public-output', action='store_true', help='Require affirmative public redistribution permission.')
    args = parser.parse_args()
    try:
        if args.refresh_universe:
            try:
                with urllib.request.urlopen(REGISTRY_URL, timeout=30) as response:
                    registry = json.loads(gzip.decompress(response.read()))
                universe = make_universe(registry, iso(utcnow()))
            except (OSError, ValueError):
                raise DataError('Public registry download failed.') from None
            atomic_json(args.universe, universe)
        universe = read_json(args.universe)
        if not isinstance(universe, dict) or not isinstance(universe.get('stocks'), list):
            raise DataError('BSE universe is absent or malformed; refresh the documented registry.')
        if args.seed:
            if Path(args.output).exists():
                raise DataError('Seed refuses to overwrite an existing snapshot.')
            atomic_json(args.output, initial_snapshot(universe))
            print('Identifier-only unavailable snapshot created; no prices or yields invented.')
            return 0
        # Default output is public, regardless of whether --public-output is passed.
        public_dir = (ROOT / 'public').resolve()
        is_public = Path(args.output).resolve().is_relative_to(public_dir)
        if (args.public_output or is_public) and os.getenv('BSE_PUBLIC_DATA_REDISTRIBUTION_CONFIRMED', '').lower() != 'true':
            raise DataError('Public output blocked: confirm permitted display/redistribution and set BSE_PUBLIC_DATA_REDISTRIBUTION_CONFIRMED=true.')
        token = os.getenv('UPSTOX_ANALYTICS_TOKEN', '').strip()
        if not token:
            raise DataError('UPSTOX_ANALYTICS_TOKEN is missing; last successful snapshot was not overwritten.')
        now = utcnow()
        params = urllib.parse.urlencode({'instrument_key': ','.join(s['instrumentKey'] for s in universe['stocks'])})
        quotes = request_json('/market-quote/quotes?' + params, token)
        cache = read_json(args.cache, {})
        histories = cache.get('histories', {}) if isinstance(cache, dict) else {}
        today = now.astimezone(IST).date().isoformat()
        errors = []
        if not args.quotes_only and cache.get('attemptDate') != today:
            histories = {}
            for item in universe['stocks']:
                try:
                    history = normalize_actions(request_json('/fundamentals/' + item['isin'] + '/corporate-actions', token))
                    history['fetchedAt'] = iso(now)
                    histories[item['isin']] = history
                except DataError as err:
                    errors.append(item['ticker'] + ': ' + str(err))
            atomic_json(args.cache, {'attemptDate': today, 'histories': histories})
        # Private cache is only valid for a daily cycle. No silent use of old history.
        if cache.get('attemptDate') != today and args.quotes_only:
            histories = {}
            errors.append('Daily dividend cache unavailable; quotes-only request withheld dividend calculations.')
        confirmed = os.getenv('UPSTOX_DIVIDEND_HISTORY_CONFIRMED', '').lower() == 'true'
        snapshot = build_snapshot(universe, quotes, histories, now, confirmed, errors)
        if snapshot['status'] in ('unavailable', 'stale'):
            raise DataError('No sufficiently fresh usable BSE snapshot; last successful output was not overwritten.')
        atomic_json(args.output, snapshot)
        print(f"BSE snapshot updated: {len(snapshot['stocks'])} instruments, status {snapshot['status']}; {len(snapshot['errors'])} sanitized data warnings.")
        return 0
    except DataError as err:
        print('BSE update failed: ' + str(err), file=sys.stderr)
        return 1
    except Exception:
        print('BSE update failed: malformed input or unexpected provider/runtime failure; output preserved.', file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())
