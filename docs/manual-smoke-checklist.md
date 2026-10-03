# Final manual smoke checklist — Phase 11

This is the current checklist for spec §§36, 44–46. Current results are in the [Phase 11 audit](phase-11-audit.md); the [initial Phase 11 verification](phase-11-verification.md) records the complete core demo. Earlier phase documents preserve historical results. No automated test suite is required or added.

## Preparation

Use a dedicated organization-led HYBRID campaign and identified demo accounts. Preserve unrelated data and the normal development volume. Keep secrets out of logs, screenshots and source files. Record HTTP status/code/request ID, relevant database state and readable exports; compare totals with independent SQL. Restore temporary suspensions/assignments after verification.

## Required core flow — spec §36

1. [ ] Register a student with ID, name, email, password and faculty. Check normalized duplicate email/ID rejection, invalid fields and BCrypt storage.
2. [ ] Login as USER and ADMIN. Required JWT claims and protected role-specific routes work. Suspended users cannot login or use existing tokens.
3. [ ] Refresh and browser reload restore authentication. Rotation replaces the HttpOnly cookie; old-token replay fails. Concurrent refresh of one token gives exactly one success.
4. [ ] Logout clears browser state/cookie and revokes the session. Logout with a just-rotated old cookie also revokes its replacement; an independent device session remains valid.
5. [ ] Student creates an organization with creator OWNER membership and PENDING_VERIFICATION atomically. Public browse hides unverified organizations.
6. [ ] Admin verifies the organization. Verify/suspend/restore transitions and stale versions; final organization owner requires ownership transfer before removal.
7. [ ] Authorized OWNER/MANAGER creates an organization proposal. MEMBER/unrelated actors and unverified/suspended organizations fail. Organization membership alone does not grant campaign management.
8. [ ] Admin approves a PENDING proposal; rejection requires a reason. Reviewed proposals cannot be edited/reviewed again.
9. [ ] Repeated/concurrent approval creates exactly one DRAFT campaign and initial OWNER atomically.
10. [ ] Owner configures skills and opens the campaign. Allowed lifecycle transitions and terminal states are enforced; public browse/detail work by UUID and stable slug.
11. [ ] Active students apply with preferred track, motivation and availability to eligible OPEN volunteer-enabled campaigns. Application remains Pending until manually reviewed.
12. [ ] Duplicate/concurrent application fails, including after rejection/cancellation. Donation-only, draft, active, terminal and expired-recruitment campaigns reject new applications.
13. [ ] Manager accepts with final assigned track. Separately reject with reason and cancel an own Pending application. Capacity warning/confirmation permits deliberate override.
14. [ ] Manager creates a meeting and assigns a task only to ACCEPTED campaign volunteers. Other-campaign/nonaccepted assignments fail.
15. [ ] Assigned student views tasks/meetings and moves To do → In progress → Done. Other students cannot update the task; students cannot verify it.
16. [ ] Manager verifies a Done task. Correction works before verification; Verified is terminal.
17. [ ] Manager creates two attendance sessions with valid start/end times. Accepted volunteers have appropriate viewing access; unrelated users do not.
18. [ ] Save Present/Absent records using atomic bulk upsert. Unrecorded differs from Absent; duplicate/nonaccepted participants fail without partial writes; stale session version returns 409.
19. [ ] Manager records completion and verifies finite nonnegative hours with at most two decimals. Attendance alone is not completion; Verified is terminal and visible in student history.
20. [ ] Active donor creates whole-VND donation within configured limits for eligible OPEN/ACTIVE donation-enabled campaign. Fractional/out-of-range amounts and ineligible campaigns fail.
21. [ ] Sandbox/dev mock checkout produces PAID only through a verified backend callback. Payment result reads backend status and ignores forged query-string success.
22. [ ] Duplicate/concurrent callback preserves versions/timestamps and totals. Invalid MAC, merchant, order, amount or reference cannot settle. Pending refresh trusts provider query; stale failure cannot downgrade PAID.
23. [ ] Manager submits expense with whole-VND amount, valid calendar date and optional textual proof reference. Unrelated users cannot submit.
24. [ ] Admin approves/rejects Pending expenses; rejection requires reason. Manager approval and terminal/stale review fail.
25. [ ] Reconcile institutional + sponsor + PAID donations − APPROVED expenses. Public expenses contain only Approved rows and public finance never discloses donor identities.
26. [ ] AI returns advisory suggestions or explicit disabled/unavailable behavior. Verify authorization, strict output parsing, minimal outbound data, bounded calls and unchanged application state.
27. [ ] Manager/Admin downloads and opens volunteer Excel: eleven exact headers, attendance, separate completion status, verified hours/time and preserved student IDs.
28. [ ] Download/open financial Excel: Summary, Donations and Expenses. PAID/APPROVED-only totals, one row per donation despite attempts, exact money/references and literal formula-looking text.
29. [ ] Reject anonymous, unrelated, organization-only member, accepted volunteer without management permission, removed manager and suspended account for management/AI/dashboard/export actions. Payment detail/refresh require donor or Admin.
30. [ ] Compose starts PostgreSQL 16, backend and frontend healthy. Nginx serves assets/deep links and proxies API/readiness; restart preserves data/history.

## Phase 11 hardening and final Definition of Done — spec §45

- [ ] Java 21 and exactly Spring Boot 3.4.3: backend `./mvnw clean package -DskipTests` (Windows `.\mvnw.cmd clean package -DskipTests`) succeeds.
- [ ] Node 22.12+ documented; frontend `npm ci` and `npm run build` succeed.
- [ ] Default/development Compose configurations validate; images build and `docker compose up --build` starts the full stack.
- [ ] Distinct empty PostgreSQL 16 project applies V1–V16 before Hibernate validation. Normal V15 upgrade applies only V16. Prior migration checksums are unchanged; Open Session in View is disabled.
- [ ] V16 rejects direct database NaN hours; NULL (unverified), zero and finite values remain allowed. Exercise critical date/money/unique/accepted-volunteer constraints with rolled-back writes.
- [ ] Mutable aggregate roots use optimistic locking; stale/concurrent commands return 409 envelopes without partial writes.
- [ ] Backend authorizes every protected action. Mock routes/gateway are absent in prod, including dev,prod; prod cookies are Secure/HttpOnly/SameSite=Lax and bootstrap defaults off.
- [ ] Bad JSON, fields, parameters/enums, 401/403/404/405/406/409/415 and provider failures have correct JSON envelopes/request IDs without SQL names or stack traces. Callback intentionally uses provider acknowledgments.
- [ ] Correlated request/state/provider-outcome logs omit passwords, raw tokens, keys and callback payloads. Review source/examples and ignore rules for secrets; check tracked/history content when Git metadata is available.
- [ ] Controllers call application services and return DTOs. Module boundaries use ports/scalar IDs; reporting/dashboard joins are read-only. External HTTP calls run outside database transactions.
- [ ] List enrichment is batched, pagination deterministic, aggregates correct and required indexes present. Use query plans only for observed performance issues; add no cache infrastructure.
- [ ] Navigate public/student/manager/Admin screens at 390px mobile, 768px tablet and 1280px desktop. No overflow; readable tables, friendly badges, exact VND and consistent dates.
- [ ] Loading/error/empty states, backend field errors, preserved values, pending controls and destructive confirmations work. Check reload, logout, protected-route return and private-cache clearing.
- [ ] Delay a request's 401, change accounts and release it: it must never refresh/retry under the new account or clear that session. Login waits for cookie rotation; logout works after failed pending refresh and expired access; late rotation cannot restore cleared authentication.
- [ ] Both browser downloads work and unauthorized JSON blob errors are readable. Headers, widths/wrapping, UTC dates and leading zeros are usable; no formulas or floating-point money loss.
- [ ] Terminal campaigns block new contributions/ordinary edits; existing reports and documented final verification/review/settlement remain available.
- [ ] README covers overview, architecture, prerequisites, host/Docker setup, variables, bootstrap, payment/tunnel, AI, builds and full HYBRID demo. Record unavailable live integrations explicitly.
- [ ] No automated tests/dependencies, stretch features, prohibited infrastructure or real secrets introduced.

## External integration distinction

For the subsequent Vietnamese Tailwind UI refinement, check [UI verification and demo guide](ui-redesign-verification.md), including the port 80 URL, responsive layouts, keyboard menu behavior, account access and fictional DUT sample data.

Verify the real ZaloPay adapter's create/query/callback logic. A live merchant checkout also needs sandbox credentials, connectivity and a public HTTPS callback; record it as pending when unavailable. The explicit dev mock uses the same settlement path and is permitted by spec §0.20/§18.1.

AI-disabled behavior is a valid core outcome. Controlled compatible-provider responses verify transport/privacy/parser behavior but do not establish real-model verification. AI suggestions never execute official decisions.
