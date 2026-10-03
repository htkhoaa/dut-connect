# Phase 2 verification

Verified on 2026-10-01. Scope: identity and security only; subsequent phases remain unimplemented.

These were manual browser, HTTP, database and command-line smoke checks. No automated test suite, test dependencies or test source files were added.

## Phase 2 audit and corrections

Audited the complete specification, actual Java/TypeScript sources, V1/V2/V3 migrations, environment configuration, Dockerfiles, Compose and Nginx on 2026-10-01. Applied migrations were left unchanged. No Phase 3 code was added.

Corrected these findings:

- The Axios retry handler cleared authentication when a successfully refreshed request subsequently returned 400/409. Only failed authentication now clears the session; the retried request's business error remains available to the form.
- Receiving updated profile data reset unsaved skill selections. The skill editor now uses React Hook Form and Zod, preserves dirty values and their original optimistic version, and displays save failures explicitly.
- Required reusable controls and states were missing. Added Input, Select, Textarea, Dialog, ConfirmDialog, Badge, Table, Pagination, EmptyState, LoadingState and ErrorState alongside Button and Card. Phase 2 pages use them; form fields associate errors with their controls. Profile editors are feature components, and status presentation and request types are centralized by feature.
- Application repository ports exposed Spring Data pagination, and application services depended on an API response class. Ports now use application pagination/result records; Spring Data adaptation and sorting stay in persistence, while controllers map the HTTP page envelope.
- Admin operations relied exclusively on the HTTP role matcher. Their application service now checks the active administrator, with deterministic actor/target lock ordering for status changes.
- JWT validation did not require every identity claim. Required UUID subject, role, email, issued-at and expiration claims are checked. Spring's default converter synthesizes a missing issued-at claim, so the decoder explicitly rejects its absence before conversion.
- Database failures during bearer account lookup escaped the MVC advice. The security boundary now returns the same 503 error envelope.
- Every data-integrity failure was classified as a uniqueness conflict. Only SQL unique-key violations now return 409; unexpected integrity failures use a safe 500 response and a sanitized log entry.
- Student-ID/email normalization could expand values beyond schema limits. Normalized lengths are checked before persistence. Registration/login trim email before email validation.
- Configuration accepted blank signing secrets and URL-shaped values that were not origins, and imposed undocumented token-lifetime ceilings. Secrets reject whitespace-only values; origins require an explicit HTTP(S) origin without credentials/path/query/fragment; lifetimes require positive, overflow-safe values and retain the specified defaults.

Audit verification evidence:

| Check | Result |
| --- | --- |
| Final backend Maven clean package; frontend TypeScript/Vite build | Passed; Java 21 and Spring Boot 3.4.3. No test sources. |
| Final Docker images, default/development Compose validation, Nginx validation | Passed; normal stack healthy. |
| Existing database | Flyway validated V1/V2/V3; ten seeded skills and one bootstrap ADMIN remained. |
| Separate empty production database | Applied V1/V2/V3 and passed Hibernate validation; ten skills and zero initial users with bootstrap disabled. |
| Production registration/login with surrounding email whitespace | 201/200; stored lowercase trimmed email; expiresIn=900; Secure, HttpOnly, SameSite=Lax cookie. |
| USER/ADMIN login, anonymous protection, USER admin denial, ADMIN listing | 200/200, 401, 403, 200 respectively; also verified through browser screens. |
| USER and ADMIN browser reload | Refresh 200 restored each protected screen without another login. |
| Unsaved skills while saving profile | Selection preserved; subsequent stale skill save returned 409 and preserved the form. |
| Expired JWT followed by a conflicting mutation | Exactly skills PUT 401, refresh POST 200, skills PUT retry 409; session and selected values remained. Used a temporary one-minute lifetime, then restored the normal 15-minute configuration. |
| Missing JWT sub/role/email/iat/exp | Each rejected with 401. |
| Unicode student ID expanding beyond 32 after uppercase | 400 VALIDATION_ERROR before database access. |
| Refresh replay, logout, concurrent refresh | Replay and logged-out cookie rejected; concurrent use yielded one 200 and one 401. |
| Suspension/restoration | Existing bearer access and login rejected while suspended; restore succeeded. Browser confirmation, status badge and mutation feedback worked. |
| Database outage during bearer account lookup | 503 SERVICE_UNAVAILABLE with request ID; database restarted and stack recovered. |
| Confirmation accessibility and mobile layout | Dialog focused Cancel; inspected 375px screenshot; no page horizontal overflow. |

The disposable production stack was stopped without deleting its volume. The normal stack is running with the standard token lifetimes. Browser verification used an isolated local Chrome session because the preferred browser execution tool was unavailable.

## Required exit criteria

| Criterion | Evidence | Result |
| --- | --- | --- |
| USER login | Registered a student, received USER on HTTP 200 login, and signed in through the browser to the protected profile screen. | Pass |
| ADMIN login | Environment bootstrap created one BCrypt ADMIN. HTTP login returned ADMIN; browser login loaded user management. | Pass |
| Refresh survives browser reload | Reloaded the authenticated profile page; refresh restored the session and the saved Programming skill without another login. Also reloaded the ADMIN user-management page. | Pass |
| Protected route works | Anonymous profile navigation redirected to login; unauthenticated API access returned 401. USER admin API access returned 403. ADMIN user listing succeeded. | Pass |

## Builds and infrastructure

- Java 21 / Spring Boot exactly 3.4.3: backend Maven Wrapper clean package with tests skipped passed. The host build used an ignored workspace Maven cache.
- Frontend TypeScript and Vite production builds passed, including Node 22 Docker builds. Pages are split into lazy-loaded chunks; the final build has no chunk-size warning.
- Default and optional development Compose configurations passed validation; Nginx configuration passed validation.
- Full `docker compose up --build --detach --wait --wait-timeout 180` passed. PostgreSQL, backend and frontend were healthy after the final rebuild.
- The existing Phase 1 database migrated from V1 to V2/V3 successfully. V1 was not edited.
- A separate fresh Compose project/database under the prod profile applied V1/V2/V3, seeded ten skills and passed Hibernate schema validation. Bootstrap was disabled there; the initial user count was zero.
- Production login returned a cookie with Secure, HttpOnly, SameSite=Lax, the auth path and seven-day lifetime.
- The disposable stack was stopped without deleting either its volume or the normal development volume.

## Identity, consistency and security

| Manual check | Observed result |
| --- | --- |
| Registration | 201, USER role, persisted faculty/profile. |
| Duplicate normalized email/student ID | 409 CONFLICT. |
| Invalid registration | 400 VALIDATION_ERROR with field errors and UUID request ID. |
| Wrong password | 401 INVALID_CREDENTIALS. |
| Current user and supplied request ID | 200 with user summary and matching X-Request-Id response header. |
| Public skill catalog | Stable page envelope containing the ten specified skills. |
| Profile/skill updates | Persisted profile fields and selected Programming skill. Browser forms displayed save feedback. |
| Stale profile version | 409 OPTIMISTIC_LOCK_CONFLICT. |
| Refresh rotation | Replacement session issued; consumed token replay returned 401. |
| Concurrent refresh | One 200 and one 401 for two uses of the same token. |
| Token storage | Database refresh hashes were 64 characters; raw tokens are not stored in schema columns. |
| Logout | 204, cookie cleared with matching attributes; refreshing that cookie subsequently returned 401. Browser sign-out returned to login. |
| Suspension | Existing bearer access, login and refresh rejected. Restore succeeded; subsequent login succeeded. |
| Admin pagination/bootstrap restart | One ADMIN remained after rebuilds; startup logged that existing-email bootstrap was skipped. |
| CORS and cookie origins | Allowed preflight succeeded with credentials. Missing/foreign origins failed. Foreign origins and invalid preflight headers returned the shared JSON error envelope. |
| Invalid JSON, missing authenticated route, unsupported method | Consistent error envelopes with 400, 404 and 405 respectively. |

## Browser recovery and layout

- Used an isolated local Chrome session because the in-app browser execution tool was unavailable.
- Temporarily configured a one-minute access-token lifetime and let the browser token expire. Saving the profile produced exactly: profile PUT 401, refresh POST 200, profile PUT retry 200. The browser displayed “Profile saved.”
- Restored the normal configuration after that check; final login responses reported expiresIn=900.
- Inspected profile screenshots at desktop and 375px mobile widths. The mobile page had no horizontal overflow and retained readable labels, forms, navigation and skill controls.
- Inspected the admin user-management screen and its pagination/status controls.
- Login return navigation is restricted to a destination appropriate for the role, so a bootstrap ADMIN is not redirected to a missing student profile.

## Documented decisions and limits

README documents cookie/origin policy, signing-secret format, password and field limits, versioned updates, pagination, strict refresh rotation, current-session logout, optional admin bootstrap without a student profile, and the absence of additional self-suspension/last-admin rules.

Logout revokes refresh access; existing access JWTs expire normally. Cross-tab refresh has no grace period. Volunteer history and donations remain deferred to their owning phases.

Generated local bootstrap credentials and the JWT secret are stored only in ignored `.env`. Verification artifacts are ignored; no real secrets are included in tracked source or documentation.
