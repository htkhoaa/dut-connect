# Phase 10 verification

Subsequent findings, fixes and verification are recorded in [Phase 10 audit](phase-10-audit.md). The results below describe the original implementation verification.

Implemented against the complete `spec.md`, particularly sections 21–22, 24, 28–30, 36–39, 41–42 and the Phase 10 roadmap. Its roadmap has no separate exit-criteria list; completion is verified against the required dashboards, report columns/sheets/download UI and reporting Definition of Done. Phase 11 and stretch features were not started. No automated test suite, new migration or external dependency was added. `.env` is unchanged.

## Implementation and decisions

- Query-oriented dashboard/reporting modules have application contracts/use cases, infrastructure projections/rendering, and thin controllers. Dedicated cross-module SQL reads are permitted by section 28. Authorization uses the existing active-account and campaign/Admin services. There are no write ports or volunteer/payment/expense decision operations.
- Admin exposes all ten required lifetime metrics. ACTIVE is the operational campaign count; active fundraising separately includes eligible OPEN/ACTIVE donation-enabled campaigns with an unexpired/null deadline. Historical accepted registrations and verified hours remain counted if accounts later become suspended. No enrollment percentage is invented.
- Campaign dashboards aggregate all registration states, accepted assigned tracks, task states, sessions, VERIFIED completions/hours and pending expenses, plus the existing financial summary. Independent queries avoid Cartesian multiplication. Repeatable-read application transactions produce consistent snapshots.
- Volunteer reports include all campaign applications, preserving their application states and assigned tracks. Missing completion records mean Pending. Financial detail sheets include all donation/expense states while their summary includes only PAID/APPROVED amounts. One selected payment attempt per donation provides provider metadata; settled attempts take priority over newer unsettled attempts.
- Money/hours use exact decimal strings in DTOs. Excel money/IDs/references are text cells; count cells are numeric. All eleven volunteer columns and the Summary/Donations/Expenses headers are present. UTC timestamps are labeled, headers styled/frozen, filters enabled, widths usable and text kept literal. Oversized sheets split at the Excel row limit. Rendering takes place outside the database transaction and closes workbook resources.
- Admin dashboard navigation, campaign workspace overview and Reports routes are connected. Account-scoped TanStack queries refresh on focus/manual refresh and successful mutations. Axios handles authenticated blob downloads and JSON blob errors, including session refresh through the existing interceptor. Buttons show pending/error/success feedback and object URLs are released.

## Executed checks

| Check | Result |
| --- | --- |
| Java 21 Maven clean package | PASS; 223 source files, Boot 3.4.3 |
| TypeScript/Vite production build | PASS; 333 modules |
| Docker Compose validation and both image builds | PASS |
| Normal Docker startup/readiness | PASS; all three services healthy |
| Empty PostgreSQL 16 startup | PASS; V1–V15, 15 successful versioned migrations, zero failures; Hibernate validation and readiness successful |
| Manual Phase 10 HTTP workflow | PASS; 101 checks |
| Terminal campaign reporting and read preservation | PASS; 8 checks |
| Compiled POI workbook inspection | PASS; 39 checks |
| Browser workflow | PASS; 12 checks |
| Desktop/mobile visual inspection | PASS; dashboards and downloads readable, no horizontal overflow or runtime exceptions |
| Phase 8 finance regression | PASS; 147 checks |
| Phase 7 payment regression | PASS; 117 checks |
| Phase 6 coordination regression | PASS; 140 checks |
| Phase 9 disabled workflow and capability preservation | PASS; 52 + 4 checks |
| Environment preservation | PASS; unchanged SHA-256 |

The manual workflow created a HYBRID campaign through proposal approval and opening, four applications spanning all states, accepted assigned Logistics participation, three attendance sessions (present/absent/unrecorded), verified 2.50 hours, verified and TODO tasks, paid/failed/pending donations, and approved/pending/rejected expenses. Dashboard values were reconciled with the expected campaign outcome and all ten Admin fields with independent PostgreSQL queries.

Funding `9999999999999999999` plus sponsor 8 and paid donations 50000 produced exact total `10000000000000050007` and remaining `10000000000000049987` after approved expense 20. Both browser and workbook retained those values. A temporary newer unsettled payment attempt did not duplicate the donation row or change totals; the report still selected the settled reference. That attempt was removed.

Authorization checks covered anonymous requests, unrelated users, organization members, accepted volunteers, unassigned managers, assigned managers, Admin, draft reports, suspended managers, missing resources and malformed identifiers. Both exports returned private/no-store attachment headers. Empty campaigns generated usable header-only detail sheets.

The diagnostic campaign was subsequently started and completed through ordinary state commands. Its dashboard and both reports remained accessible, and those reads left the completed campaign's status/version unchanged.

Workbook inspection verified sheet names, header counts, frozen rows/filters, application and expense states, attendance denominators, verified timestamps/hours, review identities, settled provider metadata, exact money and text identity fields. A direct writer probe confirmed leading zeros and formula-looking text remain literal strings.

An isolated browser downloaded both real authenticated XLSX files, rendered exact campaign balances, returned from login to Reports and Admin, displayed a real revoked-manager download error decoded from a JSON blob, refreshed metrics and restored authentication after reload. The manager assignment was restored after that check. Screenshots at 390 × 844 and 1280 × 900 were visually inspected. The browser skill's callable control tool was unavailable; an owned headless profile was used instead. Its initial download check failed due to diagnostic Windows path handling; the corrected native-path/input workflow passed without an application change.

Build logs, manual diagnostic scripts, workbooks and screenshots remain in ignored `.verification`; no test source tree was created. The temporary suspended account state was restored. The owned browser and fresh audit stack were stopped; the fresh database volume is preserved. Normal Docker remains healthy with the existing default AI/payment configuration.

Phase 10 completion criteria are satisfied: both dashboards return correct authorized aggregates, both specified Excel reports download through the UI with usable headers/values, and builds plus fresh Docker/database startup pass.
