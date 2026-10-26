# InternTrack — Complete Master Execution & Project Defense Guide

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  
**Candidate:** Sumukh Shandilya | Semester V B.Tech CSE  
**Project:** InternTrack — Internship Lifecycle Management & Semantic Matching Platform  
**Target Stack:** PostgreSQL 16 (pgvector, pg_trgm), MongoDB 7.0, Next.js 14 App Router (Node.js 20+)

---

## 1. Project Architecture & System Foundations

InternTrack is an enterprise-grade university placement platform designed to manage the entire campus internship lifecycle with strict relational integrity, high-dimensional semantic search, and semi-structured document storage.

```
                              ┌─────────────────────────────────────────┐
                              │     Next.js 14 App Router Interface     │
                              │     (Port 3000 — Student/Recruiter/Admin)│
                              └────────────────────┬────────────────────┘
                                                   │
                      ┌────────────────────────────┴───────────────────────────┐
                      │                                                        │
                      ▼                                                        ▼
         ┌─────────────────────────┐                              ┌─────────────────────────┐
         │      PostgreSQL 16      │                              │       MongoDB 7.0       │
         │  (ACID Relational Core) │                              │  (Document Collections) │
         ├─────────────────────────┤                              ├─────────────────────────┤
         │ • 17 BCNF Normalized    │                              │ • Resumes (Nested JSON) │
         │   Tables & Constraints  │                              │ • Posting Attachments   │
         │ • 4 Stored Procedures   │                              │ • Interview Rubrics     │
         │ • 4 Core DB Triggers    │                              │ • Experience Reviews    │
         │ • Views & Materialized  │                              │ • Notification Stream   │
         │ • 384-d pgvector Embed  │                              │ • 5 Aggregation Pipes   │
         │ • GIN Trigram / FTS     │                              └─────────────────────────┘
         └─────────────────────────┘
```

---

## 2. Environment Setup & Clean-Room Execution (Start to Finish)

### Step 2.1: Verify Docker Containers
InternTrack runs on dedicated Docker containers for PostgreSQL (with `pgvector`) and MongoDB:
```bash
docker ps
```
*Expected Output:* Two healthy containers: `interntrack_postgres` (ports `5432:5432`) and `interntrack_mongodb` (ports `27017:27017`).

If stopped, start them:
```bash
docker compose up -d
```

### Step 2.2: Apply Authoritative SQL Migrations
Apply the complete schema evolution sequence:
```bash
npm run db:migrate
```
*What happens:* `scripts/migrate.js` executes the 5 migrations in order:
1. `001_init.sql` — Extensions (`vector`, `pg_trgm`, `uuid-ossp`), ENUM types, and 17 tables with PK, FK, and CHECK constraints.
2. `002_indexes.sql` — B-tree, Partial Unique index, GIN Full-Text Search, GIN Trigram, and HNSW vector indexes.
3. `003_views.sql` — Relational views (`v_student_pipeline`, `v_posting_funnel`, `v_department_placement`) and materialized view (`mv_skill_demand`).
4. `004_functions_triggers.sql` — Business logic functions, state audit triggers, clash guards, and stored procedures (`sp_apply`, `sp_advance_stage`, `sp_issue_offer`, `sp_accept_offer`).
5. `005_alter_demo.sql` — DDL demonstration of `ALTER TABLE ... ADD COLUMN`, `ALTER TABLE ... ADD CONSTRAINT`, and `DROP`.

### Step 2.3: Seed Initial Data
```bash
npm run db:seed
```
*What happens:* Cleans collections and populates 12 test users (password `password123`), 7 companies, 6 departments, 6 students with 384-dimensional profile embeddings, 25 technical skills, 5 job postings, and MongoDB feedback rubrics.

### Step 2.4: Launch Next.js Application
```bash
npm run dev
```
*Access:* The application runs on **`http://localhost:3000`**.

---

## 3. Relational Schema & Entity Classification (Deliverable 3)

The schema comprises **17 relations** decomposed into Boyce-Codd Normal Form (BCNF).

### Master Entity Classification Matrix:

| Classification | Relation / Table | Primary Key | Identifying Owner | Partial Key / Discriminator | Cascade Rule | Relational Justification |
|---|---|---|---|---|---|---|
| **STRONG** | `app_user` | `user_id` | *Independent* | — | — | Authentication root. Candidate keys: `{user_id}`, `{email}`. |
| **STRONG** | `department` | `dept_id` | *Independent* | — | — | Academic divisions directory. Candidate key: `{code}`. |
| **STRONG** | `company` | `company_id` | *Independent* | — | — | Corporate hiring partners. Candidate key: `{name}`. |
| **STRONG** | `skill` | `skill_id` | *Independent* | — | — | Canonical technical taxonomy. Candidate key: `{name}`. |
| **STRONG** | `policy_config` | `policy_id` | *Independent* | — | — | Placement governance parameters. Candidate key: `{policy_key}`. |
| **STRONG** | `audit_log` | `log_id` | *Independent* | — | — | Autonomous compliance event stream. Primary key: `{log_id}`. |
| **STRONG (Subtype)** | `student` | `student_id` | `app_user` | — | `ON DELETE CASCADE` | 1:1 Specialization of `app_user`. Domain candidate key: `{usn}`. |
| **STRONG (Subtype)** | `recruiter` | `recruiter_id` | `app_user` | — | `ON DELETE CASCADE` | 1:1 Specialization of `app_user`. Candidate key: `{user_id}`. |
| **STRONG** | `internship_posting` | `posting_id` | `company` | — | `ON DELETE RESTRICT` | Job vacancy master. Primary key: `{posting_id}`. |
| **WEAK** | **`application_stage_history`** | `history_id` | **`application`** | `changed_at` / `to_stage` | `ON DELETE CASCADE` | **Weak Entity:** Existence-dependent on parent `application`. Cannot exist without application. Protected by `trg_stage_history_immutable`. |
| **WEAK** | **`interview`** | `interview_id` | **`application`** | `round_no` | `ON DELETE CASCADE` | **Weak Entity:** Identified per application via discriminator `round_no` with constraint `UNIQUE(application_id, round_no)`. |
| **WEAK / DEPENDENT** | **`offer`** | `offer_id` | **`application`** | — | `ON DELETE CASCADE` | **Dependent 1:1 Entity:** Contractual offer record tied strictly to parent `application` (`UNIQUE(application_id)`). |
| **ASSOCIATIVE** | `student_skill` | `(student_id, skill_id)` | `student`, `skill` | Composite PK | `CASCADE / RESTRICT` | Resolves M:N relationship between Student and Skill. Non-key attribute: `proficiency_level`. |
| **ASSOCIATIVE** | `posting_skill` | `(posting_id, skill_id)` | `internship_posting`, `skill` | Composite PK | `CASCADE / CASCADE` | Resolves M:N relationship between Posting and Skill. Non-key attribute: `min_level`. |
| **ASSOCIATIVE** | `posting_eligible_dept` | `(posting_id, dept_id)` | `internship_posting`, `department` | Composite PK | `CASCADE / RESTRICT` | Resolves M:N eligibility whitelist (`PRIMARY KEY(posting_id, dept_id)`). |
| **ASSOCIATIVE** | `interview_panelist` | `(interview_id, recruiter_id)` | `interview`, `recruiter` | Composite PK | `CASCADE / RESTRICT` | Resolves M:N relationship between Interview and Recruiters. |
| **ASSOCIATIVE** | `application` | `application_id` | `student`, `internship_posting` | `(student_id, posting_id)` | `CASCADE / CASCADE` | Core associative entity resolving M:N relationship with lifecycle attributes (`current_stage`, `match_score`). |

### How to Print the Relational Schema Hardcopy:
```bash
open docs/RELATIONAL_SCHEMA_PRINTABLE.html
```
Press `Cmd+P` -> Save as PDF -> Portrait A4.

---

## 4. DDL & DML Commands in Dedicated SQL Files (Deliverables 4, 5, 6, 7)

### Deliverables 4 & 5: Master DDL Script
Open the unified 53 KB master DDL script:
👉 **`db/all_ddl.sql`**  
Contains 100% of DDL commands: Extensions, Custom ENUMs, 17 `CREATE TABLE` statements, Constraints, Indexes, Views, Materialized Views, Stored Procedures, Functions, and Triggers.

### Deliverable 6: "SHOW CREATE TABLE" Demonstration
Run this command in your terminal for any table:
```bash
npm run db:show-table -- application
```
Or for another table:
```bash
npm run db:show-table -- internship_posting
```
*Output Provided:*
1. Full `psql \d+` detailed schema layout (columns, datatypes, storage, constraints, triggers, indexes).
2. Clean `CREATE TABLE public.application (...)` standard SQL DDL dump.

### Deliverable 7: Master DML Insert Script
Open the dedicated 52 KB pure DML script:
👉 **`db/all_dml.sql`**  
Contains all `INSERT INTO` commands across all 17 tables.

---

## 5. Complete UI Walkthrough & CRUD Verification Matrix (Deliverables 8 & 10)

Open **`http://localhost:3000`** in Chrome or Safari. Use the pre-configured role switcher in the top navigation bar. Password for all demo accounts is **`password123`**.

### Role 1: Student Portal (`sumukh.student@pes.edu`)

#### Feature 1.1: Browse & Semantic Recommendations (READ)
- **URL:** `http://localhost:3000/student/recommendations`
- **What happens:** The system evaluates candidate's 384-dimensional profile embedding against all active openings using pgvector cosine distance:
  $$\text{Cosine Similarity} = 1 - (p.embedding \Leftrightarrow s.profile\_embedding)$$
- **UI Element:** Displays a percentage match badge (e.g. *94.5% Match*) combining domain skills (`fn_match_score`) and vector semantic distance.

#### Feature 1.2: Submit Application (CREATE)
- **URL:** `http://localhost:3000/student/browse`
- **Action:** Select an open internship (e.g. *Frontend Engineering Intern - Adobe*). Click **"Apply Now"**.
- **Backend Execution:** Invokes stored procedure:
  ```sql
  CALL sp_apply($1, $2, NULL);
  ```
  Located at: `app/api/student/apply/route.js:33`.
- **Database Result:** Application stage initialized to `'Applied'`.

#### Feature 1.3: Pipeline Tracking & Application Withdrawal (READ / UPDATE / DELETE)
- **URL:** `http://localhost:3000/student/pipeline`
- **Action:** View live stage progression across Applied ➔ Shortlisted ➔ Interview ➔ Offered.
- **Withdrawal:** Click **"Withdraw"** on an active application.
- **Backend Execution:** Updates `current_stage = 'Withdrawn'` and records `withdrawn_at = CURRENT_TIMESTAMP`.

#### Feature 1.4: Offer Review & Acceptance (UPDATE with Cascading Auto-Withdrawal)
- **URL:** `http://localhost:3000/student/offers`
- **Action:** Review pending formal offer from Google or Microsoft. Click green **"Accept Offer"** button.
- **Backend Execution:** Invokes:
  ```sql
  CALL sp_accept_offer($1, $2);
  ```
  Located at: `app/api/student/offers/route.js:62`.
- **Database Invariant Enforced:**
  1. Secures row-level lock on the posting with `SELECT ... FOR UPDATE`.
  2. Increments `filled_openings = filled_openings + 1`.
  3. Transitions stage to `'Accepted'`.
  4. **Cascading Withdrawal:** University policy automatically withdraws all other active applications (`current_stage = 'Withdrawn'`) so the student cannot hoard offers.

---

### Role 2: Recruiter Portal (`sarah.recruiter@google.com`)

#### Feature 2.1: Create New Internship Posting (CREATE)
- **URL:** `http://localhost:3000/recruiter/postings/create`
- **Action:**
  - Title: *Distributed Systems Engineer Intern*
  - Stipend: `₹110,000` | Openings: `3` | Min CGPA: `8.5`
  - Deadline: Select date 15 days in future.
  - Required Skills: Select *Go, Distributed Systems, Docker*.
  - Click **"Publish Posting"**.
- **Backend Execution:**
  1. Inserts into `internship_posting`.
  2. Inserts whitelisted departments into `posting_eligible_dept`.
  3. Generates 384-d semantic embedding for pgvector HNSW indexing.
  4. Generates tsvector for English full-text search.

#### Feature 2.2: Candidate Funnel & Bulk Stage Progression (READ / UPDATE)
- **URL:** `http://localhost:3000/recruiter/applicants`
- **Action:**
  - View funnel analytics powered by relational view `v_posting_funnel`.
  - Select candidate checkboxes.
  - Choose new stage from dropdown: **"Shortlisted"** or **"Interview"**.
  - Click **"Update Stage"**.
- **Backend Execution:**
  - Invokes `CALL sp_advance_stage(...)` for each candidate inside savepoints.
  - Automatically fires trigger `trg_app_stage_audit`, inserting audit entries into `application_stage_history`.

#### Feature 2.3: Interview Scheduling with Clash Detection (CREATE)
- **URL:** `http://localhost:3000/recruiter/interviews`
- **Action:** Select candidate, pick date/time, set duration to `45` minutes, enter meeting URL, click **"Schedule Interview"**.
- **Database Guard:** If the student already has an overlapping interview, trigger `trg_interview_clash` intercepts and rolls back with error:
  `ERROR: Interview schedule conflict detected! Student already has another interview in this time slot.`

#### Feature 2.4: Issuing Formal Offers (CREATE)
- **URL:** `http://localhost:3000/recruiter/offers`
- **Action:** Select interviewed candidate, input monthly stipend (e.g. `₹100,000`), set start date, click **"Issue Offer"**.
- **Backend Execution:** Invokes `CALL sp_issue_offer(...)` located at `app/api/recruiter/offers/route.js:35`. Advances stage to `'Offered'`.

---

### Role 3: Placement Administrator Portal (`admin@pes.edu`)

#### Feature 3.1: Institutional Placement Analytics (READ)
- **URL:** `http://localhost:3000/admin/analytics`
- **Data Source:** Relational view `v_department_placement` and materialized view `mv_skill_demand`.
- **Metrics:** Total students, placed percentage, average placed stipend, max placed stipend by department (CSE, AIML, ECE).

#### Feature 3.2: Concurrent Materialized View Refresh (UPDATE)
- **Action:** Click **"Refresh Skill Demand Analytics"**.
- **Backend Execution:** Executes:
  ```sql
  SELECT sp_refresh_skill_demand_mv();
  ```
  Executes `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_skill_demand;` with zero table locking.

#### Feature 3.3: Placement Governance Policy Configuration (UPDATE)
- **URL:** `http://localhost:3000/admin/policies`
- **Action:** Modify `max_active_applications` from `5` to `6`. Click **"Save Policy"**.
- **Backend Execution:** Updates `policy_config`. All future student applications immediately respect the new parameter.

#### Feature 3.4: Immutable System Audit Log (READ)
- **URL:** `http://localhost:3000/admin/audit-logs`
- **Data Source:** Table `audit_log` with user joins. Displays real-time chronological ledger of stage changes, offer acceptances, logins, and policy updates.

---

## 6. Advanced Queries & Triggers Demonstration (Deliverable 9)

### A. Run Automated Live Trigger Demonstration
Run this command in your terminal:
```bash
npm run db:demo-triggers
```

#### What It Demonstrates (With Proof):

```
================================================================================
 INTERNTRACK — BEFORE & AFTER TRIGGER DEMONSTRATION
================================================================================

[DEMO 1] TRIGGER: trg_stage_history_immutable (Append-Only Audit Guarantee)
BEFORE: Reading stage history record history_id = 1...
ACTION: Fraudulent attempt: UPDATE application_stage_history SET to_stage='Accepted' WHERE history_id=1;
✓ TRIGGER FIRED & BLOCKED! Exception caught:
  "Audit and stage history records are strictly append-only and immutable. Operation UPDATE blocked."
AFTER: Verifying record remains completely unchanged.

[DEMO 2] TRIGGER: trg_block_late_apply (Rejects Applications after Deadline)
BEFORE: Posting 4 deadline set 2 hours in the past.
ACTION: Student 1 attempts to apply: INSERT INTO application (student_id, posting_id) VALUES (1, 4);
✓ TRIGGER FIRED & BLOCKED! Exception caught:
  "Application deadline has passed for this posting."
AFTER: Applications count for Student 1 on Posting 4: 0 (Zero mutations permitted).

[DEMO 3] TRIGGER: trg_interview_clash (Detects Overlapping Interview Schedules)
BEFORE: Existing interview for Student 1 from 10:00 to 10:45.
ACTION: Recruiter tries to book another round at 10:15 (overlapping).
✓ TRIGGER FIRED & BLOCKED! Exception caught:
  "Interview schedule conflict detected! Student ID 1 already has another interview in this time slot."
AFTER: Candidate calendar remains intact without collisions.

[DEMO 4] TRIGGER: trg_app_stage_audit (Autonomous Audit Log Insertion on Stage Transition)
BEFORE: History records count for Application 4 = 0.
ACTION: Recruiter advances stage: UPDATE application SET current_stage = 'Interview' WHERE application_id = 4;
AFTER: History records count for Application 4 = 1.
Autonomously Created Stage Audit Record:
  { history_id: 148, from_stage: 'Shortlisted', to_stage: 'Interview', changed_at: '2026-10-26T...' }
================================================================================
 ALL 4 TRIGGERS SUCCESSFULLY DEMONSTRATED WITH PROOF
================================================================================
```

---

### B. Where are Stored Procedures & Functions Invoked in Next.js?

| Stored Routine | Routine Type | Purpose | File Path in Next.js Codebase | Line Number |
|---|---|---|---|---|
| **`sp_apply`** | Stored Procedure | Validates CGPA cutoff, quota, and records application. | `app/api/student/apply/route.js` | [Line 33](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/student/apply/route.js#L33) |
| **`sp_advance_stage`** | Stored Procedure | Validates stage transition rules and records history. | `app/api/recruiter/applications/bulk-stage/route.js` <br> `app/api/recruiter/interviews/route.js` | [Line 90](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/recruiter/applications/bulk-stage/route.js#L90) <br> [Line 71](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/recruiter/interviews/route.js#L71) |
| **`sp_issue_offer`** | Stored Procedure | Verifies vacancies, inserts offer, sets stage to `'Offered'`. | `app/api/recruiter/offers/route.js` | [Line 35](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/recruiter/offers/route.js#L35) |
| **`sp_accept_offer`** | Stored Procedure | Atomic acceptance with `FOR UPDATE` lock & auto-withdrawals. | `app/api/student/offers/route.js` | [Line 62](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/student/offers/route.js#L62) |
| **`sp_refresh_skill_demand_mv`** | Stored Procedure | Refreshes materialized view `mv_skill_demand` concurrently. | `app/api/admin/analytics/skill-demand/route.js` | [Line 41](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/admin/analytics/skill-demand/route.js#L41) |
| **`fn_match_score`** | Stored Function | Computes candidate domain skill overlap score (0–100). | `app/api/student/postings/route.js` <br> `app/api/student/recommendations/route.js` | [Line 105](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/student/postings/route.js#L105) <br> [Line 46](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/student/recommendations/route.js#L46) |
| **`fn_interview_clash`** | Stored Function | Detects overlapping interview intervals using `OVERLAPS`. | `app/api/student/interviews/route.js` | [Line 34](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/student/interviews/route.js#L34) |

---

### C. Curated Advanced SQL Queries to Show the Evaluator

If she asks: *"Show me your complex SQL queries with Joins, Subqueries, Window Functions, and CTEs"*, run any of these in `psql`:

#### Query 1: Window Function — Student Rank by CGPA within Department
```sql
SELECT 
  s.usn,
  s.full_name,
  d.code AS dept,
  s.cgpa,
  DENSE_RANK() OVER (PARTITION BY s.dept_id ORDER BY s.cgpa DESC) AS dept_rank
FROM student s
JOIN department d ON s.dept_id = d.dept_id
ORDER BY d.code, dept_rank;
```

#### Query 2: Correlated Subquery — Students Above Department Mean CGPA
```sql
SELECT 
  s.student_id,
  s.usn,
  s.full_name,
  s.cgpa,
  d.code AS department
FROM student s
JOIN department d ON s.dept_id = d.dept_id
WHERE s.cgpa > (
  SELECT AVG(s2.cgpa)
  FROM student s2
  WHERE s2.dept_id = s.dept_id
)
ORDER BY s.cgpa DESC;
```

#### Query 3: Multi-Table Funnel Join Tracing Candidate Lifecycle
```sql
SELECT 
  a.application_id,
  s.full_name AS candidate,
  c.name AS company,
  p.title AS posting,
  a.current_stage,
  COUNT(ir.interview_id) AS total_interviews,
  o.status AS offer_status,
  o.stipend AS offered_stipend
FROM application a
JOIN student s ON a.student_id = s.student_id
JOIN internship_posting p ON a.posting_id = p.posting_id
JOIN company c ON p.company_id = c.company_id
LEFT JOIN interview ir ON a.application_id = ir.application_id
LEFT JOIN offer o ON a.application_id = o.application_id
GROUP BY a.application_id, s.full_name, c.name, p.title, a.current_stage, o.status, o.stipend
ORDER BY a.application_id;
```

#### Query 4: Common Table Expression (CTE) — Offer Acceptance Rate by Tier
```sql
WITH tier_metrics AS (
  SELECT 
    c.industry,
    COUNT(o.offer_id) AS total_offers,
    SUM(CASE WHEN o.status = 'accepted' THEN 1 ELSE 0 END) AS accepted_offers
  FROM company c
  JOIN internship_posting p ON c.company_id = p.company_id
  JOIN application a ON p.posting_id = a.posting_id
  JOIN offer o ON a.application_id = o.application_id
  GROUP BY c.industry
)
SELECT 
  industry,
  total_offers,
  accepted_offers,
  ROUND((accepted_offers::NUMERIC / NULLIF(total_offers, 0) * 100), 2) AS acceptance_rate_pct
FROM tier_metrics
ORDER BY acceptance_rate_pct DESC;
```

#### Query 5: Set Difference (EXCEPT) — Candidates Matching 100% Mandatory Skills
```sql
SELECT s.student_id, s.full_name, s.usn
FROM student s
WHERE NOT EXISTS (
  SELECT ps.skill_id
  FROM posting_skill ps
  WHERE ps.posting_id = 1 AND ps.min_level >= 3
  EXCEPT
  SELECT ss.skill_id
  FROM student_skill ss
  WHERE ss.student_id = s.student_id
);
```

#### Query 6: pgvector Cosine Distance Approximate Nearest Neighbors (ANN)
```sql
SELECT 
  s.student_id,
  s.full_name,
  s.usn,
  d.code AS department,
  s.cgpa,
  ROUND(((1 - (p.embedding <=> s.profile_embedding)) * 100)::NUMERIC, 2) AS cosine_similarity_pct
FROM student s
JOIN department d ON s.dept_id = d.dept_id
JOIN internship_posting p ON p.posting_id = 1
ORDER BY p.embedding <=> s.profile_embedding ASC
LIMIT 5;
```

---

## 7. Automated Testing Suite Verification (40/40 Passing)

Run the full automated test suite:
```bash
npm test
```

### Complete Breakdown of the 40 Passing Tests:

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
✔ 4.1 Concurrency Scenario A: Prevent race condition claiming last opening with SELECT ... FOR UPDATE
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
*Result:* **40 passed, 0 failed, duration: ~1.1 seconds.**

---

## 8. Step-by-Step Viva Presentation Script (The 10-Minute Walkthrough)

Follow this chronological presentation sequence during your viva:

### Minute 0–2: Introduction & Automated Test Suite
1. State your name, USN, course code, and project title:
   > *"Good morning ma'am. My project is InternTrack — Internship Lifecycle Management & Semantic Matching Platform. We implemented a polyglot architecture combining PostgreSQL 16 for ACID relational operations and MongoDB 7.0 for unstructured candidate documents and feedback rubrics."*
2. Run the test suite immediately:
   ```bash
   npm test
   ```
   > *"As you can see, our entire suite of 40 automated tests passes in 1.1 seconds, covering schema constraints, triggers, concurrency race conditions, and role-based access control."*

### Minute 2–4: Schema, ER Diagram & Deliverables
1. If she asks for the ER diagram or Relational Schema:
   ```bash
   open docs/ER_DIAGRAM_PRINTABLE.html
   open docs/RELATIONAL_SCHEMA_PRINTABLE.html
   ```
   > *"Here is our ER Diagram and Relational Schema. All 17 tables are in BCNF. We have explicitly categorized Strong Entities (like `app_user`, `company`, `department`) versus Weak Entities like `application_stage_history` and `interview`, which are existence-dependent on `application` and cascade on delete."*
2. If she asks for `SHOW CREATE TABLE`:
   ```bash
   npm run db:show-table -- application
   ```
   > *"In PostgreSQL, `SHOW CREATE TABLE` is retrieved via `\d+` or `pg_dump --schema-only`. Here is the full SQL DDL statement for `application` showing primary keys, foreign keys, unique constraints, and triggers."*
3. If she asks for the `.sql` files:
   - DDL statements: Open `db/all_ddl.sql`
   - DML statements: Open `db/all_dml.sql`

### Minute 4–7: Live Trigger & Procedure Demonstrations
1. Run the live trigger demonstration:
   ```bash
   npm run db:demo-triggers
   ```
   > *"Here we demonstrate our 4 database triggers with before and after state proofs:  
   > 1. `trg_stage_history_immutable`: Strictly blocks any fraudulent UPDATE or DELETE on audit logs.  
   > 2. `trg_block_late_apply`: Intercepts applications submitted after the deadline or to closed postings.  
   > 3. `trg_interview_clash`: Uses temporal interval overlapping to prevent scheduling conflicts for candidates.  
   > 4. `trg_app_stage_audit`: Autonomously creates an immutable audit row whenever a recruiter advances an applicant's stage."*

### Minute 7–9: UI CRUD Walkthrough in Next.js
1. Open the UI:
   ```bash
   open http://localhost:3000
   ```
2. Demonstrate **Student Flow**:
   - Go to `/student/recommendations`: Show semantic match scores computed via pgvector.
   - Go to `/student/browse`: Click "Apply Now" (invokes `sp_apply`).
   - Go to `/student/offers`: Click "Accept Offer". Explain that stored procedure `sp_accept_offer` executes `SELECT ... FOR UPDATE` to increment seats safely and automatically withdraws all other active applications.
3. Switch to **Recruiter Flow**:
   - Go to `/recruiter/applicants`: Show candidate funnel from view `v_posting_funnel`. Advance applicant stage.
   - Go to `/recruiter/interviews`: Schedule an interview.
4. Switch to **Admin Flow**:
   - Go to `/admin/analytics`: Show department placement metrics.
   - Click "Refresh Skill Demand" to show concurrent materialized view refresh (`mv_skill_demand`).

### Minute 9–10: Conclusion & Examiner Questions
Ask if she would like to see any specific query executed in `psql`, or open `docs/09_important_queries.md` to show window functions, CTEs, or pgvector ANN searches.

---

## 9. Final Pre-Viva Sanity Checklist

Before stepping into the evaluation room:
- [x] Docker desktop running.
- [x] `docker ps` shows `interntrack_postgres` and `interntrack_mongodb` running.
- [x] Dev server running on `http://localhost:3000`.
- [x] `npm test` runs and outputs `pass 40, fail 0`.
- [x] `npm run db:show-table -- application` outputs clean DDL.
- [x] `npm run db:demo-triggers` runs with exit code 0.
- [x] Hardcopy ER diagram (`docs/ER_DIAGRAM_PRINTABLE.html`) and Relational Schema (`docs/RELATIONAL_SCHEMA_PRINTABLE.html`) printed or ready to open.
- [x] Consolidated `db/all_ddl.sql` and `db/all_dml.sql` ready to open.

**YOU ARE 100% READY TO ACE YOUR DBMS VIVA.**
