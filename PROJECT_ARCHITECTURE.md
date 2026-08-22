# SITCOE Institutional Communication Portal — Architecture & Access Control Specification

**Sharad Institute of Technology College of Engineering (SITCOE)**  
*Unified System Architecture, Role-Based Access Control (RBAC) Matrix, and Notification Visibility Specifications*

---

## 1. System Architecture Overview

The SITCOE Institutional Communication Portal is engineered as a multi-tier, automated communication and administrative platform for college-wide notifications, academic milestone scheduling, student-parent directory management, and verified Q&A resolution.

```
       ┌────────────────────────────────────────────────────────────────────────┐
       │                        SITCOE Web Client (Vite + React)                │
       │   [Notice Board]  [Academic Calendar]  [Students Directory]  [Q&A Forum]│
       └──────────────────────────────────┬─────────────────────────────────────┘
                                          │  REST APIs / JSON payloads
       ┌──────────────────────────────────▼─────────────────────────────────────┐
       │                     Spring Boot Backend (Java 17)                      │
       │  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
       │  │ Official Web Scraper    │  │ Notice & Milestone Scheduler Job    │  │
       │  │ (sitcoe.ac.in sync)     │  │ (Pre-Notice Generator + Expiry)     │  │
       │  └─────────────────────────┘  └─────────────────────────────────────┘  │
       └──────────────────────────────────┬─────────────────────────────────────┘
                                          │
       ┌──────────────────────────────────▼─────────────────────────────────────┐
       │                       PostgreSQL / Mock Database                       │
       │   [Notices] [Milestones] [Students] [Parents] [Audit Logs] [Email Logs] │
       └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS (Vanilla CSS tokens), Lucide & Google Material Symbols Icons.
- **Backend**: Java 17, Spring Boot, Spring Data JPA, Spring Scheduler, JSOUP / Web Scraper.
- **Database**: PostgreSQL (Entities: `Notice`, `AcademicCalendar`, `CalendarEvent`, `Student`, `Faculty`, `EmailLog`, `ActivityLog`).
- **Communication Channels**: Automated Bulk Email Broadcaster, In-App Circular Stream, Live Activity Ledger.

---

## 3. Role-Based Access Control (RBAC) Matrix

The system enforces granular role-based permissions across 6 distinct user profiles:

| Feature / View Module | Admin | HOD | Faculty | Student | Parent | Public |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **SITCOE Central Notice Board (Read)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Publish Department/College Notice** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Delete Published Notice** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Inspect Live Scraper Feed (`sitcoe.ac.in`)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Academic Calendar (Read Active Events)** | ✅ | ✅ | ✅ | ✅ (5d Limit) | ✅ (5d Limit) | ✅ (5d Limit) |
| **Ingest Official Calendar Docs (`.docx` / PDF)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Add / Delete Milestone Events** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Set Active Calendar Semester** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Students & Parents Directory (Read Roster)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Add / Edit / Delete Student Credentials** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Bulk Student Roster CSV Upload** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Send Targeted Bulk Emails** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Email Transmission Audit Logs** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Post Question in Q&A Forum** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Post Official Verified Answer in Q&A Forum** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Admin Command Center & Metrics** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Live System Activity Audit Trail Stream** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Visibility & Notification Targeting Controls

### 4.1 Target Audience Visibility Scoping
Every circular notice and academic calendar event has a declared **Audience Scope**:
- `ALL`: Visible to all authenticated users and public visitors.
- `STUDENT`: Visible only to authenticated Student accounts.
- `FACULTY`: Visible only to Faculty & HOD accounts.
- `PARENT`: Visible only to Parent/Guardian login accounts.

### 4.2 Class & Division Scoping (Students Directory & Bulk Email)
Targeted notifications can be filtered precisely down to specific cohorts:
- **Academic Years**: `FE` / `FY` (First Year), `SE` / `SY` (Second Year), `TE` / `TY` (Third Year), `BE` / `BY` / `B.Tech` (Final Year).
- **Divisions**: `Div A`, `Div B`, `Div C`.
- **Batch Groups**: `A1`, `A2`, `A3`, `B1`, `B2`, `B3`, `C1`, `C2`, `C3`.

### 4.3 Academic Calendar Notice Expiry & Retention Engine
- **Students & Parents Feed**: Academic milestone notices remain visible in the Student/Parent feed **until the academic event completion date PLUS 5 days** (`Current Date <= Event Completion Date + 5 days`).
- **Auto-Expiration**: Once 5 days pass after event completion, the notice automatically expires and is hidden from Student and Parent views to keep feeds clutter-free.
- **Admin/Faculty Archive**: Full historical milestone records remain accessible to Faculty and Admin in administrative logs.

---

## 5. System File Map & Key Components

- [`src/App.tsx`](file:///d:/SIT%20PORTAL/cse-department-portal/src/App.tsx): Central App Router, User Role State Management, and Layout Wrappers.
- [`src/features/notices/NoticeFeedView.tsx`](file:///d:/SIT%20PORTAL/cse-department-portal/src/features/notices/NoticeFeedView.tsx): SITCOE Central Notice Board, Live Scraper Feed, and Compact Circular Cards.
- [`src/features/calendar/AcademicCalendarView.tsx`](file:///d:/SIT%20PORTAL/cse-department-portal/src/features/calendar/AcademicCalendarView.tsx): Academic Calendar Scheduler, Document Ingestion (`.docx` / PDF), and 5-Day Event Retention Rule Feed.
- [`src/features/directory/StudentsDirectoryView.tsx`](file:///d:/SIT%20PORTAL/cse-department-portal/src/features/directory/StudentsDirectoryView.tsx): Student & Parent Roster Directory, Compact Window Table, and Year Alias Filter Engine (`FE`/`FY`, `SE`/`SY`, `TE`/`TY`, `BE`/`BY`/`B.Tech`).
- [`src/features/questions/CentralQuestionSystem.tsx`](file:///d:/SIT%20PORTAL/cse-department-portal/src/features/questions/CentralQuestionSystem.tsx): Institutional Q&A Forum for Verified Answers.
- [`src/features/email/BulkEmailPanel.tsx`](file:///d:/SIT%20PORTAL/cse-department-portal/src/features/email/BulkEmailPanel.tsx): AI Email Drafter, Targeted Class Email Broadcaster, and Compact Audit Log Window.
- [`src/features/dashboard/AdminDashboard.tsx`](file:///d:/SIT%20PORTAL/cse-department-portal/src/features/dashboard/AdminDashboard.tsx): Master Integrated Communication Ledger, Sender Directory, and Real-Time Transferred Email Tracker.
- [`src/components/layout/Sidebar.tsx`](file:///d:/SIT%20PORTAL/cse-department-portal/src/components/layout/Sidebar.tsx): SITCOE Institutional Navigation Drawer.
- [`src/components/layout/Footer.tsx`](file:///d:/SIT%20PORTAL/cse-department-portal/src/components/layout/Footer.tsx): SITCOE Footer & Institutional Credits.

---
*Specification Document Generated for SITCOE Communication Portal.*
