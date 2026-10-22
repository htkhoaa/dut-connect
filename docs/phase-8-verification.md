# Phase 8 verification

The subsequent audit, corrections and repeated verification are recorded in [Phase 8 audit](phase-8-audit.md). The results below describe the original implementation before that audit.

Implemented against the complete `spec.md`, including sections 19, 23–29, 30–31, 36–39 and the Phase 8 roadmap. No Phase 9 implementation or automated test suite was added. `.env` was not changed.

## Implementation

- Finance module uses domain/application/infrastructure/API layers. Controllers invoke application services; scalar UUID references retain module ownership.
- V13 creates the exact expense columns, numeric(19,0) positive amounts, status/version/review consistency checks, foreign keys and explicit campaign/status and status/created indexes. V1–V12 were preserved.
- Expense creation initializes PENDING, editing is pending-only, and Admin review makes APPROVED/REJECTED terminal. Expected versions and JPA optimistic locking reject stale edits or competing reviews with 409. Rejection requires a reason.
- Active scoped managers/Admin manage expenses; only Admin reviews. Public views expose approved expense business fields, without submitter/reviewer identity or rejection details. DRAFT follows existing campaign privacy.
- Campaign funding and donation aggregates are consumed through module-owned read ports. Donation sums/counts use PAID donations rather than payment attempts. Expense sums use APPROVED only. One read-only repeatable-read transaction creates a consistent financial summary.
- Money stays BigDecimal/numeric and exact decimal strings over the API. Aggregate sums may exceed an individual numeric(19,0) value. Frontend formatting and progress arithmetic use BigInt.
- Manager finance, Admin review, public summary/expenses and batch campaign-card progress are connected to routes and navigation. Login returns to finance/review routes. Query invalidation covers expense reviews/edits, donation mutations and campaign funding changes.

## Verification results

| Verification | Result |
| --- | --- |
| Java 21 backend clean package, Spring Boot 3.4.3 | PASS; 196 source files |
| Frontend TypeScript and Vite production build | PASS; 321 modules |
| Docker Compose configuration, builds and normal startup | PASS; all three services healthy |
| Empty PostgreSQL 16 database | PASS; all 13 versioned migrations applied, zero failures, Hibernate validation/readiness successful |
| Phase 8 manual HTTP workflow | PASS; 147 checks |
| Direct expense database constraint probes | PASS; 11 rejected writes, transactions rolled back |
| Donation aggregate edge probes | PASS; five excluded statuses and multiple attempts counted once; temporary rows removed |
| Phase 7 regression workflow | PASS; 117 checks |
| Phase 6 regression workflow | PASS; 140 checks |
| Browser manager workflow | PASS; submit, invalid amount feedback, preserved values, friendly pending status |
| Browser Admin workflow | PASS; confirmation and approval reflected in the public view |
| Public finance privacy | PASS; approved expense shown, pending expense excluded |
| Responsive browser review | PASS; desktop plus 390 × 844 mobile; manager, Admin and public screenshots visually inspected; no horizontal overflow or runtime exception |

The HTTP workflow verified empty sums, institutional/sponsor funding, partial edits and clearing optional fields, required versions/reasons, stale and terminal records, Admin-only review, unauthorized campaign access, DRAFT privacy, pagination/filter validation, one winner in simultaneous approve/reject, callback settlement/idempotency, funding edits, volunteer-only finances, post-completion review, null goals, sums larger than 19 digits and negative remaining funds.

Combined example: institutional funding 10,000,000 + sponsor funding 5,000,000 + verified donation 50,000 = total funding 15,050,000. Approved expenses 8,000,000 leave 7,050,000. Pending/failed donations and pending/rejected expenses do not change those totals. Eight duplicate callbacks left every summary field unchanged.

UI example: manager submitted a 10 VND pending expense, Admin approved a separate 20 VND expense, and anonymous campaign detail showed total funding 50, approved expenses 20 and remaining funds 30, publishing only the approved expense.

The Phase 8 exit criterion is satisfied: verified donations and approved expenses produce correct authoritative totals. Live ZaloPay checkout remains dependent on merchant credentials/public callback configuration; Phase 8 was verified through the existing signed server-side mock settlement pathway.
