import importlib.util
from datetime import date, datetime, timedelta, timezone
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('provider', ROOT / 'scripts/update_bse_data.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def dividend(d='03 Nov 2026', amount=5.5, text='Rs.5.5000 per share', kind='Final'):
    return {'name': 'Dividend', 'expiry_date': d, 'amount': amount, 'event_details': [{'name': 'Ex dividend date', 'value': d}, {'name': 'Dividend type', 'value': kind}, {'name': 'Details', 'value': text}]}


class ProviderTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 3, 6, 0, tzinfo=timezone.utc)
        self.universe = json.loads((ROOT / 'public/data/bse-universe.json').read_text())

    def test_real_group_a_universe(self):
        self.assertEqual(len(self.universe['stocks']), 20)
        for s in self.universe['stocks']:
            self.assertEqual(s['segment'], 'BSE_EQ')
            self.assertEqual(s['instrumentType'], 'A')
            self.assertEqual(s['instrumentKey'], 'BSE_EQ|' + s['isin'])

    def test_epoch_and_iso_normalization(self):
        epoch = self.now.timestamp()
        for value in (epoch, epoch * 1000, str(int(epoch * 1000)), m.iso(self.now)):
            self.assertEqual(m.timestamp(value), self.now)
        for bad in (None, True, 'yesterday', '2026-11-03T06:00:00', 1e30):
            self.assertIsNone(m.timestamp(bad))

    def test_calendar_year_boundary(self):
        self.assertEqual(m.cutoff(date(2024, 2, 29)), date(2023, 2, 28))
        actions = [dividend('03 Nov 2025', 1, 'Rs.1 per share'), dividend('04 Nov 2025', 2, 'INR 2 per share'), dividend('03 Nov 2026', 3, 'Rs.3 per share'), dividend('04 Nov 2026', 4, 'Rs.4 per share')]
        h = m.normalize_actions(actions)
        self.assertEqual(m.compute_ttm(h, date(2026, 11, 3), True), 5)
        self.assertIsNone(m.compute_ttm(h, date(2026, 11, 3), False))

    def test_empty_unknown_is_not_zero(self):
        h = m.normalize_actions([])
        self.assertIsNone(m.compute_ttm(h, date(2026, 11, 3)))
        self.assertEqual(m.compute_ttm(h, date(2026, 11, 3), True), 0)

    def test_reject_currency_and_percentage(self):
        for text in ('USD 5.5 per share', 'Dividend 550%', 'Rs.5.5 per preference share', 'Rs.5.5 per share USD'):
            h = m.normalize_actions([dividend(text=text)])
            self.assertEqual(h['dividends'], [])
            self.assertIsNone(m.compute_ttm(h, date(2026, 11, 3), True))
        self.assertEqual(m.normalize_actions([dividend()])['dividends'][0]['amount'], 5.5)

    def test_split_bonus_withhold(self):
        for name in ('Split', 'Bonus'):
            h = m.normalize_actions([dividend(), {'name': name, 'expiry_date': '10 Jun 2026'}])
            self.assertIsNone(m.compute_ttm(h, date(2026, 11, 3), True))
            h = m.normalize_actions([dividend(), {'name': name, 'expiry_date': '10 Jun 2025'}])
            self.assertEqual(m.compute_ttm(h, date(2026, 11, 3), True), 5.5)
        h = m.normalize_actions([dividend(), {'name': 'Split'}])
        self.assertIsNone(m.compute_ttm(h, date(2026, 11, 3), True))

    def test_events_duplicate_and_malformed(self):
        h = m.normalize_actions([dividend(), dividend()])
        self.assertEqual(len(h['dividends']), 1)
        with self.assertRaises(m.DataError):
            m.normalize_actions({'not': 'array'})
        for amount in (True, float('nan'), float('inf'), -2, None):
            h = m.normalize_actions([dividend(amount=amount, text='INR dividend per share')])
            self.assertEqual(h['dividends'], [])

    def test_quote_observation_not_fetch_timestamp(self):
        stock = self.universe['stocks'][0]
        quote = {'instrument_token': stock['instrumentKey'], 'last_price': 100, 'last_trade_time': int(self.now.timestamp() * 1000), 'timestamp': m.iso(self.now), 'ohlc': {'close': 80}, 'volume': 0}
        histories = {stock['isin']: m.normalize_actions([dividend()])}
        s = m.build_snapshot(self.universe, {'any:response-key': quote}, histories, self.now, True)['stocks'][0]
        self.assertEqual((s['price'], s['dayChange'], s['dayChangePercent'], s['yieldPercent']), (100, 20, 25, 5.5))
        self.assertEqual(s['volume'], 0)
        self.assertEqual(s['dataStatus'], 'live')
        quote.pop('last_trade_time')
        s = m.build_snapshot(self.universe, {'x': quote}, histories, self.now, True)['stocks'][0]
        self.assertIsNone(s['price'])
        self.assertIsNone(s['yieldPercent'])

    def test_freshness_and_closed_market(self):
        self.assertEqual(m.quote_status(100, self.now - timedelta(days=5), self.now), 'stale')
        self.assertEqual(m.quote_status(100, self.now - timedelta(minutes=20), self.now), 'delayed')
        self.assertEqual(m.quote_status(100, self.now - timedelta(days=1), self.now), 'eod')
        closed = self.now.replace(hour=14)
        self.assertEqual(m.quote_status(100, closed - timedelta(minutes=1), closed), 'eod')
        self.assertEqual(m.quote_status(100, self.now + timedelta(hours=1), self.now), 'unavailable')

    def test_seed_nulls_partial_events(self):
        seed = m.initial_snapshot(self.universe)
        self.assertIsNone(seed['generatedAt'])
        for stock in seed['stocks']:
            self.assertIsNone(stock['price'])
            self.assertIsNone(stock['yieldPercent'])
            self.assertIsNone(stock['dividendTTM'])
            self.assertEqual(stock['dividendStatus'], 'unavailable')

    def test_error_never_leaks_credentials(self):
        secret = 'SENSITIVE-ANALYTICS-TOKEN'
        error = urllib.error.HTTPError('https://example.test/?token=' + secret, 401, secret, {}, io.BytesIO(secret.encode()))
        with patch('urllib.request.urlopen', side_effect=error):
            with self.assertRaises(m.DataError) as ctx:
                m.request_json('/market-quote/quotes?instrument_key=test', secret)
        self.assertNotIn(secret, str(ctx.exception))
        self.assertIn('401', str(ctx.exception))
        with self.assertRaises(m.DataError):
            m.request_json('/order/place', secret)

    def test_missing_token_preserves_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / 'snapshot.json'
            p.write_text('{"preserved":true}')
            with patch.dict('os.environ', {'UPSTOX_ANALYTICS_TOKEN': ''}):
                result = subprocess.run(['python3', str(ROOT / 'scripts/update_bse_data.py'), '--output', str(p)], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(p.read_text(), '{"preserved":true}')

    def test_public_rights_gate(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / 'snapshot.json'
            p.write_text('{"preserved":true}')
            secret = 'DO-NOT-LOG-THIS-TOKEN'
            result = subprocess.run(['python3', str(ROOT / 'scripts/update_bse_data.py'), '--public-output', '--output', str(p)], capture_output=True, text=True, env={**__import__('os').environ, 'UPSTOX_ANALYTICS_TOKEN': secret, 'BSE_PUBLIC_DATA_REDISTRIBUTION_CONFIRMED': 'false'})
            self.assertNotEqual(result.returncode, 0)
            self.assertNotIn(secret, result.stdout + result.stderr)
            self.assertIn('Public output blocked', result.stderr)
            self.assertEqual(p.read_text(), '{"preserved":true}')

    def test_bad_response_schema(self):
        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def read(self, *args): return b'{"status":"success","unexpected":[]}'
        with patch('urllib.request.urlopen', return_value=Response()):
            with self.assertRaises(m.DataError):
                m.request_json('/market-quote/quotes?instrument_key=test', 'not-logged')


if __name__ == '__main__':
    unittest.main()
