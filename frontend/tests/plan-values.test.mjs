import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults, payload} from '../src/features/campaigns/planValues.ts';

test('editing a campaign preserves funding and budget supplied by the server', () => {
    const stored = {institutionalFunding: '250000', sponsorFunding: '900000',
        sponsorName: 'Student sponsor', estimatedBudget: '1150000'};
    const form = defaults(stored);
    form.title = 'Updated campaign title';
    const result = payload(form);
    for (const field of Object.keys(stored)) assert.equal(result[field], stored[field]);
});

test('new campaigns use zero funding without inventing sponsor data', () => {
    const result = payload(defaults());
    assert.equal(result.institutionalFunding, '0');
    assert.equal(result.sponsorFunding, '0');
    assert.equal(result.sponsorName, null);
    assert.equal(result.estimatedBudget, null);
});

test('form keeps unchanged fundraising deadline and exact VND strings', () => {
    const content = {contributionMode: 'DONATION_ONLY', fundraisingGoal: '9999999999999999999',
        fundraisingDeadline: '2026-12-01T03:30:00Z'};
    const result = payload(defaults(content), content);
    assert.equal(result.fundraisingGoal, content.fundraisingGoal);
    assert.equal(result.fundraisingDeadline, content.fundraisingDeadline);
});
