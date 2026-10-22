# Phase 3 audit

Audited on 2026-10-02 against the complete `spec.md`, including sections 3, 5–8, 10, 24–31, 37–41 and the Phase 3 roadmap. Inspected actual domain/application/API/persistence code, identity read ports, frontend routes/forms/hooks, all migrations, security configuration, Dockerfiles, Compose, Nginx, application configuration and current build output.

## Findings fixed

| Finding | Fix |
| --- | --- |
| Organization/member writes checked the expected version before checking membership authority. An unrelated caller could get a version conflict instead of access denied. | Acquire the aggregate lock, check the required organization permission, then check the expected version. Membership is checked after acquiring the lock so a concurrent ownership transfer cannot leave stale authority. Admin moderation still checks ADMIN first. |
| Dirty edit state and member/moderation action state could carry across cached organization detail routes because React reused the same component instances. | Key the form, member controls and moderation controls by organization ID. Preserve drafts on same-organization errors/refetches, reset them when the organization changes. |
| The deferred owner constraint checked owner existence without serializing direct database membership changes. Two transactions deleting different owners could validate against each other's uncommitted owner records. Application locks protected API commands but did not reinforce this invariant for other database writers. | Add V7 with a BEFORE membership trigger that writes the parent organization row. This serializes writes at READ COMMITTED and causes a conflicting older snapshot to fail at REPEATABLE READ. The deferred owner check remains in place. The trigger preserves the JPA-managed version; application membership commands still increment it exactly once. V1–V6 were not edited. |
| The member-add form displayed only the general error and did not map backend field errors. | Map student ID and role field errors to React Hook Form while retaining entered values. |
| Slug allocation checked availability without serializing concurrent creations. Different names that normalize to the same slug could collide at insert instead of receiving the required suffix. | Serialize allocation by normalized slug with a transaction-scoped PostgreSQL advisory lock, then check availability and append a suffix when needed. Duplicate organization names still conflict. |

## Verification results

- Backend Maven Wrapper clean package with `-DskipTests`: passed, Java 21 / Spring Boot 3.4.3, 68 Java sources.
- Frontend TypeScript/Vite production build: passed, 270 modules. Docker frontend build used Node 22.
- `docker compose up --build --detach --wait --wait-timeout 180`: passed; PostgreSQL, backend and frontend healthy.
- Default and development Compose configurations and Nginx `nginx -t`: passed.
- Existing database: Flyway validated prior migrations and applied V7; Hibernate validation and startup passed.
- Separate empty PostgreSQL 16 database, production profile, bootstrap disabled, database role `phase3_audit` different from schema: applied V1–V7, six type seeds, initially zero users, Hibernate validation passed. Registration/login/organization creation returned 201/200/201 with OWNER and PENDING_VERIFICATION, version 0.
- Pending organization detail: owner 200, anonymous/unrelated 404. Anonymous member list 401.
- Unrelated stale metadata/member writes: 403; authorized stale edit: 409.
- Member creation: MANAGER/MEMBER both 201, parent version incremented exactly once each.
- Rename: 200 and unchanged slug.
- Concurrent creation of different names with the same normalized Vietnamese slug: both 201, distinct slugs, one with the short suffix. Case-insensitive duplicate name: 409.
- Admin verify/suspend/restore: 200; suspended organization unavailable publicly and cannot be represented.
- VERIFIED representation: OWNER and MANAGER true; MEMBER, unrelated USER and unrelated ADMIN false. The detail response exercises the reusable `OrganizationAccessPort`, not a separate permission calculation.
- Final OWNER removal: 409, membership retained.
- Concurrent edits with one expected version: one 200, one 409.
- Ownership transfer after V7: 200, parent version incremented once, former owner became MANAGER and subsequent member removal returned 403.
- Direct concurrent deletion of two owners in an isolated audit organization: one transaction committed and one failed at both READ COMMITTED and REPEATABLE READ. One OWNER remained. Restored the fixture's original owner afterwards.
- USER admin organization access 403; ADMIN list 200.
- Browser USER login succeeded. Organization reload restored the session (refresh/detail/catalog/member list all 200).
- Browser navigation from an edited organization to an already cached organization detail loaded the destination name and did not carry `Unsaved audit draft` into its form.

Existing Phase 3 implementation verification is recorded in [phase-3-verification.md](phase-3-verification.md). This audit's runtime checks use manual HTTP/browser/database inspections; no automated test sources or dependencies were added. An isolated local browser was used because the preferred browser execution tool was unavailable.

The normal stack remains available at localhost:8080. The separate verification stack was stopped while retaining its database volume. Phase 4 tables, proposal endpoints and campaign behavior remain unimplemented; Phase 3 supplies their required organization permission boundary.
