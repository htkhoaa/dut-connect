# Phase 5 verification

Executed on 2026-10-02 against the local Docker application. Scope: spec.md Phase 5, volunteer recruitment. No automated test source, test dependency, or Phase 6 implementation was added. Temporary manual verification helpers and fixture credentials remain in ignored `.verification/`.

## Builds and infrastructure

| Check | Result |
| --- | --- |
| Java 21 / Spring Boot 3.4.3 host backend clean package with skipped tests | PASS; 121 sources, executable jar. Workspace Maven cache used. |
| Frontend TypeScript + Vite production build | PASS; 291 modules. |
| Docker image builds and `docker compose up --build --detach --wait` | PASS; PostgreSQL, backend, frontend healthy. |
| Default and development Compose configuration | PASS. |
| Container Nginx syntax and proxied/direct backend readiness | PASS; readiness returns UP. |
| Existing database V9 → V10 | PASS; Flyway migration followed by Hibernate validation. |
| Empty PostgreSQL 16 database, production profile | PASS; V1–V10 applied, Hibernate validated, services healthy. |

The empty database used role `phase5_audit`, different from schema `dut_connect`, and contained six categories, ten skills, zero bootstrap users, and zero registrations. The separate stack was stopped and its volume retained. Applied V1–V9 migration files remain unchanged. The existing host npm warning about `min-release-age` does not prevent builds; the container build succeeds.

## Recruitment and authorization

The running application passed **92 Phase 5 HTTP assertions**, **17 additional authorization assertions**, and **24 additional deadline/mode/terminal assertions**:

- Authenticated creation returns 201/PENDING without assignment or review; invalid tracks, blank/oversized motivation, oversized availability, null characters, malformed versions, and invalid filters/pagination return 400.
- Concurrent duplicate submissions produce exactly one 201 and one 409 DUPLICATE_APPLICATION. A unique campaign/user database constraint independently rejects direct duplicates. Rejected/cancelled registrations cannot reapply.
- Anonymous application, applicant-list, and summary calls return 401. Unrelated users cannot list/review applicants. An organization member without campaign assignment receives 403.
- Campaign OWNER/MANAGER and ADMIN can list/review. Manager reviewer ID/time persist. Students see only their own records, including when filtering by another campaign ID.
- Acceptance selects final track independently of preference; ACCEPTED filters use assigned track. Acceptance above total/track targets succeeds and summary counts accurately reflect both tracks.
- Required rejection reasons are trimmed and stored with reviewer/time. Cancellation is restricted to the pending registration's owner, including when the campaign is terminal; ADMIN/campaign ownership does not bypass student ownership.
- Accepted/rejected/cancelled records are terminal. Stale versions conflict. Competing acceptance/cancellation produces exactly one success and one 409.
- DRAFT, donation-only, expired-deadline, ACTIVE, COMPLETED, and CANCELLED campaigns reject new applications. HYBRID and VOLUNTEER_ONLY recruitment both work. Null deadline allows applying while OPEN. Pending review is permitted after the deadline in OPEN/ACTIVE; terminal campaigns block review while students may cancel their own pending registrations.
- Suspended users cannot perform protected actions and cannot be newly accepted. Restoring the candidate permits a manager to reject the pending record.
- Database guards reject accepted records without assigned track, rejected records without reason, and inconsistent review actor/time.

The previous Phase 4 **95 primary** and **18 additional** checks also passed after the Phase 5 changes, including proposal approval, scoped campaign permissions, lifecycle, categories, skills, and optimistic concurrency.

## Architecture and scope

- Volunteer domain owns registration behavior; repositories are application interfaces with Spring Data/JDBC implementations in infrastructure. Controllers call application services and return DTOs/page envelopes.
- Cross-module UUID references remain scalar. Campaign/identity data is accessed through application snapshots and batched display lookups. Volunteer SQL reads only volunteer-owned tables.
- Recruitment commands lock the campaign through its application port before registration mutation. Campaign lifecycle, metadata, and membership writes use that same parent lock. Account share locks stabilize active-account checks; versions protect stale registration decisions.
- Capacity data uses aggregate SQL; lists page in the database with deterministic sorting and bounded size. Applicant content and identifiers are never exposed through public campaign detail.
- Frontend server state remains in TanStack Query; existing Axios, auth memory store, route guards, RHF/Zod, components, and semantic theme are reused.
- Decisions, payloads, deadline boundaries, review states, effective-track filters, and cancellation policy are documented in README.md. Tasks, meetings, attendance, completion history, payments, finance, AI, dashboards, and reports remain deferred.

## Browser checks

An isolated local browser was used because the browser skill's connection tool is unavailable. Existing user browser sessions, cookies, and storage were not inspected.

- A student submitted an application through public campaign detail. A server-side null-character validation error displayed its message and preserved motivation/availability; correcting it succeeded and showed PENDING with success feedback.
- My applications displayed the student's submitted content and status. Campaign detail replaced the apply form with existing application status, preventing duplicate submission through that UI.
- The campaign OWNER reviewed the applicant, selected Technical, and saw the explicit total/track capacity warning before confirming acceptance. The dialog focused Cancel. Updated feedback and assigned track were visible; the accepted-team route showed Technical and Logistics volunteers and correct counts of two accepted against a target of one.
- Manager rejection through its reason form and confirmation persisted the reason and REJECTED status. Student pending cancellation through confirmation persisted CANCELLED and visible success feedback.
- Reloading private manager/team routes restored authentication and retained persisted states. Anonymous navigation to My applications redirected to login.
- The accepted-team screen at a 390px viewport had 390px document scroll width, with wrapped navigation, student IDs, content, targets, and assigned tracks. Its complete screenshot was visually inspected.
- The isolated browser was closed after verification.

## Phase 5 exit criterion

The end-to-end application flow works with backend authorization: an active student applies to an eligible OPEN campaign, their registration is private and unique, an authorized manager/Admin accepts with final track or rejects with reason, and the student sees the updated result or cancels their own pending registration. Invalid, duplicate, stale, terminal, and unauthorized operations are rejected.

The main local stack remains healthy at http://localhost:8080.
