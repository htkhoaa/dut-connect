# Phase 4 verification

Executed on 2026-10-02 against the local Docker application. The scope is Phase 4 from spec.md; later phases remain deferred. No automated test suite, test dependency, or test source was added. Temporary HTTP/database/browser verification helpers and credentials stay in ignored `.verification/`.

## Required Phase 1 exit criteria

| Check | Result |
| --- | --- |
| Backend `mvnw.cmd -B -ntp clean package -DskipTests` | PASS; Java 21, 110 sources, executable jar. A workspace Maven cache was used. |
| Frontend `npm run build` | PASS; TypeScript and Vite production build, 286 modules. |
| `docker compose up --build --detach --wait` | PASS; both images build and PostgreSQL/backend/frontend become healthy. |
| Default and development Compose `config --quiet` | PASS. |
| Container `nginx -t` | PASS. |
| Nginx `/healthz` and proxied backend readiness | PASS; `ok` and `{"status":"UP"}`. |

The host npm build emits the existing warning that its npm version does not recognize `min-release-age`. The locked container build succeeds using its Node/npm image. This warning did not prevent any build.

## Phase 4 exit criterion

Concurrent approval requests for one PENDING proposal and version produced **one 200 and one 409**. The persisted proposal is APPROVED; exactly one campaign refers to it and exactly one campaign manager has OWNER role. The successful response starts at DRAFT, with the complete approved content snapshot and proposer primary contact. Repeated approval returns 409.

The unique campaign proposal ID rejects a second campaign. The OWNER partial unique index rejects a second OWNER. A deferred database constraint rejects deleting the sole OWNER and rolls the transaction back. Approval eligibility failures leave the proposal PENDING with no campaign.

## Migrations and architecture

- Existing database upgrades from V7 through V8 campaign tables and V9 category seeds. Subsequent startup validates checksums and reports schema version 9 with no migration required.
- A separate empty PostgreSQL 16 database under production profile applies V1–V9. Database role `phase4_audit` differs from schema `dut_connect`; Hibernate validation succeeds and all services are healthy. Counts: six categories, ten skills, zero bootstrap users. The temporary stack was stopped while preserving its volume.
- Category/proposal/campaign mutable records have versions. Membership/skill writes lock and increment the campaign version; approval locks the proposal. Slug allocation uses transaction advisory locks.
- Campaign application/domain code has no Spring Data, EntityManager, JdbcClient, HTTP responses, or foreign-module repository/entity access. Cross-module data comes through identity, skill, and organization application snapshot ports; display lookups are batched.
- Controllers return explicit DTOs and the existing pagination/error envelopes. Security permits the public category/list/detail paths without opening nested manager/skill paths. Business authorization is also enforced in application services.
- Money remains BigDecimal/numeric(19,0), with exact decimal-string DTOs and frontend BigInt formatting. No test source/dependency or Phase 5 implementation was introduced.

## HTTP checks

The final implementation passed **95 primary HTTP assertions**, **18 additional lifecycle/account/concurrency checks**, and two malformed-collection checks. These covered:

- USER/ADMIN login, public categories, private proposals, USER admin denial, and public browse.
- Complete HYBRID content, exact maximum 19-digit VND values, partial edits/clearing, stale versions, private detail permissions, rejection reason/audit, and immutable reviewed proposals.
- Invalid dates, fractional money, combined volunteer targets, invalid pagination/sort, literal search wildcard escaping, and null skill/clear-field entries.
- VERIFIED organization OWNER/MANAGER proposal eligibility, MEMBER/unrelated denial, approval recheck after suspension, and rollback followed by successful approval after restoration.
- Private DRAFT visibility, private paginated manager/skill lists, managed/admin campaign lists, and public ID/slug detail after opening.
- OWNER/ADMIN manager assignment, MANAGER assignment denial, duplicate/final-OWNER protection, active-account requirement, organization membership requirement, and manager removal.
- Active skill IDs, unique skill/track pairs, importance bounds and default 3, replacement, and public skill display.
- Stable campaign slugs after edits, immutable organizer, mode restriction outside DRAFT, unauthorized edits, and concurrent edits producing one 200 and one 409.
- DRAFT → OPEN → ACTIVE → COMPLETED; cancellation from DRAFT, OPEN, and ACTIVE; invalid transitions; terminal content/team/skill writes and reopen rejection.
- Category creation/edit/deactivation, inactive public exclusion, invalid new category selection, and stale category updates.

Live checks found and fixed a Hibernate query escape-literal error and new-entity version accessor unboxing. Final HTTP checks and builds were rerun after the fixes.

## Browser checks

An isolated local browser was used because the browser plugin connection tool is unavailable in this environment. Existing user browser sessions, cookies, and storage were not inspected.

- Student submitted a complete proposal through the form. A combined-target validation failure displayed its field error while retaining title, counts, and exact budget; correcting it succeeded.
- ADMIN opened the proposal, confirmed approval, and reached the new DRAFT management page. The confirmation focused Cancel.
- Skill requirement selection/replacement succeeded with confirmation and visible success feedback. Campaign content save succeeded with its ownership controls disabled.
- The campaign OWNER signed in, reached the private workspace, and opened the campaign through the confirmed lifecycle action. Reload restored the authenticated workspace before private data loaded.
- Public campaign detail displays full content, organizer/contact, status, structured skills, and an exact `9.999.999.999.999.999.999 ₫` budget.
- At a 390px mobile viewport, public detail has 390px scroll width, wrapped navigation/title/content, and no horizontal overflow; screenshot was visually inspected.
- Anonymous navigation to the protected new-proposal route redirects to login.
- ADMIN created a category through its maintenance form and saw the saved category and success feedback.

Implementation decisions and API payload conventions are documented in README.md. The main local stack remains healthy at `http://localhost:8080`.

## Phase 4 audit and fixes

The follow-up audit read the complete specification and inspected the actual domain, application services, persistence adapters, controllers, frontend forms, security/configuration, and V1–V9 migrations. Applied migrations were preserved; no new schema migration was needed.

| Finding | Correction |
| --- | --- |
| Jackson silently truncated fractional counts, skill importance, and versions. | Disable float-to-integer coercion; malformed numeric requests return 400. |
| Managed campaign queries loaded every membership ID before applying pagination. | Use a database EXISTS filter, count query, bounded ID page, and batch entity loading. |
| UUID-shaped slugs could collide with the campaign ID lookup namespace. | Suffix UUID-shaped initial slugs; preserve existing campaign slugs. |
| Saving unchanged datetime fields discarded seconds and fractional precision. | Preserve local seconds/milliseconds and submit the original instant when unchanged, retaining database microseconds. |
| Review/confirmation state could survive navigation between records. | Key proposal and workspace state by route record ID. |
| Terminal transitions hid their own success message; category success could remain during another operation. | Keep lifecycle feedback visible after completion/cancellation and clear category feedback on new work. |
| PATCH could both supply and clear the same field; PostgreSQL null characters could reach persistence. | Reject conflicting clear instructions and null characters with validation errors. |
| Campaign construction did not enforce the approved proposal prerequisite. | Enforce APPROVED in the domain constructor. |
| Category creation returned an unimplemented public resource URI. | Return the existing admin category resource URI in Location. |

Final host backend and frontend builds passed, as did Docker image builds and healthy startup, both Compose configuration checks, Nginx validation, and direct/proxied readiness (`/api/actuator/health/readiness`). Flyway validated the existing schema at version 9. A separate empty production-profile database with role `phase4_audit` applied V1–V9 and passed Hibernate validation; it contained six categories, ten skills, and no bootstrap users. Its stack was stopped and its volume retained.

The final running application passed the **95 primary** and **18 additional** HTTP checks again, plus **30 audit assertions** covering fractional integer rejection, conflicting clear instructions, null-character validation, precise deadline snapshots, UUID slug lookup, and bounded public/managed pagination with both supported sorts. Database checks confirmed one persisted campaign and OWNER per approved proposal and rejection of duplicate campaigns, duplicate OWNERs, and sole-OWNER deletion.

Browser verification confirmed an unchanged save retains `2026-10-30T10:00:30.123456Z` in PostgreSQL, record navigation clears previous form/confirmation state, and cancellation retains visible success feedback in the read-only workspace. The 390px mobile workspace has 390px scroll width; its screenshot was visually inspected. The isolated browser was closed after verification.

Phase 4's exit criterion is satisfied: approval creates exactly one DRAFT campaign and OWNER in one transaction, including concurrent approval attempts. No Phase 5 feature, automated test source, or test dependency was added.
