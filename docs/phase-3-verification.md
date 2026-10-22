# Phase 3 verification

Verified on 2026-10-02. Scope: organizations plus the requested Phase 2 regression checks. Proposals and campaigns remain Phase 4 work.

The subsequent [Phase 3 audit](phase-3-audit.md) records additional fixes, V7 ownership serialization, fresh database verification and current build results.

All checks below were manual HTTP, browser, database or build inspections. No automated test suites, test dependencies or test sources were added. Local verification credentials/artifacts are ignored and are not included in this document.

## Builds and migrations

- Java 21 / Spring Boot 3.4.3 Maven Wrapper clean package with tests skipped passed: 68 Java source files.
- TypeScript and Vite production build passed on the host and in the Node 22 Docker image.
- Final Docker Compose build/start completed with PostgreSQL, backend and frontend healthy. Default/development Compose configurations and Nginx configuration passed validation.
- Existing V1–V3 database applied V4 organization tables, V5 six organization-type seeds and V6 schema-qualified ownership enforcement; Hibernate validation passed. Already-applied migrations were not changed.
- A separate empty production-profile PostgreSQL 16 stack applied V1–V6 and passed Hibernate validation, with bootstrap disabled and zero initial users. Its database role differed from the application schema name.
- Registration, login and organization creation worked in that separate stack. Creation returned OWNER membership and PENDING_VERIFICATION. Production login/refresh cookies carried Secure, HttpOnly, SameSite=Lax and the expected path/lifetime; expiresIn was 900.

## Phase 3 exit criterion

The detail response invokes the reusable `OrganizationAccessPort` implementation, so these HTTP checks exercise the same permission boundary available to Phase 4.

| Account / organization | canRepresent |
| --- | --- |
| Active OWNER, VERIFIED | true |
| Active MANAGER, VERIFIED | true |
| Active MEMBER, VERIFIED | false |
| Unrelated active user, VERIFIED | false |
| OWNER/MANAGER, PENDING_VERIFICATION | false |
| OWNER/MANAGER, SUSPENDED | false |

The existing authentication boundary rejects suspended accounts before protected actions. Organization membership creates no campaign manager records or privileges.

## Organization behavior and consistency

| Manual check | Observed result |
| --- | --- |
| Type catalog | Six UUID-backed active organization types in the stable page envelope. |
| Create organization | 201; pending organization and creator OWNER persisted together. |
| Case-insensitive duplicate organization name | 409 CONFLICT. |
| Vietnamese slug | Name beginning “Đội Sinh viên” produced a readable `doi-sinh-vien-…` slug. |
| Pending/suspended visibility | Anonymous and unrelated users received 404; members/admin could read the private organization. |
| Public browse | Only VERIFIED organizations returned. |
| Add member | 201; exact student ID resolved through the identity port; parent version incremented. |
| Duplicate membership | 409 CONFLICT. |
| Private member list | Members/admin succeeded; unrelated user 403; anonymous 401. |
| Metadata editing | MANAGER succeeded; MEMBER 403; stale version 409. |
| Membership management | OWNER succeeded; MANAGER and former OWNER after transfer received 403. |
| Verify/suspend/restore | Correct transitions succeeded; verify on a suspended organization returned 409 INVALID_STATE_TRANSITION. USER moderation returned 403. |
| Ownership transfer | New OWNER and former OWNER's MANAGER membership changed in one transaction. |
| Final OWNER removal/demotion | Both returned 409; ownership remained intact. |
| Direct OWNER assignment | 400 directing the caller to ownership transfer. |
| Concurrent membership mutations | Same expected version produced one 200 and one 409. |
| Remove ordinary member | 204; subsequent detail showed no membership and canRepresent=false. |
| Negative mutation version | 400 VALIDATION_ERROR. |
| Deferred database protection | A manual transaction using `search_path=public` tried deleting the final OWNER. Commit failed with the owner invariant; rollback retained one OWNER. |
| Member display queries | Organization persistence reads its own memberships; identity snapshot lookup batches the member IDs, avoiding direct foreign-repository/entity access and N+1 queries. |

## Browser checks

- Anonymous creation navigation redirected to login. USER login returned to `/organizations/new`.
- Created an organization through the form, opened its pending detail, and added a member; inline feedback and member table updated.
- Reloading the pending organization restored the session first: refresh 200, detail 200, type catalog 200, member list 200. The page retained the OWNER view.
- A concurrent session changed the organization while the browser held an edited name. Save returned the version conflict and preserved “Unsaved organization draft.”
- ADMIN login returned to `/admin/organizations`; the review list displayed both pending and verified organizations. Opening a pending detail and confirming verification displayed the VERIFIED badge and success feedback.
- ADMIN reload restored the session and protected member/review access without another login.
- Inspected a 375px screenshot of organization detail/edit/member controls. The document width was 375px, with member-table overflow contained in its scroll area.
- Used an isolated local Chrome session because the preferred browser execution tool was unavailable.

## Required Phase 2 exit criteria

| Criterion | Evidence | Result |
| --- | --- | --- |
| USER login | HTTP 200 and browser login loaded the protected profile and organization creation screens. | Pass |
| ADMIN login | HTTP 200 and browser login loaded organization review; admin user listing remained 200. | Pass |
| Refresh survives browser reload | USER pending-organization reload and profile reload restored access; ADMIN detail reload did likewise. | Pass |
| Protected route works | Anonymous protected navigation redirected to login. Anonymous member API returned 401; USER admin API returned 403. | Pass |

Also rechecked current profile access, refresh rotation/replay and logout: refresh succeeded once, consumed-cookie replay returned 401, logout returned 204, and refreshing the logged-out cookie returned 401.

The normal stack remains available at localhost:8080 with the standard token lifetimes. The separate verification stack was stopped without deleting either database volume.
