import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkoutLink} from '../src/features/donations/types.ts';

test('checkout links accept provider HTTPS and the local mock checkout', () => {
    assert.equal(checkoutLink('https://pay.payos.vn/example'), 'https://pay.payos.vn/example');
    assert.equal(checkoutLink('/dev/mock-payments/123'), '/dev/mock-payments/123');
});

test('checkout links reject scripts, credentials and disguised outside paths', () => {
    for (const link of ['javascript:alert(1)', 'https://user:secret@example.test', '//evil.test', '/\\evil.test'])
        assert.equal(checkoutLink(link), null);
});
