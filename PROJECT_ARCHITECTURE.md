# SIT Institutional Portal — Architecture Notes

**Sharad Institute of Technology College of Engineering (SITCOE)**  
*Current modular-monolith structure, data model, and implementation notes.*

---

## 1. Core Objective

The portal manages communication and academic information for SITCOE. Its data model supports a hierarchy of academic and organisational units:

$$\text{College} \longrightarrow \text{Departments (8)} \longrightarrow \text{Programs} \longrightarrow \text{Years / Semesters} \longrightarrow \text{Divisions} \longrightarrow \text{Batches} \longrightarrow \text{Students}$$

The same core student information is accessed appropriately by all five primary user personas:

$$\mathbf{Student} \longleftrightarrow \mathbf{Faculty} \longleftrightarrow \mathbf{HOD} \longleftrightarrow \mathbf{Parent} \longleftrightarrow \mathbf{Admin}$$

Backend authorisation scopes control what each user can view and change.

---

## 2. Main System Modules

```
SIT PORTAL (Modular Monolith)
│
├── 🔐 1. Authentication & Authorization (Role + Scope Resolution)
├── 🏫 2. Organization Hierarchy (8 Departments, Programs, Divisions, Batches)
├── 👨‍🎓 3. Student Core & Permanent PRN Invariant Management
├── 👨‍🏫 4. Faculty Batch Supervision & Monitoring
├── 👨‍👩‍👦 5. Parent Boundary & Verified Ward Isolation
├── 📚 6. Academic Management & Multi-Term Lifecycles
├── 📅 7. Academic Calendar (Scope-Aware Milestone Engine)
├── 🔔 8. Notification Engine (Multi-Level Targeting Fan-Out)
├── 💼 9. Placement Management & Opportunities
├── 🎯 10. Placement Eligibility Engine (12th vs Diploma Qualification Paths)
├── 🔄 11. Academic Year / Semester Transition Engine (Historical Preservation)
└── 📝 12. Administrative Verification Desk & System Audit Trail
```

---

## 3. Organization Hierarchy & Multi-Department Model

The college operates **8 Engineering Departments** on a single unified database using logical multi-department separation (`department_id`):

1. `CSE` — Computer Science & Engineering
2. `AIDS` — Artificial Intelligence & Data Science
3. `MECH` — Mechanical Engineering
4. `CIVIL` — Civil Engineering
5. `ENTC` — Electronics & Telecommunication Engineering
6. `ELECTRICAL` — Electrical Engineering
7. `MECHATRONICS` — Mechatronics Engineering
8. `BASIC_SCIENCES` — First Year & Basic Sciences

### Hierarchical Breakdown
$$\text{Department} \longrightarrow \text{Program} \longrightarrow \text{Academic Year} \longrightarrow \text{Semester} \longrightarrow \text{Division} \longrightarrow \text{Batch} \longrightarrow \text{Students}$$

---

## 4. Student Permanent PRN Identity & Multi-Term Progression

- **PRN Invariant Principle**: The Permanent Registration Number (PRN) is the invariant student identity throughout their college tenure.
- **Decoupled Enrollment**: A student's current academic location is maintained separately in `student_enrollments` records:

$$\text{Student (PRN)} \longrightarrow \text{Enrollment Records } [\text{Term}_1 (\text{Archived}), \text{Term}_2 (\text{Archived}), \text{Term}_3 (\text{Active})]$$

This allows students to transition across terms ($FY \rightarrow SY \rightarrow TY \rightarrow Final Year$) without altering their PRN or user account.

---

## 5. Student Self-Service & Administrative Verification

- **Self-Service Updates**: Students may edit permitted profile fields (phone, address, personal email).
- **Institution-Controlled Data**: Fields such as PRN, Department, Program, Division, Batch, and Official Academic Records require a verified **Student Change Request**.
- **Approval Workflow**:
  $$\text{Student Submits Request} \longrightarrow \text{Verification Desk (Admin/HOD)} \longrightarrow \text{Approve / Reject} \longrightarrow \text{Audit Log Recorded}$$

---

## 6. Faculty Batch Supervision & Role Separation

- **Batch Supervision**: Faculty monitor assigned student lab/tutorial batches:
  $$\text{Faculty} \longrightarrow \text{Assigned Batch} \longrightarrow \text{Student Roster Monitoring}$$
- **Role vs Position Separation**:
  - **Academic Position**: *Assistant Professor, Associate Professor, Professor, Head of Department*.
  - **Portal Role**: *FACULTY, HOD, COORDINATOR, ADMIN*.

---

## 7. Parent Security Boundary & Ward Isolation

Parents have strictly scoped access restricted to verified enrolled wards:
$$\text{Parent Account} \longrightarrow \text{Verified Student Relationships} \longrightarrow \text{Permitted Ward Data Only}$$
- Unauthorized queries for unassociated student PRNs return `403 Forbidden`.
- A parent account can be linked to more than one enrolled student.

---

## 8. Backend Authorization & Scope Enforcement

Security and scoping are enforced exclusively on the backend:
$$\text{Request} \longrightarrow \text{JWT Auth} \longrightarrow \text{Role Extraction} \longrightarrow \text{Scope Resolution} \longrightarrow \text{Permission Check} \longrightarrow \text{Allow / Deny}$$

---

## 9. Academic Year / Semester Transition Engine

Academic transitions never overwrite past data destructively:
1. Fetch active term record where `is_current = true`.
2. Update existing active record to `is_current = false` with `status = COMPLETED` or `ENROLLED`.
3. Create new term record with `is_current = true`.
4. Log transition action in `system_audit_logs`.

---

## 10. Placement Eligibility Engine (12th vs Diploma Qualification Paths)

Mathematical qualification model:
$$\text{Eligibility} = \begin{cases} 
\text{CGPA} \ge \text{Min} \;\land\; 10^{\text{th}}\% \ge \text{Min} \;\land\; 12^{\text{th}}\% \ge \text{Min} & \text{if Path} = \mathbf{12TH} \\
\text{CGPA} \ge \text{Min} \;\land\; 10^{\text{th}}\% \ge \text{Min} \;\land\; \text{Diploma}\% \ge \text{Min} & \text{if Path} = \mathbf{DIPLOMA}
\end{cases}$$
- No semester-wise CGPA requirement.
- Evaluates candidate pools with detailed ineligibility reason breakdown.

---

## 11. Notification & Target Fan-Out Hierarchy

Multi-level target scopes:
$$\mathbf{COLLEGE} \;\big|\; \mathbf{DEPARTMENT} \;\big|\; \mathbf{PROGRAM} \;\big|\; \mathbf{YEAR} \;\big|\; \mathbf{DIVISION} \;\big|\; \mathbf{BATCH} \;\big|\; \mathbf{ROLE} \;\big|\; \mathbf{INDIVIDUAL}$$
- Creator's authorized scope automatically restricts target selection.
- Automated parent dispatch resolves associated parent contacts for targeted student cohorts.

---

## 12. Database Schema (Single PostgreSQL Database)

```sql
-- Logical Module Breakdown:
-- AUTH: users, roles, permissions, fcm_tokens
-- ORG: departments, programs, academic_years, semesters, divisions, batches
-- STUDENTS: students, student_enrollments, student_academic_data, student_change_requests
-- FACULTY: faculty, faculty_batch_assignments
-- PARENTS: parents, parent_student_relationships
-- CALENDAR: academic_calendars, calendar_events
-- NOTIFICATIONS: notifications, notification_targets, notification_recipients
-- PLACEMENT: placement_drives, recruiters, placed_student_achievements, placement_eligibility_rules, placement_eligibility_results
-- AUDIT: system_audit_logs
```

---

## 13. Verification checklist

| Check | Command |
| :--- | :--- |
| Backend unit tests | `cd backend && mvn test` |
| TypeScript check | `npm run lint` |
| Frontend build | `npm run build` |
| API requests | `postman_collection.json` |
