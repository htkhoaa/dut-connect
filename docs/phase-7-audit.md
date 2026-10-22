# Phase 7 audit

Completed 2026-10-02 after reading the complete `spec.md` and inspecting the actual backend, frontend, V12 migration, application profiles, Compose/Nginx settings and build/runtime results. Scope: Phase 7 and regressions in existing functionality. Phase 8 was not started.

## Findings fixed

| Finding | Correction and evidence |
| --- | --- |
| `PaymentGateways.get()` and callback verification required all creation/query/redirect settings. Valid callback processing was unavailable when app ID and key2 were configured but key1 or URLs were absent. | Validate configuration per operation. Creation retains full availability checks; callback needs app ID/key2; query needs app ID/key1/query URL. A signed unknown-order callback changed from temporary-unavailable acknowledgment 0 to invalid-order acknowledgment 2. All 88 signed callback checks pass with only callback credentials configured, including valid settlement. |
| Mock simulation and query dereferenced nullable `expires_at`. | Treat null as no configured expiry. Both refresh and successful simulation were reproduced as HTTP 500 before the fix and HTTP 200 afterward. |
| Provider query errors, including invalid credentials or missing order, were silently returned as normal pending outcomes. | Preserve local payment state but report HTTP 503 when the provider request cannot establish status. Processing and documented retryable payment failures remain pending; confirmed expiration remains terminal. A refresh with missing query credentials returns 503 with donation PENDING_PAYMENT/payment PROVIDER_PENDING unchanged. |
| `asInt`/`asBoolean` coercion accepted string or overflowed subcodes and invalid processing flags. Query timestamps were truncated or replaced by the current time, and invalid money could escape as client validation errors. | Introduce the focused infrastructure response decoder `ZaloPayResponses`. Validate integer types/ranges, boolean types, positive whole amount, transaction reference and payment timestamp before returning a verified result. Invalid provider confirmation becomes a provider failure without settlement. Eighteen manual probes of compiled creation/query decoding verified normal outcomes and rejected malformed values. |
| A malformed duplicate-order subcode could be interpreted as a definitive rejection and prematurely fail the intent. | Parse subcodes strictly. A valid duplicate order remains UNKNOWN and refreshable; malformed provider responses leave creation unresolved through the existing boundary handling. |
| Creation response messages used the earlier provider HTTP outcome even when a concurrent callback had already settled the intent. | Build the message from the reloaded payment's persisted failure reason alongside its persisted status and checkout URL. PAID cannot be returned with an obsolete provider-failure/unresolved message. This race inconsistency was found by code inspection; early callback settlement and idempotency are exercised by the signed callback workflow. |
| Successful/rejected/unresolved creation outcomes were not logged, and an unresolved response code was discarded. | Log only IDs, outcome and state after recording creation. Retain the safe response code for unresolved creation. Runtime logs confirm creation outcome events without keys or payloads. |
| Mock checkout displayed status as plain text and maintained a duplicate label mapping. | Reuse the shared Badge and centralized donation status labels/tones. Browser DOM and the visually inspected 390 × 844 screenshot show the pending badge, friendly labels, functional controls and no horizontal overflow. |

The fixes preserve the provider-independent application port, existing transaction boundaries, shared settlement path, pessimistic donation/payment lock order and authorization. Parsing provider wire data remains in infrastructure. No controller calls a repository, no domain method calls HTTP, and no application service imports infrastructure.

## Schema and configuration review

V12 satisfies the specified columns, scalar foreign keys, numeric(19,0) amounts, positive-value/status checks, audit/version fields, unique provider identifiers and indexes. Its nullable expiry is retained. No schema change was necessary, and no applied migration was edited. Flyway validates all existing migration checksums; Hibernate validates the schema. Eight direct SQL probes, each rolled back, reject invalid amounts/statuses, missing paid timestamp/reference and invalid donation/campaign foreign keys. Existing HTTP callback checks cover unique transaction-reference collisions and rollback of both aggregates. Stored donation/payment amounts and PAID statuses are consistent.

Mock gateway/service/API beans require `dev & !prod`. A fresh isolated stack with both `dev,prod` active applies all 12 versioned migrations and becomes healthy. Authenticated mock GET/success/fail requests return 404, and the mock provider remains unavailable. There is no provider fallback in production. The public callback path is permitted at HTTP authentication level and verified cryptographically.

The supplied `.env` still contains no payment provider settings or merchant credentials. Defaults keep the normal development stack on mock. Temporary dummy callback configuration was supplied only to verification containers and removed afterward; `.env` and its existing secrets were not changed.

## Verification

| Check | Result |
| --- | --- |
| Final backend `mvnw clean package -DskipTests`, Java 21 / Spring Boot 3.4.3 | PASS; 183 source files, executable jar |
| Frontend `npm run build` | PASS; TypeScript and Vite |
| Compose configuration and backend/frontend Docker builds | PASS |
| Normal Compose startup/readiness | PASS; PostgreSQL, backend and frontend healthy |
| Fresh isolated PostgreSQL and `dev,prod` startup | PASS; 12 versioned migrations successful, zero failures, Hibernate validation/readiness healthy |
| Donation/mock HTTP and persistence workflow | PASS; 117 checks, rerun after the final change |
| Signed ZaloPay callback workflow with callback-only configuration | PASS; 88 checks |
| Mixed production/development profile endpoint verification | PASS; 9 checks |
| Additional SQL guards | PASS; 8 rollback probes |
| Compiled provider response decoding | PASS; 18 manual JShell probes covering success, processing, retryable failure, expiry, duplicate order, request failure and malformed fields |
| Null mock expiry | PASS; refresh/success both HTTP 200, previously both 500 |
| Missing query credentials | PASS; HTTP 503 and unchanged pending donation/payment |
| Phase 6 workflow, edges, audit regressions and database guards | PASS; 140 + 43 + 48 + 8 = 239 checks |
| Mock checkout badge and mobile layout | PASS; DOM checked and 390 × 844 screenshot visually inspected |

Phase 7 exit criteria remain satisfied: mock checkout uses a signed server-side callback; the frontend cannot set PAID; duplicate callbacks safely acknowledge success without changing versions/timestamps or multiplying the donation's PAID amount. Callback amount/identity/reference checks, atomic rollback, early callback handling and private donor/Admin access remain intact. Phase 6 coordination and final verification continue to pass.

No automated test source tree/dependencies or Phase 8 functionality were introduced. Temporary manual verification artifacts are ignored under `.verification`. The isolated audit stack is stopped with its volume preserved, and the normal development stack is healthy.

## External limitation

Actual ZaloPay sandbox order creation, checkout, external callback delivery and live query remain unverified because merchant credentials and a publicly reachable HTTPS callback are absent. Local signed fixtures execute the real callback adapter and persistence path; decoder probes inspect actual compiled response handling, but neither establishes merchant connectivity. The [manual smoke checklist](manual-smoke-checklist.md) retains the separate real sandbox procedure. Provider protocol interpretation was checked against official [callback](https://docs.zalopay.vn/docs/specs/callback-api/), [query](https://docs.zalopay.vn/docs/specs/order-query/) and [status-code](https://docs.zalopay.vn/docs/developer-tools/knowledge-base/status-codes/) documentation.
