# InternTrack — System Architecture & Data Flow Design

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  

---

## 1. High-Level Multi-Tier Architecture

InternTrack uses a modern, high-performance polyglot architecture separating presentation, server-side business logic, transactional persistence, unstructured document storage, and vector retrieval.

```mermaid
graph TD
    subgraph ClientLayer ["Client Presentation Tier (Browser)"]
        UI_Student["Student Portal<br/>(Dashboard, Kanban, Recs)"]
        UI_Recruiter["Recruiter Portal<br/>(Postings, Applicants, Offers)"]
        UI_Admin["Placement Admin Console<br/>(Governance, Analytics, CSV)"]
    end

    subgraph ServerLayer ["Next.js App Router (Fullstack Node.js Engine)"]
        AuthMid["JWT Auth & RBAC Middleware<br/>(HTTP-Only Cookies, bcrypt)"]
        APIRoutes["REST API Route Handlers<br/>(/api/student/*, /api/recruiter/*, /api/admin/*)"]
        EmbedEngine["Vector Embedding Generator<br/>(384-d Dense Semantic Pipeline)"]
        ConnPG["PostgreSQL Connection Pool<br/>(pg, Min: 2, Max: 20)"]
        ConnMongo["MongoDB Client Connection Pool<br/>(mongodb driver)"]
    end

    subgraph DataLayer ["Polyglot Persistence Tier"]
        subgraph PostgresEngine ["PostgreSQL 16 + pgvector"]
            Tables["17 BCNF/3NF Tables<br/>(ACID Transactions, Row Locks)"]
            Views["5 Standard Analytical Views<br/>+ 1 Materialized View"]
            Triggers["PL/pgSQL Business Triggers<br/>(Immutability, Overlap, Late Apply)"]
            Procs["Stored Procedures<br/>(sp_apply, sp_accept_offer, etc.)"]
            HNSW["HNSW Vector Index<br/>(Cosine Distance <=>)"]
        end

        subgraph MongoEngine ["MongoDB 7.0 Document Engine"]
            ColResumes["resumes (Polymorphic JDs & Portfolios)"]
            ColRubrics["interview_feedback (Dynamic Criteria)"]
            ColReviews["experience_reviews (Culture & Sentiment)"]
            ColNotifs["notifications (Automated 30-Day TTL)"]
            ColTelemetry["activity_logs (Heatmap & User Events)"]
        end
    end

    ClientLayer -->|HTTPS / JSON API| ServerLayer
    AuthMid --> APIRoutes
    APIRoutes --> EmbedEngine
    APIRoutes --> ConnPG
    APIRoutes --> ConnMongo
    ConnPG --> PostgresEngine
    ConnMongo --> MongoEngine
```

---

## 2. End-to-End Data Flow Workflows

### 2.1 Workflow 1: Eligibility-Checked Application Submission (`sp_apply`)

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student User
    participant Frontend as Next.js Student Portal
    participant API as /api/student/apply
    participant Postgres as PostgreSQL 16 Engine
    participant Trigger as trg_block_late_apply
    participant Procedure as sp_apply (PL/pgSQL)

    Student->>Frontend: Clicks "Apply Now" on Posting #1
    Frontend->>API: POST /api/student/apply { posting_id: 1 } (JWT in Cookie)
    API->>API: Verify Student Role & Extract student_id
    API->>Postgres: CALL sp_apply(p_student_id, p_posting_id, ...);
    
    activate Procedure
    Procedure->>Postgres: Check student.is_placed
    alt Student is already placed
        Procedure-->>API: RAISE EXCEPTION 'Student has already accepted an offer'
    end

    Procedure->>Postgres: Check student.cgpa >= posting.min_cgpa
    alt CGPA below cutoff
        Procedure-->>API: RAISE EXCEPTION 'Student CGPA is below cutoff'
    end

    Procedure->>Postgres: Verify posting_eligible_dept
    alt Department not eligible
        Procedure-->>API: RAISE EXCEPTION 'Department not eligible'
    end

    Procedure->>Trigger: INSERT INTO application(...)
    activate Trigger
    Trigger->>Postgres: Verify posting.status == 'Active' AND deadline > NOW()
    alt Deadline passed
        Trigger-->>Procedure: RAISE EXCEPTION 'Posting expired'
    end
    Trigger-->>Procedure: Allow INSERT
    deactivate Trigger

    Procedure-->>API: p_application_id, 'Application submitted successfully'
    deactivate Procedure

    API-->>Frontend: 201 Created { success: true }
    Frontend-->>Student: Renders Green Confirmation & Moves to Pipeline
```

---

### 2.2 Workflow 2: Atomic Offer Acceptance & Cascade (`sp_accept_offer`)

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student User
    participant Frontend as Next.js Offers Portal
    participant API as /api/student/offers
    participant Postgres as PostgreSQL 16 Engine
    participant Procedure as sp_accept_offer (PL/pgSQL)

    Student->>Frontend: Clicks "Accept Offer" (Offer ID: 1)
    Frontend->>API: POST /api/student/offers { offer_id: 1, action: 'accept' }
    API->>Postgres: CALL sp_accept_offer(p_offer_id, p_student_id, ...);
    
    activate Procedure
    Procedure->>Postgres: Verify offer status == 'issued' & expires_at >= CURRENT_DATE
    Procedure->>Postgres: SELECT filled_openings, total_openings FROM posting FOR UPDATE (Pessimistic Lock)
    alt Quota already full
        Procedure-->>API: RAISE EXCEPTION 'Contention Exception: All openings filled'
    end

    Procedure->>Postgres: UPDATE offer SET status = 'accepted'
    Procedure->>Postgres: UPDATE application SET current_stage = 'Accepted'
    Procedure->>Postgres: UPDATE student SET is_placed = TRUE
    
    Note over Procedure,Postgres: University Cascade Policy:
    Procedure->>Postgres: UPDATE application SET current_stage = 'Withdrawn' WHERE student_id = S AND id != AppID
    
    Procedure->>Postgres: UPDATE posting SET filled_openings = filled_openings + 1
    Procedure-->>API: p_success = TRUE, 'Auto-withdrew N other applications'
    deactivate Procedure

    API-->>Frontend: 200 OK { message: 'Offer accepted! Applications cascaded.' }
    Frontend-->>Student: Displays Official Placed Badge & Locked Pipeline
```

---

## 3. Concurrency & Security Architecture

1. **Authentication & Session Tokens:**
   - Stateless JWT tokens signed with HMAC-SHA256 containing `userId`, `email`, `role`, and `subId` (student_id or recruiter_id).
   - Stored in browser `httpOnly`, `sameSite: 'lax'`, `secure: false` (local dev) cookies to prevent XSS credential theft.
   - Passwords salted and hashed with `bcrypt` (10 rounds).

2. **Pessimistic Concurrency Control:**
   - `SELECT ... FOR UPDATE` acquires an exclusive row lock on the target `internship_posting` record inside transaction boundaries.
   - Any concurrent request attempting to accept an offer for the final opening is serialized and blocked until the first transaction commits, preventing overselling seats.

3. **Database Security & RBAC:**
   - Relational check constraints and foreign keys protect against SQL injection and application bugs.
   - Parameterized queries (`$1, $2, ...`) utilized universally across all PostgreSQL queries.
