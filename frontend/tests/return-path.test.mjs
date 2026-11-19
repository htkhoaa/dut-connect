import {test} from 'node:test';
import assert from 'node:assert/strict';
import {returnPath} from '../src/features/auth/returnPath.ts';

const origin = 'https://example.test';

test('login keeps the QR check-in token and payment return parameters', () => {
    for (const path of ['/attendance/checkin?token=abc', '/payment/result?donationId=123', '/admin/payouts'])
        assert.equal(returnPath(path, origin), path);
});

test('login rejects outside domains and login loops', () => {
    for (const path of ['https://evil.test', '//evil.test', '/\\evil.test', '/login', '/login-admin?from=x', undefined])
        assert.equal(returnPath(path, origin), undefined);
});
