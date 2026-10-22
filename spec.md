# DUT Connect — AI Implementation Specification

> **Document purpose:** This file is the single implementation contract for an AI coding agent building the entire DUT Connect project.
>
> **Project:** DUT Connect — Student Volunteer, Donation & Campaign Coordination Platform  
> **Architecture:** Modular Monolith, Domain-Driven Design (pragmatic DDD), SOLID, ACID, Clean Code  
> **Backend:** Java 21, Spring Boot 3.4.3, Maven  
> **Frontend:** React + TypeScript + Vite, Node.js 22.12+  
> **Database:** PostgreSQL 16  
> **Database migrations:** Flyway  
> **Deployment:** Docker + Docker Compose  
> **Testing:** Automated tests are intentionally OUT OF SCOPE for this PBL. Do not generate unit, integration, E2E, Vitest, Jest, JUnit, Testcontainers, or Playwright tests unless this specification is later changed.

---

# 0. Instructions to the Coding Agent

This specification is authoritative.

The coding agent MUST:

1. Implement the project end-to-end, not only scaffold it.
2. Keep the project compiling/runnable after every implementation phase.
3. Follow the exact stack and architecture in this document.
4. Prefer the simplest correct implementation over speculative abstractions.
5. Enforce business invariants in the domain/application layer and reinforce critical invariants with database constraints.
6. Use Flyway as the only mechanism that creates or changes the database schema.
7. Never expose JPA entities directly through REST APIs.
8. Never call repositories directly from REST controllers.
9. Never place business rules in controllers.
10. Never trust frontend-calculated payment, permission, ownership, or financial state.
11. Preserve ACID consistency for state transitions that update multiple records.
12. Use explicit, readable code over clever generic frameworks.
13. Avoid TODO placeholders in any CORE feature.
14. Do not create microservices.
15. Do not add Kafka, RabbitMQ, Redis, Kubernetes, GraphQL, WebSockets, Elasticsearch, or other infrastructure not requested here.
16. Do not implement chat, comments, reactions, announcement feeds, social feeds, or real-time messaging.
17. Do not add automated tests.
18. Do not change the domain model merely to reduce coding effort.
19. If an implementation detail is not specified, choose the smallest solution consistent with this specification and document the choice in `README.md`.
20. If an external integration cannot run without credentials, implement the real adapter and a clearly isolated local fallback so the rest of the application remains runnable.
21. The final project MUST build successfully with:
    - backend: `./mvnw clean package -DskipTests`
    - frontend: `npm run build`
    - full stack: `docker compose up --build`
22. The final codebase MUST contain no fake success paths for payment. A mock provider may simulate the provider, but payment state must still flow through a server-side callback/verification path.
23. For frontend styling, use a DUT-inspired blue-and-white color palette based on https://en.dut.udn.vn/, but do not copy its layout or page structure.

If sections conflict, use this precedence:

1. Non-negotiable technical constraints
2. Core business rules
3. State-transition rules
4. Database invariants
5. API contract
6. UI behavior
7. Implementation roadmap

---

# 1. Product Vision

DUT Connect is a centralized platform for managing university-sanctioned volunteer and community campaigns at the University of Science and Technology — The University of Danang (DUT).

The platform replaces fragmented workflows involving Google Forms, spreadsheets, manual attendance lists, and scattered coordination tools.

A student can contribute to a campaign in two independent ways:

1. **Volunteer Contribution**
   - time;
   - skills;
   - technical knowledge;
   - logistics/manpower.

2. **Financial Contribution**
   - donation through an integrated payment gateway sandbox that reproduces a production-style payment lifecycle.

A campaign can support:

- `VOLUNTEER_ONLY`
- `DONATION_ONLY`
- `HYBRID`

The platform is NOT a social network and NOT a full accounting system.

Its core value is:

- governance;
- recruitment;
- coordination;
- verified participation;
- payment verification;
- financial transparency;
- reporting.

---

# 2. Non-Negotiable Technical Stack

## 2.1 Backend

Use:

- Java 21
- Spring Boot **3.4.3**
- Maven
- Maven Wrapper committed to the repository
- Spring Web MVC
- Spring Security
- Spring Data JPA
- Jakarta Bean Validation
- PostgreSQL JDBC Driver
- Flyway Core
- Flyway PostgreSQL database module
- Spring Boot Actuator
- Apache POI `poi-ooxml` for Excel export
- Jackson through Spring Boot defaults

Do not use:

- Gradle
- Kotlin
- WebFlux
- native PostgreSQL enum types
- Hibernate schema auto-generation for production schema changes

`spring.jpa.hibernate.ddl-auto` MUST be `validate`.

Flyway MUST run before Hibernate validation.

PostgreSQL support for Flyway MUST include:

- `org.flywaydb:flyway-core`
- `org.flywaydb:flyway-database-postgresql`

Prefer dependency versions managed by Spring Boot where available.

For third-party libraries not managed by the Spring Boot BOM, choose one compatible stable version and pin it in `pom.xml`.

## 2.2 Frontend

Use:

- Node.js **22.12+**
- npm
- React
- TypeScript
- Vite
- React Router
- TanStack Query for server state
- Zustand for authentication/session and small client-only state
- React Hook Form
- Zod
- Axios
- Tailwind CSS
- Recharts only where charts add clear dashboard value

Do not use:

- Next.js
- Redux
- MobX
- Angular
- Vue
- server-side rendering
- a heavy component framework such as MUI/Ant Design unless this document is later changed

Build reusable Tailwind-based components for:

- Button
- Input
- Select
- Textarea
- Modal/Dialog
- Card
- Badge
- Table
- Pagination
- EmptyState
- LoadingState
- ErrorState
- ConfirmDialog

## 2.3 Database

Use:

- PostgreSQL 16
- one PostgreSQL database;
- one logical application schema unless a later requirement needs multiple schemas;
- UUID primary keys;
- `snake_case` SQL naming;
- `timestamptz` for timestamps;
- `date` for calendar-only dates;
- `numeric(19,0)` for VND monetary values;
- explicit foreign keys;
- explicit unique constraints;
- explicit useful indexes;
- check constraints for critical numerical/date invariants.

Do NOT use floating point values for money.

## 2.4 Deployment

Use Docker Compose with at minimum:

- `postgres`
- `backend`
- `frontend`

The frontend production container should serve the Vite build with Nginx and proxy `/api` to the backend.

The backend should expose Actuator health information used by Docker health checks.

---

# 3. Architecture

## 3.1 Architectural Style

Build a **Modular Monolith**.

There is:

- one backend deployable;
- one frontend deployable;
- one PostgreSQL database.

The backend is divided into domain modules with explicit boundaries.

Do not implement the application as a package-by-layer structure such as:

```text
controller/
service/
repository/
entity/
```

Instead use package-by-domain-module, then layers inside each module.

Base Java package:

```text
vn.edu.dut.connect
```

Recommended module structure:

```text
vn.edu.dut.connect
├── shared
├── identity
│   ├── domain
│   ├── application
│   ├── infrastructure
│   └── api
├── organization
│   ├── domain
│   ├── application
│   ├── infrastructure
│   └── api
├── campaign
│   ├── domain
│   ├── application
│   ├── infrastructure
│   └── api
├── volunteer
│   ├── domain
│   ├── application
│   ├── infrastructure
│   └── api
├── donation
│   ├── domain
│   ├── application
│   ├── infrastructure
│   └── api
├── finance
│   ├── domain
│   ├── application
│   ├── infrastructure
│   └── api
├── ai
│   ├── application
│   ├── infrastructure
│   └── api
├── reporting
│   ├── application
│   ├── infrastructure
│   └── api
└── dashboard
    ├── application
    ├── infrastructure
    └── api
```

## 3.2 Pragmatic DDD Rules

Use pragmatic DDD.

Domain entities may contain JPA annotations to avoid duplicating persistence models, but:

- business behavior belongs in domain methods;
- domain objects must not depend on controllers;
- domain objects must not contain HTTP concepts;
- repositories are exposed as domain/application interfaces;
- Spring Data implementation details belong in infrastructure;
- controllers only call application use cases/services;
- cross-module aggregate relationships use scalar UUID identifiers, not JPA object graphs.

Avoid large bidirectional JPA relationships.

Prefer:

```java
private UUID campaignId;
```

over cross-module:

```java
@ManyToOne
private Campaign campaign;
```

Use JPA relationships only when both entities belong to the same module and the relationship clearly improves the model.

## 3.3 SOLID Rules

Apply SOLID pragmatically:

- one application service/use case should have one clear reason to change;
- use interfaces at true boundaries: payment provider, AI provider, repositories, module read ports;
- avoid one giant `CampaignService`;
- avoid generic `BaseService<T>`;
- avoid generic repository abstractions that hide domain intent;
- prefer constructor injection;
- never use field injection;
- avoid static mutable state.

## 3.4 ACID Rules

Use `@Transactional` at application-service/use-case boundaries.

A transaction MUST cover state changes that must succeed or fail together.

Examples:

- approve proposal + create campaign + create first campaign manager;
- accept volunteer application;
- verify completion;
- approve expense;
- process successful payment callback.

Do not hold a database transaction open while making a slow external HTTP call if avoidable.

For payment creation use a two-step orchestration:

1. transaction creates local Donation + PaymentTransaction intent;
2. external payment API is called outside the first DB transaction;
3. second transaction stores checkout/provider result.

Payment callbacks MUST be processed atomically and idempotently.

---

# 4. Repository Layout

Repository root:

```text
dut-connect/
├── spec.md
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml
├── backend/
│   ├── pom.xml
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── .mvn/
│   └── src/
│       └── main/
│           ├── java/vn/edu/dut/connect/
│           └── resources/
│               ├── application.yml
│               ├── application-dev.yml
│               ├── application-prod.yml
│               └── db/migration/
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── src/
│   └── nginx.conf
└── docs/
    └── manual-smoke-checklist.md
```

No automated test source tree is required.

---

# 5. Shared Backend Conventions

## 5.1 IDs

All aggregate/entity IDs are UUID.

Generate UUIDs in application/domain code.

Do not expose auto-increment sequence IDs in public APIs.

## 5.2 Time

Backend stores timestamps in UTC using `Instant`.

PostgreSQL uses `timestamptz`.

Frontend converts timestamps to the user's local timezone.

Business date rules such as campaign start/end use `LocalDate`.

## 5.3 Money

Use Java `BigDecimal` with scale 0 for VND.

Validate all money:

- non-null where required;
- integer VND values;
- greater than zero for donations/expenses;
- zero or greater for allocated funding.

Do not use `double` or `float` for monetary data.

## 5.4 Enum Persistence

Persist Java enums as strings.

Examples:

```java
@Enumerated(EnumType.STRING)
```

Use `varchar` + CHECK constraints in PostgreSQL.

Do not use PostgreSQL native enum types.

## 5.5 Optimistic Locking

Use `@Version` on mutable aggregate roots where concurrent updates could cause lost updates.

At minimum:

- User
- Organization
- Proposal
- Campaign
- VolunteerRegistration
- VolunteerCompletion
- Donation
- PaymentTransaction
- CampaignExpense

Return HTTP `409 Conflict` when an optimistic locking conflict is detected.

## 5.6 Audit Fields

Mutable aggregate roots include:

- `created_at`
- `updated_at`
- `version`

Where business meaning matters also store actor/time explicitly:

- reviewed_by
- reviewed_at
- verified_by
- verified_at
- recorded_by

## 5.7 API DTOs

Use Java records for immutable REST request/response DTOs where practical.

Do not serialize entities directly.

Example:

```java
public record CampaignSummaryResponse(
    UUID id,
    String slug,
    String title,
    CampaignStatus status,
    ContributionMode contributionMode
) {}
```

## 5.8 Mapping

Use explicit mapper classes or small mapping methods.

Do not add a mapping framework unless implementation becomes objectively repetitive.

---

# 6. Error Handling

Implement one global `@RestControllerAdvice`.

Return a consistent error envelope:

```json
{
  "timestamp": "2026-10-01T10:00:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "path": "/api/v1/proposals",
  "requestId": "uuid",
  "fieldErrors": [
    {
      "field": "title",
      "message": "must not be blank"
    }
  ]
}
```

Common domain error codes:

```text
VALIDATION_ERROR
AUTHENTICATION_REQUIRED
INVALID_CREDENTIALS
ACCESS_DENIED
RESOURCE_NOT_FOUND
CONFLICT
INVALID_STATE_TRANSITION
DUPLICATE_APPLICATION
ORGANIZATION_NOT_VERIFIED
NOT_ORGANIZATION_MEMBER
CAMPAIGN_NOT_OPEN
CAMPAIGN_NOT_ACCEPTING_VOLUNTEERS
CAMPAIGN_NOT_ACCEPTING_DONATIONS
VOLUNTEER_NOT_ACCEPTED
PAYMENT_PROVIDER_ERROR
PAYMENT_VERIFICATION_FAILED
PAYMENT_AMOUNT_MISMATCH
PAYMENT_ALREADY_PROCESSED
EXPENSE_NOT_PENDING
AI_PROVIDER_UNAVAILABLE
OPTIMISTIC_LOCK_CONFLICT
```

Map errors approximately as:

- 400 invalid input/business validation
- 401 unauthenticated
- 403 authenticated but unauthorized
- 404 missing resource
- 409 conflict/state/version/duplicate constraint
- 422 valid JSON but unusable domain transition when appropriate
- 502 external provider failure
- 503 temporarily unavailable provider

Never expose stack traces to clients.

---

# 7. Request Correlation and Logging

Implement a servlet filter that:

1. reads optional `X-Request-Id`;
2. generates UUID if missing;
3. places it in MDC;
4. returns it in response header;
5. includes it in error responses.

Log:

- request ID;
- authenticated user ID where useful;
- campaign/proposal/payment IDs;
- state transitions;
- payment provider request outcome without secrets.

Never log:

- passwords;
- raw JWTs;
- refresh tokens;
- AI API key;
- payment secret keys;
- full callback MAC secrets;
- sensitive credentials.

---

# 8. Authentication and Security

## 8.1 Global Roles

Only two global roles:

```text
ADMIN
USER
```

There is NO global `ORGANIZER` role.

Organizer/campaign-manager permissions are scoped per campaign.

## 8.2 Account Status

```text
ACTIVE
SUSPENDED
```

Suspended users cannot authenticate or perform protected actions.

## 8.3 Registration

Student registration requires:

- student ID;
- full name;
- email;
- password;
- faculty.

Do not assume a specific DUT email domain unless a later requirement provides the official domain rule.

Normalize:

- email to lowercase;
- student ID trim + uppercase if suitable for the accepted format.

Validate:

- unique email;
- unique student ID;
- password minimum 8 characters;
- sensible maximum lengths.

## 8.4 Password Storage

Use BCrypt through Spring Security.

Never store plain passwords.

## 8.5 JWT

Implement:

- short-lived access JWT;
- opaque refresh token.

Recommended access token lifetime:

```text
15 minutes
```

Recommended refresh token lifetime:

```text
7 days
```

Access JWT claims:

```text
sub = user UUID
role = ADMIN | USER
email
iat
exp
```

Use Spring Security JWT/Nimbus components.

Use an environment-provided secret key of sufficient length.

## 8.6 Refresh Token

Refresh tokens are random cryptographically secure opaque values.

Store only SHA-256 hash in database.

Use refresh token rotation:

1. refresh endpoint receives cookie;
2. hash token;
3. find active token;
4. revoke current token;
5. issue replacement refresh token;
6. issue new access JWT.

Store refresh token in:

- HttpOnly cookie;
- Secure in production;
- SameSite=Lax unless deployment topology requires otherwise.

Access token may be stored in frontend memory via Zustand.

On page reload, frontend calls refresh endpoint using cookie credentials.

## 8.7 Security Configuration

Stateless protected APIs.

Disable server-side form login.

Disable HTTP Basic.

CSRF may be disabled for bearer-token APIs; refresh/logout cookie endpoints must still be protected by SameSite policy and explicit CORS/origin configuration.

CORS development origins come from configuration.

Public endpoints include:

- register/login/refresh;
- public campaign browse/detail;
- public verified organization browse/detail;
- public categories/skills;
- payment provider callback;
- actuator health.

All other endpoints require authentication unless explicitly stated.

---

# 9. Identity Module

## 9.1 Responsibilities

Own:

- users;
- authentication;
- refresh tokens;
- profile;
- skills;
- current-user lookup.

## 9.2 Tables

### `users`

```text
id                  uuid PK
student_id          varchar(32) NOT NULL UNIQUE
email               varchar(255) NOT NULL UNIQUE
password_hash       varchar(255) NOT NULL
full_name           varchar(150) NOT NULL
global_role         varchar(20) NOT NULL CHECK IN ('ADMIN','USER')
status              varchar(20) NOT NULL CHECK IN ('ACTIVE','SUSPENDED')
created_at          timestamptz NOT NULL
updated_at          timestamptz NOT NULL
version             bigint NOT NULL
```

Create a case-insensitive uniqueness strategy for email. Preferred simple option:

- normalize email to lowercase before storage;
- unique index on `email`.

### `refresh_tokens`

```text
id                       uuid PK
user_id                  uuid NOT NULL FK users(id) ON DELETE CASCADE
token_hash               char(64) NOT NULL UNIQUE
expires_at               timestamptz NOT NULL
revoked_at               timestamptz NULL
replaced_by_token_id     uuid NULL
created_at               timestamptz NOT NULL
```

Indexes:

- `user_id`
- `expires_at`

### `student_profiles`

```text
user_id              uuid PK FK users(id) ON DELETE CASCADE
faculty              varchar(150) NOT NULL
bio                  varchar(500) NULL
preferred_track      varchar(20) NULL CHECK IN ('TECHNICAL','LOGISTICS')
experience           text NULL
created_at           timestamptz NOT NULL
updated_at           timestamptz NOT NULL
version              bigint NOT NULL
```

### `skills`

```text
id                   uuid PK
name                 varchar(100) NOT NULL UNIQUE
active               boolean NOT NULL DEFAULT true
created_at           timestamptz NOT NULL
```

Seed useful skills through Flyway:

- Programming
- Graphic Design
- Photography
- Video Editing
- Communication
- Tutoring
- Data Entry
- Electrical Support
- Logistics
- Event Operations

### `student_skills`

```text
user_id              uuid NOT NULL FK users(id) ON DELETE CASCADE
skill_id             uuid NOT NULL FK skills(id)
PRIMARY KEY(user_id, skill_id)
```

## 9.3 APIs

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

GET    /api/v1/skills
GET    /api/v1/me/profile
PUT    /api/v1/me/profile
PUT    /api/v1/me/skills
GET    /api/v1/me/volunteer-history
GET    /api/v1/me/donations
```

Admin-only:

```text
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/{userId}/status
```

Use pagination for admin user list.

---

# 10. Organization Module

## 10.1 Domain Model

An Organization is an entity such as:

- University Youth Union;
- Faculty Youth Union;
- Student Association;
- Club;
- Student Team;
- Other approved student organization.

Organizations are NOT login accounts.

Users act on behalf of organizations through membership and permissions.

## 10.2 Organization Status

```text
PENDING_VERIFICATION
VERIFIED
SUSPENDED
```

Only `VERIFIED` organizations can officially own new organization campaigns.

## 10.3 Organization Membership Role

```text
OWNER
MANAGER
MEMBER
```

Rules:

- creator becomes `OWNER`;
- OWNER can manage members;
- OWNER can grant MANAGER/MEMBER;
- OWNER cannot remove the final OWNER without transferring ownership;
- OWNER and MANAGER may submit proposals on behalf of a VERIFIED organization;
- being an organization member does not automatically make the user a campaign manager.

## 10.4 Organization Type

Do not hard-code every organization type as Java enum.

Use a configurable table.

### `organization_types`

```text
id            uuid PK
code          varchar(50) NOT NULL UNIQUE
name          varchar(120) NOT NULL
active        boolean NOT NULL DEFAULT true
created_at    timestamptz NOT NULL
```

Seed:

```text
UNIVERSITY_YOUTH_UNION
FACULTY_YOUTH_UNION
STUDENT_ASSOCIATION
CLUB
STUDENT_TEAM
OTHER
```

### `organizations`

```text
id                      uuid PK
name                    varchar(200) NOT NULL
slug                    varchar(220) NOT NULL UNIQUE
organization_type_id    uuid NOT NULL FK organization_types(id)
description             text NULL
status                  varchar(30) NOT NULL
created_by_user_id      uuid NOT NULL FK users(id)
verified_by_user_id     uuid NULL FK users(id)
verified_at             timestamptz NULL
created_at              timestamptz NOT NULL
updated_at              timestamptz NOT NULL
version                 bigint NOT NULL
```

Recommended unique index:

```text
lower(name)
```

### `organization_members`

```text
organization_id    uuid NOT NULL FK organizations(id) ON DELETE CASCADE
user_id            uuid NOT NULL FK users(id) ON DELETE CASCADE
member_role        varchar(20) NOT NULL CHECK IN ('OWNER','MANAGER','MEMBER')
joined_at          timestamptz NOT NULL
PRIMARY KEY(organization_id, user_id)
```

## 10.5 APIs

Public/authenticated browse:

```text
GET    /api/v1/organizations?status=VERIFIED&q=
GET    /api/v1/organizations/{organizationId}
```

Authenticated:

```text
POST   /api/v1/organizations
PATCH  /api/v1/organizations/{organizationId}
GET    /api/v1/organizations/{organizationId}/members
POST   /api/v1/organizations/{organizationId}/members
PATCH  /api/v1/organizations/{organizationId}/members/{userId}
DELETE /api/v1/organizations/{organizationId}/members/{userId}
GET    /api/v1/me/organizations
```

Admin:

```text
GET    /api/v1/admin/organizations?status=
POST   /api/v1/admin/organizations/{organizationId}/verify
POST   /api/v1/admin/organizations/{organizationId}/suspend
```

Verify transition:

```text
PENDING_VERIFICATION -> VERIFIED
```

Suspend:

```text
VERIFIED -> SUSPENDED
```

Optionally allow Admin to restore:

```text
SUSPENDED -> VERIFIED
```

---

# 11. Campaign Category

Categories are admin-configurable.

### `campaign_categories`

```text
id            uuid PK
name          varchar(120) NOT NULL UNIQUE
slug          varchar(140) NOT NULL UNIQUE
description   varchar(300) NULL
active        boolean NOT NULL DEFAULT true
created_at    timestamptz NOT NULL
updated_at    timestamptz NOT NULL
```

Seed examples:

- Community Support
- Education
- Environment
- Disaster Relief
- Campus Support
- Other

APIs:

```text
GET    /api/v1/campaign-categories

POST   /api/v1/admin/campaign-categories
PATCH  /api/v1/admin/campaign-categories/{id}
```

Prefer deactivation over deleting categories already referenced.

---

# 12. Proposal and Campaign Module

## 12.1 Organizer Type

```text
INDIVIDUAL
ORGANIZATION
```

Rules:

For `INDIVIDUAL`:

- `organization_id` MUST be null;
- proposer becomes campaign owner/manager after approval.

For `ORGANIZATION`:

- `organization_id` MUST be present;
- organization MUST be VERIFIED when proposal is submitted;
- proposer MUST be OWNER or MANAGER of that organization;
- proposer becomes initial campaign manager after approval.

## 12.2 Contribution Mode

```text
VOLUNTEER_ONLY
DONATION_ONLY
HYBRID
```

## 12.3 Proposal Status

```text
PENDING
APPROVED
REJECTED
```

Rules:

- only `PENDING` proposals may be edited by proposer;
- only `PENDING` proposals may be approved/rejected;
- rejection requires reason;
- approved proposal is immutable except audit fields;
- one approved proposal creates exactly one campaign.

## 12.4 Proposal Data

### `proposals`

```text
id                         uuid PK
proposer_user_id           uuid NOT NULL FK users(id)
organizer_type             varchar(20) NOT NULL
organization_id            uuid NULL FK organizations(id)
category_id                uuid NOT NULL FK campaign_categories(id)

title                      varchar(200) NOT NULL
summary                    varchar(500) NOT NULL
description                text NOT NULL
expected_impact            text NULL

contribution_mode          varchar(30) NOT NULL

start_date                 date NOT NULL
end_date                   date NOT NULL
application_deadline       timestamptz NULL
fundraising_deadline       timestamptz NULL

target_volunteer_count     integer NULL
target_technical_count     integer NULL
target_logistics_count     integer NULL
volunteer_requirements     text NULL

fundraising_goal           numeric(19,0) NULL
institutional_funding      numeric(19,0) NOT NULL DEFAULT 0
sponsor_name               varchar(200) NULL
sponsor_funding            numeric(19,0) NOT NULL DEFAULT 0
estimated_budget           numeric(19,0) NULL

status                     varchar(20) NOT NULL
rejection_reason           varchar(1000) NULL
reviewed_by_user_id        uuid NULL FK users(id)
reviewed_at                timestamptz NULL

created_at                 timestamptz NOT NULL
updated_at                 timestamptz NOT NULL
version                    bigint NOT NULL
```

Important checks:

```text
end_date >= start_date
fundraising_goal IS NULL OR fundraising_goal > 0
institutional_funding >= 0
sponsor_funding >= 0
estimated_budget IS NULL OR estimated_budget >= 0
target counts are NULL or >= 0
```

Application rules:

If mode is `DONATION_ONLY`:

- volunteer target fields may be null/zero;
- application_deadline may be null.

If mode is `VOLUNTEER_ONLY`:

- fundraising_goal should be null;
- fundraising_deadline should be null.

If mode is `HYBRID`, both areas may be configured.

For volunteer-enabled campaigns:

```text
target_volunteer_count >= 1
```

If technical/logistics targets are both provided:

```text
target_technical_count + target_logistics_count <= target_volunteer_count
```

## 12.5 Campaign Status

```text
DRAFT
OPEN
ACTIVE
COMPLETED
CANCELLED
```

Allowed normal transitions:

```text
DRAFT -> OPEN
OPEN -> ACTIVE
ACTIVE -> COMPLETED
DRAFT -> CANCELLED
OPEN -> CANCELLED
ACTIVE -> CANCELLED
```

Do not reopen COMPLETED/CANCELLED in MVP.

Rules:

- approved proposal creates campaign as `DRAFT`;
- only campaign manager/admin can transition state;
- `OPEN` is required for new volunteer applications;
- donations are allowed in `OPEN` and `ACTIVE` if campaign accepts donations and fundraising deadline is not passed;
- `ACTIVE` means operational work is in progress;
- `COMPLETED` blocks new applications/donations and normal operational edits.

## 12.6 Campaign Data

### `campaigns`

Copy approved proposal data as campaign snapshot.

```text
id                         uuid PK
proposal_id                uuid NOT NULL UNIQUE FK proposals(id)
slug                       varchar(240) NOT NULL UNIQUE

primary_contact_user_id    uuid NOT NULL FK users(id)
organizer_type             varchar(20) NOT NULL
organization_id            uuid NULL FK organizations(id)
category_id                uuid NOT NULL FK campaign_categories(id)

title                      varchar(200) NOT NULL
summary                    varchar(500) NOT NULL
description                text NOT NULL
expected_impact            text NULL

contribution_mode          varchar(30) NOT NULL

start_date                 date NOT NULL
end_date                   date NOT NULL
application_deadline       timestamptz NULL
fundraising_deadline       timestamptz NULL

target_volunteer_count     integer NULL
target_technical_count     integer NULL
target_logistics_count     integer NULL
volunteer_requirements     text NULL

fundraising_goal           numeric(19,0) NULL
institutional_funding      numeric(19,0) NOT NULL DEFAULT 0
sponsor_name               varchar(200) NULL
sponsor_funding            numeric(19,0) NOT NULL DEFAULT 0
estimated_budget           numeric(19,0) NULL

status                     varchar(20) NOT NULL

created_at                 timestamptz NOT NULL
updated_at                 timestamptz NOT NULL
version                    bigint NOT NULL
```

## 12.7 Campaign Managers

```text
campaign_manager_role:
OWNER
MANAGER
```

### `campaign_managers`

```text
campaign_id        uuid NOT NULL FK campaigns(id) ON DELETE CASCADE
user_id            uuid NOT NULL FK users(id)
manager_role       varchar(20) NOT NULL CHECK IN ('OWNER','MANAGER')
created_at         timestamptz NOT NULL
PRIMARY KEY(campaign_id, user_id)
```

Rules:

- every campaign has exactly one OWNER at MVP;
- OWNER may add/remove MANAGER;
- Admin can manage any campaign;
- for organization campaign, newly assigned campaign managers must be ACTIVE users and organization members;
- for individual campaign, owner may add other active users as managers.

## 12.8 Campaign Skill Requirements

AI matching needs structured skill requirements.

### `campaign_skill_requirements`

```text
campaign_id       uuid NOT NULL FK campaigns(id) ON DELETE CASCADE
skill_id          uuid NOT NULL FK skills(id)
track             varchar(20) NOT NULL CHECK IN ('TECHNICAL','LOGISTICS')
importance        integer NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5)
PRIMARY KEY(campaign_id, skill_id, track)
```

Campaign managers maintain these after campaign creation.

## 12.9 Proposal APIs

Authenticated:

```text
POST   /api/v1/proposals
GET    /api/v1/proposals/mine?page=&size=
GET    /api/v1/proposals/{proposalId}
PATCH  /api/v1/proposals/{proposalId}
```

Admin:

```text
GET    /api/v1/admin/proposals?status=&page=&size=
POST   /api/v1/admin/proposals/{proposalId}/approve
POST   /api/v1/admin/proposals/{proposalId}/reject
```

Reject body:

```json
{
  "reason": "Required reason"
}
```

Approve is one ACID transaction:

1. lock proposal;
2. validate PENDING;
3. validate organization if applicable;
4. set proposal APPROVED;
5. create campaign DRAFT;
6. create initial OWNER campaign manager;
7. commit.

Unique `proposal_id` on campaigns guarantees no duplicate campaign creation.

## 12.10 Campaign APIs

Public:

```text
GET /api/v1/campaigns
GET /api/v1/campaigns/{campaignIdOrSlug}
GET /api/v1/campaigns/{campaignId}/financial-summary
```

Filters:

```text
q
status
categoryId
contributionMode
organizationId
page
size
sort
```

Default page size:

```text
20
```

Maximum page size:

```text
100
```

Manager/Admin:

```text
PATCH  /api/v1/campaigns/{campaignId}

POST   /api/v1/campaigns/{campaignId}/open
POST   /api/v1/campaigns/{campaignId}/start
POST   /api/v1/campaigns/{campaignId}/complete
POST   /api/v1/campaigns/{campaignId}/cancel

GET    /api/v1/campaigns/{campaignId}/managers
POST   /api/v1/campaigns/{campaignId}/managers
DELETE /api/v1/campaigns/{campaignId}/managers/{userId}

GET    /api/v1/campaigns/{campaignId}/skill-requirements
PUT    /api/v1/campaigns/{campaignId}/skill-requirements
```

Do not allow changing ownership type after campaign creation.

---

# 13. Volunteer Module

## 13.1 Contribution Track

```text
TECHNICAL
LOGISTICS
```

This is a broad track, not a job title.

## 13.2 Volunteer Registration Status

```text
PENDING
ACCEPTED
REJECTED
CANCELLED
```

Transitions:

```text
PENDING -> ACCEPTED
PENDING -> REJECTED
PENDING -> CANCELLED
```

No transition out of ACCEPTED/REJECTED/CANCELLED in MVP.

## 13.3 Volunteer Application Rules

A student can apply only if:

- campaign is `OPEN`;
- contribution mode is `VOLUNTEER_ONLY` or `HYBRID`;
- application deadline is not passed;
- student has no existing application for that campaign.

Applying does NOT imply acceptance.

Application count may exceed target count.

When accepting:

- manager selects final `assigned_track`;
- accepted counts should not exceed target unless manager deliberately confirms an override.
- simplest MVP rule: allow manager to exceed target but show warning in UI; do not hard-block.

## 13.4 Table

### `volunteer_registrations`

```text
id                    uuid PK
campaign_id           uuid NOT NULL FK campaigns(id) ON DELETE CASCADE
user_id               uuid NOT NULL FK users(id)
preferred_track       varchar(20) NOT NULL
assigned_track        varchar(20) NULL
motivation            varchar(1000) NOT NULL
availability          varchar(1000) NULL

status                varchar(20) NOT NULL
rejection_reason      varchar(1000) NULL
reviewed_by_user_id   uuid NULL FK users(id)
reviewed_at           timestamptz NULL

created_at            timestamptz NOT NULL
updated_at            timestamptz NOT NULL
version               bigint NOT NULL

UNIQUE(campaign_id, user_id)
```

Indexes:

- `(campaign_id, status)`
- `user_id`

## 13.5 APIs

Student:

```text
POST   /api/v1/campaigns/{campaignId}/applications
GET    /api/v1/me/applications
POST   /api/v1/applications/{applicationId}/cancel
```

Manager:

```text
GET    /api/v1/campaigns/{campaignId}/applications?status=&track=&page=&size=
POST   /api/v1/applications/{applicationId}/accept
POST   /api/v1/applications/{applicationId}/reject
```

Accept body:

```json
{
  "assignedTrack": "TECHNICAL"
}
```

Reject body:

```json
{
  "reason": "Reason"
}
```

---

# 14. Meetings

Meetings belong to a campaign.

### `meetings`

```text
id                   uuid PK
campaign_id          uuid NOT NULL FK campaigns(id) ON DELETE CASCADE
title                varchar(200) NOT NULL
description          text NULL
meeting_type         varchar(20) NOT NULL CHECK IN ('ONLINE','OFFLINE')
starts_at            timestamptz NOT NULL
ends_at              timestamptz NOT NULL
location             varchar(300) NULL
meeting_url          varchar(1000) NULL
created_by_user_id   uuid NOT NULL FK users(id)
created_at           timestamptz NOT NULL
updated_at           timestamptz NOT NULL
version              bigint NOT NULL
```

Rules:

- `ends_at > starts_at`;
- ONLINE requires `meeting_url`;
- OFFLINE requires `location`;
- campaign manager/admin manages meetings;
- accepted volunteers can view.

APIs:

```text
GET    /api/v1/campaigns/{campaignId}/meetings
POST   /api/v1/campaigns/{campaignId}/meetings
PATCH  /api/v1/meetings/{meetingId}
DELETE /api/v1/meetings/{meetingId}
```

Do not integrate Google Calendar in MVP.

---

# 15. Volunteer Tasks

## 15.1 Task Status

```text
TODO
IN_PROGRESS
DONE
VERIFIED
```

Allowed transitions:

```text
TODO -> IN_PROGRESS
IN_PROGRESS -> DONE
DONE -> VERIFIED
```

Manager/Admin may move task backwards before VERIFIED if correction is needed:

```text
IN_PROGRESS -> TODO
DONE -> IN_PROGRESS
```

VERIFIED is terminal in MVP.

## 15.2 Priority

```text
LOW
MEDIUM
HIGH
```

## 15.3 Tables

### `volunteer_tasks`

```text
id                   uuid PK
campaign_id          uuid NOT NULL FK campaigns(id) ON DELETE CASCADE
title                varchar(200) NOT NULL
description          text NOT NULL
track                varchar(20) NOT NULL
priority             varchar(20) NOT NULL
due_at               timestamptz NULL
status               varchar(20) NOT NULL

created_by_user_id   uuid NOT NULL FK users(id)
verified_by_user_id  uuid NULL FK users(id)
verified_at          timestamptz NULL

created_at           timestamptz NOT NULL
updated_at           timestamptz NOT NULL
version              bigint NOT NULL
```

### `task_assignees`

```text
task_id          uuid NOT NULL FK volunteer_tasks(id) ON DELETE CASCADE
user_id          uuid NOT NULL FK users(id)
assigned_at      timestamptz NOT NULL
PRIMARY KEY(task_id, user_id)
```

Rules:

- only ACCEPTED volunteers of campaign may be task assignees;
- task track should generally match assigned volunteer track, but manager may override;
- assignees can move TODO -> IN_PROGRESS -> DONE;
- only manager/admin can VERIFY;
- manager/admin can edit task and assignees before VERIFIED.

## 15.4 APIs

```text
GET    /api/v1/campaigns/{campaignId}/tasks
POST   /api/v1/campaigns/{campaignId}/tasks
GET    /api/v1/tasks/{taskId}
PATCH  /api/v1/tasks/{taskId}
DELETE /api/v1/tasks/{taskId}
POST   /api/v1/tasks/{taskId}/start
POST   /api/v1/tasks/{taskId}/done
POST   /api/v1/tasks/{taskId}/verify

GET    /api/v1/me/tasks
```

Task request contains `assigneeUserIds`.

No drag-and-drop Kanban is required. A simple grouped-column or filterable task view is enough.

---

# 16. Attendance

Attendance MUST support multi-day/multi-session campaigns.

Do not use one campaign-level boolean.

## 16.1 Attendance Session

Campaign manager creates one attendance session for each meaningful attendance period/day.

### `attendance_sessions`

```text
id                   uuid PK
campaign_id          uuid NOT NULL FK campaigns(id) ON DELETE CASCADE
title                varchar(200) NOT NULL
starts_at            timestamptz NOT NULL
ends_at              timestamptz NOT NULL
created_by_user_id   uuid NOT NULL FK users(id)
created_at           timestamptz NOT NULL
updated_at           timestamptz NOT NULL
version              bigint NOT NULL
```

## 16.2 Attendance Record

Status:

```text
PRESENT
ABSENT
```

### `attendance_records`

```text
id                   uuid PK
session_id           uuid NOT NULL FK attendance_sessions(id) ON DELETE CASCADE
user_id              uuid NOT NULL FK users(id)
status               varchar(20) NOT NULL
recorded_by_user_id  uuid NOT NULL FK users(id)
recorded_at          timestamptz NOT NULL
updated_at           timestamptz NOT NULL

UNIQUE(session_id, user_id)
```

Only ACCEPTED campaign volunteers may have attendance records.

## 16.3 APIs

```text
GET    /api/v1/campaigns/{campaignId}/attendance-sessions
POST   /api/v1/campaigns/{campaignId}/attendance-sessions
PATCH  /api/v1/attendance-sessions/{sessionId}
DELETE /api/v1/attendance-sessions/{sessionId}

GET    /api/v1/attendance-sessions/{sessionId}/records
PUT    /api/v1/attendance-sessions/{sessionId}/records
```

Bulk upsert request example:

```json
{
  "records": [
    {
      "userId": "uuid",
      "status": "PRESENT"
    },
    {
      "userId": "uuid",
      "status": "ABSENT"
    }
  ]
}
```

QR check-in is OUT OF SCOPE for CORE.

---

# 17. Volunteer Completion

Attendance and completion are different concepts.

## 17.1 Status

```text
PENDING
COMPLETED
VERIFIED
```

Recommended semantics:

- PENDING: no completion submitted/recorded;
- COMPLETED: work considered complete but not finally verified;
- VERIFIED: manager/admin confirms official campaign completion data.

## 17.2 Table

### `volunteer_completions`

```text
id                   uuid PK
campaign_id          uuid NOT NULL FK campaigns(id) ON DELETE CASCADE
user_id              uuid NOT NULL FK users(id)

status               varchar(20) NOT NULL
verified_hours       numeric(8,2) NULL
note                 varchar(1000) NULL

verified_by_user_id  uuid NULL FK users(id)
verified_at          timestamptz NULL

created_at           timestamptz NOT NULL
updated_at           timestamptz NOT NULL
version              bigint NOT NULL

UNIQUE(campaign_id, user_id)
```

Rules:

- record may only exist for ACCEPTED volunteer;
- `verified_hours >= 0`;
- VERIFIED requires `verified_hours`;
- only manager/admin can set VERIFIED;
- campaign report uses VERIFIED completion, not attendance alone.

APIs:

```text
GET /api/v1/campaigns/{campaignId}/completions
PUT /api/v1/campaigns/{campaignId}/volunteers/{userId}/completion
```

---

# 18. Donation and Payment Module

## 18.1 Payment Strategy

Primary final-demo integration:

```text
ZaloPay Sandbox
```

Implement a provider-independent port:

```java
public interface PaymentGateway {
    PaymentCreationResult createPayment(PaymentCreationCommand command);
    PaymentCallbackResult verifyCallback(String rawBodyOrData, String mac, Integer type);
    PaymentQueryResult query(String providerOrderId);
}
```

Exact Java signatures may be refined, but responsibilities must remain separated.

Implement:

```text
ZaloPaySandboxPaymentGateway
```

Also implement a local-only provider:

```text
LocalMockPaymentGateway
```

Purpose of local mock:

- allow development without external credentials/public callback URL;
- simulate checkout and callback;
- exercise the SAME backend callback/state-transition logic.

The final PBL demo should use ZaloPay Sandbox when credentials/network are available.

Provider is selected by configuration:

```text
PAYMENT_PROVIDER=zalopay | mock
```

## 18.2 ZaloPay Sandbox Requirements

The adapter must implement the production-style flow:

1. Backend creates local donation/payment intent.
2. Backend creates ZaloPay sandbox order.
3. ZaloPay returns checkout/order URL data.
4. Student completes sandbox payment.
5. ZaloPay sends server-to-server callback.
6. Backend verifies callback MAC with callback key.
7. Backend compares:
   - provider order ID;
   - amount;
   - app/merchant identity where applicable.
8. Backend atomically marks payment transaction and donation PAID.
9. Duplicate callback returns success without applying payment twice.

For order creation:

- use HMAC-SHA256 according to provider documentation;
- use payment creation key for order MAC;
- use callback key for callback MAC;
- generate provider order ID in the required provider format;
- use Vietnam date/time requirement for ZaloPay transaction prefix when needed;
- currency is VND.

The callback endpoint must be public and unauthenticated at HTTP authentication level, but cryptographically authenticated through provider MAC verification.

When running external sandbox locally, document that the callback endpoint requires a publicly reachable HTTPS tunnel.

## 18.3 Donation Status

```text
CREATED
PENDING_PAYMENT
PAID
FAILED
CANCELLED
REFUNDED
```

CORE requires:

```text
CREATED
PENDING_PAYMENT
PAID
FAILED
CANCELLED
```

`REFUNDED` status may exist but refund endpoint is STRETCH.

## 18.4 Payment Transaction Status

```text
CREATED
PROVIDER_PENDING
PAID
FAILED
CANCELLED
REFUNDED
```

## 18.5 Donation Rules

A donation is allowed only when:

- authenticated user is ACTIVE;
- campaign status is OPEN or ACTIVE;
- mode is DONATION_ONLY or HYBRID;
- fundraising deadline has not passed;
- amount > 0.

Donation amount limits should be configurable:

```text
APP_DONATION_MIN_VND
APP_DONATION_MAX_VND
```

Use reasonable development defaults.

Do not hard-code real-world legal/compliance assumptions into domain logic.

## 18.6 Tables

### `donations`

```text
id                 uuid PK
campaign_id        uuid NOT NULL FK campaigns(id)
donor_user_id      uuid NOT NULL FK users(id)
amount             numeric(19,0) NOT NULL CHECK(amount > 0)
status             varchar(30) NOT NULL

created_at         timestamptz NOT NULL
updated_at         timestamptz NOT NULL
version            bigint NOT NULL
```

Indexes:

- `(campaign_id, status)`
- `donor_user_id`
- `created_at`

### `payment_transactions`

A donation may have multiple attempts.

```text
id                       uuid PK
donation_id              uuid NOT NULL FK donations(id) ON DELETE CASCADE
provider                 varchar(30) NOT NULL
status                   varchar(30) NOT NULL

provider_order_id        varchar(100) NOT NULL UNIQUE
provider_transaction_id  varchar(100) NULL UNIQUE

amount                   numeric(19,0) NOT NULL
checkout_url             varchar(2000) NULL
provider_response_code   varchar(100) NULL
failure_reason           varchar(1000) NULL

expires_at               timestamptz NULL
paid_at                  timestamptz NULL

created_at               timestamptz NOT NULL
updated_at               timestamptz NOT NULL
version                  bigint NOT NULL
```

Check:

```text
amount > 0
```

Do not store secret keys or full sensitive provider payloads.

## 18.7 Payment Creation Algorithm

`CreateDonationAndPaymentUseCase`:

1. load campaign;
2. verify donation rules;
3. validate amount;
4. transaction A:
   - create Donation status CREATED;
   - create PaymentTransaction status CREATED;
   - commit;
5. call payment provider outside transaction;
6. transaction B:
   - lock/reload PaymentTransaction;
   - on successful provider order creation:
     - save provider checkout URL;
     - set transaction PROVIDER_PENDING;
     - set donation PENDING_PAYMENT;
   - on provider failure:
     - set transaction FAILED;
     - set donation FAILED;
7. return donation ID + payment transaction ID + checkout URL.

## 18.8 Callback Algorithm

`HandlePaymentCallbackUseCase`:

1. verify provider MAC before trusting callback data;
2. identify provider order;
3. open transaction;
4. load PaymentTransaction using a pessimistic write lock or equivalent safe locking;
5. if already PAID:
   - return provider success response;
   - do not update donation totals again;
6. verify callback amount equals stored transaction amount;
7. verify donation exists and amount matches;
8. store provider transaction ID;
9. set PaymentTransaction PAID;
10. set `paid_at`;
11. set Donation PAID;
12. commit;
13. return provider expected success response.

If amount mismatches:

- do not mark paid;
- log security warning;
- return provider failure/invalid callback response.

## 18.9 Payment Query/Reconciliation

Implement a manager/user-safe status refresh endpoint that calls provider query if the transaction is pending.

It MUST still trust only server-side provider result.

API:

```text
POST /api/v1/payments/{paymentTransactionId}/refresh
```

A user may refresh only their own donation payment unless Admin.

## 18.10 APIs

Student:

```text
POST /api/v1/campaigns/{campaignId}/donations
GET  /api/v1/donations/{donationId}
GET  /api/v1/me/donations
POST /api/v1/payments/{paymentTransactionId}/refresh
```

Create donation request:

```json
{
  "amount": 50000
}
```

Response:

```json
{
  "donationId": "uuid",
  "paymentTransactionId": "uuid",
  "status": "PENDING_PAYMENT",
  "checkoutUrl": "https://provider-sandbox/..."
}
```

Provider callback:

```text
POST /api/v1/payments/zalopay/callback
```

Mock-only development flow:

```text
GET  /api/v1/dev/mock-payments/{paymentTransactionId}
POST /api/v1/dev/mock-payments/{paymentTransactionId}/success
POST /api/v1/dev/mock-payments/{paymentTransactionId}/fail
```

The `/dev` endpoints MUST:

- be available only under `dev` profile;
- internally invoke the same callback/application pathway;
- never exist under production profile.

---

# 19. Finance Module

## 19.1 Funding Model

Campaign funding is:

```text
Institutional Funding
+ Sponsor Funding
+ Verified PAID Donations
```

Do not count:

- CREATED donations;
- PENDING_PAYMENT donations;
- FAILED donations;
- CANCELLED donations;
- REFUNDED donations.

## 19.2 Expense Status

```text
PENDING
APPROVED
REJECTED
```

## 19.3 Expense Approval

Campaign manager submits expenses.

Admin approves/rejects expenses.

This creates meaningful separation between organizer submission and institutional verification.

Only APPROVED expenses affect public financial totals.

## 19.4 Table

### `campaign_expenses`

```text
id                   uuid PK
campaign_id          uuid NOT NULL FK campaigns(id) ON DELETE CASCADE
title                varchar(200) NOT NULL
category             varchar(100) NOT NULL
amount               numeric(19,0) NOT NULL CHECK(amount > 0)
expense_date         date NOT NULL
description          varchar(2000) NULL
proof_reference      varchar(1000) NULL

status               varchar(20) NOT NULL
submitted_by_user_id uuid NOT NULL FK users(id)
reviewed_by_user_id  uuid NULL FK users(id)
reviewed_at          timestamptz NULL
rejection_reason     varchar(1000) NULL

created_at           timestamptz NOT NULL
updated_at           timestamptz NOT NULL
version              bigint NOT NULL
```

No file-upload infrastructure in CORE.

`proof_reference` may be a textual reference or externally hosted URL.

## 19.5 Financial Summary

Return:

```json
{
  "campaignId": "uuid",
  "institutionalFunding": 10000000,
  "sponsorFunding": 5000000,
  "verifiedDonations": 2500000,
  "totalFunding": 17500000,
  "approvedExpenses": 8000000,
  "remainingFunds": 9500000,
  "fundraisingGoal": 10000000,
  "successfulDonationCount": 25
}
```

Formula:

```text
totalFunding =
  institutionalFunding
  + sponsorFunding
  + sum(PAID donations)

remainingFunds =
  totalFunding
  - sum(APPROVED expenses)
```

Calculate financial totals server-side using database aggregate queries.

Never accept client-provided totals.

## 19.6 APIs

Public financial transparency:

```text
GET /api/v1/campaigns/{campaignId}/financial-summary
GET /api/v1/campaigns/{campaignId}/expenses
```

Public `expenses` endpoint returns only APPROVED expenses.

Manager:

```text
GET  /api/v1/campaigns/{campaignId}/management/expenses
POST /api/v1/campaigns/{campaignId}/expenses
PATCH /api/v1/expenses/{expenseId}
```

Admin:

```text
GET  /api/v1/admin/expenses?status=PENDING&page=&size=
POST /api/v1/admin/expenses/{expenseId}/approve
POST /api/v1/admin/expenses/{expenseId}/reject
```

Reject requires reason.

---

# 20. AI Module

## 20.1 AI Philosophy

AI is advisory only.

AI MUST NOT:

- approve/reject proposals;
- accept/reject volunteers automatically;
- verify attendance;
- verify completion;
- approve/reject expenses;
- mark payments successful;
- award official university credits.

The application MUST still function if AI is unavailable.

## 20.2 AI Provider Abstraction

Use:

```java
public interface AiService {
    VolunteerMatchResult evaluateVolunteer(VolunteerMatchInput input);
}
```

Provider configuration:

```text
AI_ENABLED=true|false
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=
```

Implement one OpenAI-compatible HTTP adapter.

Do not hard-code a provider-specific domain dependency.

When AI is disabled/missing credentials:

- core application remains usable;
- matching endpoint returns an explicit unavailable result or graceful 503;
- no campaign workflow is blocked.

## 20.3 AI Volunteer Matching — CORE AI Feature

Authorized users:

- campaign manager;
- Admin.

Input to AI MUST contain only information useful to matching.

Do not send:

- email;
- password;
- student ID;
- payment history;
- donation amount;
- unnecessary personal identifiers.

Input can include:

```json
{
  "campaign": {
    "title": "...",
    "description": "...",
    "volunteerRequirements": "...",
    "requiredSkills": [
      {
        "name": "Photography",
        "track": "TECHNICAL",
        "importance": 5
      }
    ]
  },
  "candidate": {
    "candidateRef": "internal-random-ref",
    "preferredTrack": "TECHNICAL",
    "skills": ["Photography", "Video Editing"],
    "experience": "...",
    "availability": "..."
  }
}
```

Expected structured AI output:

```json
{
  "score": 86,
  "recommendedTrack": "TECHNICAL",
  "matchedSkills": ["Photography", "Video Editing"],
  "missingSkills": [],
  "reason": "Short, factual explanation",
  "confidence": "HIGH"
}
```

Rules:

- score range 0–100;
- score is advisory;
- never use donation behavior;
- never use protected/sensitive attributes;
- never auto-accept based on score;
- manager sees clear label: `AI suggestion — final decision is yours`.

## 20.4 Matching Multiple Applicants

API may evaluate pending applicants and return a list.

The application may pre-compute deterministic overlap information before AI:

```text
matched required skill count
weighted skill overlap
preferred track match
```

AI can use this structured context to produce a concise explanation.

Do not ask AI to invent student qualifications.

## 20.5 API

```text
POST /api/v1/campaigns/{campaignId}/ai/volunteer-matches
```

Request:

```json
{
  "applicationIds": ["uuid-1", "uuid-2"]
}
```

If omitted, evaluate current PENDING applications up to a safe configured limit, e.g. 20 at once.

Response:

```json
{
  "generatedAt": "timestamp",
  "model": "configured-model",
  "recommendations": [
    {
      "applicationId": "uuid",
      "score": 86,
      "recommendedTrack": "TECHNICAL",
      "matchedSkills": ["Photography"],
      "missingSkills": [],
      "reason": "...",
      "confidence": "HIGH"
    }
  ]
}
```

Do not persist AI results in CORE unless persistence becomes useful during implementation.

## 20.6 AI Campaign Impact Report — STRETCH

Only implement after CORE is complete.

Input from verified database data:

- accepted volunteers;
- verified volunteers;
- verified hours;
- completed/verified tasks;
- verified donations;
- approved expenses;
- remaining funds.

AI output is a draft report requiring human review.

---

# 21. Reporting Module

## 21.1 Excel Only in CORE

Generate `.xlsx` using Apache POI.

Do not implement PDF in CORE.

## 21.2 Volunteer Report

Endpoint:

```text
GET /api/v1/campaigns/{campaignId}/reports/volunteers.xlsx
```

Authorized:

- campaign manager;
- Admin.

Columns:

```text
Full Name
Student ID
Faculty
Campaign
Assigned Contribution Track
Application Status
Present Attendance Sessions
Total Attendance Sessions
Completion Status
Verified Hours
Verified At
```

Only include relevant campaign volunteers.

## 21.3 Financial Report

Endpoint:

```text
GET /api/v1/campaigns/{campaignId}/reports/financial.xlsx
```

Sheets:

### Summary

```text
Campaign
Institutional Funding
Sponsor
Sponsor Funding
Verified Donations
Total Funding
Approved Expenses
Remaining Funds
Successful Donation Count
```

### Donations

```text
Donation ID
Donor Student ID
Donor Name
Amount
Status
Paid At
Payment Provider
Provider Transaction Reference
```

### Expenses

```text
Expense
Category
Amount
Expense Date
Status
Submitted By
Reviewed By
Reviewed At
```

Financial report is private to manager/Admin.

Do not publish donor identity on public campaign pages.

---

# 22. Dashboard Module

## 22.1 Admin Dashboard

Endpoint:

```text
GET /api/v1/admin/dashboard
```

Return at minimum:

- activeCampaigns;
- completedCampaigns;
- pendingProposals;
- pendingOrganizationVerifications;
- verifiedOrganizations;
- uniqueAcceptedVolunteers;
- verifiedVolunteerHours;
- successfulDonationVolume;
- activeFundraisingCampaigns;
- pendingExpenses.

Avoid a university-wide participation percentage because the application does not necessarily know total DUT enrollment.

## 22.2 Campaign Dashboard

Endpoint:

```text
GET /api/v1/campaigns/{campaignId}/dashboard
```

Authorized:

- campaign manager;
- Admin.

Return:

- applications total;
- pending/accepted/rejected counts;
- assigned Technical count;
- assigned Logistics count;
- task counts by status;
- attendance session count;
- verified completion count;
- verified volunteer hours;
- financial summary;
- pending expense count.

Use aggregate database queries instead of loading all entities into memory.

---

# 23. Public Campaign Experience

Campaign list card displays:

- title;
- organizer display name;
- category;
- contribution mode;
- status;
- start/end dates;
- volunteer target summary if applicable;
- fundraising progress if applicable.

Campaign detail displays:

- title;
- summary;
- description;
- organizer;
- primary contact display name;
- category;
- dates;
- contribution mode;
- volunteer requirements;
- target counts;
- required skills;
- volunteer apply CTA when eligible;
- fundraising goal/progress when eligible;
- donation CTA when eligible;
- approved expenses summary;
- campaign status.

There is NO:

- announcement feed;
- chat;
- comments;
- reactions;
- donor leaderboard.

---

# 24. Frontend Architecture

Recommended structure:

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── layout/
├── features/
│   ├── auth/
│   ├── profile/
│   ├── organizations/
│   ├── proposals/
│   ├── campaigns/
│   ├── volunteers/
│   ├── meetings/
│   ├── tasks/
│   ├── attendance/
│   ├── donations/
│   ├── finance/
│   ├── ai/
│   ├── admin/
│   └── reports/
├── shared/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── utils/
├── main.tsx
└── index.css
```

## 24.1 State Rules

TanStack Query owns:

- campaigns;
- proposals;
- organizations;
- applications;
- tasks;
- meetings;
- attendance;
- donations;
- financial data;
- dashboards.

Zustand owns:

- access token in memory;
- current authenticated user summary;
- small UI preferences if needed.

Do not duplicate server state into Zustand.

## 24.2 Axios

Create one Axios instance.

Behavior:

- base URL from `VITE_API_BASE_URL`, default `/api/v1`;
- include credentials for refresh cookie;
- attach bearer token;
- on 401:
  - attempt one refresh;
  - retry original request once;
  - if refresh fails, clear auth and redirect/login state;
- prevent infinite refresh loops.

## 24.3 Forms

Use React Hook Form + Zod.

Client validation improves UX but backend remains authoritative.

Render backend field errors when available.

## 24.4 Routing

Public:

```text
/
 /login
 /register
 /campaigns
 /campaigns/:idOrSlug
 /organizations
 /organizations/:id
```

Authenticated student:

```text
/me/profile
/me/applications
/me/tasks
/me/donations
/me/history
/proposals/new
/proposals
/organizations/new
```

Campaign management:

```text
/manage/campaigns/:campaignId
/manage/campaigns/:campaignId/applications
/manage/campaigns/:campaignId/team
/manage/campaigns/:campaignId/tasks
/manage/campaigns/:campaignId/meetings
/manage/campaigns/:campaignId/attendance
/manage/campaigns/:campaignId/finance
/manage/campaigns/:campaignId/ai
/manage/campaigns/:campaignId/reports
```

Admin:

```text
/admin
/admin/proposals
/admin/organizations
/admin/expenses
/admin/users
/admin/categories
```

Payment result:

```text
/payment/result?donationId=...
```

Payment result page MUST:

1. not trust query-string "success";
2. fetch donation status from backend;
3. show PAID/PENDING/FAILED based on server state;
4. offer refresh status action while pending.

---

# 25. Pagination Contract

For list endpoints use Spring `Pageable` semantics but return a stable application response:

```json
{
  "items": [],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5,
  "hasNext": true,
  "hasPrevious": false
}
```

Do not return raw Spring `Page` JSON.

Default sort should be deterministic, usually:

```text
createdAt DESC
```

Campaign public browse may sort by:

- newest;
- start date;
- fundraising progress if implemented later.

---

# 26. Database Migration Strategy

Use Flyway SQL migrations only.

Migration folder:

```text
backend/src/main/resources/db/migration/
```

Suggested migration sequence:

```text
V1__create_identity_tables.sql
V2__seed_identity_reference_data.sql
V3__create_organization_tables.sql
V4__seed_organization_types.sql
V5__create_campaign_tables.sql
V6__seed_campaign_categories.sql
V7__create_volunteer_tables.sql
V8__create_meeting_task_attendance_tables.sql
V9__create_donation_payment_tables.sql
V10__create_finance_tables.sql
V11__add_indexes.sql
```

Rules:

- never edit an already-applied migration after it is committed/shared;
- add a new migration instead;
- keep migrations deterministic;
- create indexes explicitly;
- use `IF NOT EXISTS` sparingly; migration failures should reveal schema drift;
- no Hibernate `create`/`update`;
- seed only stable reference data, not fake users/passwords.

---

# 27. Indexing

Create useful indexes.

At minimum:

```text
users(email)
users(student_id)

organization_members(user_id)
organizations(status)

proposals(status, created_at)
proposals(proposer_user_id)

campaigns(status)
campaigns(category_id)
campaigns(organization_id)
campaigns(contribution_mode)
campaigns(start_date)

campaign_managers(user_id)

volunteer_registrations(campaign_id, status)
volunteer_registrations(user_id)

meetings(campaign_id, starts_at)

volunteer_tasks(campaign_id, status)
task_assignees(user_id)

attendance_sessions(campaign_id, starts_at)
attendance_records(session_id, user_id)

volunteer_completions(campaign_id, status)
volunteer_completions(user_id)

donations(campaign_id, status)
donations(donor_user_id, created_at)

payment_transactions(donation_id)
payment_transactions(provider_order_id)

campaign_expenses(campaign_id, status)
campaign_expenses(status, created_at)
```

Use database query plans only if actual performance problems appear. Do not invent premature caching.

---

# 28. Cross-Module Dependency Rules

Allowed conceptual dependencies:

```text
identity
  ↑
organization
  ↑
campaign
  ↑
volunteer

campaign -> identity
campaign -> organization

donation -> identity
donation -> campaign

finance -> campaign
finance -> identity

ai -> campaign read port
ai -> volunteer read port
ai -> identity/profile read port

reporting -> read/query access across modules
dashboard -> read/query access across modules
```

Avoid circular service calls.

Use small application/read ports for cross-module checks.

Examples:

```java
public interface OrganizationAccessPort {
    boolean isVerified(UUID organizationId);
    boolean canRepresent(UUID organizationId, UUID userId);
}
```

```java
public interface CampaignAccessPort {
    CampaignAccessSnapshot getCampaign(UUID campaignId);
    boolean isManager(UUID campaignId, UUID userId);
}
```

Do not expose another module's repository directly just for convenience.

Reporting/dashboard are allowed to use dedicated read queries joining multiple tables because they are query-oriented boundary modules and do not mutate foreign aggregates.

---

# 29. Authorization Rules

Implement reusable authorization services.

Examples:

```text
isAdmin(userId)
isCampaignManager(campaignId, userId)
isCampaignOwner(campaignId, userId)
canRepresentOrganization(organizationId, userId)
isAcceptedVolunteer(campaignId, userId)
ownsDonation(donationId, userId)
```

Never rely only on hidden frontend buttons.

Every protected endpoint must perform backend authorization.

Key permissions:

### Admin

Can:

- verify/suspend organizations;
- approve/reject proposals;
- view all campaigns;
- cancel campaigns;
- approve/reject expenses;
- export reports;
- view dashboards;
- manage user status;
- manage categories.

### Campaign OWNER/MANAGER

Can:

- edit their campaign;
- manage campaign state except policy-restricted admin actions;
- manage applications;
- meetings;
- tasks;
- attendance;
- completions;
- submit expenses;
- view campaign financial details;
- run AI matching;
- export campaign reports.

### Student

Can:

- maintain own profile;
- create individual proposal;
- create organization;
- represent organization if authorized;
- apply as volunteer;
- cancel pending own application;
- view own tasks/meetings;
- update own permitted task state;
- donate;
- view own donation status/history.

---

# 30. Core Business Rules

These are mandatory invariants.

```text
BR-01  One approved Proposal creates at most one Campaign.
BR-02  Only PENDING proposals may be approved/rejected.
BR-03  Rejected proposals require a rejection reason.
BR-04  Only VERIFIED organizations may own new organization campaigns.
BR-05  A user must be OWNER/MANAGER of an organization to propose on its behalf.
BR-06  Campaign-management permission is scoped to the campaign.
BR-07  Organization membership alone does not grant campaign management.
BR-08  One student may have at most one volunteer application per campaign.
BR-09  Application does not imply volunteer acceptance.
BR-10  Only ACCEPTED volunteers may receive tasks.
BR-11  Only ACCEPTED volunteers may receive attendance records.
BR-12  Attendance and completion are separate.
BR-13  Only manager/Admin may issue VERIFIED completion.
BR-14  Only donation-enabled campaigns accept donations.
BR-15  Only OPEN/ACTIVE eligible campaigns accept donations.
BR-16  Frontend cannot mark a payment successful.
BR-17  Payment success requires verified server-side provider data.
BR-18  Callback processing is idempotent.
BR-19  Callback amount must equal stored payment amount.
BR-20  Only PAID donations contribute to fundraising totals.
BR-21  Only APPROVED expenses affect remaining funds.
BR-22  AI never executes sensitive decisions.
BR-23  AI matching must not use donation amounts or financial behavior.
BR-24  Public financial views do not expose donor identity.
BR-25  COMPLETED/CANCELLED campaigns do not accept new contributions.
BR-26  Money calculations use BigDecimal/numeric, never floating point.
```

---

# 31. State Transition Summary

## Proposal

```text
PENDING -> APPROVED
PENDING -> REJECTED
```

## Organization

```text
PENDING_VERIFICATION -> VERIFIED
VERIFIED -> SUSPENDED
SUSPENDED -> VERIFIED   (Admin restore)
```

## Campaign

```text
DRAFT -> OPEN
OPEN -> ACTIVE
ACTIVE -> COMPLETED

DRAFT -> CANCELLED
OPEN -> CANCELLED
ACTIVE -> CANCELLED
```

## Volunteer Registration

```text
PENDING -> ACCEPTED
PENDING -> REJECTED
PENDING -> CANCELLED
```

## Task

```text
TODO -> IN_PROGRESS
IN_PROGRESS -> TODO       manager correction
IN_PROGRESS -> DONE
DONE -> IN_PROGRESS       manager correction
DONE -> VERIFIED
```

## Completion

```text
PENDING -> COMPLETED
COMPLETED -> VERIFIED
```

Manager may directly mark VERIFIED if the UI/use case collects required data and domain method applies both transitions atomically.

## Expense

```text
PENDING -> APPROVED
PENDING -> REJECTED
```

## Donation

```text
CREATED -> PENDING_PAYMENT
CREATED -> FAILED
PENDING_PAYMENT -> PAID
PENDING_PAYMENT -> FAILED
PENDING_PAYMENT -> CANCELLED
PAID -> REFUNDED          stretch
```

---

# 32. Admin Bootstrap

Do not seed plaintext demo admin credentials in Flyway.

Implement controlled bootstrap through environment variables.

Example:

```text
APP_BOOTSTRAP_ADMIN_ENABLED=true
APP_BOOTSTRAP_ADMIN_EMAIL=admin@example.local
APP_BOOTSTRAP_ADMIN_STUDENT_ID=ADMIN001
APP_BOOTSTRAP_ADMIN_FULL_NAME=System Admin
APP_BOOTSTRAP_ADMIN_PASSWORD=change-me
```

At startup:

- if enabled;
- if no user with configured email exists;
- create ADMIN with BCrypt password;
- log that bootstrap occurred, but never log password.

Production defaults bootstrap disabled.

---

# 33. Configuration

`.env.example` should include at minimum:

```text
# PostgreSQL
POSTGRES_DB=dut_connect
POSTGRES_USER=dut_connect
POSTGRES_PASSWORD=dut_connect_dev

SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/dut_connect
SPRING_DATASOURCE_USERNAME=dut_connect
SPRING_DATASOURCE_PASSWORD=dut_connect_dev

# JWT
APP_JWT_SECRET=replace-with-a-long-random-secret
APP_ACCESS_TOKEN_TTL_MINUTES=15
APP_REFRESH_TOKEN_TTL_DAYS=7

# CORS
APP_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080

# Bootstrap admin
APP_BOOTSTRAP_ADMIN_ENABLED=true
APP_BOOTSTRAP_ADMIN_EMAIL=admin@example.local
APP_BOOTSTRAP_ADMIN_STUDENT_ID=ADMIN001
APP_BOOTSTRAP_ADMIN_FULL_NAME=System Admin
APP_BOOTSTRAP_ADMIN_PASSWORD=change-me

# Payment
PAYMENT_PROVIDER=mock
APP_DONATION_MIN_VND=10000
APP_DONATION_MAX_VND=100000000

ZALOPAY_APP_ID=
ZALOPAY_KEY1=
ZALOPAY_KEY2=
ZALOPAY_CREATE_ORDER_URL=
ZALOPAY_QUERY_ORDER_URL=
ZALOPAY_CALLBACK_URL=
ZALOPAY_REDIRECT_URL=

# AI
AI_ENABLED=false
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=

# Frontend
VITE_API_BASE_URL=/api/v1
```

Do not commit real secrets.

---

# 34. Backend Configuration

`application.yml` should configure:

- application name;
- profiles;
- datasource;
- Flyway;
- JPA;
- Jackson;
- actuator;
- custom app properties.

Important:

```text
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false
spring.flyway.enabled=true
```

Disable Open Session in View.

Use explicit transactions in application layer.

Production SQL logging off.

Development SQL logging may be optionally enabled without leaking values.

---

# 35. Docker Compose

Minimum topology:

```text
browser
   |
frontend nginx :8080
   |---- static React
   |
   +---- /api/* -> backend:8080

backend
   |
postgres:5432
```

Suggested external ports:

```text
frontend: 8080
backend: 8081   optional direct dev/debug
postgres: 5432  optional dev exposure
```

Production-like compose should let browser access frontend on:

```text
http://localhost:8080
```

Nginx proxies:

```text
/api/ -> http://backend:8080/api/
```

For ZaloPay callback during local development:

- backend callback must be reachable from public internet;
- use a public HTTPS tunnel and configure callback URL accordingly.

Do not expose database in a production deployment unless needed.

---

# 36. Manual Smoke Checklist

Because automated tests are intentionally out of scope, create:

```text
docs/manual-smoke-checklist.md
```

It MUST cover manually verifying:

1. register;
2. login;
3. refresh;
4. logout;
5. create organization;
6. admin verifies organization;
7. organization representative creates proposal;
8. admin approves proposal;
9. campaign created exactly once;
10. campaign opened;
11. student applies;
12. duplicate application rejected;
13. manager accepts;
14. manager assigns task;
15. volunteer updates task;
16. manager verifies task;
17. manager creates attendance session;
18. attendance saved;
19. manager verifies volunteer completion;
20. donor creates donation;
21. sandbox/mock payment callback marks PAID;
22. duplicate callback does not duplicate totals;
23. expense submitted;
24. admin approves expense;
25. financial summary correct;
26. AI matching returns suggestion or gracefully reports disabled provider;
27. Excel volunteer report downloads;
28. Excel financial report downloads;
29. unauthorized users cannot access manager/admin actions;
30. Docker Compose starts full stack successfully.

This is documentation, not automated tests.

---

# 37. UX Requirements

The interface should be clean and demo-ready, not visually experimental.

General requirements:

- responsive desktop/tablet/mobile;
- clear loading states;
- clear empty states;
- toast or inline success/error feedback;
- destructive actions require confirmation;
- status displayed as badges;
- forms preserve values after server validation errors;
- tables paginate;
- buttons disabled while mutation in progress;
- money displayed as VND using `Intl.NumberFormat`;
- dates displayed consistently;
- no raw enum text such as `PENDING_PAYMENT` when a friendly label can be shown.

Do not hide important financial or volunteer status only behind color; include text.

# 37.1 DUT-Inspired Color Theme

The DUT Connect frontend should use a color theme visually inspired by the official DUT website:

https://en.dut.udn.vn/

Only the **color identity and general visual tone** should be referenced.

Do NOT copy or imitate:

- DUT website layout;
- page structure;
- navigation style;
- header/footer composition;
- content arrangement;
- typography hierarchy;
- public university website interaction patterns.

DUT Connect should remain a modern application UI with its own layout and component system.

The intended visual direction is:

- dominant white background;
- DUT-inspired blue as the primary brand color;
- lighter blue tones for secondary surfaces and highlights;
- neutral gray borders and text;
- clean, minimal surfaces;
- restrained use of strong colors.

The application should visually feel related to DUT through color identity, but should not look like a clone of the DUT website.

Use semantic theme tokens such as:

- `primary`
- `primary-hover`
- `primary-light`
- `primary-muted`
- `background`
- `surface`
- `surface-muted`
- `border`
- `text-primary`
- `text-secondary`
- `success`
- `warning`
- `danger`

Before finalizing the palette, inspect the DUT reference website and derive an approximate blue/white palette from its public visual identity.

Do not scatter raw HEX values across components.

Centralize colors in the Tailwind/CSS theme configuration and reuse them consistently across the entire frontend.

---

# 38. Required Screens

## Public

- Landing/Campaign list
- Campaign detail
- Organization list
- Organization detail
- Login
- Register

## Student

- My Profile + Skills
- My Applications
- My Tasks
- My Volunteer History
- My Donations
- My Proposals
- Create Proposal
- Create Organization
- My Organizations

## Campaign Manager

- Campaign Overview Dashboard
- Campaign Edit
- Skill Requirements
- Applications
- Team/Accepted Volunteers
- Meetings
- Tasks
- Attendance Sessions
- Volunteer Completion
- Finance/Expenses
- AI Matching
- Reports

## Admin

- Admin Dashboard
- Pending Proposals
- Proposal Detail/Review
- Organization Verification
- Pending Expenses
- User Management
- Campaign Category Management

---

# 39. API Response Guidelines

For creation endpoints return:

- HTTP 201;
- created resource DTO or command result;
- `Location` header where reasonable.

For successful state command:

- HTTP 200 with updated state/resource;
- avoid empty 204 if frontend needs refreshed status.

For delete:

- HTTP 204.

Validation errors:

- HTTP 400.

Duplicate unique violations:

- map meaningful known constraints to 409.

Avoid leaking raw SQL constraint names to client.

---

# 40. Slug Generation

Organizations and campaigns have slugs.

Rules:

- normalize title/name to URL-safe lower-case slug;
- remove/normalize Vietnamese diacritics for readability;
- append short suffix if conflict;
- slug is stable after creation in MVP even if title/name changes.

Never use slug as database PK.

---

# 41. Clean Code Rules

Backend:

- constructor injection only;
- classes should have focused responsibility;
- methods should be small enough to understand;
- meaningful domain names;
- no `Utils` dumping ground;
- no `Helper` dumping ground;
- no boolean parameters whose meaning is unclear;
- no magic strings for statuses;
- no catch-all `catch (Exception)` unless converting an external boundary failure with logging;
- never swallow exceptions;
- custom domain exceptions should carry meaningful error code;
- avoid N+1 queries;
- use projections/query DTOs for dashboards;
- avoid returning giant entity graphs.

Frontend:

- no `any` except unavoidable third-party interop with a comment;
- API DTO types centralized by feature;
- do not put all requests into one giant `api.ts`;
- feature hooks wrap TanStack Query;
- components should not contain raw Axios calls;
- route/page components orchestrate, reusable components render;
- avoid prop drilling where a feature context/query is cleaner;
- no duplicated status label/color mapping—centralize per domain.

---

# 42. Things Explicitly Out of Scope

Do NOT implement these in CORE:

- comments;
- reactions;
- announcement feed;
- chat;
- WebSockets;
- social network feed;
- donor leaderboard;
- public donor identity list;
- QR attendance;
- file upload/storage service;
- receipt image upload;
- PDF reports;
- multiple live payment providers;
- payment refund UI;
- DUT SSO;
- automatic Social Work Point synchronization;
- email notifications;
- SMS;
- push notifications;
- AI proposal approval;
- AI automatic volunteer acceptance;
- AI automatic expense approval;
- microservices;
- message broker;
- Redis/cache layer;
- Elasticsearch;
- Kubernetes;
- automated tests.

---

# 43. Stretch Features

Only after ALL core Definition of Done items work:

1. QR attendance.
2. AI campaign impact report.
3. PDF export.
4. Receipt upload.
5. Payment refund.
6. Second payment provider.
7. DUT SSO.
8. Official Social Work Point integration.
9. Email notification.

Stretch work must not destabilize CORE.

---

# 44. Implementation Roadmap for the Coding Agent

The coding agent should implement in this order.

## Phase 1 — Repository and Infrastructure

Create:

- backend Spring Boot project;
- frontend Vite React TS project;
- Docker Compose;
- PostgreSQL;
- Flyway baseline migrations;
- Nginx;
- health check;
- environment configuration;
- Maven/npm build success.

Exit criteria:

```text
./mvnw clean package -DskipTests
npm run build
docker compose up --build
```

all work.

## Phase 2 — Identity and Security

Implement:

- users;
- profiles;
- skills;
- register;
- login;
- JWT;
- refresh rotation;
- logout;
- current user;
- bootstrap admin;
- route security;
- frontend auth flow.

Exit criteria:

- USER and ADMIN login;
- refresh survives browser reload;
- protected route works.

## Phase 3 — Organizations

Implement:

- organization types;
- organization creation;
- membership;
- admin verify/suspend;
- organization pages;
- organization permissions.

Exit criteria:

- verified organization can be represented only by authorized members.

## Phase 4 — Proposals and Campaigns

Implement:

- categories;
- proposal creation/edit/list;
- admin approve/reject;
- transactional campaign creation;
- campaign managers;
- campaign state transitions;
- campaign public browse/detail;
- skill requirements.

Exit criteria:

- approve creates exactly one DRAFT campaign and owner manager.

## Phase 5 — Volunteer Recruitment

Implement:

- applications;
- duplicate protection;
- acceptance/rejection/cancel;
- assigned track;
- manager applicant UI;
- student application history.

Exit criteria:

- end-to-end application flow works with authorization.

## Phase 6 — Meetings, Tasks, Attendance, Completion

Implement:

- meetings;
- tasks + assignees;
- task transitions;
- attendance sessions + bulk records;
- completion + verified hours;
- student task/history UI.

Exit criteria:

- accepted volunteer can be coordinated and finally verified.

## Phase 7 — Donation and Payment

Implement first:

- LocalMockPaymentGateway;
- donation;
- payment transaction;
- callback state machine;
- idempotency;
- payment result UI.

Then implement:

- ZaloPaySandboxPaymentGateway;
- create order;
- callback MAC verification;
- provider query;
- status refresh.

Exit criteria:

- sandbox/mock checkout uses server-side callback;
- frontend cannot fake PAID;
- duplicate callback is safe.

## Phase 8 — Finance

Implement:

- expenses;
- admin expense approval;
- public approved expense list;
- financial aggregate summary;
- campaign finance UI.

Exit criteria:

- verified donations + approved expenses produce correct totals.

## Phase 9 — AI Matching

Implement:

- AI provider abstraction;
- disabled mode;
- OpenAI-compatible adapter;
- minimal-data prompt;
- structured response parsing;
- manager AI matching page.

Exit criteria:

- AI suggestion cannot mutate application status.

## Phase 10 — Dashboards and Reports

Implement:

- admin dashboard;
- campaign dashboard;
- volunteer Excel;
- financial Excel;
- download UI.

## Phase 11 — Hardening and Finalization

Perform manual review for:

- authorization gaps;
- invalid state transitions;
- payment amount verification;
- callback idempotency;
- optimistic lock mapping;
- N+1 queries;
- validation;
- error envelope;
- responsive UI;
- Docker;
- README;
- smoke checklist.

Do not add automated tests.

---

# 45. Final Definition of Done

The project is DONE only when all of the following are true.

## Build

- Java 21 backend builds.
- Spring Boot version is exactly 3.4.3.
- Node runtime is documented as 22.12+.
- frontend production build succeeds.
- Docker Compose starts full stack.
- Flyway creates database from empty PostgreSQL 16 instance.
- Hibernate validates the Flyway-created schema.

## Security

- password hashing works;
- JWT access works;
- refresh rotation works;
- logout revokes refresh token;
- backend authorization protects all manager/admin operations;
- no secret appears in repository.

## Organizations

- student can create organization;
- Admin verifies organization;
- only authorized organization representative can create organization proposal;
- campaign manager scope is separate from organization membership.

## Campaign

- proposal can be created;
- Admin approves/rejects;
- approval creates one campaign atomically;
- campaign lifecycle enforced;
- public campaign browse works.

## Volunteer

- application works;
- duplicate application blocked;
- accept/reject works;
- assigned track works;
- meetings/tasks work;
- multi-session attendance works;
- completion verification and hours work.

## Donation/Payment

- donation creation works;
- mock payment works in dev;
- ZaloPay sandbox adapter is implemented;
- callback verification is server-side;
- callback amount is verified;
- duplicate callback is idempotent;
- frontend cannot forge payment status;
- pending transaction can be refreshed/query-checked.

## Finance

- expense submit works;
- Admin approve/reject works;
- only approved expense affects totals;
- only PAID donation affects totals;
- financial summary is correct.

## AI

- matching uses only relevant volunteer/campaign information;
- AI is advisory;
- AI outage does not break core campaign functionality;
- no AI result changes application state automatically.

## Reporting

- volunteer Excel downloads;
- financial Excel downloads;
- reports have usable column headers and values.

## UX

- public, student, manager, admin flows are navigable;
- loading/error/empty states exist;
- payment result reads server status;
- responsive layout is acceptable.

## Documentation

`README.md` includes:

- project overview;
- architecture;
- prerequisites;
- local setup;
- environment variables;
- Docker setup;
- payment sandbox setup;
- public callback/tunnel note;
- AI configuration;
- admin bootstrap;
- build commands;
- demo scenario.

`docs/manual-smoke-checklist.md` exists and covers the core flow.

---

# 46. Recommended Final Demo Scenario

Use one organization-led HYBRID campaign.

Example flow:

1. Student account representing a Youth Union officer logs in.
2. Organization already exists or is created.
3. Admin verifies organization.
4. Organization OWNER/MANAGER submits HYBRID campaign proposal.
5. Admin approves.
6. Campaign is created as DRAFT.
7. Campaign owner configures required skills.
8. Owner opens campaign.
9. Student A applies as TECHNICAL.
10. Student B applies as LOGISTICS.
11. Manager runs AI volunteer matching.
12. AI recommends based on skills.
13. Manager manually accepts applications.
14. Manager creates meeting/task.
15. Student works task.
16. Manager creates attendance session.
17. Attendance is recorded.
18. Student C creates donation.
19. Backend creates sandbox payment.
20. Student completes sandbox payment.
21. Provider callback reaches backend.
22. Backend verifies callback and marks donation PAID.
23. Fundraising total updates.
24. Manager submits campaign expense.
25. Admin approves expense.
26. Financial summary updates.
27. Manager verifies volunteer completion/hours.
28. Admin/manager downloads volunteer Excel report.
29. Admin/manager downloads financial Excel report.
30. Dashboard shows campaign outcome.

This scenario should demonstrate:

- RBAC;
- scoped authorization;
- DDD state transitions;
- database constraints;
- ACID transaction boundaries;
- external payment integration;
- webhook/callback security;
- financial consistency;
- AI integration;
- reporting;
- Dockerized deployment.

---

# 47. Product Boundary Reminder

DUT Connect is:

> A structured university contribution and campaign coordination platform where students can contribute time, skills, or financial support, while organizations and administrators receive verifiable workflows, payment records, transparent financial summaries, and operational reports.

DUT Connect is NOT:

- a social network;
- a chat application;
- a banking product;
- a full accounting package;
- an autonomous AI decision system.

When implementation choices are ambiguous, preserve this product boundary.
