# Phase 10 specification audit

Reviewed the complete `spec.md`, actual dashboard/reporting code, frontend routing/cache/download behavior, existing V1–V15 migrations, security/configuration, and production builds. Phase 11 was not started. No migration, infrastructure dependency or automated test suite was added. `.env` remains unchanged.

## Findings and fixes

1. **Admin/campaign query keys could collide.** The Admin key ended in `admin`, while campaign keys ended directly in the route parameter. A malformed `/manage/campaigns/admin/reports` route reused cached Admin data and displayed report controls. An actual browser probe reproduced this. Campaign keys now include a distinct `campaign` namespace; the same probe now displays no download controls. Backend authorization remained enforced throughout.
2. **Global mutation handling coupled reads to dashboard refresh.** A global `MutationCache` invalidated dashboards after every successful mutation, including read-only report downloads, authentication and AI generation. The browser recorded a dashboard request after a download. Removed that global handler and added dashboard invalidation to the existing organization, campaign/proposal, volunteer, coordination, donation/payment and finance mutation hooks. Read-only downloads now cause zero dashboard requests. A real expense submission still refreshed a previously cached campaign pending-expense count from 1 to 2.
3. **Excel presentation did not accommodate valid long values.** Fixed widths and unwrapped default-height rows clipped long names/references and multiline values. Widths now account for headers and content, with a readable maximum; body cells wrap and row heights grow. Full UUIDs fit their columns. Exact text, leading zeros and formula-looking text remain preserved. This improves report usability without altering the data scope or monetary representation.
4. **Timestamp headers differed from the specification.** Restored exact `Verified At`, `Paid At` and `Reviewed At` headers. UTC remains explicit in their header comments, ISO values and workbook metadata, and in the download screen.
5. **Attendance aggregates were repeated for each application.** The volunteer report used correlated present-session and total-session counts per row. It now aggregates present counts by user and total sessions once within the campaign-scoped query, joining those projections to registrations. Empty reports, absent/unrecorded sessions and the distinction between attendance and VERIFIED completion are preserved. Existing indexes suffice.

The remaining documented decisions are consistent with underspecified parts of the contract: reports contain all relevant campaign applications and all donation/expense detail statuses; financial totals use PAID/APPROVED only; one selected payment attempt supplies each donation's metadata; Admin metrics are lifetime aggregates, with ACTIVE operational campaigns and separately eligible OPEN/ACTIVE fundraising campaigns. Historical contributions remain counted after account suspension. Excel money stays exact text to avoid losing supported 19-digit values.

## Architecture and configuration

- Controllers call application services and return query DTOs/files. Reporting/dashboard SQL joins across modules are explicitly allowed by section 28. They neither expose foreign repositories nor mutate foreign aggregates.
- Application reads authorize active accounts and campaign OWNER/MANAGER/Admin before querying private content. Admin dashboard requires Admin. Organization membership and accepted participation alone grant no report/dashboard permission. Draft and terminal campaigns retain management reporting access.
- Read-only repeatable-read transactions capture report/dashboard snapshots. POI serialization follows the completed read transaction. Workbook resources close normally and on failures; no external provider calls are introduced.
- Monetary aggregation remains PostgreSQL numeric/Java BigDecimal, with exact decimal strings in responses/export cells. There is no client-provided financial state. Donor identity exists only in private exports; public financial endpoints and dashboard summaries do not acquire identity lists.
- V1–V15 are unchanged, Flyway remains the schema authority, Hibernate uses `validate`, and Open Session in View is disabled. Apache POI remains the existing pinned dependency; Docker/Nginx and CORS wiring remain valid.

## Executed verification

| Check | Result |
| --- | --- |
| Java 21 Maven clean package | PASS; 223 source files, Boot 3.4.3 |
| TypeScript/Vite production build | PASS; 333 modules |
| Compose validation and both production image builds | PASS |
| Normal Docker startup/readiness | PASS; all three services healthy |
| Fresh PostgreSQL 16 startup | PASS; V1–V15, 15 successful versioned migrations, zero failures, Hibernate validation and readiness |
| Phase 10 manual HTTP workflow | PASS; 101 checks |
| Compiled workbook inspection | PASS; 48 checks |
| Actual cache probes before/after | PASS; malformed-route controls true → false; download-triggered dashboard requests 1 → 0 |
| Browser workflows and expense cache invalidation | PASS; 13 checks |
| Repeated reads preserve protected domain state | PASS; 7 checks |
| Terminal campaign reports/dashboard/read preservation | PASS; 8 checks |
| Desktop/mobile layout and runtime verification | PASS; no horizontal overflow/runtime exceptions |
| Phase 8 / Phase 7 / Phase 6 regressions | PASS; 147 / 117 / 140 checks |
| Phase 9 disabled workflow/capability preservation | PASS; 52 + 4 checks |
| Environment preservation | PASS; unchanged SHA-256 |

HTTP verification covered manager/Admin scope, anonymous/unrelated/suspended access, empty/draft reports, all application/task/payment/expense states, exact large amounts, independent reconciliation of all Admin metrics and payment-attempt deduplication. The workbook probe verified required headers/sheets, attendance and verified hours, provider/review metadata, exact values, UTC comments, full UUID widths, wrapping and multiline row heights. Workbook artifacts were inspected before the subsequent browser expense submission; they reflect their generation-time snapshots.

The browser downloaded both real authenticated files, decoded a real revoked-manager JSON blob error, verified login return/reload behavior, and submitted an expense through the actual form to check dashboard invalidation. The manager assignment and temporarily suspended account state were restored; the temporary extra payment attempt was removed. The browser skill's callable control tool was unavailable, so verification used owned isolated profiles without inspecting existing profiles or session stores. Those browser sessions are closed. Screenshots were inspected.

Read-preservation verification compared database fingerprints of campaign, registration, task, completion, donation, payment and expense status/version/update timestamps before/after repeated dashboard and Excel calls. All matched. Terminal campaign reads also preserved campaign status/version.

Manual diagnostic scripts, logs, workbooks and screenshots are retained in ignored `.verification`. The fresh audit stack is stopped with its database volume preserved. Normal Docker remains healthy under the original `.env` configuration. Export rows and POI workbooks remain materialized in memory, as previously documented; this audit does not claim large-dataset streaming verification.

Phase 10 satisfies its required dashboards, private report downloads and usable workbook contents. Phase 11 and stretch work remain deferred.
