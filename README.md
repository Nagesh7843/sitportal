# 🏛️ Sharad Institute of Technology (SITCOE) & Trust Institutions Central Portal

> **Production Full-Stack Institutional Web Application** built for **Sharad Institute of Technology College of Engineering (SITCOE)** and scalable across all 12 educational units of **Shri Shamrao Patil (Yadravkar) Educational & Charitable Trust**.

---

## 🌟 Key Capabilities & Features

- **🏛️ Institutional Digital Notice Board**: Real-time circulars, official PDF attachments, priority tagging (Urgent / Normal), and automated web scraping sync with `sitcoe.ac.in`.
- **👨‍🏫 Live Faculty Presence & Directory**: Real-time status tracking (`ON CAMPUS`, `IN LAB`, `IN MEETING`, `OFF CAMPUS`), qualifications, research profiles, and office hours.
- **🎓 Academic & Curriculum System**: Complete semester-wise syllabus, credits, course prerequisites, and document library.
- **💼 Training & Placement Hub**: Placement drives, student achiever showcases, statistics, recruiter directories, and automated notification broadcasts.
- **❓ Central Institutional Q&A**: Departmental and campus Q&A with real-time upvoting, expert faculty answers, and category filtering.
- **🔔 Multi-Channel Notification Engine**: Web Push API (VAPID / Service Worker), Chrome push notifications, and asynchronous SMTP email broadcasts with Spring Retry.
- **🤖 SIT Institutional AI Assistant**: Google Gemini-powered departmental intelligence with smart query routing and local fallback engine.
- **🔒 Production Security & RBAC**: Role-based access control (`ADMIN`, `HOD`, `FACULTY`, `STUDENT`, `PARENT`), BCrypt password hashing (strength 12), and JWT session management.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Service Worker Web Push |
| **Backend API** | Java 17, Spring Boot 4.1.0, Spring Data JPA, Spring Security, Hibernate ORM |
| **Database** | PostgreSQL 16 (`sitportaldb`) with composite B-tree performance indexing |
| **Push & Mail** | MartijnDwars WebPush (VAPID RFC-8292), Spring Mail (SMTP Async Retry) |
| **DevOps & CI** | GitHub Actions (`.github/workflows/ci.yml`), Multi-stage Docker, Docker Compose, Nginx |

---

## 🚀 Quick Start & Local Execution

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
*The Spring Boot server will initialize on `http://localhost:8080`.*

### 3. Frontend Setup
```bash
# In the root directory:
npm install

# Start Vite Development Server
npm run dev
```
*The React SPA will launch on `http://localhost:3000`.*

---

## 🐳 Docker Deployment

To launch the complete full-stack environment (Database + Backend + Frontend + Reverse Proxy) with a single command:

```bash
docker compose up -d --build
```
- **Web Portal**: [http://localhost](http://localhost)
- **API Engine**: [http://localhost:8080](http://localhost:8080)
- **PostgreSQL**: `localhost:5432` (`sitportaldb`)

---

## 🧪 Testing & Verification

Run automated backend unit tests and frontend type validation:

```bash
# Run 28 Java Backend Unit Tests
cd backend && mvn test

# Run TypeScript Lint & Production Bundle Build
npm run lint
npm run build
```

---

## 📚 Architecture & System Design Documentation

- [**High-Level Design (HLD): Login to User Role & Access Control**](file:///d:/SIT%20PORTAL/cse-department-portal/LOGIN_TO_USER_ROLE_HLD.md): Comprehensive HLD covering Authentication (Credentials & Google OAuth SSO), Zero-Trust Roster Verification, Stateless JWT Lifecycle, Multi-Persona RBAC Matrix, Entity-Relationship Models, Sequence Flows, and Security Hardening.
- [**System Architecture & Access Control Specification**](file:///d:/SIT%20PORTAL/cse-department-portal/PROJECT_ARCHITECTURE.md): Multi-tier topology, module descriptions, and notification retention rules.

---

## 📮 API Documentation (Postman)

The single source of truth Postman collection is located at [`postman_collection.json`](file:///d:/SIT%20PORTAL/cse-department-portal/postman_collection.json) with 14 modular folders covering all REST endpoints.
