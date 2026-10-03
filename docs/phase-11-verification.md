# Phase 11 — hardening and final verification

This is the initial implementation snapshot. See the [Phase 11 audit](phase-11-audit.md) for subsequent session fixes, current dependencies and rebuilt-server verification.

Verified on 2026-10-03 against the complete `spec.md`, actual application code, migrations, configuration and running Docker images. Phase 11 has no separate exit list, so its gate is spec §45's complete core Definition of Done and §36's thirty-step manual flow. Stretch features were not implemented.

## Findings and implemented corrections

1. **Logout could leave a rotated replacement usable.** Reproduction: login, rotate the cookie, logout with the original cookie, then refresh with the replacement returned HTTP 200. Logout now holds the existing user lock and revokes the presented token's replacement chain through the identity repository. The recursive query is restricted to the authenticated user and does not revoke independent device sessions. Repeating the reproduction now gives logout 204, replacement refresh 401 and independent-device refresh 200. Concurrent rotation gives one 200 and three 401 responses; logout of the original cookie also revokes that winning replacement. Frontend logout waits for an existing refresh before sending its request.
2. **PostgreSQL NaN bypassed the nonnegative hours check.** The database confirmed that `NaN::numeric(8,2) >= 0` is true. New migration V16 explicitly rejects NaN in `volunteer_completions.verified_hours`. A rolled-back direct update is rejected; zero and 2.50 remain valid. The domain/API continue using BigDecimal with nonnegative, precision and scale validation. V1–V15 were not edited, and no data cleanup or fabricated values were introduced.
3. **Media negotiation errors became misleading authentication failures.** Unsupported request media and unavailable response formats fell through to `/error`, producing 401 with the wrong path. Global advice now returns JSON 415/406 envelopes with appropriate codes, original paths and correlated request IDs. Other JSON errors retain the same envelope.
4. **Rejected callbacks lacked useful boundary diagnostics.** Callback failures now log only safe exception types or application code/status. They retain provider acknowledgments and do not log request bodies, keys, signatures or credentials. Amount mismatch security warnings remain in transactional settlement.
5. **Final documentation contained stale phase assumptions.** README now describes Phase 11, the complete organization-led HYBRID demo and current token-lifetime validation. The smoke checklist is a single current core checklist with final hardening checks. `.env.example` describes the completed core. Historical phase documents remain historical evidence.

## Executed build and deployment verification

| Requirement | Observed result |
| --- | --- |
| Java 21 / Spring Boot exactly 3.4.3 | PASS; host Temurin 21.0.11; Maven clean package succeeds, 223 application sources |
| Frontend build / documented Node 22.12+ | PASS; host Node 24.13.0; TypeScript/Vite build succeeds, 333 modules |
| Default and development Compose configurations | PASS; both `config --quiet` commands succeed |
| Backend/frontend Docker images | PASS; both production images build successfully |
| `docker compose up --build` | PASS; PostgreSQL, backend and frontend become healthy |
| Nginx configuration and proxied readiness | PASS; `nginx -t`, static/deep-link browser navigation and readiness HTTP 200 |
| Normal existing schema upgrade | PASS; V15 → V16, existing database preserved |
| Empty PostgreSQL 16 | PASS; separate `dut-connect-phase11fresh` project starts PostgreSQL 16.15, applies 16 successful versioned migrations with zero failures, initializes Hibernate successfully and becomes ready |
| Restart persistence | PASS; campaign ID/status/version/update timestamp and Flyway count/version unchanged; dashboard remains readable with 12.50 verified hours |
| Production configuration | PASS; explicit prod startup and combined dev,prod startup succeed; Secure/HttpOnly/SameSite=Lax cookie; mock routes return 404 and mock gateway reports unavailable |

Build logs, startup logs, HTTP/SQL observations and screenshots are retained under ignored `.verification/phase11-*`. A PowerShell stderr-redirection status initially reported failure despite successful frontend/fresh-stack output; frontend was rerun through cmd with exit 0, and Compose startup was explicitly repeated with its actual native exit status. The recorded successful commands are the final results.

## Complete core manual flow — spec §36

The normal stack used seven newly registered demo students and one new organization-led HYBRID campaign. All core steps were exercised; negative checks used identified diagnostic records or temporarily restored permissions/statuses.

| Steps | Observed result |
| --- | --- |
| 1–4: register/login/refresh/logout | PASS; duplicate normalized registration 409, BCrypt storage and 64-character SHA-256 token hashes, USER/Admin login, cookie rotation/replay/concurrency, browser reload, logout and protected navigation |
| 5–7: organization and representation | PASS; PENDING organization plus creator OWNER, membership creation, Admin verification, unverified proposal 409 and MEMBER representation 403 |
| 8–10: proposal/campaign | PASS; concurrent approval 200/409 with exactly one DRAFT campaign and initial OWNER; rejection requires reason; skills and campaign manager configured; campaign opened |
| 11–13: applications | PASS; four Pending applications; duplicate 409; manual Technical/Logistics acceptance, rejection and own Pending cancellation |
| 14–16: meetings/tasks | PASS; accepted student sees meeting; task start/done/verification works; unassigned start and student verification return 403 |
| 17–19: attendance/completion | PASS; two sessions; Technical Present 2/2 and Logistics Present 1/2; Technical completion VERIFIED at 7.50 hours while Logistics remains Pending until separately verified |
| 20–22: payment | PASS; mock intent/checkout, verified PAID callback, Failed and Pending donations, provider-query refresh, eight concurrent duplicate callbacks without version/timestamp changes, private donor access and forged redirect rejection |
| 23–25: finance | PASS; Pending submissions, Admin approval/rejection, manager approval denied, only Approved public rows and independent SQL reconciliation |
| 26: AI | PASS; normal disabled mode gives graceful 503 without blocking manual review; isolated compatible-provider matching/outage checks below |
| 27–28: reports | PASS; both actual authenticated browser downloads, readable XLSX headers/rows and private JSON blob error after manager revocation |
| 29: authorization | PASS; anonymous manager reads 401; unrelated reads 403; organization-only member/accepted volunteers denied management; assigned volunteer task/meeting access retained; removed manager denied export; suspended existing manager JWT 401 |
| 30: full stack | PASS; healthy startup and restart persistence, including isolated empty database |

Financial fixture: institutional 100,000 + sponsor 20,000 + PAID donation 50,000 = total funding **170,000 VND**. APPROVED expense 20,000 gives **150,000 VND** remaining, matching independent SQL. FAILED 30,000 and PENDING 40,000 donations, REJECTED 10,000 and PENDING 5,000 expenses are excluded from totals.

The initial report/dashboard snapshot has one verified volunteer at 7.50 hours. Later terminal-state verification marks the Logistics volunteer VERIFIED at 5.00 hours, yielding final 12.50 hours. Downloaded files and screenshots reflect their generation-time snapshots; later state changes do not retroactively alter them.

## Hardening review and regressions

- Backend authorization remains in application services/ports, in addition to HTTP Admin routing. Organization membership is distinct from campaign assignment. Protected payment detail/refresh require donor or Admin, not campaign manager alone.
- Controllers call application services and return records/query DTOs/files. Foreign aggregate references remain scalar UUIDs. Reporting/dashboard dedicated cross-module joins are read-only, as allowed by spec §28. No new foreign repository coupling, entity REST response or field injection was introduced.
- Proposal approval and payment settlement remain atomic. Settlement locks donation then payment consistently. Provider calls are outside payment/AI database transactions; report serialization occurs after read snapshots close.
- Mutable operational aggregates retain `@Version`. Concurrent expense edits produce 200/409 with `OPTIMISTIC_LOCK_CONFLICT`; a real browser profile submission with a stale version displays the conflict and preserves entered values. Existing repeated proposal/recruitment/coordination/expense checks cover invalid transitions and stale commands.
- Reviewed list enrichment uses batch identity/campaign/assignment/completion/attendance queries. Dashboards use database aggregates; report attendance is grouped once per campaign. Existing required indexes remain present. No observed performance problem justified query-plan tuning or caching infrastructure.
- Error-envelope checks cover field validation, invalid page/enum, malformed input, 401/403/404/405/406/409/415, disabled/outage provider responses and matching request IDs. Provider callbacks intentionally retain their acknowledgment contract.
- Terminal campaign checks reject donations, applications, meeting creation and reopening with 409. Verified completion is terminal. The documented final completion-verification exception works after campaign completion. Repeated terminal dashboard/export reads preserve campaign, registration, task, completion, donation, payment and expense status/version/update fingerprints.
- Existing diagnostic regression inspections were executed sequentially where they share users: Phase 6 full HTTP 140 and audit 48; Phase 7 mock payment 117; Phase 8 full HTTP 147 and audit 113; database rollback guards 16; structured AI parser inspection 14. All final runs pass. An initial concurrent Phase 6/8 run observed temporary account suspension from the other inspection; rerunning sequentially resolves it, with no application defect or status left suspended.

## External integration verification and limits

The real ZaloPay adapter is implemented with order/query HMAC, Vietnam order IDs, server callback verification, merchant/order/amount/reference checks and separated transactions. Its create/query response decoder was inspected against controlled successful, unresolved/duplicate, failed, processing, expired, retryable and malformed cases. This is not a live merchant checkout.

On the isolated fresh stack, a diagnostic merchant ID/key and explicitly inserted diagnostic intent exercised the actual public callback endpoint. Forged MAC, signed wrong merchant, wrong amount and unknown order all return invalid acknowledgment without settling. Eight concurrent valid signed callbacks all acknowledge success; both aggregates become PAID once, total PAID is 50,000, and valid replay leaves metadata unchanged. A changed transaction reference is rejected. Key1 is absent in this callback-only configuration, confirming that settlement does not depend on new-order creation credentials.

The isolated compatible HTTP provider returns a structured matching result with score 86 and relevant Programming skill. Outbound fields are limited to campaign matching context and candidate reference/track/skills/experience/availability; email/student ID/user UUID are absent. Provider outage returns 503 with the application still PENDING. Current compiled parser inspection rejects malformed/invented/extra/refused output. No diagnostic adapter or credential was added to the application source.

**Live ZaloPay checkout/public HTTPS callback and real-model AI were not run:** `.env` has no ZaloPay merchant keys or AI provider credentials. Spec §0.20/§18.1 allow the explicit dev mock; §20 permits graceful AI-disabled behavior. These optional live checks remain explicitly unverified, rather than reported as successful. Configure real sandbox/model credentials and execute the README demo to demonstrate those integrations live.

## UI, source safety and documentation

- Actual browser views were inspected at 390px mobile, 768px tablet and 1280px desktop. Campaign/Admin dashboards have no horizontal overflow; public, student and Admin navigation works, readable statuses and exact VND appear, and runtime exception capture is empty.
- Both reports downloaded as actual ZIP-based XLSX files through authenticated controls. Workbook XML inspection confirms eleven volunteer columns, three financial sheets, attendance/completion distinctions, detail statuses, UTC timestamps, private identity/reference data and exact funding values. Existing report code retains wrapping, widths, frozen headers, string money/IDs and literal formula-looking text.
- Browser reload restores the session; sign out returns protected navigation to login. Client invalid input and a real server version conflict preserve form values. Revoked-manager download displays the decoded JSON error. Payment `success=true&status=PAID` still displays the backend's Awaiting payment state.
- Shared loading/error/empty feedback, pagination, pending controls, status labels and destructive confirmation components remain in use. Theme colors remain centralized DUT-inspired blue/white tokens; no redesign or layout copying was introduced.
- Source/example configuration scan examines 409 project files, excluding ignored credentials/build/cache/diagnostic artifacts; it finds no occurrence of configured JWT/bootstrap/provider secrets. `.gitignore` excludes local environment and verification files. Runtime logs were reviewed for safe correlated state/provider diagnostics. This workspace lacks `.git`, so tracked-file/commit-history secret verification is unavailable; no claim is made about absent history.
- `.env` remains byte-for-byte unchanged: SHA-256 `5175F02F372D17A385509ECEFCD067B0DA58F2E3A3524331FA462AA432ACB452`.
- README includes the required overview, architecture, prerequisites, local/environment/Docker setup, bootstrap, payment/tunnel, AI, builds and full HYBRID demo. The current checklist covers all thirty required steps and final hardening checks. No application test tree, automated test framework/dependency, prohibited infrastructure or stretch feature was introduced.

## Final gate

Phase 11's required core hardening and final Definition of Done are satisfied by the code review and executed build/runtime/manual evidence above. Live external demonstrations and unavailable Git-history inspection are explicitly distinguished from verified core behavior. The normal stack retains its original configuration and healthy services; owned diagnostic services are stopped with database volumes preserved.
