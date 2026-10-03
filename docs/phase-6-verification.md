# Phase 6 verification

Completed 2026-10-02 against the local Docker application. Scope: meetings, tasks, multi-session attendance, completion, and student participation history. Phase 7 was not started. No automated test source tree, test dependencies, calendar integration, QR attendance, dashboards, or exports were added. Temporary manual verification helpers and fixture credentials remain in ignored `.verification/`.

## Builds and deployment

| Check | Result |
| --- | --- |
| Java 21 / Spring Boot 3.4.3 clean package with skipped tests | PASS; 152 sources, executable jar |
| Frontend TypeScript and Vite production build | PASS; 303 modules |
| Docker backend/frontend builds and Compose startup | PASS; all services healthy |
| Default and development Compose configuration | PASS |
| Nginx configuration and direct/proxied backend readiness | PASS; UP |
| Existing database V10 -> V11 and Hibernate validation | PASS |
| Empty PostgreSQL 16 database, production profile | PASS; all 11 SQL migrations applied and Hibernate validation succeeded |
| Fresh stack restarted with final images | PASS; services healthy, migrations validated |

The fresh database used role `phase6_audit`, different from application schema `dut_connect`, with bootstrap disabled. It contained zero users and zero completions. The isolated stack was stopped afterward with its volume retained. V1-V10 were preserved; V11 is the only new migration. The existing host npm `min-release-age` warning remains nonblocking.

## API and database verification

The final application passed **140 main Phase 6 HTTP assertions** and **43 additional assertions**:

- Managers/Admin create, edit, and delete meetings. Accepted volunteers read meetings; pending/unrelated/anonymous callers cannot. Invalid titles, null characters, required ONLINE/OFFLINE fields, URL schemes, time ranges, and stale versions are rejected. PATCH preserves omitted fields and clears only allowed optional fields.
- Task assignment rejects unaccepted and duplicate users. Cross-track assignment succeeds deliberately. The assigned track is shown alongside task track. Assignee replacement removes previous access and preserves omitted task fields.
- Students see only assigned tasks. Only assignees start and mark done; manager/Admin verifies. Both backward corrections work only for managers. Illegal skips, repeated transitions, unauthorized progress/verification, and stale writes fail. Concurrent progress produces one success and one conflict.
- VERIFIED tasks preserve actor/time and reject edits, reassignment, correction, deletion, and further progress. Unverified task deletion succeeds with dependent assignments.
- Multiple attendance sessions work independently. Bulk records enforce accepted participants and reject duplicate, empty, invalid, and stale batches. Mixed valid/invalid participants leave no partial records. Upsert preserves omitted records and uniqueness, records the actor/time, and increments the session version. Competing batches produce one success and one conflict. Session deletion removes dependent records.
- Completion lists include accepted participants with Pending display before a completion row exists. COMPLETED remains unofficial; verification records exact decimal hours and actor/time. Zero-hour direct verification works. Missing, negative, excessive, or overprecise hours fail. Backward completion transitions, stale updates, missing existing-record versions, nonaccepted recipients, student verification, and changes after VERIFIED fail. Competing verification yields one success and one conflict.
- Private student history excludes pending applications, shows only that student's accepted participation, distinguishes attendance from completion, and exposes official hours only when VERIFIED.
- All list pagination remains bounded. Missing resources return 404. DRAFT/CANCELLED block coordination changes; COMPLETED blocks meetings/tasks/attendance while permitting completion finalization.
- A scoped MANAGER performs meetings, tasks, attendance, and completion operations. Removing their campaign assignment revokes management access. Suspended accounts receive the existing security layer's 401 response and cannot use tasks/history; restoring the account permits authentication again.

Eight direct database guard checks also passed: accepted-participant enforcement for task assignees, attendance records, and completions; meeting time ordering; task verification audit consistency; attendance uniqueness; required verified hours; and nonnegative hours. Invalid database operations ran inside rolled-back transactions.

The final application also passed all **133 Phase 5 regression assertions**: 92 recruitment, 17 additional authorization, and 24 deadline/mode/terminal checks.

## Browser verification

The browser skill was read. Its connection tool is unavailable in this session, so verification used an isolated local Chrome session and rendered DOM interactions. Existing user profiles, cookies, and storage were not inspected.

- Manager meeting creation showed a backend null-character error while preserving description, dates, and location. Correcting the title saved the meeting with visible feedback. The accepted student viewed it without edit controls.
- The manager assigned a Technical task to a Logistics volunteer. Confirmation explicitly warned about the different track and focused Cancel; saving showed the persisted assignment.
- The student opened My tasks and task detail, moved the task through In progress and Done, and saw success feedback. The manager verified it; the resulting task was read-only.
- The manager created an attendance session, selected Present for the accepted volunteer, confirmed the bulk write, and saw the recorded participant/time and success feedback.
- The manager verified completion with 4.25 hours and a note. Confirmation explained that official verification is final and distinct from attendance. The student subsequently saw VERIFIED, 4.25 official hours, attendance 1/1, verification time, and the note in history.
- Reloading a protected student task route restored authentication or redirected to login as appropriate. Login returned to My tasks. The final student task detail offered student navigation without manager workspace links.
- Meeting and task detail at 390px had a 390px document width. Complete screenshots were visually inspected for wrapped content, dates, assignees, navigation, and readable status.
- The isolated browser was closed after verification.

## Architecture and exit criterion

Coordination remains in the volunteer module with domain behavior, focused transactional services, application repository interfaces, infrastructure persistence, and DTO controllers. Cross-module references are scalar UUIDs; campaign/identity checks and display reads use application ports. Own-module read queries batch assignment, attendance, and completion data. Campaign locks serialize coordination changes against lifecycle and manager changes; actor share locks and optimistic versions protect writes. The existing global error envelope and protected-route security are reused.

The Phase 6 exit criterion is satisfied: an accepted volunteer can view a meeting, receive and progress an assigned task, have attendance recorded across sessions, and receive final manager/Admin verification with official hours visible in private history. Authorization and invalid/stale/concurrent operations were verified. Decisions resolving unspecified policies are documented in README.

The normal stack remains healthy at http://localhost:8080.
