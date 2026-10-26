# InternTrack — Internship Lifecycle Management & Semantic Matching Platform

**Course:** DBMS Experiential Learning – Level 3 Project
**Team size:** 2 members
**Stack:** Next.js (UI + Route Handlers) · PostgreSQL (+ pgvector) · MongoDB · Git/GitHub

---

## 1. Background

Internship hunting at a university is chaotic. Students track applications in spreadsheets, miss deadlines, forget which round they are in, and apply to roles that don't fit their skills. Placement cells juggle dozens of companies and hundreds of students over email and WhatsApp, with no reliable view of how many students are placed, where candidates drop off, or which skills the market is asking for. Recruiters receive resumes with no structure and no easy way to shortlist.

The result: missed deadlines, double-accepted offers, poor visibility, and decisions made without data.

## 2. Problem Statement

Design and build **InternTrack**, a web-based platform that manages the *entire internship lifecycle* — from posting and discovery, through application, multi-round interviews, and offers, to final acceptance and post-internship feedback — for three kinds of users (students, recruiters, placement admins).

The system must go beyond CRUD by:

1. Enforcing **placement-policy rules at the database level** (deadlines, openings, one accepted offer per student) using triggers, constraints, and transactions.
2. Maintaining a **tamper-evident history** of every application's stage changes.
3. Providing **analytics** (funnel conversion, time-in-stage, skill demand, placement rates) via views, aggregate queries, and NoSQL aggregation pipelines.
4. Providing **semantic matching** — recommending internships to students (and candidates to postings) by comparing embeddings of resumes/skills against job descriptions, instead of relying on exact keyword overlap.
5. Storing **semi-structured data** (parsed resumes, raw job descriptions, interview feedback with varying rubrics, activity logs, notifications) in a document store where a rigid schema would be a poor fit.

## 3. Objectives

| # | Objective |
|---|-----------|
| O1 | Model the internship domain with a normalized relational schema (3NF/BCNF) with full integrity constraints. |
| O2 | Automate lifecycle rules (deadline checks, opening counts, stage audit trail) with triggers and stored procedures. |
| O3 | Guarantee consistency in concurrent scenarios (e.g., two offers accepted at once, last opening claimed by two students) using transactions and row-level locking. |
| O4 | Use a document database for flexible, high-volume, semi-structured data and demonstrate aggregation pipelines. |
| O5 | Implement vector embeddings + similarity search for internship ↔ student matching, combined with SQL filters (hybrid retrieval). |
| O6 | Provide role-based dashboards with search, filters, and analytics through a Next.js interface. |
| O7 | Secure the application with backend authentication, RBAC, validation, and environment-based configuration. |
| O8 | Deliver complete documentation, tests, and a Git history that shows both members' contributions. |

## 4. Scope

### 4.1 In scope

- Student profile, skills, resume upload (PDF/text) and parsing
- Company and recruiter management with admin verification
- Internship posting with required skills, stipend, openings, deadline, eligibility criteria (min CGPA, department, year)
- Application workflow with configurable stages: `Applied → Shortlisted → Interview → Offered → Accepted / Rejected / Withdrawn`
- Interview scheduling (multiple rounds), clash detection for students and panels
- Offer issue, accept/decline, with placement-policy enforcement
- Notifications and deadline reminders
- Search (full-text + semantic), filtering, sorting, pagination
- Analytics dashboards for all roles
- Post-internship experience reviews by students
- Audit log of sensitive actions

### 4.2 Out of scope

- Real payment/stipend processing
- Video interviewing
- Integration with external job boards (LinkedIn, Naukri)
- Native mobile app

### 4.3 Assumptions

- Single university tenant (multi-tenancy not required).
- Email delivery is simulated (stored as notifications) unless time permits SMTP.
- Embeddings are generated with an open-source model so no paid API is required.

## 5. Stakeholders & Roles (RBAC — minimum 2 required, we implement 3)

| Role | Description | Key permissions |
|------|-------------|-----------------|
| **Student** | Seeks internships | Manage own profile/skills/resume; browse, search, and get recommendations; apply/withdraw; view own pipeline and interviews; accept/decline offers; submit reviews |
| **Recruiter** | Represents a company | Create/edit postings for own company; view applicants; move candidates between stages; schedule interviews; issue offers; submit interview feedback; view own funnel analytics |
| **Admin (Placement cell)** | Governs the platform | Verify companies/recruiters; configure policies (e.g., max applications, one-offer rule); view institution-wide analytics; manage users; view audit logs; override stages with justification |

## 6. Functional Requirements

### 6.1 Authentication & Authorization
- FR-A1: Registration and login via backend; passwords hashed (bcrypt/argon2); sessions or JWT in HTTP-only cookies.
- FR-A2: Route Handlers/middleware check role on every protected endpoint.
- FR-A3: Recruiters cannot access applicants of other companies; students cannot see other students' data.
- FR-A4: Account lockout / rate limit after repeated failed logins.

### 6.2 Student module
- FR-S1: Create/update profile (department, year, CGPA, graduation year, links).
- FR-S2: Add skills with proficiency level; upload resume (parsed into MongoDB).
- FR-S3: Browse/search internships by keyword (full-text), skill, stipend range, location/mode, deadline, company.
- FR-S4: Get **Top-N recommended internships** via semantic similarity + eligibility filters.
- FR-S5: Apply (only if eligible and before deadline); withdraw before offer.
- FR-S6: Pipeline board showing each application's current stage and timeline.
- FR-S7: View interview schedule; get clash warnings.
- FR-S8: Accept or decline an offer; accepting one offer auto-withdraws all other active applications (per policy).
- FR-S9: Submit and read experience reviews.

### 6.3 Recruiter module
- FR-R1: Register company (pending admin verification).
- FR-R2: Create postings with required/preferred skills, openings, deadline, eligibility.
- FR-R3: View applicants ranked by **match score** (skill overlap + semantic similarity).
- FR-R4: Bulk-move applicants between stages with a note.
- FR-R5: Schedule interview rounds with panel members; record structured feedback.
- FR-R6: Issue offers (stipend, start date, expiry); track responses.
- FR-R7: Find "similar candidates" to a chosen applicant (vector search).
- FR-R8: Funnel analytics per posting.

### 6.4 Admin module
- FR-M1: Approve/reject companies and recruiters.
- FR-M2: Configure policies (max concurrent applications, offer expiry, one-offer rule).
- FR-M3: Institution-wide dashboards (placement %, department-wise, company-wise, stipend distribution).
- FR-M4: View audit log and application stage history; override with mandatory reason.
- FR-M5: Export reports (CSV).

### 6.5 System-level (non-CRUD) behaviours
- FR-X1: Auto-close postings when deadline passes or openings are filled.
- FR-X2: Auto-generate reminders for upcoming deadlines and interviews.
- FR-X3: Auto-expire unaccepted offers after expiry date.
- FR-X4: Log every stage change with who/when/why.
- FR-X5: Prevent duplicate applications and interview clashes.

## 7. Database Choice & Justification

> *"Database technology must be selected based on the problem requirements."* Each store is chosen for the data it holds.

| Data | Store | Justification |
|------|-------|---------------|
| Users, students, companies, postings, applications, interviews, offers, skills | **PostgreSQL** | Highly relational with strict integrity needs (FKs, uniqueness, check constraints), multi-row transactions (offer acceptance), and analytical joins/aggregations. ACID guarantees are non-negotiable for offers and applications. |
| Embeddings of postings and student profiles | **PostgreSQL + pgvector** | Keeps vectors next to relational rows so that similarity search can be combined with SQL filters (CGPA, department, deadline, open status) in a *single query* — no cross-system sync problem. |
| Parsed resumes, raw job descriptions, interview feedback, experience reviews, notifications, activity logs | **MongoDB** | Schema varies (different resume layouts, different feedback rubrics per company), nested/array-heavy, append-heavy logs, TTL expiry for notifications, and aggregation pipelines for analytics over unstructured fields. Forcing this into rigid tables would produce sparse columns or EAV anti-patterns. |

Why not everything in one store? Offers and applications need ACID joins; resumes and feedback need schema flexibility; semantic matching needs ANN indexes. Each paradigm answers a different data shape.

## 8. Relational Design (PostgreSQL)

### 8.1 Entities and key attributes

| Table | Key attributes | PK | Foreign keys | Notable constraints |
|-------|---------------|----|--------------|---------------------|
| `app_user` | email, password_hash, role, is_active, created_at | user_id | — | `UNIQUE(email)`, `CHECK(role IN ('student','recruiter','admin'))` |
| `department` | name, code | dept_id | — | `UNIQUE(code)` |
| `student` | usn, full_name, year, cgpa, grad_year, phone, about | student_id | user_id → app_user, dept_id → department | `CHECK(cgpa BETWEEN 0 AND 10)`, `UNIQUE(usn)`, `UNIQUE(user_id)`, phone format check |
| `company` | name, website, industry, size, verified, verified_by | company_id | verified_by → app_user | `UNIQUE(name)`, `CHECK(website ~ '^https?://')` |
| `recruiter` | designation | recruiter_id | user_id → app_user, company_id → company | `UNIQUE(user_id)` |
| `skill` | name, category | skill_id | — | `UNIQUE(LOWER(name))` |
| `student_skill` | proficiency | (student_id, skill_id) | student_id, skill_id | `CHECK(proficiency BETWEEN 1 AND 5)` — **M:N** |
| `internship_posting` | title, description, location, mode, stipend, openings, filled, deadline, start_date, duration_weeks, min_cgpa, status, embedding `vector(384)`, search_tsv | posting_id | company_id, recruiter_id | `CHECK(openings > 0)`, `CHECK(filled <= openings)`, `CHECK(stipend >= 0)`, `CHECK(deadline < start_date)`, status enum |
| `posting_skill` | is_mandatory, min_level | (posting_id, skill_id) | posting_id, skill_id | **M:N** |
| `posting_eligible_dept` | — | (posting_id, dept_id) | posting_id, dept_id | **M:N** |
| `application` | applied_at, current_stage, match_score, withdrawn_at | application_id | student_id, posting_id | `UNIQUE(student_id, posting_id)`, stage enum |
| `application_stage_history` | from_stage, to_stage, changed_by, reason, changed_at | history_id | application_id, changed_by → app_user | append-only (no UPDATE/DELETE privilege) |
| `interview` | round_no, scheduled_at, duration_min, mode, link_or_room, status | interview_id | application_id | `UNIQUE(application_id, round_no)`, `CHECK(duration_min > 0)` |
| `interview_panelist` | — | (interview_id, recruiter_id) | interview_id, recruiter_id | **M:N** |
| `offer` | stipend, start_date, issued_at, expires_at, status, responded_at | offer_id | application_id | `UNIQUE(application_id)`, `CHECK(expires_at > issued_at)` |
| `policy_config` | key, value | key | — | e.g., `max_active_applications`, `one_offer_rule` |
| `audit_log` | action, entity, entity_id, actor_id, at, details(jsonb) | audit_id | actor_id → app_user | append-only |

### 8.2 Relationships (for the ER diagram)

- `app_user` 1—1 `student` / `recruiter` (specialization by role)
- `department` 1—N `student`
- `company` 1—N `recruiter`; `company` 1—N `internship_posting`
- `student` M—N `skill` via `student_skill` (attribute: proficiency)
- `internship_posting` M—N `skill` via `posting_skill` (attributes: mandatory, min level)
- `internship_posting` M—N `department` via `posting_eligible_dept`
- `student` M—N `internship_posting` via **`application`** (associative entity with its own attributes and children)
- `application` 1—N `application_stage_history`, 1—N `interview`, 1—0..1 `offer`
- `interview` M—N `recruiter` via `interview_panelist`

### 8.3 Normalization
All tables designed to 3NF; derived data (`filled`, `match_score`) is justified as controlled denormalization maintained by triggers/procedures, and documented as such.

## 9. SQL Implementation Plan

### 9.1 DDL
- `CREATE TABLE` for all entities with PK, FK (with `ON DELETE` rules — `RESTRICT` for company→posting, `CASCADE` for application→history/interview), `NOT NULL`, `DEFAULT`, `CHECK`, `UNIQUE`.
- Custom `ENUM` types for stage, posting status, and role.
- `ALTER TABLE` demonstrations: add `portfolio_url` to `student`, add `CHECK` on stipend, add a column `remote_allowed`, rename/modify during iterative schema evolution (kept in numbered migration files).
- `DROP` demonstrations: drop obsolete index/view/column in a migration; `DROP ... IF EXISTS` in reset scripts.
- Migration files: `001_init.sql`, `002_indexes.sql`, `003_views.sql`, `004_functions_triggers.sql`, `005_alter_demo.sql`, `006_seed.sql`.

### 9.2 Indexes (with justification, verified using `EXPLAIN ANALYZE`)

| Index | Purpose |
|-------|---------|
| B-tree `(student_id, current_stage)` on `application` | Student pipeline lookups |
| B-tree `(posting_id, current_stage)` on `application` | Recruiter applicant lists |
| **Partial** index on `internship_posting(deadline) WHERE status='open'` | Fast browse of live postings |
| GIN on `search_tsv` | Full-text search |
| GIN trigram on `skill.name` | Fuzzy skill autocomplete |
| **HNSW** on `embedding vector_cosine_ops` | ANN similarity search |
| Composite `(scheduled_at)` on `interview` | Clash detection and reminders |

### 9.3 Views

| View | Description |
|------|-------------|
| `v_student_pipeline` | Student's applications with posting, company, stage, next interview |
| `v_posting_funnel` | Per posting: counts per stage and conversion % |
| `v_company_stats` | Postings, applicants, offers, acceptance rate per company |
| `v_upcoming_deadlines` | Open postings closing within N days |
| `v_department_placement` | Placement counts/percentage by department |
| `mv_skill_demand` (**materialized**) | Most demanded skills across open postings; refreshed on schedule |

### 9.4 Stored procedures / functions

| Routine | Behaviour |
|---------|-----------|
| `sp_apply(student_id, posting_id)` | Validates eligibility (CGPA, dept, deadline, openings, max-active rule), inserts application and first history row in one transaction |
| `sp_advance_stage(application_id, new_stage, actor_id, reason)` | Validates legal transitions (state machine), updates stage; history written by trigger |
| `sp_issue_offer(application_id, stipend, start_date, expiry)` | Creates offer, moves application to `Offered` |
| `sp_accept_offer(offer_id)` | **Transaction** with `SELECT ... FOR UPDATE`: checks expiry and one-offer rule, increments `filled`, marks other active applications `Withdrawn`, closes posting if full |
| `fn_match_score(student_id, posting_id)` | Weighted: mandatory-skill coverage, proficiency vs. min level, optional-skill overlap |
| `fn_interview_clash(student_id, ts, duration)` | Returns boolean for overlapping slots |
| `sp_expire_offers()` | Expires offers past `expires_at`, reopens openings |

### 9.5 Triggers

| Trigger | Event | Purpose |
|---------|-------|---------|
| `trg_app_stage_audit` | AFTER UPDATE OF `current_stage` on `application` | Append to `application_stage_history` |
| `trg_block_late_apply` | BEFORE INSERT on `application` | Reject if deadline passed or posting not open |
| `trg_one_accepted_offer` | BEFORE UPDATE on `offer` | Reject acceptance if student already has an accepted offer |
| `trg_posting_autoclose` | AFTER UPDATE OF `filled` on `internship_posting` | Set status `closed` when `filled = openings` |
| `trg_interview_clash` | BEFORE INSERT/UPDATE on `interview` | Raise exception on overlapping slots |
| `trg_history_immutable` | BEFORE UPDATE/DELETE on history/audit | Raise exception (append-only) |
| `trg_touch_updated_at` | BEFORE UPDATE | Maintain `updated_at` |

### 9.6 Transactions & concurrency
- Isolation level `READ COMMITTED` with explicit row locks (`FOR UPDATE`) for opening-count and offer acceptance; `SERIALIZABLE` demonstrated for the one-offer rule.
- Demo scenario: two sessions racing to claim the last opening — one succeeds, one rolls back cleanly.
- Savepoints used in bulk stage moves so one invalid candidate does not abort the batch.

## 10. DML & Query Showcase

| Operation | Example use in app |
|-----------|--------------------|
| **INSERT** | Register student, create posting, apply, schedule interview, issue offer |
| **UPDATE** | Edit profile, advance stage, respond to offer, close posting |
| **DELETE** | Withdraw application (soft/hard as per rule), remove skill, delete draft posting |
| **SELECT + JOIN** | Pipeline across `student ⨝ application ⨝ posting ⨝ company` |
| **GROUP BY / HAVING** | Companies with > 5 offers; postings with conversion < 10% |
| **ORDER BY / LIMIT** | Top paying open internships; latest applications |
| **Aggregates** | AVG stipend per department, COUNT applicants per stage, MAX/MIN CGPA of shortlisted |
| **Subqueries** | Students with no application yet; postings whose applicant count is above average |
| **Correlated subquery / EXISTS** | Students who have *not* got an offer but have ≥ 3 interviews |
| **CTEs / window functions** | Rank applicants within a posting by match score (`RANK() OVER`); running count of placements by week; time-in-stage via `LAG()` on history |
| **Set operations** | Students with skill A `INTERSECT` skill B; unplaced `EXCEPT` placed |
| **Outer joins** | Postings with zero applicants |
| **Full-text** | `to_tsvector/plainto_tsquery` with `ts_rank` on title + description |

A curated list of ≥ 15 "important queries" with outputs will be placed in `docs/queries.md`.

## 11. NoSQL Design (MongoDB)

### 11.1 Collections

| Collection | Sample document (abridged) | Why document-oriented |
|------------|---------------------------|-----------------------|
| `resumes` | `{ student_id, uploaded_at, raw_text, parsed: { education:[…], projects:[{name, tech:[…], desc}], experience:[…], certifications:[…] }, extracted_skills:[…] }` | Resume structure varies per student; nested arrays |
| `posting_documents` | `{ posting_id, raw_jd, responsibilities:[…], perks:[…], attachments:[…] }` | Long unstructured text, variable sections |
| `interview_feedback` | `{ interview_id, panelist_id, rubric:{ dsa:4, communication:3, … }, comments, recommendation }` | Rubric differs per company/role |
| `experience_reviews` | `{ company_id, posting_id, student_id, ratings:{mentorship:4, learning:5, culture:3}, text, tags:[…], created_at }` | Flexible fields, text-heavy |
| `notifications` | `{ user_id, type, message, read:false, created_at, expireAt }` | High write volume, **TTL index** auto-expires |
| `activity_logs` | `{ user_id, action, meta:{…}, ts }` | Append-heavy event stream |

### 11.2 Indexes
- Unique `{ student_id: 1 }` on `resumes`
- Compound `{ company_id: 1, created_at: -1 }` on `experience_reviews`
- Multikey `{ extracted_skills: 1 }`
- Text index on `experience_reviews.text`
- TTL index on `notifications.expireAt`
- Compound `{ user_id: 1, read: 1, created_at: -1 }` for the notification bell

### 11.3 Aggregation pipelines (demonstrated)
1. **Average rating per company by category** — `$match → $group → $project → $sort`
2. **Most frequent skills in resumes vs. skills demanded by postings** — `$unwind → $group → $lookup`
3. **Feedback rubric averages per round** — `$group` with `$avg` over dynamic keys using `$objectToArray`
4. **Activity heatmap** (applications by weekday/hour) — `$project` with date operators → `$group`
5. **Top review tags per industry** — `$lookup` against company data → `$unwind` → `$group`

### 11.4 Relational ↔ document linkage
Documents store the PostgreSQL IDs (`student_id`, `posting_id`) as references. The Next.js service layer is responsible for keeping them in sync (create in SQL first, then document; compensating cleanup on failure).

## 12. Vector Database / Semantic Search

| Question | Answer |
|----------|--------|
| **What is embedded?** | (a) Posting text = title + description + required skills; (b) Student profile text = skills + project descriptions + about (from parsed resume) |
| **Embedding model** | `all-MiniLM-L6-v2` (384 dimensions, open-source, runs locally via a small Python service or `@xenova/transformers` in Node) |
| **How stored** | `vector(384)` columns in PostgreSQL via **pgvector** (`internship_posting.embedding`, `student.profile_embedding`) |
| **Similarity metric** | Cosine distance (`<=>`); embeddings L2-normalised |
| **Index** | HNSW (`vector_cosine_ops`), with IVFFlat compared during testing |
| **Retrieval strategy** | **Hybrid:** SQL pre-filters (open, deadline, min CGPA, department eligibility, not already applied) → ANN top-K by cosine distance → re-rank with `fn_match_score` (skills) → return top N with explanation (matched/missing skills) |
| **Other uses** | "Similar internships", "Similar candidates", semantic search box ("backend role working with distributed systems") |
| **Refresh** | Re-embed on posting create/edit and on resume upload; background job |

## 13. Advanced Features Coverage

| Requirement | Where it's demonstrated |
|-------------|------------------------|
| Transactions | `sp_apply`, `sp_accept_offer`, bulk stage move with savepoints |
| Views | Section 9.3 (incl. materialized view) |
| Stored procedures/functions | Section 9.4 |
| Triggers | Section 9.5 |
| Indexing | Section 9.2 + `EXPLAIN ANALYZE` before/after evidence |
| Full-text search | `tsvector` + GIN on postings |
| NoSQL aggregation | Section 11.3 |
| Vector similarity search | Section 12 |

*(Required: ≥ 4 SQL concepts + ≥ 1 NoSQL/Vector — this design covers 6 SQL concepts and 2 NoSQL/vector concepts.)*

## 14. Data Validation & Integrity

- **Database-level validation:** `NOT NULL`, `CHECK` (CGPA range, stipend ≥ 0, dates order, email/phone regex, `filled ≤ openings`), `UNIQUE`, FK with explicit `ON DELETE` rules, ENUM types.
- **State-machine integrity:** stage transitions validated in `sp_advance_stage` (e.g., cannot jump `Applied → Accepted`).
- **Business-rule integrity:** triggers for deadline, openings, one-accepted-offer, interview clashes.
- **Immutable history:** audit tables reject UPDATE/DELETE.
- **Application-level validation:** Zod/Yup schemas on Route Handlers (second line of defence; DB remains the source of truth).
- **MongoDB:** `$jsonSchema` validators on collections for required fields and types.
- **Concurrency integrity:** row locks and isolation levels (Section 9.6).

## 15. Web Application (Next.js)

### 15.1 Pages / UI components

| Role | Pages |
|------|-------|
| Public | Landing, Login, Register |
| Student | Dashboard (stats + deadlines), Browse/Search with filters, Recommended for You, Application pipeline (Kanban), Interview calendar, Offers, Profile & Resume, Reviews |
| Recruiter | Dashboard, Create/Edit posting, Applicants table (sort by match score, bulk actions), Candidate detail with similar candidates, Interview scheduler, Feedback form, Offer manager, Funnel charts |
| Admin | Verification queue, Policy settings, Institution dashboards (charts), Audit log viewer, Reports export |

### 15.2 UI features
Forms with inline validation, paginated/sortable tables, debounced search and autocomplete, multi-filter sidebar, Kanban pipeline, calendar view, charts (bar/line/funnel/heatmap), toast notifications, role-aware navigation.

## 16. Architecture & Integration

```
 ┌───────────────────────────┐
 │  Browser (Next.js UI)     │  React components, charts
 └─────────────┬─────────────┘
               │ HTTPS / fetch
 ┌─────────────▼─────────────┐
 │ Next.js Route Handlers    │  Auth middleware · RBAC · Zod validation
 │ (service layer)           │
 └──────┬──────────┬─────────┘
        │          │                    ┌───────────────────────┐
        │          │  embedding calls   │ Embedding service     │
        │          └───────────────────►│ (MiniLM, local)       │
        │                               └───────────────────────┘
 ┌──────▼───────────┐          ┌────────────────────┐
 │ PostgreSQL       │          │ MongoDB            │
 │ + pgvector       │          │ resumes, feedback, │
 │ core + vectors   │          │ reviews, logs, …   │
 └──────────────────┘          └────────────────────┘
```

- **Connection:** `pg` (or Prisma with raw SQL for procedures) and `mongodb` driver, using pooled connections.
- **Configuration:** all credentials in `.env.local` (`DATABASE_URL`, `MONGODB_URI`, `JWT_SECRET`, `EMBEDDING_URL`); `.env.example` committed, real `.env` git-ignored. **No hard-coded secrets.**
- **Security:** parameterised queries only (no string-built SQL), password hashing, HTTP-only cookies, CSRF protection, rate limiting on auth routes, least-privilege DB users (app role cannot `DROP`/`TRUNCATE`).

## 17. Testing Plan

| Type | Examples |
|------|----------|
| **Schema/constraint tests** | Insert CGPA = 11 → rejected; duplicate application → rejected; `filled > openings` → rejected |
| **Trigger tests** | Apply after deadline → blocked; stage update creates history row; update on history → blocked |
| **Procedure tests** | `sp_apply` with ineligible student; illegal stage jump; offer acceptance with expired offer |
| **Concurrency tests** | Two parallel accepts for last opening; student accepting two offers simultaneously |
| **Query/performance tests** | `EXPLAIN ANALYZE` before/after indexes on 50k+ seeded applications |
| **Vector tests** | Known pairs (e.g., "React frontend" student ↔ frontend postings) rank above unrelated ones; recall@K vs. exact search |
| **NoSQL tests** | Aggregation outputs checked against hand-computed values on a small fixture |
| **API tests** | Auth required, role forbidden (403), validation errors (400), happy paths |
| **UI/E2E** | Login → search → apply → recruiter shortlists → interview → offer → accept (Playwright/Cypress) |

Seed data: a script generating realistic volumes (≈ 500 students, 60 companies, 300 postings, 5,000 applications) so that indexes, analytics, and recommendations are meaningful.

## 18. Team Responsibilities (balanced across DB and application)

| Area | Member A | Member B |
|------|----------|----------|
| ER diagram & schema | Student, skill, application, history, interview entities | Company, posting, offer, policy, audit entities |
| SQL objects | Triggers, `sp_apply`, `sp_advance_stage`, student views | `sp_accept_offer`, `sp_issue_offer`, funnel/company views, indexes |
| NoSQL / vector | MongoDB collections, aggregations, validators | Embedding pipeline, pgvector index, hybrid recommendation query |
| Backend/API | Auth, RBAC middleware, student endpoints | Recruiter and admin endpoints, validation layer |
| Frontend | Student dashboard, pipeline, search | Recruiter console, admin dashboards, charts |
| Docs & testing | ER/schema docs, data dictionary, constraint/trigger tests | System architecture, queries doc, vector/API/E2E tests |

Both members commit to both the database and application layers; the Git history should reflect this (feature branches + pull requests with reviews).

## 19. Originality & Differentiators

What makes InternTrack more than a tutorial-style tracker:

1. **Policy engine in the database** — rules enforced by triggers/procedures, not just application code.
2. **Immutable, auditable stage history** with time-in-stage analytics.
3. **Concurrency-safe offer acceptance** that cascades to other applications.
4. **Hybrid semantic + relational recommendation** with explainable match (matched/missing skills).
5. **Polyglot persistence** where each store is chosen by data shape, with documented justification.
6. **Skill-demand vs. skill-supply analysis** comparing what postings ask for against what resumes contain.

## 20. Deliverables Checklist (mapped to the requirements document)

| Req. # | Requirement | Covered in |
|--------|-------------|------------|
| 1 | Unique, non-CRUD title with real-world problem | §1–2, §19 |
| 2 | 2-member team with defined responsibilities | §18 |
| 3 | SQL + NoSQL/Vector (min. 2 paradigms) | §7, §8, §11, §12 |
| 4 | ER diagram, relational schema, NoSQL/vector documentation | §8, §11, §12 |
| 5 | DDL: CREATE/ALTER/DROP, keys, constraints, indexes, views | §9.1–9.3 |
| 6 | DML + JOIN/GROUP BY/HAVING/ORDER BY/aggregates/subqueries | §10 |
| 7 | ≥ 4 advanced SQL + 1 NoSQL/vector concept | §9.4–9.6, §11.3, §12, §13 |
| 8 | Embeddings and similarity search explained | §12 |
| 9 | Next.js interface with forms, tables, search, dashboards | §15 |
| 10 | API layer; no hard-coded credentials; env variables | §16 |
| 11 | Backend authentication; ≥ 2 roles | §5, §6.1 |
| 12 | DB-level validation and integrity | §14 |
| 13 | Documentation (objectives → conclusion) | `docs/` folder, see below |
| 14 | Git/GitHub with individual contributions and README | §18, repo layout |
| 15 | Demonstration including test cases | §17 |
| 16 | Originality | §19 |
| 17 | Beyond CRUD; justified DB choices | §2, §7 |

### Documentation structure (`/docs`)
`01_objectives.md` · `02_functional_requirements.md` · `03_er_diagram.png` · `04_relational_schema.md` · `05_db_choice_justification.md` · `06_data_dictionary.md` · `07_sql_implementation.md` · `08_nosql_vector_implementation.md` · `09_important_queries.md` · `10_architecture.md` · `11_screenshots/` · `12_testing_results.md` · `13_conclusion.md`

### Suggested repository layout
```
interntrack/
├── app/                  # Next.js routes, pages, route handlers
├── components/
├── lib/                  # db clients, auth, validators, embedding client
├── db/
│   ├── migrations/       # 001_init.sql … 006_seed.sql
│   ├── functions/ triggers/ views/
│   └── mongo/            # validators, indexes, aggregation scripts
├── embedding-service/    # small MiniLM service
├── tests/
├── docs/
├── .env.example
└── README.md             # setup + run instructions
```

## 21. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Scope too large for the timeline | Build in phases: (1) core SQL + auth, (2) lifecycle logic/triggers, (3) MongoDB, (4) vectors, (5) analytics/polish |
| Keeping SQL and MongoDB in sync | Single service layer owns writes; SQL is source of truth; compensating cleanup |
| Embedding model setup/performance | Small local model, batch embedding at seed time, fallback to keyword search if service is down |
| Concurrency bugs hard to demo | Scripted two-session test and a short recorded demo |

## 22. Expected Outcome

A working, role-based Next.js application backed by PostgreSQL (with pgvector) and MongoDB that lets students discover and track internships with intelligent recommendations, lets recruiters run a structured hiring pipeline, and gives the placement cell reliable, auditable, data-driven oversight — while clearly demonstrating database design, implementation, advanced features, and the reasoning behind each database choice.
