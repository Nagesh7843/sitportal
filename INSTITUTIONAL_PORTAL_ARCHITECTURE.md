# SIT Trust Institutional Portal — Reference Architecture

**Status:** Target architecture for a multi-institution portal  
**Implementation style:** Modular monolith first; service extraction only when scale or ownership demands it

---

## 1. Purpose and scope

The portal is a shared digital platform for the Trust and every institution it operates. It must support institution-wide communication and governance while ensuring that a user sees and changes only the data within their permitted organizational scope.

The platform supports colleges, schools, departments, programs, academic years, divisions/batches, students, guardians, faculty, and central Trust administrators. A single deployment may serve multiple institutions; each institution remains logically isolated.

```
Trust
 ├── Institution (for example, SITCOE)
 │    ├── Campus
 │    │    ├── School / College unit
 │    │    │    ├── Department
 │    │    │    │    └── Program → Cohort → Term → Division → Batch
 │    │    │    └── Shared services (library, examination, placement)
 │    └── Institutional users and guardians
 └── Institution (future college/school)
```

## 2. Architectural principles

1. **Institution first.** Every business record that is owned by an institution carries `institution_id`; cross-institution access is exceptional and explicitly authorized.
2. **Scope is enforced by the API.** The UI may hide actions for usability, but it is never the access-control boundary.
3. **One person, many roles and affiliations.** A faculty member may be a department HOD and an institutional coordinator; a guardian may have multiple wards.
4. **Preserve academic history.** Student identity is permanent, while enrolments and academic status are time-bound records.
5. **Events for fan-out, transactions for truth.** PostgreSQL transactions own authoritative changes. Notifications, emails, audit records, and integrations react asynchronously.
6. **Module boundaries before microservices.** The current Spring Boot backend remains deployable as one application, with package/API boundaries that make later extraction safe.

## 3. Logical architecture

```text
Web / PWA (React + TypeScript)
       │ HTTPS + JWT / refresh session
       ▼
Edge: Nginx / WAF / rate limits / TLS
       ▼
Institutional API (Spring Boot modular monolith)
 ┌────────────────────────────────────────────────────────────────┐
 │ Identity & access │ Organization │ Academic records             │
 │ People & profiles │ Notices      │ Calendar                     │
 │ Placement         │ Documents    │ Communication               │
 │ Requests & audit  │ Reporting    │ Integration adapters        │
 └────────────────────────────────────────────────────────────────┘
       │                         │                         │
       ▼                         ▼                         ▼
 PostgreSQL                  Job worker              Object storage
 authoritative data          mail/push/scrapers      files, PDFs, media
       │                         │
       └───────────────► Observability ◄─────────────┘
                         logs, metrics, traces
```

## 4. Identity, roles, and data scope

### Identity model

- `users` represents a login identity and must not embed a single role or department as its only source of authorization.
- `person_profiles` stores shared person details.
- `user_role_assignments` grants a role with an effective scope and optional date range.
- `user_institution_memberships` links a user to one or more institutions.

### Recommended roles

| Level | Roles | Typical scope |
| --- | --- | --- |
| Trust | Trust Super Admin, Trust Auditor | All institutions, usually read/admin respectively |
| Institution | Institution Admin, Principal, Registrar, Placement Head | One institution |
| Academic unit | HOD, Department Coordinator, Faculty | One or more departments/programs/batches |
| User | Student, Parent/Guardian, Alumni | Self or verified associated student |

### Authorization rule

Every protected request resolves a `PrincipalContext` from the token:

```text
principal + role assignments + institution membership
  → allowed institutions
  → allowed organisational units
  → allowed action on resource
  → permit or deny
```

All repository queries for scoped resources must receive the resolved institution/scope; never accept a client-supplied `institutionId` as authority without validating it against `PrincipalContext`.

## 5. Domain modules and ownership

| Module | Owns | Key integrations |
| --- | --- | --- |
| Identity & Access | accounts, roles, sessions, password/SSO policy | every API module |
| Organization | Trust, institutions, campuses, departments, programs | identity, academic, notices |
| People | profiles, faculty, student, guardian relationships | academic, placement |
| Academic Lifecycle | enrolments, terms, divisions, batches, curriculum, results | calendar, requests |
| Communication | notices, email, web push, delivery/read status | all modules |
| Placement | drives, recruiters, eligibility rules/results, achievements | people, academic, communication |
| Documents | document metadata, access policies, file references | curriculum, notices |
| Workflow & Audit | change requests, approvals, immutable audit log | all write operations |
| Reporting | institution-scoped operational dashboards | read-only projections |

Each module exposes a service interface and owns its tables. Modules communicate through service calls inside the monolith or through domain events; they do not reach directly into another module's repositories.

## 6. Data architecture

### Required tenant keys

`trust_id` is optional if one Trust owns the deployment. `institution_id` is mandatory for institution-owned data. Add narrower scope keys only where they are intrinsic to the record (`department_id`, `program_id`, `batch_id`).

```text
trusts → institutions → campuses → departments → programs
                                              └→ academic offerings
institutions → users / faculty / students / notices / placement drives
students → student_enrollments → academic term and cohort history
parents ↔ parent_student_relationships ↔ students
```

### Database controls

- PostgreSQL foreign keys and composite indexes beginning with `institution_id`.
- Unique constraints include the tenant where a code is only institution-unique: `(institution_id, code)`.
- Audit records store actor, institution, action, resource type/id, timestamp, request/correlation id, and before/after summaries.
- Soft-delete records only when retention or restoration is required; otherwise use archival state and documented retention jobs.
- Store files outside PostgreSQL; retain metadata, checksum, owner institution, classification, and access policy in PostgreSQL.

## 7. Request and event flow

### Synchronous write

```text
Client → API authentication → scope authorization → validation
       → domain transaction → database commit → API response
                                  │
                                  └→ outbox event
```

### Asynchronous work

An outbox worker reads committed events and creates notification recipients, sends mail/push messages, indexes search content, and records delivery outcomes. This prevents a failed mail or push provider from rolling back an academic or administrative action.

Event examples: `NoticePublished`, `StudentEnrollmentChanged`, `PlacementDrivePublished`, `ChangeRequestApproved`.

## 8. API design

- Version REST APIs under `/api/v1`.
- Infer institution context from the selected membership in the authenticated session; require an explicit `X-Institution-Id` only for authorised Trust-level users and validate it server-side.
- Use resource filters rather than role-specific endpoints where appropriate, for example `GET /students?departmentId=&programId=&termId=`.
- Cursor-paginate directories, audit logs, and notification feeds.
- Define a standard error body: `code`, `message`, `fieldErrors`, `correlationId`.
- Publish OpenAPI documentation and generate the Postman collection from it where possible.

## 9. Frontend architecture

```text
src/
 ├── app/              app shell, routing, authenticated session
 ├── features/         domain-owned screens and components
 ├── components/       reusable, domain-neutral UI
 ├── services/         typed API client and notification client
 ├── state/            session, institution context, server-cache hooks
 └── types/            API contracts; generated where practical
```

The active institution should always be visible in the header for Trust-level users. Navigation is built from permissions returned by the API, not from a hard-coded assumption that every user belongs to one department.

## 10. Deployment topology

```text
Internet
  → CDN / WAF
  → Nginx (static SPA, TLS, API proxy)
  → Spring Boot API replicas
  → PostgreSQL primary + managed backups
  → object storage
  → worker process (notifications, scraping, scheduled jobs)
```

For the current deployment, Docker Compose can run PostgreSQL, the Spring API, and the React/Nginx frontend. Production should add managed PostgreSQL backups, secrets management, TLS, environment separation (development/staging/production), and centralized logs/metrics.

## 11. Security and compliance baseline

- Short-lived access tokens with rotation/revocation strategy; hashed passwords with BCrypt/Argon2.
- Role and institution scope checks at controller/service boundaries; audit all privileged writes and exports.
- Enforce HTTPS, secure cookies where used, CSP, rate limits on authentication, input validation, and attachment scanning.
- Encrypt database backups and object storage; do not log tokens, passwords, or student PII.
- Apply documented retention rules for notices, communications, audit logs, and student records according to Trust policy and applicable law.

## 12. Migration from the current portal

1. Create `institutions` and add the initial SITCOE record.
2. Backfill `institution_id` onto existing department-owned tables and indexes; make it non-null after verification.
3. Replace single `users.role` / `users.department` assumptions with membership and role-assignment tables, retaining legacy fields during a staged transition.
4. Update JWT claims and backend scope resolution before enabling institution switching in the frontend.
5. Route notices, placements, calendars, and reports through institution-scoped queries.
6. Introduce the transactional outbox for notification fan-out and external integrations.
7. Add automated authorization tests that prove cross-institution access is denied.

## 13. Success criteria

- A Trust administrator can administer multiple institutions without mixing data.
- An institutional administrator cannot access another institution's records.
- Faculty, students, and guardians receive only resources linked to their approved scope.
- Academic promotions preserve historical enrolments and reports.
- A failed notification provider does not lose a published notice or approved workflow change.
- Every privileged mutation is traceable to an actor, institution, and request.
