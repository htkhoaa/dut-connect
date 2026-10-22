# Phase 9 verification

Subsequent findings, corrections and verification are recorded in [Phase 9 audit](phase-9-audit.md). Counts below describe the original implementation verification.

Implemented against the complete `spec.md`, especially sections 20, 24, 28–30, 36–39, 41–42 and the Phase 9 roadmap. Recommendations are advisory and unpersisted. Phase 10 dashboards/reports and stretch impact reports were not implemented. No automated test suite or new migration was added. `.env` remains unchanged.

## Implementation

- The AI module contains application contracts/orchestration, infrastructure configuration/disabled/HTTP adapters and strict parsing, and a thin REST controller. It has no repository, entity, write port or dependency on volunteer mutation services.
- Campaign matching context, pending applicants and profile experience/skills are exposed through module-owned read ports. Each infrastructure read queries only its owning module's tables. Profiles and skills are fetched in batches.
- Active campaign OWNER/MANAGER and Admin can match. Authorization is enforced on the backend, including the additional availability endpoint. Matching requires OPEN/ACTIVE and volunteer-enabled mode. Explicit IDs must be distinct, bounded, pending, campaign-owned and backed by active profiles; default selection reads the latest bounded pending cohort and excludes inactive candidates.
- A short read-only repeatable-read transaction creates immutable inputs. External calls run outside transactions. A second read rechecks permissions, versions and matching inputs, refusing stale results or revoked access.
- The OpenAI-compatible adapter uses the configured API prefix plus `/chat/completions`, bearer authentication, Chat Completions messages and JSON-object response format. Only relevant campaign and candidate matching fields are sent. Fresh random references replace persistent identifiers. Account/application IDs, names, contact data, faculty, credentials, motivation and finances do not enter the prompt.
- Provider output must contain the six contracted fields, valid score/track/confidence and factual skill references consistent with the input. Invalid JSON, empty/null output, duplicate keys, trailing content, refusal, truncation, fabricated skills and oversized responses fail explicitly. Provider messages and secrets are not logged.
- Disabled or missing-credential mode preserves ordinary campaign workflows. The complete-response timeout is 10 seconds, connection timeout 3 seconds and response cap 64 KiB. Sequential batches start no further request after 45 seconds, with approximately 55 seconds maximum external-call duration. Provider errors fail the whole command; there are no automatic AI retries or fabricated fallback recommendations.
- The manager page uses feature DTOs/API/hooks, TanStack Query mutations and React Hook Form/Zod selection validation. It displays scores, tracks, skill lists, explanations, confidence, generation time and the advisory label. It contains no decision controls. Applicant pagination, pending controls, error retention, unavailable messaging, navigation and safe login return are connected.
- Existing V1–V15 and schema ownership are preserved. Settings and Compose wiring are documented in README and `.env.example`; the actual `.env` is not edited.

## Executed verification

| Verification | Result |
| --- | --- |
| Java 21 backend clean package | PASS; 211 source files |
| TypeScript/Vite production build | PASS; 325 modules |
| Docker configuration and backend/frontend image builds | PASS |
| Normal Docker startup/readiness | PASS; all three services healthy |
| Fresh PostgreSQL 16 startup | PASS; V1–V15, 15 successful migrations, zero failures, Hibernate validation/readiness successful |
| Final images against fresh database | PASS; all services healthy |
| Disabled-mode manual HTTP workflow | PASS; 52 checks |
| Enabled adapter manual HTTP workflow | PASS; 59 checks |
| Additional eligibility/permission HTTP workflow | PASS; 15 checks |
| Enabled-but-missing credentials | PASS; startup, unavailable capability, graceful 503 and unchanged application DTOs |
| Restored normal disabled configuration | PASS; unavailable capability/503 and unchanged application DTOs |
| Compiled parser probes | PASS; 12 valid/invalid output cases |
| Enabled browser workflow | PASS; 9 checks |
| Unavailable browser workflow | PASS; 5 checks |
| Desktop/mobile visual inspection | PASS; 1280 × 900 and 390 × 844 screenshots, no horizontal overflow/runtime exceptions |
| Phase 8 finance regression | PASS; 147 checks |
| Phase 7 payment regression | PASS; 117 checks |
| Phase 6 coordination regression | PASS; 140 checks |
| Environment preservation | PASS; `.env` SHA-256 unchanged |

Enabled checks used an isolated local HTTP diagnostic provider, exercising the actual production adapter and backend endpoint. The provider fixture is only in ignored `.verification`; it is not a production adapter or success fallback. Captured outbound requests confirmed the minimal field set, exclusion of known private identifiers and fresh references for each evaluation.

Runtime scenarios covered manager/Admin access, anonymous/unrelated access, invalid selections, accepted/cancelled/suspended candidates, foreign-campaign IDs, existing applicants after deadline, no provider call for an empty eligible cohort, invalid output fields and invented skills, provider outages/rate limiting, oversized responses and a deliberately stalled response body. The stalled body failed within the complete-response deadline.

Application status, version and update timestamps were compared before/after successful and failed matching; full application DTOs remained identical in unavailable-mode checks. Client-supplied decision fields also could not change application rows. Cancellation during a delayed provider response produced 409, and removal of manager permission during a call produced 403. PostgreSQL inspection during a held provider call found no idle database transaction.

Browser verification used real endpoint/provider failures to confirm retained selection and disabled controls, then generated a valid structured suggestion. Injected provider markup remained literal text. Login returned to the AI route, reload restored authentication without rerunning generation, and no accept/reject control appeared. Screenshots were visually inspected. The browser skill's control tool was unavailable, so verification used an isolated headless browser with its own audit profile; existing browser profiles were not inspected.

The Phase 9 exit criterion is satisfied: AI suggestions cannot mutate application status. Structural isolation and actual success/failure/concurrency probes confirm this. Manual acceptance/rejection remains exclusively in the existing volunteer workflow.

Live model inference was not attempted because `.env` contains no AI provider credentials/configuration. The real HTTP protocol, validation and failure behavior were verified locally; generated quality from a selected live model requires configuring that provider. Temporary overrides/provider/browser and the fresh audit stack were stopped after verification; the normal stack remains healthy with AI disabled by default.
