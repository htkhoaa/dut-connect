# Phase 5 audit

Completed 2026-10-02 after reading spec.md completely and inspecting the volunteer implementation, shared security and exception handling, campaign and identity ports, V10 migration, frontend routes/forms/cache handling, and deployment configuration. Scope remains Phase 5; Phase 6 was not started.

## Findings and fixes

- Campaign mutations did not invalidate cached recruitment data. Campaign metadata, lifecycle, and manager changes now invalidate application lists and capacity summaries as well as campaign queries.
- Acceptance confirmation could use capacity counts from an earlier page load. Review now refreshes counts and review eligibility before opening confirmation. A failed refresh or terminal campaign prevents confirmation and preserves entered input. Cached summary data remains visible on refresh failure, avoiding an unmounted review form.
- Acceptance confirmation now names the applicant and final assigned track, including when acceptance stays within capacity. Review fields receive focus when opened. Submission success no longer makes an unconditional promise about future manager review.
- The registration domain relied on database null constraints for campaign/applicant/reviewer identifiers. It now validates those identifiers before creating or changing state, keeping invalid transitions out of the domain model.
- The manual checklist lacked a Phase 5 section and still described recruitment as pending. It now covers implemented recruitment and the refreshed confirmation behavior.

No migration change was necessary. Applied V1-V10 remain unchanged. No cross-module repository/table/entity access or controller persistence bypass was found in recruitment. The existing documented interpretations remain: review in OPEN/ACTIVE, terminal-state cancellation of one's own pending application, terminal registrations cannot reapply, advisory capacity, and recruitment records rather than Phase 6 completion history.

## Verification after code fixes

| Check | Result |
| --- | --- |
| Backend clean production package | PASS; Java 21, 121 sources, executable jar |
| Frontend TypeScript and Vite production build | PASS; 291 modules |
| Docker builds and Compose startup | PASS; all three services healthy |
| Default/development Compose validation, Nginx syntax, direct/proxied readiness | PASS |
| Empty database with production profile and role different from schema | PASS; V1-V10, Hibernate validation, zero users/registrations with bootstrap disabled |
| Phase 5 HTTP checks | PASS; 92 main, 17 authorization, 24 lifecycle/deadline/mode assertions |
| Phase 4 regression checks | PASS; 95 main and 18 edge assertions |
| Database guards | PASS; duplicate, assignment, reason, and review audit consistency |

The existing npm `min-release-age` configuration warning does not prevent the frontend build. No automated test files or dependencies were introduced; manual helpers and local fixture credentials remain in ignored `.verification/`. The empty-database stack was stopped; the normal local stack remains healthy.

## Browser evidence

An isolated local Chrome session verified the audit fixes using rendered UI only:

- After loading capacity 1/100, campaign targets were reduced externally to total 1 and Technical 0. Preparing acceptance refreshed the displayed counts to 1/1 and showed the capacity warning, applicant name, and Technical assignment before confirmation. Confirmation focused Cancel. Acceptance above the targets succeeded, as required by the advisory policy.
- A pending rejection reason was entered, then the campaign was cancelled externally. Preparing review displayed the read-only state and eligibility error, opened no confirmation, preserved the reason, and left the registration PENDING.
- Blocking only the summary request produced a connection error, opened no confirmation, and retained the review form and reason.
- At 390px, document width was 390px; the complete screenshot was visually checked for wrapping, readable errors, and retained input.

The isolated browser was closed after verification. These checks supplement the application, acceptance/rejection, duplicate prevention, student cancellation, private history, authorization, and race checks recorded in [phase-5-verification.md](phase-5-verification.md).

Phase 5 satisfies its exit criterion: volunteer recruitment works end to end with backend authorization. No unresolved Phase 5 blocker was found.
