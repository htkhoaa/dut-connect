# Phase 8 audit

Audited against the complete `spec.md`, with particular attention to section 19, architecture and coding constraints, UI requirements, and the Phase 8 exit criterion. Inspected the finance implementation, campaign funding validation and ports, donation aggregate queries, security rules, frontend forms/routes/cache invalidation, SQL migrations, Docker configuration and actual build/runtime results. Phase 9 was not started. No automated test suite was introduced; verification used manual runtime workflows and rollback probes in ignored `.verification` files. `.env` is unchanged.

## Findings and corrections

1. **Nonfinite database money could corrupt aggregate reads.** PostgreSQL numeric NaN satisfies the existing positive/nonnegative checks; rollback probes reproduced acceptance in expense, donation and declared funding columns. Added V14 checks excluding NaN from expense/donation/payment amounts and all campaign/proposal funding fields. Nullable goals/budgets remain nullable. V14 also rejects whitespace-only rejected-expense reasons, including tabs/newlines. Existing applied migrations were preserved.
2. **Extreme expense exponents were normalized before validation.** The domain now checks sign and the integer digit bound using long arithmetic before removing trailing zeros or converting to scale zero. Oversized and fractional scientific inputs return field errors; accepted whole inputs retain exact values and canonical scale zero.
3. **Allocated funding had a related reproducible server error.** `100e2147483647` passed bean validation, then `CampaignContent.money` threw `ArithmeticException` inside `stripTrailingZeros`. Runtime probe evidence identified that exact call. Validation now checks sign and integer bounds first; accepted funding/goal/budget values normalize to scale zero. HTTP checks cover all four money fields, oversized/tiny/negative exponents, canonical scientific whole values, zero budget and unchanged summary formulas. Existing strict bean-validation rules for fractional input remain in place.
4. **Expense dates outside the supported calendar range caused server errors.** A syntactically valid extended ISO year reached PostgreSQL and failed. Domain and browser validation now support years 0001–9999 consistently. V15 enforces that range and excludes PostgreSQL infinite dates. Both supported boundaries pass. This is a representation constraint; no restriction to campaign dates or past dates was added.
5. **Conflicting expense PATCH values were silently discarded.** Setting and clearing the same optional description/proof field now returns a field-specific 400, with the persisted version and contents unchanged.
6. **Draft progress authorization performed a lookup per campaign.** The finance application now checks draft manager membership through the existing batched campaign port, with one active-account lookup and Admin override. Mixed ownership remains hidden, and null IDs/oversized batches return 400.
7. **Admin rejection did not satisfy the form requirements.** Replaced the native rejection form with React Hook Form and Zod, preserving the entered reason after server errors and displaying backend field errors. Confirmation, status badges and success feedback remain available. Review filters/actions/pagination are disabled while a review is pending; an explicit refresh action is available.
8. **A pending expense save could lose its form.** Parent submit/edit controls now stay disabled while the edit form is open, preventing another action from replacing an in-flight form. Save/cancel controls are disabled during submission. Browser verification held a real outgoing request to inspect those states before allowing it to complete.

## Architecture and contract review

- Finance retains domain, application, infrastructure and API boundaries. Controllers call application services; repositories and queries operate on their owning module's tables. Cross-module references remain scalar UUIDs, with identity/campaign/donation access through application ports. No foreign JPA relationships, circular service calls or external HTTP calls inside finance transactions were introduced.
- The specification's conceptual dependency list in section 28 omits finance-to-donation, while section 19 requires verified donation totals. The existing donation aggregate read port is retained as the necessary dependency; finance does not read donation tables directly.
- Expense writes remain transactional and optimistic-versioned. Creation is PENDING, only pending records can be edited, only Admin reviews, rejection requires a reason, and APPROVED/REJECTED are terminal. Original submitter identity survives manager edits.
- Campaign OWNER/MANAGER and Admin receive private access. Organization membership alone grants none. Suspended actors cannot use protected operations. Public views expose APPROVED expenses only and omit private reviewer/submitter/rejection information. Draft privacy is preserved.
- Donation sums/counts query PAID donation rows, rather than payment attempts. Expense sums query APPROVED rows. Empty sums are zero. Financial summary reads share a read-only repeatable-read transaction. Arithmetic remains BigDecimal/numeric in the backend and exact strings/BigInt in the browser.
- `totalFunding = institutionalFunding + sponsorFunding + PAID donations`; `remainingFunds = totalFunding - APPROVED expenses`. Negative balances, aggregate sums exceeding one stored amount's precision, absent goals and over-goal progress remain supported. Institutional/sponsor funding does not change the donation progress numerator.
- Required public/manager/Admin routes, paginated lists, scoped query caches, mutation invalidation, confirmation dialogs, proof reference rendering, loading/error/empty states and mobile navigation remain connected. No dashboard, AI matching or export functionality was added.

## Executed verification

| Check | Result |
| --- | --- |
| Java 21 backend clean package | PASS; 196 source files |
| TypeScript/Vite frontend production build | PASS; 322 modules |
| Docker Compose configuration and both image builds | PASS |
| Normal Docker startup/readiness | PASS; PostgreSQL, backend and frontend healthy |
| Fresh PostgreSQL 16 migration startup | PASS; V1–V15 applied, 15 successful versioned migrations, zero failures, Hibernate validation/readiness successful |
| Final image against that isolated database | PASS; all services healthy |
| Additional Phase 8 audit HTTP checks | PASS; 113 |
| Original Phase 8 manual HTTP checks | PASS; 147 |
| Additional rollback database guards | PASS; 16 |
| Original expense rollback database guards | PASS; 11 |
| Donation status/multiple-attempt aggregate probes | PASS; 6 |
| Phase 7 regression workflow | PASS; 117 |
| Phase 6 regression workflows and SQL guards | PASS; 140 + 43 + 48 + 8 |
| Browser audit workflow | PASS; 10 checks, including actual server rejection-error retention and controls during an actual pending save |
| Responsive visual inspection | PASS; Admin and manager screenshots at 390 × 844, no horizontal overflow or browser runtime exceptions |
| Environment preservation | PASS; `.env` SHA-256 unchanged |

The HTTP checks include scoped-manager removal, suspension, draft batches, terminal campaign review, conflicting PATCH atomicity, extreme numeric/date inputs and supported boundary values. The original finance workflow also checks simultaneous review with exactly one winner, verified callback idempotency, large exact totals, funding edits, volunteer-only finance and negative remaining funds. SQL probes rolled back invalid writes; aggregate probe fixtures were removed afterward.

Browser verification submitted a blank reason to the real backend by modifying an outgoing request, confirmed the original typed reason and returned field error stayed visible, then retried successfully. It also delayed a real save request to verify parent and form controls could not discard its values. Screenshots and build/probe output are recorded locally under ignored `.verification`.

For the allocated-funding overflow, the IntelliJ debugger could not launch because its saved configuration references the stale main class `com.dut.connect.DutConnectApplication`; code-location launch was also unavailable. A compiled JVM probe and real HTTP request supplied the runtime evidence instead. Temporary audit logpoints were removed, and existing user breakpoints were left unchanged. The stale IDE launch configuration was not edited.

The Phase 8 exit criterion is satisfied: verified donations and approved expenses produce correct authoritative totals, with public/private access and exact monetary arithmetic verified. Live ZaloPay checkout still requires merchant credentials and public callback configuration; settlement was exercised through the existing signed server-side mock pathway. Temporary audit containers were stopped after verification, preserving their data volumes; the normal application remains running.
