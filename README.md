# SIT Institutional Portal

A web portal for managing institutional communication, academic information, people, and shared services. It is designed for SITCOE today and can grow to support additional Trust institutions.

---

## Features

- **Notices and announcements**: Circulars, attachments, priority tags, and scheduled publishing.
- **People directory**: Faculty and student profiles, availability, qualifications, and office hours.
- **Academic information**: Programs, terms, curriculum, calendar, documents, and student records.
- **Placements**: Drives, recruiters, eligibility criteria, placement updates, and notifications.
- **Questions and support**: A central Q&A area and an optional AI helpdesk.
- **Notifications**: Web push and email delivery, with delivery records.
- **Access control**: Roles for administrators, HODs, faculty, students, parents, and future Trust-level users.

---

## Technology stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Service Worker Web Push |
| **Backend API** | Java 17, Spring Boot 4.1.0, Spring Data JPA, Spring Security, Hibernate ORM |
| **Database** | PostgreSQL 16 (`sitportaldb`) with composite B-tree performance indexing |
| **Push & Mail** | MartijnDwars WebPush (VAPID RFC-8292), Spring Mail (SMTP Async Retry) |
| **Deployment** | Docker, Docker Compose, Nginx, and GitHub Actions |

---

## Run locally

### 1. Prerequisites
- **Node.js**: v18 or v20+
- **JDK**: Java 17+ (Eclipse Temurin / OpenJDK)
- **Maven**: 3.9+
- **PostgreSQL**: Local or Cloud instance (NeonDB / Supabase / Render)

### 2. Backend Setup
```bash
cd backend

# Run with local environment profile
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```
The API runs on `http://localhost:8080`.

### 3. Frontend Setup
```bash
# In the root directory:
npm install

# Start Vite Development Server
npm run dev
```
The web app runs on `http://localhost:3000`.

---

## Run with Docker

Start the database, API, and web app with:

```bash
docker compose up -d --build
```
- **Web Portal**: [http://localhost](http://localhost)
- **API Engine**: [http://localhost:8080](http://localhost:8080)
- **PostgreSQL**: `localhost:5432` (`sitportaldb`)

---

## Checks

Run backend tests, TypeScript checks, and a production build:

```bash
# Backend tests
cd backend && mvn test

# Frontend checks
npm run lint
npm run build
```

---

## Architecture documentation

- [Institutional portal architecture](INSTITUTIONAL_PORTAL_ARCHITECTURE.md): Target architecture for a multi-institution portal.
- [Current project architecture](PROJECT_ARCHITECTURE.md): Modules, academic model, and access-control notes.
- [Login and access-control design](LOGIN_TO_USER_ROLE_HLD.md): Authentication and role-flow details.

---

## API documentation

The Postman collection is available in [`postman_collection.json`](postman_collection.json).
