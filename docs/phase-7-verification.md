# Phase 7 implementation and verification

Completed 2026-10-02 against the complete `spec.md`, with scope limited to Phase 7 and preservation of Phase 6. Phase 8 was not started.

The subsequent [Phase 7 audit](phase-7-audit.md) records fixes to operation-specific credentials, strict provider response parsing, nullable mock expiry, creation response messages/logging, and mock status badges. Its verification supersedes the corresponding original observations below.

## Implementation

- `donation` contains domain entities/state transitions; application gateway/repository ports, reads, creation orchestration and settlement; infrastructure persistence, mock and ZaloPay adapters; and thin API controllers.
- V12 creates donation/payment tables with scalar foreign keys, exact whole VND amounts, audit/version columns, checked statuses, paid metadata constraints, unique provider order/transaction IDs, and lookup indexes. Existing V1–V11 migrations remain unchanged.
- Creation commits an intent before calling the provider, then reloads and locks before saving its outcome. Provider calls are outside database transactions. Settlement locks donation then payment and updates them atomically. Early and repeated callbacks cannot be overwritten by creation finalization or stale refresh.
- ZaloPay uses Vietnam-date order prefixes, documented HMAC-SHA256 inputs and separate creation/callback keys, strict callback identity/amount/reference validation, server-side query, bounded HTTP timeouts, and official sandbox endpoints. Uncertain creation/duplicate-order outcomes remain refreshable; only confirmed expiration terminates a pending queried order.
- Mock checkout creates a signed server event and uses the same verification/settlement pipeline. Its gateway, service and API controller require `dev` without `prod`.
- Donation creation requires an active actor and eligible campaign/deadline/mode. Reads, checkout and refresh require the donor or Admin. Being a campaign manager gives no additional donor access.
- Frontend campaign donation form, confirmation, My Donations, mock checkout and result routes use existing shared components, React Hook Form/Zod, account-scoped TanStack Query hooks and protected navigation. Result status comes from the backend; URL success parameters are ignored. Money remains decimal strings through display.
- Configured limits and safe availability are exposed by the public settings endpoint. Missing ZaloPay configuration reports payment unavailability without disabling volunteer features. Provider setup, HTTPS callback tunnel, and decisions are documented in README.

## Verification results

| Check | Result |
| --- | --- |
| Host backend build, Java 21, `mvnw clean package -DskipTests` and final package rebuild | PASS; 182 Java source files, executable jar |
| Host frontend `npm run build` | PASS; TypeScript and Vite |
| `docker compose config --quiet` | PASS |
| Backend/frontend Docker builds and `up --detach --wait` | PASS; PostgreSQL, backend and frontend healthy |
| Existing database Flyway/Hibernate validation | PASS; V12 applied, all 12 versioned migrations successful |
| Isolated fresh PostgreSQL database and production stack | PASS; all 12 versioned migrations applied, no failures, Hibernate validation and readiness healthy |
| Donation/mock HTTP and SQL workflow checks | PASS; 117 checks |
| Real ZaloPay adapter callback handling with locally signed fixtures and temporary dummy merchant configuration | PASS; 88 checks, including repeated/concurrent callbacks |
| Authenticated production endpoint checks | PASS; 9 checks; mock GET/success/fail return 404 and mock provider is unavailable |
| Phase 6 workflow | PASS; 140 checks |
| Phase 6 permission, lifecycle and concurrent completion checks | PASS; 43 checks |
| Phase 6 audit regression checks | PASS; 48 checks |
| Phase 6 PostgreSQL constraints | PASS; 8 checks |
| Browser payment result with forged URL success flags | PASS; backend PENDING_PAYMENT displayed as Awaiting payment |
| Browser mock checkout/confirmation/result | PASS; signed backend settlement changes result to Paid with paid timestamp |
| Browser donation form validation/confirmation/creation | PASS; fractional value rejected, valid amount confirmed, pending intent returned |
| Mobile result page, 390 × 844 | PASS; no horizontal overflow, screenshot visually inspected |
| Architecture/dependency inspection | PASS; application layer does not import infrastructure, domain does not call HTTP/repositories, no cross-module entity associations/SQL, no floating-point money or browser token persistence introduced |

HTTP checks covered anonymous/cross-donor/manager access, valid min/max amounts, invalid whole VND values, pending refresh, terminal states, expiry, draft/active/closed and donation/volunteer modes, fundraising deadline, duplicate version/timestamp stability, and SQL consistency/PAID sums. Signed callback checks covered MAC tampering, malformed signed JSON, integer overflow/type mismatch, merchant/order/amount mismatch, duplicate transaction-reference rollback, early CREATED settlement, and settling an existing intent after donor suspension. Regressions were rerun against the final application image.

## Exit criteria

| Criterion | Evidence |
| --- | --- |
| Phase 7: sandbox/mock checkout uses a server-side callback | Mock checkout generates and verifies a signed event through the shared application pipeline; the public ZaloPay endpoint also settles valid signed fixtures. |
| Phase 7: frontend cannot fake PAID | Supplied create/refresh status fields and forged redirect success flags do not settle payment. No donation status mutation endpoint exists. Only verified provider results can settle PAID. |
| Phase 7: duplicate callback is safe | Twelve simultaneous success events for each provider all succeed; repeated callbacks leave versions/timestamps/reference unchanged and the PAID donation sum includes the donation once. |
| Phase 6: accepted volunteer can be coordinated and finally verified | Meeting, assigned task transitions and manager verification, multiple attendance sessions, completion with official verified hours, and student history pass the 239 Phase 6 checks. |

## External verification limitation

The supplied `.env` contains no ZaloPay merchant app ID/keys or public HTTPS callback configuration. A real sandbox order, checkout, external callback delivery, and live provider query were therefore **not verified**. Local signed fixtures exercise the actual ZaloPay callback adapter and atomic persistence, but do not establish external connectivity or merchant onboarding. The Phase 7 exit criteria are satisfied through the specified mock flow. Complete the separate real sandbox checklist after supplying merchant credentials and a reachable HTTPS tunnel. Temporary dummy callback settings were removed; `.env` and its existing secrets were not changed.

No automated test sources, test dependencies, later-phase finance endpoints, or refund functionality were added. Verification artifacts and local fixtures remain in the ignored `.verification` directory. The isolated verification stack is stopped without deleting its database volume; the main development stack remains healthy.
