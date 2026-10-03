# Phase 6 audit

Completed 2026-10-02 after rereading all of `spec.md`. Scope: specification sections 14–17, Phase 6 exit criteria, and applicable architecture, security, persistence, API, and UX constraints. Phase 7 was not started.

## Findings fixed

| Finding | Correction |
| --- | --- |
| An ONLINE relative URL returned 500 because an immutable set rejected a null URI scheme. | Null-safe, case-insensitive HTTP(S) scheme validation returns a field-level 400. |
| OFFLINE meetings accepted arbitrary optional URLs, which the frontend rendered as links. | Every supplied meeting URL must be absolute HTTP(S), have a host, and contain no credentials. Frontend validation applies to optional OFFLINE URLs too. |
| `clearFields: [null]` returned 500 for meeting/task patches. | Reject null entries before checking the allowed fields; return 400 without changing the resource. |
| Attendance `records: [null]` reached application code and returned 500. | Add element-level `@NotNull` alongside nested validation. Mixed valid/null batches fail before any write. |
| One persistence adapter implemented five repository ports and combined meeting, task, attendance, completion, and recruitment reads. | Replace it with five focused infrastructure adapters. Each owns explicit queries for its tables; application ports and transactional services remain intact. |
| Operational versus completion writes were selected by boolean arguments at call sites. | Use named operational/completion authorization methods and an internal purpose enum. Existing campaign-state policy remains explicit. |
| Meeting `canManage` remained true in terminal campaigns, and task `canProgress` remained true at DONE. | Capability flags now reflect available operations and campaign state. |
| Attendance controls depended only on campaign state; coordination pages could show manager navigation to students. | Require scoped manager/Admin permission for controls and navigation, with a successful roster/session query before management actions. Backend authorization remains authoritative. |
| Contribution-track labels were duplicated; attendance DTOs and meeting/attendance labels were defined inline. | Reuse the existing volunteer track mapping and centralize coordination DTOs and labels. |

The first four defects were reproduced against the pre-fix Docker application: three HTTP 500 responses and one unsafe OFFLINE URL accepted with HTTP 201. The corrected application returns HTTP 400 for all four cases.

## Verification performed

| Check | Result |
| --- | --- |
| Backend `mvnw clean package -DskipTests`, Java 21 / Spring Boot 3.4.3 | PASS; 156 source files, executable jar |
| Frontend TypeScript / Vite production build | PASS; 303 modules |
| Docker backend/frontend builds and `compose up --build --detach --wait` | PASS; PostgreSQL, backend, frontend healthy |
| Default and development Compose configuration | PASS |
| Nginx syntax and direct/proxied readiness | PASS; UP |
| Existing PostgreSQL migration history | PASS; V1–V11 successful |
| Fresh PostgreSQL 16, production profile, bootstrap disabled | PASS; 11 SQL migrations, Hibernate validation, readiness UP; zero users/completions |
| Existing Phase 6 workflow and edge checks | PASS; 183 HTTP assertions |
| Additional audit cases | PASS; 48 HTTP assertions |
| Direct database guards, rolled-back invalid writes | PASS; 8 checks |
| Phase 5 recruitment regressions | PASS; 133 HTTP assertions |

Audit cases include malformed and credential-bearing URLs for both meeting types, valid optional OFFLINE HTTP(S) URLs, null clear-field entries, null attendance rows/fields, atomic rejection of mixed batches, unchanged versions/data after rejection, subsequent valid attendance writes, and terminal/progress capability flags. Existing checks cover scoped permissions, accepted-only participants, partial patches, assignment replacement, state transitions, final verification, exact decimal hours, pagination, stale writes, and concurrent task/attendance/completion commands.

Browser verification used an isolated local Chrome profile because the browser skill's connection tool is unavailable. No existing browser profile, cookies, or storage were inspected. Verified:

- OFFLINE URL validation displays a field error and retains title/description; correcting the URL saves successfully.
- Accepted students view the persisted meeting without visible edit/create/delete controls.
- Student visits to attendance/completion management show permission errors without manager controls or workspace navigation.
- Student history shows final verification and official hours separately from attendance.
- The meeting screen has a 390px document width at a 390px viewport; its screenshot was visually inspected.

The host npm `min-release-age` configuration warning remains nonblocking. No automated test source tree or test dependencies were added; temporary manual verification helpers and private fixture data remain ignored in `.verification/`.

## Schema, configuration, and exit criterion

No applied migration was edited and no schema change was needed. V11 contains the six required tables, scalar foreign keys, audit/version fields, attendance/completion uniqueness, required indexes, verification/hour/date constraints, and accepted-volunteer guards. Application services enforce scoped permission, state transitions, and atomic writes. Cross-module access continues through campaign and identity application ports; volunteer persistence does not query foreign module tables. Flyway remains enabled, Hibernate uses `validate`, and Open Session in View remains disabled.

The fresh database used role `phase6_audit2`, distinct from schema `dut_connect`. Its isolated Compose stack was stopped after verification, retaining its database volume. The normal application remains healthy at `http://localhost:8080`.

The Phase 6 exit criterion is satisfied: an accepted volunteer can view meetings, receive and progress assigned tasks, have attendance recorded across multiple sessions, and receive final manager/Admin completion verification with official hours visible in private history. The audit found no remaining Phase 6 blocker. Donation/payment and all later-phase implementation remain deferred.
