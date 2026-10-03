# Phase 9 specification audit

Audited the implementation, module boundaries, provider protocol, migrations, configuration and built images against `spec.md`. Phase 10 remains deferred. No migration or automated test suite was added; `.env` is unchanged.

## Findings and corrections

1. **Invalid optional AI settings could prevent backend startup.** Eager integer conversion and validation of the applicant limit could break core workflows even with AI disabled. Configuration now reads safely, reports invalid enabled configuration as unavailable, and exposes a safe bounded limit of 20 for the unavailable UI. Invalid flags disable AI. Invalid limits do not silently enable matching.
2. **Invalid URL ports were advertised as available.** Ports zero and above 65535 now fail availability validation and produce the existing graceful 503 instead of a later HTTP construction failure.
3. **Nontext provider refusal values were accepted.** Strict parsing now accepts only absent/null or blank text refusal metadata. Objects and booleans fail as invalid provider output, even alongside otherwise valid content.
4. **Default matching from a later applicant page produced unnamed suggestions.** The screen keeps the latest pending page available, returns to that page before default generation and resolves result names from the selected or latest cohort. A distinct application reference remains a fallback if the applicant list changes.
5. **Free text could carry private identifiers to the provider.** Omitting structured identity fields did not remove identifiers embedded in experience. An actual outbound HTTP probe reproduced disclosure of a candidate's email, student ID, name, faculty and user UUID. Module-owned profile reads now supply private terms solely for local redaction. Campaign title/description/requirements and candidate experience/availability are cleaned before constructing the provider DTO. Recognizable emails and UUIDs, and known selected candidates' identity terms, are removed. Repeating the same outbound probe confirmed all five identifiers absent. This is a bounded redaction policy, not a claim to detect every possible sensitive fact in arbitrary prose.

Private redaction terms never enter the provider DTO. Identity infrastructure reads its own identity tables; AI orchestration consumes application ports and does not access another module's repositories. No passwords or financial data are read for matching. Fresh random candidate references remain independent of persistent identity.

## Verification on the corrected implementation

| Check | Result |
| --- | --- |
| Java 21 Maven clean package | PASS; 212 Java source files |
| TypeScript/Vite production build | PASS; 325 modules |
| Docker Compose validation and both image builds | PASS |
| Fresh PostgreSQL 16, Flyway and Hibernate startup | PASS; V1–V15, 15 successes, zero failures |
| Fresh startup with invalid AI limit and URL port | PASS; all services healthy; registration/login/profile/browse: 4 checks |
| Enabled actual HTTP adapter workflow | PASS; 85 checks including new fixture setup |
| Eligibility, access revocation and client decision injection | PASS; 15 checks |
| Compiled parser diagnostic probes | PASS; 14 cases |
| Compiled settings diagnostic probes | PASS; 9 cases |
| Actual provider-bound privacy probe | PASS; all five reproduced identity disclosures removed |
| Enabled browser, including default matching from page two | PASS; 10 checks; 20 named default results |
| Disabled HTTP workflow | PASS; 52 checks |
| Unavailable capability/503/unchanged applications | PASS; 4 checks |
| Disabled browser workflow | PASS; 5 checks |
| Desktop/mobile visual inspection | PASS; mobile has no horizontal overflow; markup renders as text |
| Phase 8 / Phase 7 / Phase 6 regression workflows | PASS; 147 / 117 / 140 checks |
| Normal restored Docker stack | PASS; PostgreSQL, backend and frontend healthy; AI disabled by default |
| Environment preservation | PASS; unchanged SHA-256 |

Diagnostic scripts and build logs are in ignored `.verification`. The fresh-stack HTTP probe uses an allowed origin; its separate frontend port does not change the application's configured CORS policy. The temporary pagination users/applications were removed. The diagnostic provider, owned browser sessions and fresh stack were stopped; the normal stack remains running. The fresh database volume is preserved.

The Phase 9 exit criterion holds: recommendations cannot modify application status. Successful, failed and delayed/concurrent matching preserved application status/version/timestamps; cancellation during a request rejected stale results, and revoked manager permission rejected access. The AI module still has no write port, persistence or volunteer decision dependency. Manual review remains the existing volunteer workflow.

Live model inference was not verified because no provider credentials are configured. The production HTTP adapter, validation, timeouts, failure handling and UI were exercised against a local diagnostic provider.
