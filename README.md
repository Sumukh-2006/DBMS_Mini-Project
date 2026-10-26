<div align="center">

# 🎯 InternTrack
### Next-Gen Internship Lifecycle Management & Semantic Matching Platform

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![pgvector](https://img.shields.io/badge/pgvector_0.8.7-0064a5?style=for-the-badge&logoColor=white)](https://github.com/pgvector/pgvector)
[![MongoDB](https://img.shields.io/badge/MongoDB_7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/Academic_License-PES_University-f59e0b?style=for-the-badge)](https://pes.edu)

<br/>

**A production-grade, polyglot campus placement platform powered by PostgreSQL 16 + pgvector and MongoDB 7.0.**  
*Enforces university bylaws, atomic offer acceptance cascades, interview collision detection, and AI semantic vector matching.*

<br/>

[Explore Architecture](#-architecture--polyglot-engine) •
[Quickstart](#-quickstart-in-3-minutes) •
[Demo Portals](#-role-based-demo-portals) •
[Test Suite](#-automated-test-suite-4040-passing) •
[Docs Index](#-academic-documentation)

<br/>
<br/>

---

</div>

## ⚡ Why InternTrack?

Managing university recruitment drives for thousands of students and hundreds of corporate partners is fraught with compliance violations and operational friction:

- ❌ **Offer Hoarding:** Students acquire offers and fail to withdraw active applications, denying peers interview slots.
- ❌ **Interview Schedule Collisions:** Recruiters independently book shared candidates into overlapping time slots.
- ❌ **Keyword Matching Blindspots:** Keyword searches miss high-potential students with alternative technical jargon.
- ❌ **Relational Rigidity vs Unstructured Resumes:** Complex student portfolios and dynamic evaluation rubrics break strict tabular schemas.

**InternTrack** resolves this with an **Institutional Polyglot Architecture**:

| Capability | Engineering Solution | Database Tier |
|---|---|---|
| **ACID Integrity & 3NF/BCNF** | 17 normalized tables with domain checks and foreign key referential actions | `PostgreSQL 16` |
| **High-Dimensional Semantic Search** | 384-d dense vectors with HNSW cosine distance index (`<=>`) | `pgvector` |
| **Concurrency & Cascade Rules** | Atomic stored procedures with `SELECT ... FOR UPDATE` pessimistic locks | `PL/pgSQL` |
| **Real-Time Temporal Overlaps** | Interval overlap triggers (`(start, end) OVERLAPS (...)`) | `PostgreSQL Triggers` |
| **Polymorphic Resumes & Rubrics** | Unstructured JSON documents, multi-criteria evaluations | `MongoDB 7.0` |
| **Automated Storage Cleanup** | 30-day Time-To-Live (TTL) index on notifications | `MongoDB TTL` |
| **Curriculum Gap Analytics** | Materialized view (`mv_skill_demand`) refreshed concurrently | `PostgreSQL MV` |

---

## 🏛️ Architecture & Polyglot Engine

```mermaid
graph TD
    subgraph Browser ["Client Presentation Layer (Browser)"]
        UI_Student["🎓 Student Portal<br/>(AI Matches, Kanban, Offers)"]
        UI_Recruiter["🏢 Recruiter Console<br/>(Postings, Funnel, Schedule)"]
        UI_Admin["🏛️ Placement Cell Admin<br/>(Governance, Analytics, CSV)"]
    end

    subgraph AppServer ["Fullstack Next.js 14 Engine (Node.js)"]
        AuthMid["JWT Auth & RBAC Security<br/>(HTTP-Only Cookies, Bcrypt)"]
        APIRoutes["30 Dynamic REST API Handlers<br/>(/api/student, /api/recruiter, /api/admin)"]
        VectorEngine["384-d Vector Transformer<br/>(Dense Cosine Embedding)"]
        PGPool["PostgreSQL Pool (pg)<br/>(ACID Transactions, Row Locks)"]
        MongoClient["MongoDB Client Pool<br/>(Mongoose / MongoDB Native)"]
    end

    subgraph Storage ["Polyglot Persistence Layer"]
        subgraph Postgres ["PostgreSQL 16 + pgvector"]
            PG_Tables["17 BCNF/3NF Tables<br/>(student, company, application, offer)"]
            PG_Triggers["Triggers: trg_history_immutable<br/>trg_interview_clash, trg_block_late_apply"]
            PG_Procedures["Procedures: sp_apply, sp_advance_stage<br/>sp_accept_offer (with Auto-Withdraw Cascade)"]
            PG_Vectors["HNSW Vector Index (m=16, ef=64)<br/>384-dimensional cosine similarity"]
        end

        subgraph Mongo ["MongoDB 7.0 Store"]
            MG_Resumes["resumes (Polymorphic JSON Portfolios)"]
            MG_Feedback["interview_feedback (Dynamic 1-10 Rubrics)"]
            MG_Reviews["experience_reviews (Culture & Sentiment)"]
            MG_TTL["notifications (30-Day Automated TTL)"]
            MG_Logs["activity_logs (Heatmap Telemetry)"]
        end
    end

    Browser -->|JSON REST / HTTP-Only Cookies| AppServer
    AuthMid --> APIRoutes
    APIRoutes --> VectorEngine
    APIRoutes --> PGPool
    APIRoutes --> MongoClient
    PGPool --> Postgres
    MongoClient --> Mongo
```

---

## 🚀 Quickstart in 3 Minutes

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed & running

### 2. Clone & Spin up Containers
```bash
git clone https://github.com/your-username/interntrack.git
cd interntrack

# Start PostgreSQL 16 (pgvector) and MongoDB 7.0
docker compose up -d

# Verify containers are healthy
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 3. Initialize Database & Seed
```bash
# 1. Apply 17-table schema, indexes, views, triggers, and stored procedures
npm run db:migrate

# 2. Seed realistic students, 384-d vectors, postings, resumes, and reviews
npm run db:seed
```
> **Safety Guard:** `scripts/seed.js` performs a destructive reset across all 17 tables and MongoDB collections for demonstration environments. When executed in production (`NODE_ENV=production`), it requires `ALLOW_DESTRUCTIVE_SEED=true` to prevent accidental data loss.

### 4. Run Automated Test Suite
```bash
npm test
```
> **Output:** `pass 40, fail 0` — 27 database constraints, triggers, pessimistic locks, concurrency races, vector searches, and MongoDB aggregations + 13 full HTTP endpoint integration and tenant isolation tests verified.

### 5. Launch the Platform
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🎭 Role-Based Demo Portals

The landing page features a **1-Click Evaluator Demo Switcher** for instant testing:

```
+-----------------------------------------------------------------------------------+
|  [ 🔵 Launch Student Portal ]   [ 🟢 Launch Recruiter Portal ]   [ 🟡 Launch Admin ]|
+-----------------------------------------------------------------------------------+
```

| Portal | Email | Password | What to Test |
|---|---|---|---|
| **Student (Unplaced)** | `sumukh.student@pes.edu` | `password123` | Apply to openings, inspect AI recommendations, accept offers with atomic cascading withdrawal. |
| **Student (Placed)** | `arjun.kapoor@pes.edu` | `password123` | View locked placement status (`current_stage = 'Accepted'`), inspect finalized offer details. |
| **Recruiter (Google)** | `sarah.recruiter@google.com` | `password123` | Applicant funnel, trigger `sp_advance_stage`, find similar candidates via vector proximity. |
| **Recruiter (Microsoft)** | `priya.sharma@microsoft.com` | `password123` | Schedule interviews, test clash detection trigger, issue formal compensation offers. |
| **Placement Cell Admin** | `admin@pes.edu` | `password123` | Vetting queue, policy tuning, `mv_skill_demand` refresh, download official NAAC/NBA CSV exports. |

---

## 🧪 Automated Test Suite (40/40 Passing)

InternTrack includes an automated test harness in [`tests/interntrack.test.js`](tests/interntrack.test.js) and [`tests/http_routes.test.js`](tests/http_routes.test.js) executed via `npm test`:

```
✔ HTTP 1.1 Bulk-Stage: Missing or invalid authentication returns 401
✔ HTTP 1.2 Bulk-Stage: Missing required fields or empty batch returns 400
✔ HTTP 1.3 Bulk-Stage: Malformed IDs or invalid stage returns 400
✔ HTTP 1.4 Bulk-Stage: Authorized recruiter advancing own company applications succeeds (200)
✔ HTTP 1.5 Bulk-Stage: Recruiter attempting to modify another company applications is strictly blocked (403)
✔ HTTP 1.6 Bulk-Stage: Mixed batch containing valid and unauthorized IDs is rejected with 403 and zero mutations
✔ HTTP 1.7 Bulk-Stage: Subsequent valid request succeeds after a rejected request (verifying connection health)
✔ HTTP 2.1 Applicants: Recruiter viewing another company posting applicants is blocked with 403
✔ HTTP 2.2 Applicants: Recruiter viewing own company applicants succeeds with 200
✔ HTTP 2.3 Offers: Recruiter issuing offer to another company applicant is blocked with 403
✔ HTTP 2.4 Interviews: Recruiter scheduling interview for another company candidate is blocked with 403
✔ HTTP 2.5 Student Offers: Student attempting to decline another student offer is blocked with 403
✔ HTTP 2.6 Postings: Recruiter belonging to an unverified company is blocked from creating postings (403)
✔ 1.1 Schema Constraint: Block invalid student CGPA > 10.00
✔ 1.2 Schema Constraint: Block duplicate application for same student and posting
✔ 1.3 Schema Constraint: Block posting filled count exceeding openings
✔ 1.4 Schema Constraint: Block invalid email format in app_user
✔ 2.1 Trigger trg_history_immutable: Strictly block UPDATE on application_stage_history
✔ 2.2 Trigger trg_history_immutable: Strictly block DELETE on audit_log
✔ 2.3 Trigger trg_block_late_apply: Block application if posting is closed or deadline passed
✔ 2.4 Trigger trg_interview_clash: Detect and block overlapping interview schedule
✔ 2.5 Partial Unique Index: uq_student_single_accepted_application blocks multiple accepted applications
✔ 3.1 sp_apply: Reject application if student CGPA is below cutoff
✔ 3.2 sp_advance_stage: Block illegal stage transition from Applied directly to Accepted
✔ 3.3 sp_issue_offer: Issue offer and advance application stage to Offered
✔ 3.4 sp_accept_offer & University Cascade Policy: Concurrency-safe acceptance auto-withdraws other active apps
✔ 3.5 sp_accept_offer: Expired offer rejection (Scenario D)
✔ 4.1 Concurrency Scenario A: Prevent race condition claiming last opening with SELECT ... FOR UPDATE (parallel execution)
✔ 4.2 Concurrency Scenario B: One student accepts two offers in parallel with deadlock freedom
✔ 4.3 Idempotency Scenario C: Repeated acceptance request fails cleanly with controlled error
✔ 5.1 pgvector: Cosine distance calculation with 384-dimensional vectors
✔ 6.1 MongoDB Aggregation: Average Rating per Company
✔ 6.2 MongoDB Aggregation: Resume Skills Frequency
✔ 6.3 MongoDB Aggregation: Interview Rubric Dynamic Keys
✔ 6.4 MongoDB Aggregation: Activity Heatmap by Day of Week and Hour
✔ 6.5 MongoDB Aggregation: Top Review Tags Analysis
✔ 7.1 Auth: Password hashing and verification with bcrypt
✔ 7.2 Auth: JWT Token signing, verification, and role payload
✔ 7.3 RBAC: requireAuth enforces role-based access control
✔ 7.4 Materialized View: sp_refresh_skill_demand_mv procedure executes concurrently without error
```

---

## 📊 In-Depth Database Features

### 1. Atomic Offer Acceptance & Cascade (`sp_accept_offer`)
When a student accepts an offer, InternTrack prevents race conditions using **pessimistic row-level locking**:
```sql
-- Lock target posting row to serialize concurrent applicants
SELECT * FROM internship_posting WHERE posting_id = v_posting_id FOR UPDATE;

-- Update status and mark application accepted
UPDATE offer SET status = 'accepted', responded_at = CURRENT_TIMESTAMP WHERE offer_id = p_offer_id;
UPDATE application SET current_stage = 'Accepted', updated_at = CURRENT_TIMESTAMP WHERE application_id = v_app_id;

-- University Cascade Policy: Auto-withdraw all competing active applications
UPDATE application SET current_stage = 'Withdrawn'
WHERE student_id = p_student_id AND application_id != v_app_id
  AND current_stage IN ('Applied', 'Shortlisted', 'Interview', 'Offered');
```

### 2. High-Dimensional Vector Search (pgvector)
PostgreSQL performs native nearest-neighbor retrieval using an **HNSW index** with cosine distance:
```sql
SELECT 
  p.posting_id, p.title, c.name,
  -- Combined Hybrid Recommendation Score (60% Skill Match + 40% Vector Cosine Similarity)
  ROUND(
    ((0.6 * fn_match_score(s.student_id, p.posting_id)) + 
    (0.4 * ((1 - (p.embedding <=> s.profile_embedding)) * 100)))::NUMERIC,
    2
  ) AS hybrid_score
FROM internship_posting p
JOIN company c ON p.company_id = c.company_id
CROSS JOIN student s
WHERE s.student_id = $1 AND p.status = 'open' AND s.cgpa >= p.min_cgpa
ORDER BY hybrid_score DESC
LIMIT 10;
```
> **Note on Vector Embeddings:** The system utilizes a deterministic dense semantic projection in `lib/embeddings.js` that clusters technical keywords across domain centroids (Systems, Web, AI/ML, Mobile) onto a 384-dimensional unit hypersphere with SHA-256 dispersion for out-of-vocabulary terms. It requires zero external neural model downloads and generates ranking scores for retrieval rather than calibrated empirical probabilities.

### 3. Five Production MongoDB Aggregation Pipelines
- **Company Sentiment (`getCompanyRatingAverages`):** `$group` on ratings across 4 dimensions (mentorship, learning, work-life, compensation).
- **Skills Intelligence (`getResumeSkillsFrequency`):** `$unwind: '$extracted_skills'` computing university-wide competency frequency.
- **Dynamic Rubrics (`getInterviewFeedbackAverages`):** `$objectToArray` to unpack and average variable role criteria (e.g. `System Design`, `Coding`).
- **Telemetry Heatmap (`getActivityHeatmap`):** `$dayOfWeek` and `$hour` grouping user traffic for institutional capacity planning.
- **Corporate Culture Tags (`getTopReviewTags`):** `$unwind: '$tags'` and `$group` surfacing top student sentiment badges.

---

## 📚 Academic Documentation

Every aspect of this project is documented in the [`docs/`](./docs) folder:

| Document | Topic |
|---|---|
| [**01_objectives.md**](./docs/01_objectives.md) | Problem Statement, Challenges, and Core Objectives (O1–O8) |
| [**02_functional_requirements.md**](./docs/02_functional_requirements.md) | Functional Requirements Matrix (FR-S1 through FR-X5) |
| [**03_er_diagram.md**](./docs/03_er_diagram.md) | Conceptual Schema, Mermaid ER Diagram, and Cardinality Ratios |
| [**04_relational_schema.md**](./docs/04_relational_schema.md) | 17 Table Definitions & Formal BCNF Functional Dependency Proof |
| [**05_db_choice_justification.md**](./docs/05_db_choice_justification.md) | Relational vs NoSQL vs pgvector Polyglot Architecture Rationale |
| [**06_data_dictionary.md**](./docs/06_data_dictionary.md) | Complete Data Dictionary for 17 Tables and 6 MongoDB Collections |
| [**07_sql_implementation.md**](./docs/07_sql_implementation.md) | Complete DDL, Triggers, Stored Procedures, and Locking Details |
| [**08_nosql_vector_implementation.md**](./docs/08_nosql_vector_implementation.md) | 5 MongoDB Aggregation Pipelines & HNSW Vector Indexing Guide |
| [**09_important_queries.md**](./docs/09_important_queries.md) | 15+ Advanced Curated Queries (Joins, CTEs, Window Functions, Vectors) |
| [**10_architecture.md**](./docs/10_architecture.md) | System Architecture & End-to-End Workflow Sequence Diagrams |
| [**12_testing_results.md**](./docs/12_testing_results.md) | 16-Test Verification Report, Concurrency Logs, and Invariants |
| [**13_conclusion.md**](./docs/13_conclusion.md) | Evaluation Rubric Checklist, Limitations, and Future Roadmap |
| [**COMPLETE_EXECUTION_GUIDE.md**](./docs/COMPLETE_EXECUTION_GUIDE.md) | Master End-to-End Execution Guide & Viva Defense Manual |
| [**VIVA_EVALUATION_GUIDE.md**](./docs/VIVA_EVALUATION_GUIDE.md) | Quick Viva Deliverables Checklist & Rubric Verification |

---

## 🛠️ Project Structure

```
├── app/                              # Next.js 14 App Router
│   ├── admin/                        # Placement Cell Admin Console
│   ├── api/                          # 30 Dynamic REST API Route Handlers (55 total routes)
│   ├── recruiter/                    # Recruiter Management Portal
│   ├── student/                      # Student Self-Service Portal
│   ├── globals.css                   # Custom Dark Glassmorphism Styling
│   └── page.js                       # Landing Page with 1-Click Demo Switcher
├── db/                               # Relational Schema & Migrations
│   ├── all_ddl.sql                   # Single Consolidated Master DDL Script
│   ├── all_dml.sql                   # Single Consolidated Master DML Insert Script
│   └── migrations/                   # 001_init to 005_alter_demo + 006_seed
├── docs/                             # Complete Academic Documentation Reports (01–13)
│   ├── COMPLETE_EXECUTION_GUIDE.md   # Master End-to-End Execution & Defense Guide
│   ├── VIVA_EVALUATION_GUIDE.md      # Deliverables Checklist & Live Demo Guide
│   ├── ER_DIAGRAM_PRINTABLE.html     # Print-Ready Hardcopy ER Diagram
│   └── RELATIONAL_SCHEMA_PRINTABLE.html # Print-Ready Hardcopy Relational Schema
├── lib/                              # Core Drivers & Business Logic
│   ├── aggregations.js               # 5 MongoDB Aggregation Pipelines
│   ├── auth.js                       # JWT, Bcrypt, & RBAC Middleware
│   ├── db.js                         # PostgreSQL Pool & Transaction Helpers
│   ├── embeddings.js                 # 384-d Dense Semantic Vector Generator
│   └── mongo.js                      # MongoDB Client & 30-Day TTL Indexes
├── scripts/                          # DevOps Automation & Demonstration Scripts
│   ├── demo_triggers.js              # Live Before & After Trigger Verification
│   ├── show_table.js                 # "SHOW CREATE TABLE" DDL Extractor
│   ├── migrate.js                    # Sequential SQL Migration Runner
│   └── seed.js                       # Polyglot Seeder (Postgres + Mongo + Vectors)
├── tests/                            # Automated Verification (40/40 Passing)
│   ├── http_routes.test.js           # 13 Live HTTP Endpoint & Tenant Isolation Tests
│   └── interntrack.test.js           # 27 Database Constraint, Concurrency & Aggregation Tests
├── docker-compose.yml                # Multi-Container PostgreSQL + MongoDB Stack
└── README.md                         # Project Master Documentation
```

---

<div align="center">

Developed by Sumukh Shandilya!
</div>
