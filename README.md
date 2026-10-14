# DUT Connect

Student volunteer, donation, and campaign coordination for the University of Science and Technology — The University of Danang. `spec.md` is the authoritative implementation contract.

GitHub/Vercel preparation: [source exclusions, frontend settings, and API/domain requirements](docs/github-vercel.md).

## Current scope: Phase 11 — core hardening and finalization

Phase 1 provides a runnable infrastructure foundation: Java 21 / Spring Boot **3.4.3**, Maven Wrapper, React / TypeScript / Vite, PostgreSQL 16, Flyway, Docker Compose, Nginx, and live backend readiness shown on the frontend.

Phase 2 adds registration, BCrypt login, JWT access, refresh rotation, logout, current-user lookup, profiles, skills, admin user management, controlled admin bootstrap, and frontend authentication with protected routes.

Phase 3 adds organization types, creation, editing, membership, ownership transfer, admin verification/suspension/restoration, public browse, My Organizations, and scoped representation permissions.

Phase 4 adds configurable campaign categories, private proposals, admin approval/rejection, transactional draft campaign creation, campaign managers, lifecycle transitions, public browse/detail, campaign editing, and structured skill requirements. No automated tests are included.

Phase 5 adds volunteer recruitment: private applications, acceptance with final assigned tracks, rejection reasons, pending cancellation, student application history, campaign applicant management, accepted teams, and capacity warnings.

Phase 6 adds meetings, tasks and assignments, task progress/correction/verification, multi-session attendance with atomic bulk updates, completion and official verified hours, student tasks, and volunteer history.

Phase 7 adds donations, payment intents, local mock checkout, ZaloPay Sandbox order creation/MAC verification/query, atomic and idempotent settlement, private donation history, and backend-authoritative payment results.

Phase 8 adds pending expense submission/editing, Admin approval/rejection, public approved expenses, exact financial summaries and fundraising progress, and manager/Admin finance pages.

Phase 9 adds advisory volunteer matching through an OpenAI-compatible HTTP adapter, graceful disabled mode, minimal matching snapshots, strict result validation, and a manager matching page.

Phase 10 adds Admin and campaign dashboards, private volunteer and financial Excel reports, and authenticated download controls.

Phase 11 reviews the complete core against the final Definition of Done, hardens logout during refresh rotation, enforces finite verified hours, completes JSON media-type error handling and callback diagnostics, and consolidates final verification and demo documentation. Stretch features remain out of scope.

The subsequent user-authorized UI update uses Vietnamese, a Tailwind CSS component system, responsive public pages and workspace sidebars, campaign/organization cards, and real campus photographs supplied in image/ and credited photographs from DUT news. The public URL is now **http://localhost:80** (equivalent to **http://localhost**), overriding the original spec's suggested public port 8080; backend-to-Nginx traffic and backend health checks still use internal port 8080. Google OAuth is disabled and does not appear in the interface.

For the new UI and DUT demonstration data, see [UI verification and demo guide](docs/ui-redesign-verification.md). This is a refinement of the existing core, not a new roadmap phase.

Preview: [desktop](docs/ui-preview.png) · [mobile](docs/ui-preview-mobile.png). Search updates automatically after a 300 ms typing pause. All routes have a real-campus photographic background; organization cards also include photos.

To populate a local `dev` stack with fictional DUT examples after startup:

```powershell
node scripts/seed-demo.mjs
```

The importer creates six student accounts, six organizations and eight campaigns using normal authenticated APIs, including approval, recruitment, tasks, attendance, verified completion, mock payment callbacks and expense review. It does not seed users through Flyway or invent frontend financial totals. Records show **Dữ liệu mẫu**, photographs show **Ảnh tư liệu DUT** or **Ảnh khuôn viên DUT**. It preserves existing records and reuses its completed local seed state on subsequent runs. Date ranges are relative to the initial import date.

Demo account credentials are generated locally and saved in the ignored `.local/demo-accounts.json`; they are never printed or bundled into the frontend. Read the `people.<role>.values` entries for email/password. Available roles are `organizer`, `technical`, `logistics`, `donor`, `applicant`, and `manager`. Use the existing bootstrap administrator for administrative screens. Do not commit `.local` or `.env`.

The importer refuses non-local origins and non-dev profiles. It simulates paid contributions only when the configured provider is the available local mock. It does not perform external ZaloPay payments. An alternate local port can be selected with `DUT_DEMO_ORIGIN`.

To keep old phase-verification fixtures out of the local presentation catalog without deleting history:

```powershell
node scripts/configure-demo-catalog.mjs --apply
docker compose up -d --wait
```

The exact excluded IDs/names are recorded in the ignored `.local/catalog-exclusions.json`. The four `APP_DEMO_CATALOG_*_IDS` values in `.env` apply only in `dev` (and never when `prod` is active). Counts and pagination use the same backend predicates. Direct record access, payments, exports and system-wide statistics retain the underlying history. Clear these four values and recreate the backend to show all records again. No migration or business data is deleted.

## Architecture and decisions

- One backend deployable, one frontend deployable, and one PostgreSQL database.
- Base Java package: `vn.edu.dut.connect`. Phase 1 configuration lives in `shared.infrastructure`; subsequent domains use module packages with `domain`, `application`, `infrastructure`, and `api` layers. Do not introduce root packages organized by layer.
- Flyway owns the single logical application schema `dut_connect`. It creates the schema and records `V1__initialize_application_schema.sql`. Domain tables and stable reference-data seeds will be introduced by new migrations in their own phases. No speculative domain entities or extra infrastructure tables are created in Phase 1.
- Hibernate starts after Flyway with `ddl-auto=validate`, `default_schema=dut_connect`, and Open Session in View disabled. V2 creates identity tables and V3 seeds the ten specified skills; the applied V1 remains unchanged.
- SQL script initialization is disabled. Never use Hibernate `create`/`update`, PostgreSQL native enums, or modify an applied/shared migration.
- Security is stateless. Registration, login, refresh, GET skills/categories, verified organization browse/detail, public campaign browse/detail, and GET/HEAD health are public. Identity/profile operations require an active account; organization and campaign mutations enforce scoped permissions; admin APIs require ADMIN. Server form login, HTTP Basic, session logout, request caching, and the generated default user are disabled.
- Actuator is mounted at `/api/actuator` so the same `/api/` proxy covers both business APIs and health. Only health is exposed, without internal details. Readiness includes database connectivity; liveness remains independent of the database.
- Database pool acquisition waits at most 3 seconds (connection validation: 1 second), allowing failed readiness to return before frontend, container, or proxy timeouts.
- The frontend uses React Router and TanStack Query. Feature hooks own requests; components never call Axios directly. Zustand holds only the memory access token and user summary. React Hook Form and Zod validate forms; server validation remains authoritative.
- Colors are centralized in `frontend/src/index.css`. Primary blue `#1556d5` is drawn from the official DUT site's public CSS; the application uses its own layout. Reference: <https://en.dut.udn.vn/>.
- Default Compose is a local development environment with production-built frontend assets. PostgreSQL and backend have no published host ports. The optional development override publishes them on loopback only. Production deployment requires explicit credentials, the `prod` profile, and HTTPS at an appropriate reverse proxy.

## Prerequisites

- Java **21** for a host backend build.
- Node.js **22.12+** and npm **10+** for host frontend development/builds.
- Docker Desktop/Engine with Linux containers and Docker Compose **2.24+** (optional `env_file` support).
- Internet access for Maven, npm, and container-image downloads on the initial build.

Maven is downloaded by the committed wrapper; a global Maven installation is unnecessary. The Node 22 container satisfies the frontend requirement.

On macOS/Linux, ensure the wrapper is executable before its first host invocation: `chmod +x backend/mvnw`.

## Full stack with Docker

From the repository root:

```powershell
Copy-Item .env.example .env
$phase2Secret = node -e "console.log(require('node:crypto').randomBytes(48).toString('base64'))"
(Get-Content .env) -replace '^APP_JWT_SECRET=.*$', "APP_JWT_SECRET=$phase2Secret" | Set-Content .env
docker compose up --build
```

On macOS/Linux, use `cp .env.example .env` and replace `APP_JWT_SECRET` with a securely generated value. A configured secret is now required: missing, short, and example placeholder secrets fail backend startup. Never commit `.env` or real secrets. To create an admin, enable bootstrap and replace its sample password before starting.

Open <http://localhost>. The home page displays campaign and organization cards backed by the API. Use the readiness URL below to check backend/database health.

```powershell
docker compose ps
curl.exe --fail http://localhost/healthz
curl.exe --fail http://localhost/api/actuator/health
curl.exe --fail http://localhost/api/actuator/health/readiness
docker compose logs backend
```

Startup order is PostgreSQL healthy → backend healthy → frontend. PostgreSQL data survives container recreation in the `postgres_data` volume.

To start in the background and wait for health:

```powershell
docker compose up --build --detach --wait --wait-timeout 180
```

To stop while preserving data:

```powershell
docker compose down
```

## Host development

Start only the database with the optional development port override:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --detach postgres
```

In a backend terminal:

```powershell
cd backend
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://localhost:5432/dut_connect'
$env:SPRING_DATASOURCE_USERNAME = 'dut_connect'
$env:SPRING_DATASOURCE_PASSWORD = 'dut_connect_dev'
$env:SERVER_PORT = '8081'
$env:APP_JWT_SECRET = '<your generated secret from .env>'
.\mvnw.cmd spring-boot:run
```

The backend defaults to `dev`. Use database credentials matching your `.env`. Spring Boot does **not** automatically load the repository `.env`; Compose reads it, whereas host development uses shell environment variables. The Docker datasource hostname `postgres` must be replaced with `localhost` when running the backend on the host.

In another terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` to `http://localhost:8081`, preserving paths. Copy `frontend/.env.example` to `frontend/.env.local` to change the proxy target. For debugging the containerized backend instead, run the full stack with both Compose files.

## Build commands

Backend, from `backend/`:

```sh
./mvnw clean package -DskipTests
```

On Windows use `.\mvnw.cmd clean package -DskipTests`. The executable jar is `backend/target/dut-connect.jar`.

Frontend, from `frontend/`:

```sh
npm ci
npm run build
```

The production output is `frontend/dist/`. `npm run preview` serves build artifacts only and does not reproduce the Nginx API proxy; use Docker or Vite development for a connected local application.

Validate both Compose configurations:

```sh
docker compose config --quiet
docker compose -f docker-compose.yml -f docker-compose.dev.yml config --quiet
```

Backend Docker builds use the Maven Wrapper. Frontend Docker builds use `npm ci` and the committed lockfile. Runtime backend runs as a non-root user. Nginx serves static assets, provides SPA route fallback, and proxies `/api/` to `backend:8080/api/`.

Nginx uses Docker's embedded DNS resolver to refresh the backend service address after container replacement, preserving API paths and query strings. Shared response headers are included in locations with cache headers because Nginx does not otherwise inherit parent `add_header` directives there.

## Environment configuration

`.env.example` lists the core configuration. Defaults containing passwords are for local development only.

| Variables | Purpose |
| --- | --- |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Container database initialization; changing these does not update an existing volume's credentials. |
| `SPRING_DATASOURCE_*` | Backend connection settings; Compose derives defaults from `POSTGRES_*` when not overridden. |
| `SPRING_PROFILES_ACTIVE` | `dev` locally, `prod` for production. Production requires an explicit datasource password and suppresses SQL/bind logging. |
| `FRONTEND_PORT` | Published Nginx port, default `80`. |
| `VITE_API_BASE_URL` | Public build-time business API base, default `/api/v1`. Changing it requires rebuilding the frontend. |
| `VITE_BACKEND_PROXY_TARGET` | Frontend-local development proxy target, default `http://localhost:8081`. |
| `APP_JWT_SECRET` | Required random UTF-8 signing string, at least 32 bytes; HS256. Never use the example placeholder. |
| `APP_ACCESS_TOKEN_TTL_MINUTES`, `APP_REFRESH_TOKEN_TTL_DAYS` | Defaults 15 minutes and 7 days; positive integers whose conversion to seconds fits a Java long. Use short access lifetimes and bounded refresh lifetimes. |
| `APP_ALLOWED_ORIGINS` | Explicit browser origins; defaults localhost:5173 and localhost. No wildcard credentials. |
| `APP_BOOTSTRAP_ADMIN_*` | Opt-in startup ADMIN creation; skips an existing email without promoting or changing that user. |
| `PAYMENT_PROVIDER`, `APP_DONATION_*`, `ZALOPAY_*` | Payment provider, donation limits, and sandbox configuration. |
| `AI_ENABLED`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` | Advisory matching; disabled by default. Enable with a compatible API prefix URL, key and model. |
| `AI_MAX_APPLICANTS` | Maximum candidates per matching request, 1–20; default 20. |

Admin bootstrap remains disabled by default, including production. Enabled bootstrap requires valid email, student ID, full name and password; a conflicting student ID fails startup. It creates a BCrypt ADMIN without a student profile, because no faculty is provided by the specified bootstrap configuration. It never logs passwords. Disable bootstrap after provisioning.

ZaloPay Sandbox requires app ID, creation/callback keys, provider URLs, and a publicly reachable HTTPS callback URL. See the Phase 7 setup below. Mock checkout exists only under the `dev` profile and is disabled whenever `prod` is active.

The AI adapter requires an OpenAI-compatible API prefix URL, API key, and model. Disabled/missing configuration returns graceful unavailability without blocking campaign workflows. Only the backend receives the AI key.

## Manual verification and demo

Follow the current [manual smoke checklist](docs/manual-smoke-checklist.md). Current build, hardening findings and runtime observations are recorded in the [Phase 11 audit](docs/phase-11-audit.md); the [initial Phase 11 verification](docs/phase-11-verification.md) records the complete core demo. Earlier phase documents are historical evidence; their deferred-feature notes do not describe the final application.

Use one organization-led HYBRID campaign for the final demo:

1. Start Compose and provision the Admin using the opt-in bootstrap. Register an organizer, Technical student, Logistics student, and donor; fill their profiles and relevant skills. Reload an authenticated page to demonstrate refresh, then sign out and sign in again.
2. Organizer creates an organization. Admin verifies it. Organizer submits an organization HYBRID proposal with volunteer targets, a fundraising goal, institutional funding and sponsor funding. Admin approves once; show the single DRAFT campaign and initial OWNER. Separately demonstrate rejection with a reason.
3. Owner configures skill requirements and opens the campaign. Both students apply; repeat an application to demonstrate duplicate rejection. An organization MEMBER without campaign assignment cannot open management screens or APIs.
4. Run advisory matching if configured; otherwise show explicit AI unavailability and continue. Manager manually accepts both students with final tracks. Show rejection and pending cancellation using separate applicants.
5. Create a meeting and tasks for accepted volunteers. Students move assigned tasks through In progress and Done; manager verifies them. Start the campaign and create two attendance sessions, recording Present/Absent separately from completion.
6. Donor creates a donation and opens checkout. Use ZaloPay Sandbox when credentials and network are available; otherwise use the explicitly labeled dev mock. Show that a redirect query parameter cannot mark the donation paid. A verified server callback updates PAID; replay it and show unchanged payment versions and totals. Refresh a separate pending payment through the backend.
7. Manager submits an expense; Admin approves it. Demonstrate rejection on another expense. Public finance includes only PAID donations and APPROVED expenses, without donor identities. Reconcile institutional + sponsor + paid donations − approved expenses.
8. Manager verifies completion and hours, then completes the campaign. New contributions and ordinary operational edits are blocked; final completion verification, existing expense review, existing payment settlement, dashboards and authorized reports remain available as documented below.
9. Download both Excel reports, open them and compare values with the campaign dashboard. Show Admin metrics, anonymous/student authorization failures, and desktop/tablet/mobile navigation.

Keep real credentials in ignored local environment files or deployment secrets. The example file contains development values and placeholders only. Run empty-database verification with a distinct Compose project/port; never remove the normal development volume. Production cookies require HTTPS, and the mock gateway/endpoints are unavailable whenever `prod` is active. A local HTTP demo therefore uses `dev`.

Verification distinguishes the real ZaloPay adapter and controlled protocol checks from a live merchant checkout, and diagnostic AI responses from a real configured model. Unavailable credentials or external connectivity must be reported explicitly; they do not justify fake success paths.

Executed Phase 1 checks and their results are recorded in [docs/phase-1-verification.md](docs/phase-1-verification.md).

Build outputs and `.verification/` are ignored. No automated test suite is generated or run.

## Phase 2 API and security decisions

- Registration returns 201 with a user summary and redirects the UI to login; it never grants ADMIN. Emails are trimmed/lowercased and student IDs trimmed/uppercased, without an invented DUT email domain, faculty catalog, or student ID format.
- Passwords require at least 8 characters and at most 72 UTF-8 bytes. Schema field limits are enforced; profile experience is bounded at 10,000 characters.
- Email is trimmed before validation; normalized email/student ID lengths are checked before persistence. Token lifetimes are positive configurable values, with defaults of 15 minutes and 7 days. Allowed origins must be complete HTTP(S) origins without paths or credentials.
- Login and refresh return `{accessToken, tokenType, expiresIn, user}`. `GET /api/v1/auth/me` returns the user summary. Neither responses nor logs expose password hashes or refresh-token hashes.
- Refresh uses a host-only `dut_refresh` HttpOnly cookie at `/api/v1/auth`, SameSite=Lax, seven-day lifetime by default, and Secure under the `prod` profile. Production requires HTTPS; the local HTTP Compose demo uses `dev`.
- Login, refresh and logout POSTs require an exact configured `Origin`, including command-line clients. CORS preflight is supported. CSRF is disabled for stateless bearer APIs; cookie requests additionally enforce origins.
- Refresh replacements receive a new seven-day expiry. User-row and token-row locks serialize rotation; consumed tokens cannot be reused. Strict rotation has no cross-tab grace period. Logout revokes the presented cookie's replacement chain for the authenticated user while preserving independent device sessions.
- Logout requires bearer authentication, revokes the current cookie session and clears that cookie. The frontend refreshes once if its access token expired, then logs out. Previously issued access JWTs expire normally; immediate logout invalidation is not specified.
- Frontend login/logout finish pending cookie rotation before changing sessions. Requests retain a session generation so delayed failures cannot refresh, retry or clear authentication after an account change. A failed pending refresh does not skip logout; late refresh responses cannot restore cleared memory.
- Every protected bearer request checks the current database account status and role. Suspension also revokes every refresh token for that account. Restoring an account requires a new login for revoked refresh sessions.
- Profile PUT edits full name, faculty, bio, preferred track and experience. Email/student ID are immutable. It requires `version` and `userVersion`; skills PUT replaces the complete `skillIds` set and requires the profile `version`. Status PATCH requires `status` and user `version`. Stale writes return 409.
- Skill and admin-user lists use the specification's page envelope, default size 20, maximum 100, with deterministic sorting. The skill catalog exposes active entries only.
- There is no additional self-suspension or last-admin safeguard in the contract. Administrators can suspend themselves; provision another ADMIN before doing so. Bootstrap never promotes or restores an existing email.
- Volunteer-history listed under identity is implemented by the volunteer module in Phase 6. Phase 7 donation endpoints are implemented by the donation module.

Executed Phase 2 verification is recorded in [docs/phase-2-verification.md](docs/phase-2-verification.md).

## Phase 3 organization decisions

- V4 creates organization tables and their constraints/indexes; V5 seeds the six specified organization types. V6 qualifies the deferred ownership constraint's table references so it works with a database role different from the `dut_connect` schema name. V7 serializes membership changes at the database boundary, including concurrent changes outside the application services. Existing migrations remain unchanged.
- Organization types are database-backed reference data, with authenticated `GET /api/v1/organization-types` returning active types in the page envelope. There is no organization-type enum or speculative type-management UI.
- Creation atomically saves a PENDING_VERIFICATION organization and its creator's OWNER membership. Organization names are trimmed and unique case-insensitively. Slugs normalize Vietnamese diacritics, add a short suffix for conflicts and remain stable after renaming. Description is optional and bounded at 10,000 characters.
- Public browse exposes VERIFIED organizations only. Public detail returns 404 for pending/suspended organizations. Members may read their own organizations in any status, and admins may review all organizations. Member lists, including student IDs, are private to members and admins.
- OWNER/MANAGER can edit organization metadata; only OWNER can add, change or remove memberships. ADMIN moderation does not implicitly grant membership-management or representation permission. Suspension blocks representation, while authorized metadata and membership maintenance remain available.
- Only active accounts with OWNER/MANAGER membership in a VERIFIED organization can represent it. `OrganizationAccessPort` supplies this check for Phase 4; the detail response/UI uses the same port. Organization membership never creates campaign management privileges.
- Add members by exact student ID using `{studentId, memberRole, version}`. OWNER can grant MANAGER/MEMBER; existing suspended accounts may remain members but cannot authenticate or represent an organization. Identity lookups go through snapshot ports, including a batch lookup for member display, without exposing identity repositories/entities or creating N+1 queries.
- `POST /api/v1/organizations/{id}/transfer-ownership` accepts `{userId, version}`. The recipient must be another existing active member who is not already an OWNER. Promotion and the transferring OWNER's demotion to MANAGER are atomic. The model requires at least one OWNER; it does not impose the campaign-specific exactly-one-OWNER policy.
- All organization/member writes use the organization version. Membership changes lock and increment the parent organization so concurrent commands cannot remove the final OWNER or silently overwrite one another. The database trigger writes the parent row without changing its application-managed version, serializing direct membership writes and preventing owner write skew at READ COMMITTED and REPEATABLE READ. A deferred database constraint rejects ownerless organizations at commit. DELETE membership takes `?version=...` and returns 204; authorized stale writes return 409, while callers without the required organization permission receive 403.
- Organization PATCH preserves omitted fields. Use `clearDescription:true` to clear description; supplying both that flag and a description is invalid. Client forms preserve dirty values and their original version after server errors; navigating to another organization resets its form/action state. Reload organization confirms before discarding changes.
- Organization creation serializes allocation of each normalized slug using a PostgreSQL transaction advisory lock. Concurrent names that normalize to the same slug receive distinct slugs with a short suffix; duplicate organization names still return 409. Slugs remain stable after edits.
- Admin verify, suspend and restore endpoints accept `{version}`. Verify only permits PENDING_VERIFICATION → VERIFIED, suspend VERIFIED → SUSPENDED, and the additional `/restore` command SUSPENDED → VERIFIED. Restoration records the latest verification actor/time; transitions are logged with IDs.
- Organization routes are `/organizations`, `/organizations/:id`, `/organizations/new`, `/me/organizations`, and `/admin/organizations`. The existing navigation and protected login return paths include them.

Phase 3 demo: sign in as a student, create an organization, add another student as MANAGER, then sign in as ADMIN and verify it. Both OWNER and MANAGER can represent the verified organization; MEMBER and unrelated users cannot. Suspend/restore the organization, transfer ownership, and confirm the former OWNER loses membership-management permission.

Executed checks, including the required Phase 2 regression checks, are recorded in [docs/phase-3-verification.md](docs/phase-3-verification.md).

## Phase 4 campaign decisions

- V8 creates categories, proposals, campaigns, campaign managers, and campaign skill requirements. V9 seeds six categories. Unique proposal IDs and a unique OWNER index plus a deferred owner constraint enforce approval cardinality and exactly one campaign OWNER. Existing V1–V7 migrations are preserved; future migrations start at V10.
- Proposals are private to their proposer and ADMIN. Only their proposer can edit while PENDING. Approval rechecks the active proposer, active category, and VERIFIED organization OWNER/MANAGER eligibility, then commits review, a complete DRAFT snapshot, and OWNER membership in one transaction. Organization membership alone never grants campaign permissions.
- DRAFT campaign detail is private to campaign managers and ADMIN; public lists omit it. OPEN, ACTIVE, COMPLETED, and CANCELLED campaigns are public. Only OWNER/ADMIN assigns or removes MANAGER; the sole OWNER cannot be replaced or removed in this phase. New organization campaign managers must be active organization members. Existing campaign assignments remain scoped to the campaign if organization membership/status changes.
- Nonterminal campaign content is editable by campaign managers/ADMIN. Organizer type, organization ID, proposal ID, primary contact, ownership, and slug are immutable. Contribution mode can change only in DRAFT. COMPLETED/CANCELLED block all ordinary writes and cannot reopen. Category deactivation preserves references but blocks new selection and approval.
- Create proposal accepts `{content:{...}}`; content contains the fields from spec §12.4. PATCH accepts `{content:{...},clearFields:[...],version}` and preserves omitted values. Only optional fields may be cleared. Review/state commands require `{version}`; rejection also requires `reason`. Manager addition takes `{studentId,version}`; removal takes `?version=...`. Skill replacement takes `{items:[{skillId,track,importance}],version}`; omitted importance defaults to 3. Category PATCH also requires its version.
- VND values use Java BigDecimal and numeric(19,0); response DTOs encode amounts as decimal strings to preserve precision in JavaScript. Forms retain decimal strings, and display uses BigInt with Intl.NumberFormat. No floating-point financial calculation is introduced.
- Integer counts, importance, and versions reject fractional JSON values. Text rejects PostgreSQL null characters; PATCH rejects a non-null value combined with clearing that same field. Unchanged deadline inputs preserve the original instant, including database microseconds. Campaign slugs reserve UUID-shaped identifiers to keep ID and slug lookup unambiguous.
- All list APIs use bounded pagination. Additional authenticated `GET /me/campaigns`, admin `GET /admin/campaigns`, and admin `GET /admin/campaign-categories` support private campaign management and inactive-category maintenance. Dedicated manager/skill endpoints stay protected; public campaign detail includes skill display data.
- Identity, organization, and skill reads go through application snapshot ports, with batch display lookups. No campaign code accesses another module's repositories/entities/tables.
- Routes: `/campaigns`, `/campaigns/:id`, `/proposals`, `/proposals/new`, `/proposals/:id`, `/manage/campaigns`, `/manage/campaigns/:campaignId`, `/admin/proposals`, `/admin/categories`, and `/admin/campaigns`. Forms preserve dirty input and its version after failures; confirmation dialogs protect review, lifecycle, removal, skill replacement, and category deactivation.
- Public pages display declared funding goals and budgets, verified donation progress, financial totals, and approved expenses. Donation actions are implemented in Phase 7, finance in Phase 8, and private dashboards in Phase 10. Volunteer application actions are implemented in Phase 5 below.

Phase 4 demo: submit a proposal, sign in as ADMIN and approve it, then open Managed campaigns as its proposer. Configure skills, add a manager, edit the campaign, and open it. Browse its public page by ID or stable slug. The final application also supports recruitment, payments, finance, dashboards and reports.

Executed Phase 4 and required Phase 1 checks are recorded in [docs/phase-4-verification.md](docs/phase-4-verification.md).

## Phase 5 recruitment decisions

- V10 creates `volunteer_registrations` with UUID IDs, audit fields, versions, foreign keys, the unique `(campaign_id,user_id)` constraint, status/track checks, consistent assigned/review fields, and campaign/status and user/history indexes. V1–V9 are unchanged. Registrations have no cross-module JPA relationships.
- An active account may apply once per campaign while OPEN, volunteer-enabled, and not past its application deadline. A null deadline adds no time restriction; equality is allowed. Capacity does not limit application count. REJECTED/CANCELLED applications cannot be deleted, reopened, or resubmitted.
- `POST /campaigns/{id}/applications` takes `{preferredTrack,motivation,availability}`; motivation is required and availability is optional, each at most 1000 characters. Strings are trimmed and reject null characters. Identity is always taken from authentication, never from the body.
- Only campaign OWNER/MANAGER or ADMIN may view all applicants, accepted teams, and capacity counts or accept/reject. Organization membership alone grants no campaign permission. Review is permitted in OPEN/ACTIVE, including after the application deadline, and blocked in DRAFT/COMPLETED/CANCELLED. New acceptance requires an active applicant; existing registrations survive suspension.
- Accept takes `{assignedTrack,version}`; final assigned track may differ from preferred track. Reject takes `{reason,version}` with a nonblank reason of at most 1000 characters. Students cancel only their own PENDING registration with `{version}`, including after the campaign becomes terminal. ADMIN does not bypass cancellation ownership. All three commands return the updated DTO; only PENDING may transition.
- Recruitment writes lock the campaign through its application port before locking the registration and validating state. This serializes against lifecycle/content/team changes and competing recruitment commands. Relevant accounts are share-locked for protected writes. Registration versions reject stale decisions, and the unique database constraint reinforces duplicate protection. Lists use database pagination and batched identity/campaign snapshots; the volunteer module never queries foreign tables/repositories.
- `GET /me/applications` accepts optional `campaignId`, `status`, and `track`; campaign applicant lists accept status/track. Both use the stable page envelope, default 20/max 100, ordered newest first with UUID tie-breaker. Track filtering uses assigned track for ACCEPTED and preferred track otherwise. All application content and student identifiers remain private.
- Additional protected `GET /campaigns/{id}/applications/summary` returns database accepted total/track counts, campaign targets, and review eligibility. Acceptance above total or selected-track targets remains allowed, with an explicit warning in the confirmation dialog. These are advisory capacity counts, not the later campaign dashboard.
- UI routes are `/me/applications`, `/manage/campaigns/:campaignId/applications`, and `/manage/campaigns/:campaignId/team`. Public detail includes the apply/sign-in action and the authenticated student's existing status. The team route reuses the paginated ACCEPTED filter. Forms preserve values/version after errors; decisions and cancellation require confirmation. Query caches are scoped to the signed-in account and invalidated after writes.
- Campaign edits/lifecycle/team changes also invalidate recruitment data. Before review confirmation, the UI refreshes server counts and review eligibility; failed refreshes retain the review input and prevent confirmation. Acceptance identifies the applicant and final track and warns when the current total/track target would be exceeded.
- Application history means recruitment records in Phase 5. Phase 6 adds `/me/volunteer-history`, tasks, meetings, attendance, and completions. Phase 9 adds advisory AI matching; Phase 10 adds reports. AI does not execute decisions.

Phase 5 demo: open a volunteer-enabled campaign, sign in as another student and apply, then sign in as its manager and review the applicant. Select the final track and confirm acceptance; the student sees the result in My applications and the manager sees them in Accepted team. Repeat with rejection and pending cancellation, then verify duplicate submission is refused.

Executed Phase 5 checks are recorded in [docs/phase-5-verification.md](docs/phase-5-verification.md).

The subsequent audit, fixes, and repeated verification are recorded in [docs/phase-5-audit.md](docs/phase-5-audit.md).

## Phase 6 coordination decisions

- V11 adds meetings, tasks, assignees, attendance sessions/records, and completions. Applied V1-V10 are unchanged. All coordination belongs to the backend volunteer module, with focused services and application repository interfaces. Infrastructure queries only volunteer-owned tables. Campaign and identity access uses snapshot/read ports; task display, history, attendance counts, and completion data are batched.
- Campaign OWNER/MANAGER and ADMIN manage coordination. Accepted volunteers read campaign meetings and only their assigned tasks. Attendance rosters and completion management are private to managers/Admin. Student history exposes only the current user's accepted participation, attendance counts, and completion; pending/rejected applications remain in My applications.
- Meetings, tasks, and attendance can be changed in OPEN/ACTIVE. DRAFT/COMPLETED/CANCELLED are read-only for those operations. Completion finalization is explicitly allowed in OPEN/ACTIVE/COMPLETED, including after the campaign closes, and blocked in CANCELLED. This resolves the specification's ordinary terminal edit restriction while supporting final verification.
- Meetings validate ordered instants, required ONLINE URL, and OFFLINE location. Every supplied meeting URL, including optional OFFLINE links, must be an absolute HTTP(S) URL without credentials. Text fields trim, reject null characters, and enforce schema limits; otherwise unbounded meeting/task descriptions use a 10,000-character application limit. No future-date or campaign-calendar boundary is imposed. PATCH preserves omitted fields; `clearFields` clears optional description/location/meetingUrl or task dueAt. Null clear-field entries and null attendance rows return validation errors. Unchanged datetime inputs preserve their original instants.
- Tasks begin TODO. Assignees alone perform `/start` and `/done`; a manager must also be assigned to use those commands. Manager/Admin uses `/verify` for DONE -> VERIFIED, with audit actor/time. PATCH `status` supports only IN_PROGRESS -> TODO and DONE -> IN_PROGRESS corrections. VERIFIED tasks cannot edit, reassign, correct, or delete. Task deletion cascades assignments.
- Task writes accept `assigneeUserIds` (complete replacement on PATCH, omitted means unchanged), with at most 100 distinct accepted volunteers from the same campaign. Unassigned tasks are allowed. Assigned and task tracks may differ; confirmation shows a warning. Existing accepted registrations survive account suspension, so managers can record attendance/completion for those participants; suspended accounts cannot perform actions themselves.
- Attendance session end must follow start. PUT records takes `{version,records:[{userId,status}]}`, 1-100 distinct accepted users, and atomically upserts only supplied rows. Omitted users retain records; a missing record means unrecorded, not ABSENT. Every upsert stores the latest recorder/time. The session version increments for each batch, covering records and session edits/deletion together. Session deletion cascades attendance records and requires confirmation.
- Completion PUT takes `{status,verifiedHours,note,version}`. A null/omitted version creates the first record; existing records require their exact version. No completion row is created merely by acceptance; list/history displays Pending until recording. Managers/Admin record PENDING/COMPLETED or issue VERIFIED. PENDING -> COMPLETED -> VERIFIED is enforced; direct verification performs both transitions atomically. VERIFIED is terminal, including hours/note edits. Completion does not require all tasks or attendance to be complete because the contract specifies independent manager verification.
- Hours accept exact decimal values from 0 through 999999.99 with at most two decimal places, without rounding. DTOs encode them as decimal strings. Only VERIFIED hours appear as official hours in student history. Attendance counts never imply completion or award credits.
- Creation returns 201, commands return updated DTOs with 200, and deletes return 204. Edits/deletes/task commands require the resource version; deletes use `?version=...`. Missing/negative expected versions are invalid; stale versions return 409. Lists use the stable page envelope with default 20/max 100 and deterministic order. Attendance/completion uniqueness and accepted-participant guards are reinforced in PostgreSQL.
- All coordination writes lock the campaign before loading mutable children, stabilizing lifecycle and manager permissions. Actor accounts are share-locked; JPA aggregate versions reinforce concurrent updates. Bulk validation and record writes are one transaction. User suspension, campaign completion, and competing commands cannot silently overwrite coordination data.
- Manager routes add `/manage/campaigns/:campaignId/meetings`, `/tasks`, `/attendance`, and `/completions`. Student routes add `/me/tasks`, `/tasks/:taskId`, `/me/history`, and `/me/campaigns/:campaignId/meetings`. Backend history is `/api/v1/me/volunteer-history`; completion management uses the endpoints in spec section 17. Forms retain values/versions after failures, destructive and verification actions confirm, and campaign/application mutations invalidate account-scoped coordination caches.

Phase 6 demo: accept a student, create a meeting and assign a task, sign in as the student to view the meeting and move the task through In progress and Done, then verify the task as manager. Create attendance sessions for two days, record attendance, and verify the volunteer's completion and hours. The student sees the official result separately from attendance in My volunteer history.

## Phase 7 payment setup and decisions

The `donation` module owns donation and payment entities, repository/gateway ports, transactional settlement, provider adapters, and API controllers. V12 creates `donations` and `payment_transactions`; V1–V11 are unchanged. Amounts use `BigDecimal` and `numeric(19,0)`; response amounts are decimal strings. Input accepts whole VND JSON numbers or decimal strings and rejects fractional values. Configured limits default to 10,000–100,000,000 VND.

Local development requires `SPRING_PROFILES_ACTIVE=dev` and `PAYMENT_PROVIDER=mock`. Open an OPEN/ACTIVE DONATION_ONLY or HYBRID campaign, enter an amount, confirm, and choose **Open checkout** on the payment result page. The authenticated mock checkout asks the backend to generate a signed provider event. Success/failure go through the same verification and settlement pipeline as ZaloPay. No money is collected. Mock APIs and the mock gateway are absent in `prod`, including when both `dev` and `prod` are active. There is no silent provider fallback.

For ZaloPay Sandbox, configure these server-only `.env` settings and recreate the backend:

```dotenv
PAYMENT_PROVIDER=zalopay
ZALOPAY_APP_ID=<merchant app ID>
ZALOPAY_KEY1=<order creation/query key>
ZALOPAY_KEY2=<callback key>
ZALOPAY_CREATE_ORDER_URL=https://sb-openapi.zalopay.vn/v2/create
ZALOPAY_QUERY_ORDER_URL=https://sb-openapi.zalopay.vn/v2/query
ZALOPAY_CALLBACK_URL=https://<public HTTPS host>/api/v1/payments/zalopay/callback
ZALOPAY_REDIRECT_URL=http://localhost/payment/result
```

The public HTTPS host must forward the callback path to this backend; local external callbacks need an HTTPS tunnel. The redirect URL must point to the frontend's `/payment/result` route; the backend adds `donationId`. Never put keys in `VITE_*`, browser storage, API responses, provider payload persistence, or logs. With an incomplete selected provider configuration, donations report unavailable while existing campaign and volunteer functions continue to work.

Order IDs start with the Vietnam-local `yyMMdd` prefix. Creation and query use key1; callbacks authenticate the original data string with key2 before parsing trusted fields. Official references: [create order](https://docs.zalopay.vn/docs/specs/order-create/), [callback](https://docs.zalopay.vn/docs/specs/callback-api/), [query](https://docs.zalopay.vn/docs/specs/order-query/), and [status codes](https://docs.zalopay.vn/docs/developer-tools/knowledge-base/status-codes/).

Provider configuration is checked per operation: creation requires both keys and valid provider/callback/redirect URLs; queries require app ID, key1 and the query URL; callbacks require only app ID and key2. Existing callbacks can settle even when new checkout creation is unavailable. Provider response numbers and booleans are validated without coercion. Processing and documented retryable payment failures remain pending; query request failures return 503 without changing local state. Confirmations require positive integer amount, provider transaction ID, and provider payment timestamp. A null mock expiration means no configured expiration, matching the nullable schema.

Intent creation and provider result persistence use separate transactions; network calls run outside them with bounded timeouts. All settlement writers lock donation then payment consistently. Successful callbacks compare merchant, order, amount against both snapshots, and provider transaction reference. Duplicate success acknowledges success without changing versions/timestamps; failures and stale refreshes cannot downgrade PAID.

One payment attempt is created per donation through the current API. The schema and private detail/history responses support multiple attempts; no retry API is specified. Cancellation is represented in the domain/provider settlement state machine, with no new user cancellation or refund endpoint. An early callback settles a CREATED intent through the intermediate pending state within the same atomic transaction. Provider timeouts and duplicate order responses preserve unresolved CREATED intents for refresh. A query confirms failure only for documented expiration; insufficient funds, processing, or query errors do not prove terminal failure. Existing intents may settle after fundraising closes or a donor is suspended; creation still requires an active actor and eligible campaign.

Private detail, checkout, and refresh require the donor or Admin. Being a campaign manager alone gives no access to donor records. My Donations uses bounded pagination, account-scoped query keys, and batch campaign/payment lookup. `/payment/result?donationId=...` displays backend state and explicitly refreshes pending payments. Provider/browser success parameters never set PAID. `GET /api/v1/donation-settings` exposes only provider name, whole VND limits, and availability to the donation form.

See [Phase 7 verification](docs/phase-7-verification.md), [Phase 7 audit](docs/phase-7-audit.md), and [manual smoke checklist](docs/manual-smoke-checklist.md). Finance totals, expenses, refunds, AI, dashboards, and exports remain outside this phase.

## Phase 8 finance setup and decisions

No additional environment variables or credentials are required. Open **Managed campaigns → campaign → Finance** to submit or edit expenses. Admin uses **Expense review** to approve/reject. Public campaign detail shows authoritative totals and approved expenses; campaign cards show verified donation progress.

- V13 creates `campaign_expenses`; audit migrations V14 and V15 enforce finite financial amounts, nonblank rejection reasons and supported expense calendar dates. Applied migrations are unchanged. Category is free text. Proof is a text reference or external URL; no upload infrastructure is added. Only HTTP(S) references without embedded credentials become frontend links.
- Expense submission/editing follows campaign mutability: DRAFT, OPEN and ACTIVE. COMPLETED/CANCELLED block new expenses and editing, while Admin may finish reviewing existing pending expenses. Finance remains available for volunteer-only campaigns with institutional/sponsor funding.
- Scoped managers and Admin can edit any pending expense in the campaign, preserving its original submitter. Only Admin approves/rejects. The spec does not require reviewer and submitter to be different people; no separate self-review prohibition is imposed. Approved/rejected expenses are final, without deletion or resubmission endpoints.
- POST expense body contains `title`, `category`, whole-VND `amount`, `expenseDate` (ISO calendar date, years 0001 through 9999), optional `description` and optional `proofReference`. PATCH accepts these fields selectively plus required `version`; `clearFields` can clear `description`/`proofReference`. Setting and clearing the same field returns 400. Approval requires `{version}`; rejection requires `{version, reason}`. Stale changes and repeated/terminal reviews return 409. Private lists include version, audit names and `canEdit`.
- Public finance endpoints respect existing DRAFT visibility and omit private review identity/rejection fields. Public expense lists always contain APPROVED only. Lists use the stable page envelope, default 20/max 100, ordered by creation time descending and ID.
- Finance consumes campaign funding and PAID donation aggregates through their owning modules' read ports. The required donation read dependency supplements the conceptual dependency list in §28; no foreign repository access or circular service call is introduced. Summary reads share one repeatable-read transaction. They never count payment attempts or accept client totals.
- Money responses preserve the existing exact decimal-string convention. Expense and campaign funding validation checks integer bounds before decimal normalization, including extreme scientific exponents; accepted values have scale zero. Aggregate values are not limited to the precision of one stored amount. Negative remaining funds and over-goal fundraising are permitted and displayed; no unstated budget cap or campaign-date restriction is introduced.
- Progress is PAID donations divided by fundraising goal. Institutional/sponsor funding contributes to total funding separately. A null goal shows verified donations without a progress percentage; over-goal text retains the actual percentage while the visual bar stops at 100%.
- `GET /api/v1/campaigns/fundraising-progress?campaignIds=id1,id2` is a bounded (1–100 IDs) aggregate read for campaign cards, avoiding a request/query per card. Draft manager permissions are checked in one batch, following the same campaign visibility rules.
- Expense mutations, payment mutations/status refresh and campaign edits invalidate finance/progress queries. Normal query refetch on focus and explicit **Refresh totals** pick up callbacks received outside the current browser session.

See [Phase 8 verification](docs/phase-8-verification.md), the subsequent [Phase 8 audit](docs/phase-8-audit.md), and the [manual smoke checklist](docs/manual-smoke-checklist.md).

## Phase 9 AI matching setup and decisions

Open **Managed campaigns → campaign → AI matching**. Campaign OWNER/MANAGER and Admin can select pending applicants or match the latest bounded pending cohort. The screen labels every result **AI suggestion — final decision is yours**. Manual decisions remain on the existing Applications page.

- Configure `AI_ENABLED=true`, `AI_BASE_URL` as the API prefix (for example `https://your-provider.example/v1`), `AI_API_KEY`, and `AI_MODEL`. The adapter appends `/chat/completions`, uses bearer authentication and the Chat Completions `messages`/`response_format: {type: json_object}` contract. The configured model/provider must support that contract. Production requires HTTPS; the dev profile permits HTTP for local adapters. Redirects are not followed. No provider SDK or extra infrastructure is required.
- `AI_ENABLED=false` uses an isolated disabled adapter. Enabled but missing/invalid provider configuration also returns `503 AI_PROVIDER_UNAVAILABLE`; startup and ordinary campaign workflows remain usable. No fabricated AI recommendations are substituted. The actual `.env` is not changed automatically.
- `POST /api/v1/campaigns/{campaignId}/ai/volunteer-matches` accepts `{applicationIds:[...]}`. An omitted body, omitted IDs or null IDs field selects the latest at most `AI_MAX_APPLICANTS` pending records, ordered by creation descending and ID, then excludes inactive/missing profiles. That cohort can contain fewer than the configured limit. Explicit arrays must contain 1–limit distinct, nonnull UUIDs, all pending in this campaign with active profiles. Invalid selections return 400; no partial selection succeeds.
- Matching is allowed in OPEN/ACTIVE VOLUNTEER_ONLY/HYBRID campaigns, including after the application deadline for existing pending applications. DRAFT/COMPLETED/CANCELLED and DONATION_ONLY return 409. Authorization is enforced before reading private matching context. `GET /campaigns/{id}/ai/availability` is an additional manager/Admin-only capability read exposing availability and the batch limit, without credentials or making a provider request.
- Campaign, volunteer and profile data cross application read ports. Profile/skill lookups are batched. A short repeatable-read snapshot collects context; all external calls happen outside database transactions. Authorization and the selected snapshots are rechecked after calls. Concurrent application/profile/campaign changes reject stale results; revoked manager access returns 403.
- Provider payloads contain campaign title/description/volunteer requirements/skill names, tracks and importance; candidate random per-evaluation reference, application preferred track, skills, experience and availability. Account/application IDs, names, student IDs, email, faculty, motivation, credentials and financial data are omitted. Free text is treated as untrusted data; the prompt prohibits invented qualifications and sensitive-attribute inference. Candidate references are never used as persistent identity.
- Structured output requires exactly six fields: integer score 0–100, TECHNICAL/LOGISTICS recommendation, distinct matched/missing required skills, nonblank reason up to 1000 characters, and LOW/MEDIUM/HIGH confidence. Matched skills must also be held by the candidate; missing skills must not be held. Refusal, truncation, markdown, malformed JSON, duplicate JSON keys and invented skills are rejected. Provider text is rendered as plain text.
- Calls are sequential with a 10-second complete-response deadline, 3-second connection timeout, and 64 KiB response cap. The batch starts no new call after 45 seconds, giving an external-call bound of approximately 55 seconds. Nginx and the matching request allow that duration. A failed call fails the entire command with 502/503; no automatic AI retries or partial-success envelope is introduced.
- Recommendations are not persisted and the AI module has no write port. Matching never changes application status, track, version, reviewer or audit timestamps. Results display generation time and should be refreshed after input changes. No new SQL schema or migration is needed; V1–V15 remain unchanged.

Known selected candidates' identity terms and recognizable emails/UUIDs are redacted from provider-bound free text. Redaction terms are used locally and never serialized to the provider. Invalid AI limits and invalid URL ports leave core workflows usable and matching unavailable; the unavailable screen uses a safe limit of 20. Default matching returns to the latest pending page so suggestions retain applicant names.

See [Phase 9 verification](docs/phase-9-verification.md) and [subsequent audit](docs/phase-9-audit.md).

## Phase 10 dashboards and Excel reports

- Admin opens **Dashboard** at `/admin`. Campaign OWNER/MANAGER and Admin open the existing campaign workspace for its overview, then **Reports** at `/manage/campaigns/:campaignId/reports` for downloads. All four backend endpoints enforce active-account and role/campaign authorization; organization membership and volunteer acceptance alone do not grant access. Draft and terminal campaigns retain reporting access for their managers/Admin.
- `GET /api/v1/admin/dashboard` returns all ten specification metrics. These are lifetime counts/totals: active campaigns means ACTIVE, unique accepted volunteers means distinct users across ACCEPTED registrations, hours come only from VERIFIED completions, and donation volume counts PAID donations only. Historical participation from subsequently suspended accounts remains included. Active fundraising means OPEN/ACTIVE, donation-enabled, and no elapsed fundraising deadline; a goal is not required. No enrollment percentage is inferred.
- `GET /api/v1/campaigns/{id}/dashboard` returns `campaignId`, `operations` (application counts including TOTAL/CANCELLED, assigned tracks, task counts, attendance sessions, verified completion/hours and pending expenses), and the existing `financialSummary` contract. Counts use database aggregates rather than loading entities. Money and hours are decimal strings; finance formulas and PAID/APPROVED filters are unchanged.
- Reporting/dashboard infrastructure uses dedicated SQL read projections across module tables, as explicitly permitted by spec section 28. Application services authorize and collect a repeatable-read snapshot; workbook serialization occurs after that transaction. These modules have no write ports or foreign aggregate mutation dependencies. Existing V1–V15 are sufficient; no schema migration is added.
- `GET /api/v1/campaigns/{id}/reports/volunteers.xlsx` includes all campaign applications and the eleven specified columns. Unassigned tracks are blank; absent completion records mean Pending; verified hours/time are blank until VERIFIED. Present sessions count PRESENT records; total sessions counts every campaign attendance session, including sessions with no record for that person.
- `GET /api/v1/campaigns/{id}/reports/financial.xlsx` contains Summary, Donations and Expenses. Detail sheets include all statuses; Summary counts only PAID donations and APPROVED expenses. Each donation occupies one row: a settled payment attempt supplies provider metadata when present, otherwise the latest attempt is used, with deterministic ordering. Extra attempts never duplicate donation totals or rows. Missing review/settlement data remains blank.
- Apache POI creates `.xlsx` files with styled/frozen headers, filters and readable widths/statuses. Money and identity/reference values are exact string cells to preserve 19-digit VND values and leading zeros; counts are numeric cells. Timestamps are labeled UTC and exported in ISO form. User text is never interpreted as an Excel formula. Sheets split at Excel's row limit rather than silently truncating.
- Exports return XLSX content type, attachment filenames and private/no-store caching. The UI downloads through the authenticated Axios instance, decodes JSON errors returned as blobs, disables both controls during generation and releases temporary object URLs. Dashboard query keys separate Admin/campaign scope and signed-in accounts. They refetch on focus or explicit refresh and are invalidated by relevant domain mutation hooks; read-only report downloads and AI generation do not trigger dashboard invalidation. Charts and new infrastructure are unnecessary for the specified metrics.
- Exports currently materialize query rows and an in-memory POI workbook, suitable for the PBL scope. No artificial row cap is imposed; very large datasets would require a separate streaming/memory review.

Executed build, API, workbook, browser and fresh-database results: [Phase 10 verification](docs/phase-10-verification.md). The actual `.env` is unchanged; no new external credentials are needed.

Subsequent corrections and verification: [Phase 10 audit](docs/phase-10-audit.md). Excel headers match the specification exactly; UTC is recorded in header comments/metadata. Content-aware widths, wrapping and row heights keep long values readable. Volunteer attendance uses grouped campaign-scoped projections rather than per-application counts.

Executed verification is recorded in [docs/phase-6-verification.md](docs/phase-6-verification.md).

The subsequent specification audit, corrections, and fresh verification are recorded in [docs/phase-6-audit.md](docs/phase-6-audit.md).

## October 2026 product updates

The owner's new requirements supersede the earlier optional-email-domain and no-avatar-upload scope: new students must use a nine-digit student ID and the matching ID@sv1.dut.udn.vn email, and choose one of the 16 supplied faculty entries. The list retains the supplied suffixes and excludes All, Training/Quality Assurance and AEC. Profile changes validate the catalog while preserving unchanged legacy faculties. Sign-in uses student ID, including existing administrator IDs such as ADMIN001; email login remains backward-compatible for existing integration scripts. Format checks do not verify mailbox ownership. Existing accounts are not rewritten.

Avatar upload stores a bounded normalized JPEG in PostgreSQL through identity application services, so deployment restarts do not lose it. Authenticated own-avatar APIs accept PNG/JPEG up to 1 MB, at most 8 megapixels and 4096 pixels per dimension; stored images are 256×256, under 256 KiB. Re-encoding discards uploaded metadata and active formats; updates use the user version. No general file-storage service was added.

VI/EN is a bundled dictionary and a Zustand language preference (only the preference is persisted), with reactive UI labels, accessibility text and locale formatting. Forms and sessions are retained on switching language. User-authored content remains in its original language. Public historical activity records include editorial Vietnamese and English content. No external translation service is used.

Flyway V18 adds profile_avatars; V19 creates/seeds six published_activities from official DUT articles. This immutable public archive belongs to the campaign module and documents already-published events; it is separate from operational proposals/campaigns, manager assignments, verified hours and payment ledgers. No fake participants, donors, financial settlements or institutional approvals are created. History cards have real photos, source links, dates/periods and organizer descriptions. Articles with ambiguous event dates retain the known month; launch plans are not presented as verified programme results. Data definitions and references are in scripts/real-activity-content.mjs. Fresh installs receive the archive without requiring a seeded user; Flyway remains the only schema/data migration mechanism.

[Database diagram script](docs/dut-connect.dbml) — 27 business tables and 48 foreign-key relationships, exported from PostgreSQL after V1–V19. Paste into dbdiagram.io; SQL constraints/index definitions are retained.

[Concise system workflow report](docs/bao-cao-he-thong.md) explains roles, full workflows and the reason for the important rules. [Change verification](docs/october-product-verification.md) records builds, manual checks and deployment limits.

## Danh mục DUT và lịch mô phỏng

Khi khởi động, bộ import tạo thêm 5 hồ sơ tổ chức có nguồn DUT và 8 chiến dịch vận hành dựa trên hoạt động thật: 2 OPEN, 2 ACTIVE, 2 COMPLETED, 1 CANCELLED, 1 DRAFT. DRAFT chỉ có trong giao diện quản trị/quản lý theo quyền hiện hành. Ngày và chỉ tiêu là mô phỏng, có nhãn trên card và giải thích trong chi tiết; không phải thông báo tuyển của trường. OPEN tuyển thêm 120 ngày, ACTIVE chạy thêm 180–200 ngày tính từ lần import đầu tiên (UTC). Khởi động lại giữ lịch và mọi chỉnh sửa của quản trị viên.

Import cần một ADMIN đang ACTIVE, chạy sau bootstrap admin và dùng các application service hiện hành để tạo/xác minh tổ chức, tạo/duyệt đề xuất và chuyển trạng thái chiến dịch. Không tạo tài khoản, quyên góp, người tham gia hay giờ công giả. Nếu chưa có ADMIN, import được hoãn đến lần khởi động sau khi có ADMIN. Hồ sơ tổ chức được quản trị viên quản lý phục vụ trải nghiệm, không khẳng định tổ chức đã đăng ký thực tế trên DUT Connect. Không tiếp quản hồ sơ trùng tên do người khác sở hữu.

Bật mặc định theo yêu cầu seed; đặt APP_DUT_CATALOGUE_ENABLED=false để dừng các lần import tiếp theo (không xóa dữ liệu đã có). Flyway V20 chỉ tạo bảng theo dõi khóa import; transaction và advisory lock chống trùng, kể cả nhiều instance cùng khởi động. Không sửa migrations cũ. Nội dung ở backend/src/main/resources/catalogue/dut-catalogue.json; tái sinh bằng node scripts/build-real-catalogue.mjs. Nguồn gốc được ghi trong từng hồ sơ.
