# InternTrack — Master Viva & Project Evaluation Guide

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  
**Candidate:** Sumukh Shandilya | Semester V B.Tech CSE  
**Stack:** Next.js 14 App Router, PostgreSQL 16 (pgvector, pg_trgm), MongoDB 7.0  

---

## 1. Deliverables Readiness Master Checklist

| # | Evaluator Rubric Deliverable | Repository Status | File / Artifact Location | Viva Verification Command / Action |
|---|---|---|---|---|
| **2** | **Hardcopy of ER Diagram** | ✅ **READY** | [ER_DIAGRAM_PRINTABLE.html](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/docs/ER_DIAGRAM_PRINTABLE.html) <br> [03_er_diagram.md](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/docs/03_er_diagram.md) | Open `docs/ER_DIAGRAM_PRINTABLE.html` in Chrome/Safari & press `Cmd+P` (Print to PDF / Paper). |
| **3** | **Hardcopy of Relational Schema (Strong & Weak Entities)** | ✅ **READY** | [RELATIONAL_SCHEMA_PRINTABLE.html](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/docs/RELATIONAL_SCHEMA_PRINTABLE.html) <br> [04_relational_schema.md](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/docs/04_relational_schema.md) | Open `docs/RELATIONAL_SCHEMA_PRINTABLE.html` in browser & press `Cmd+P`. Explicitly categorizes all 17 relations. |
| **4** | **DDL Statements** | ✅ **READY** | [all_ddl.sql](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/db/all_ddl.sql) <br> [001_init.sql](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/db/migrations/001_init.sql) | Full DDL statements with Keys, Constraints, Indexes, Views, Functions, Triggers, and Procedures. |
| **5** | **A .sql file ready for all DDL commands** | ✅ **READY** | [db/all_ddl.sql](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/db/all_ddl.sql) | Single consolidated 53 KB master SQL script containing 100% of DDL commands in correct order. |
| **6** | **"SHOW CREATE TABLE" for any table** | ✅ **READY** | [scripts/show_table.js](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/scripts/show_table.js) | Run: `npm run db:show-table -- application` or in `psql`: `\d+ <table>` |
| **7** | **DML commands (all INSERT commands in a separate sql file)** | ✅ **READY** | [db/all_dml.sql](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/db/all_dml.sql) | Single consolidated 52 KB master SQL script containing all INSERT statements for all 17 tables. |
| **8** | **UI — CRUD operations verified** | ✅ **READY** | Next.js Interface at `http://localhost:3000` | Complete CRUD matrix across Student, Recruiter, and Admin portals. |
| **9** | **Advanced queries (Nested, Triggers, Functions, Procedures)** | ✅ **READY** | [scripts/demo_triggers.js](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/scripts/demo_triggers.js) <br> [09_important_queries.md](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/docs/09_important_queries.md) | Run: `npm run db:demo-triggers` to demonstrate before/after of 4 triggers with proof. Code locations detailed below. |
| **10** | **Without error, UI gives output in Next.js interface** | ✅ **READY** | Port `3000` (PID active) | All 20 page routes return HTTP 200 OK. 40/40 tests pass. Next.js build clean. |

---

## 2. Deliverable 2: Hardcopy of ER Diagram

### How to print / export:
1. Open the file in your browser:
   ```bash
   open docs/ER_DIAGRAM_PRINTABLE.html
   ```
2. The page renders the full conceptual Mermaid ER diagram with:
   - Official PES University CSE title banner and course details.
   - Distinct entity color coding (Strong = Blue, Weak = Orange, Associative = Green, Vector = Purple).
   - Cardinality ratios labeled on every relationship ($1:1$, $1:N$, $M:N$, $1:0..1$).
   - Full attribute listings, primary keys (`PK`), foreign keys (`FK`), and unique constraints (`UK`).
3. Click the blue **"🖨️ Print / Save Hardcopy as PDF"** button or press `Cmd+P` / `Ctrl+P`.
4. Destination: **Save as PDF** | Layout: **Landscape** | Paper: **A4**.

---

## 3. Deliverable 3: Hardcopy of Relational Schema (Strong & Weak Entities)

### Academic Categorization Summary:

| Entity Classification | Tables / Relations | Identifying Owner Entity | Discriminator / Partial Key | Cascade Semantics | Relational Theoretical Justification |
|---|---|---|---|---|---|
| **STRONG ENTITY** | `app_user` | *None (Independent)* | — | — | Autonomous authentication root. Candidate keys: `{user_id}`, `{email}`. |
| **STRONG ENTITY** | `department` | *None (Independent)* | — | — | Master institutional department directory. Candidate key: `{code}`. |
| **STRONG ENTITY** | `company` | *None (Independent)* | — | — | Corporate partner entity. Candidate key: `{name}`. |
| **STRONG ENTITY** | `skill` | *None (Independent)* | — | — | Canonical technical skills taxonomy. Candidate key: `{name}`. |
| **STRONG ENTITY** | `policy_config` | *None (Independent)* | — | — | University placement governance parameters. Candidate key: `{policy_key}`. |
| **STRONG ENTITY** | `audit_log` | *None (Independent)* | — | — | Immutable chronological event trail with autonomous surrogate key `{log_id}`. |
| **STRONG ENTITY (Subtype)** | `student` | `app_user` | — | `ON DELETE CASCADE` | 1:1 Specialization of `app_user`. Possesses independent domain candidate key `{usn}`. |
| **STRONG ENTITY (Subtype)** | `recruiter` | `app_user` | — | `ON DELETE CASCADE` | 1:1 Specialization of `app_user` representing corporate hiring staff. |
| **STRONG ENTITY** | `internship_posting` | `company` | — | `ON DELETE RESTRICT` | Job vacancy entity with independent surrogate key `{posting_id}`. |
| **WEAK ENTITY** | **`application_stage_history`** | **`application`** | `changed_at` / `to_stage` | `ON DELETE CASCADE` | **Existence-Dependent Weak Entity:** Cannot exist without a parent application. If an application is purged, its audit trail cascades. Guarded by `trg_stage_history_immutable`. |
| **WEAK ENTITY** | **`interview`** | **`application`** | `round_no` | `ON DELETE CASCADE` | **Subordinate Weak Entity:** Identified per application via discriminator `round_no` with constraint `UNIQUE(application_id, round_no)`. |
| **WEAK / DEPENDENT** | **`offer`** | **`application`** | — | `ON DELETE CASCADE` | **Dependent 1:1 Entity:** Contractual offer record tied strictly to parent `application` (`UNIQUE(application_id)`). |
| **ASSOCIATIVE ENTITY** | `student_skill` | `student`, `skill` | Composite PK | `CASCADE / RESTRICT` | Resolves M:N cardinality between Student and Skill (`PRIMARY KEY(student_id, skill_id)`). |
| **ASSOCIATIVE ENTITY** | `posting_skill` | `internship_posting`, `skill` | Composite PK | `CASCADE / CASCADE` | Resolves M:N cardinality between Posting and Skill (`PRIMARY KEY(posting_id, skill_id)`). |
| **ASSOCIATIVE ENTITY** | `posting_eligible_dept` | `internship_posting`, `department` | Composite PK | `CASCADE / RESTRICT` | Resolves M:N eligibility whitelist (`PRIMARY KEY(posting_id, dept_id)`). |
| **ASSOCIATIVE ENTITY** | `interview_panelist` | `interview`, `recruiter` | Composite PK | `CASCADE / RESTRICT` | Resolves M:N interviewer assignments (`PRIMARY KEY(interview_id, recruiter_id)`). |
| **ASSOCIATIVE ENTITY** | `application` | `student`, `internship_posting` | `(student_id, posting_id)` | `CASCADE / CASCADE` | Core associative entity resolving M:N relationship with lifecycle attributes (`current_stage`, `match_score`). |

### How to print:
```bash
open docs/RELATIONAL_SCHEMA_PRINTABLE.html
```
Press `Cmd+P` -> Save as PDF -> Portrait A4.

---

## 4. Deliverables 4 & 5: DDL Statements & Consolidated Master File

- **Master Consolidated File:** [db/all_ddl.sql](file:///Users/Sumukh_Shandilya/Documents/PES UNIVERSITY/V SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/db/all_ddl.sql) (53.7 KB)
- **Organized Migrations:**
  1. [001_init.sql](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/db/migrations/001_init.sql) — Extensions, Custom ENUMs, 17 Normalized Tables, Foreign Keys, CHECK constraints.
  2. [002_indexes.sql](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/db/migrations/002_indexes.sql) — B-tree, Partial Unique Index, GIN Trigram, HNSW 384-d Vector Index.
  3. [003_views.sql](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/db/migrations/003_views.sql) — Views (`v_student_pipeline`, `v_posting_funnel`, `v_department_placement`) and Materialized View (`mv_skill_demand`).
  4. [004_functions_triggers.sql](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/db/migrations/004_functions_triggers.sql) — Stored procedures, triggers, audit functions, and concurrency locks.
  5. [005_alter_demo.sql](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/db/migrations/005_alter_demo.sql) — Explicit `ALTER TABLE ... ADD COLUMN`, `ALTER TABLE ... ADD CONSTRAINT`, `DROP VIEW`, `DROP INDEX` demonstrating rubric criterion 5.

---

## 5. Deliverable 6: "SHOW CREATE TABLE" for Any Table

In MySQL, examiners use `SHOW CREATE TABLE <name>;`.  
In **PostgreSQL**, there is no native `SHOW CREATE TABLE` keyword. You have **three immediate ways** to demonstrate this flawlessly:

### Method 1: The Automated One-Command Script (Recommended)
```bash
npm run db:show-table -- application
```
*(You can replace `application` with `student`, `internship_posting`, `interview`, `offer`, etc.)*  
This automatically prints:
1. The formatted `psql \d+` schema specification.
2. The exact SQL `CREATE TABLE public.application (...)` DDL with constraints, indexes, triggers, and foreign keys.

### Method 2: In PostgreSQL CLI (`psql`)
```bash
docker exec -it interntrack_postgres psql -U postgres -d interntrack_db -c "\d+ application"
```

### Method 3: Direct SQL DDL Dump via `pg_dump`
```bash
docker exec interntrack_postgres pg_dump -U postgres -d interntrack_db --schema-only -t application
```

---

## 6. Deliverable 7: DML Commands in a Separate SQL File

- **Master File:** [db/all_dml.sql](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/db/all_dml.sql) (52.4 KB)
- Contains complete pure `INSERT INTO` statements with realistic placement data for:
  - 12 User Accounts (`app_user` with bcrypt hashes)
  - 7 Companies (`company` — Google, Microsoft, Amazon, Adobe, Cisco, etc.)
  - 6 Departments (`department` — CSE, AIML, ECE, ISE, MECH, BT)
  - 6 Students (`student` with USNs, CGPA, 384-dimensional pgvector profile embeddings)
  - 5 Recruiters (`recruiter`)
  - 25 Technical Skills (`skill`)
  - Associative links: `student_skill`, `posting_skill`, `posting_eligible_dept`
  - 5 Internship Postings with embeddings and full-text search tsvectors
  - Applications, Interviews, Offers, Policy Configs, and Audit Logs

---

## 7. Deliverable 8: UI — CRUD Operations Verification Matrix

The frontend runs at **`http://localhost:3000`**. You can log in or use the quick switcher:

| Operation | Entity | Role & URL | Exact Viva Steps | Database Verification |
|---|---|---|---|---|
| **CREATE** | Internship Posting | Recruiter: `/recruiter/postings/create` | 1. Fill title, stipend (e.g. ₹90,000), openings, deadline, eligible depts.<br>2. Click **"Publish Posting"**. | Executes `INSERT INTO internship_posting`. Generates 384-d embedding. |
| **CREATE** | Application | Student: `/student/browse` | 1. Find an active opening.<br>2. Click **"Apply Now"**. | Invokes `CALL sp_apply($1, $2, NULL)`. Enforces CGPA cutoff & max applications policy. |
| **CREATE** | Interview Round | Recruiter: `/recruiter/interviews` | 1. Pick shortlisted candidate.<br>2. Select date, duration, mode.<br>3. Click **"Schedule Interview"**. | Executes `INSERT INTO interview` & advances stage to `'Interview'`. Guarded by `trg_interview_clash`. |
| **CREATE** | Offer | Recruiter: `/recruiter/offers` | 1. Pick interviewed applicant.<br>2. Set stipend and start date.<br>3. Click **"Issue Offer"**. | Invokes `CALL sp_issue_offer($1, $2, ...)`. Advances stage to `'Offered'`. |
| **READ** | Postings & Match Scores | Student: `/student/browse` & `/student/recommendations` | View semantic cosine match scores calculated dynamically via `1 - (p.embedding <=> s.profile_embedding)`. | Reads `internship_posting` via `pgvector` distance operator `<=>`. |
| **READ** | Candidate Funnel | Recruiter: `/recruiter/applicants` | View stage distribution (Applied, Shortlisted, Interview, Offered, Accepted). | Queries view `v_posting_funnel`. |
| **READ** | Audit Logs | Admin: `/admin/audit-logs` | View real-time security events, user logins, stage transitions. | Queries `audit_log` with user joins. |
| **UPDATE** | Applicant Stage | Recruiter: `/recruiter/applicants` | 1. Check an applicant checkbox.<br>2. Select new stage (e.g. "Shortlisted").<br>3. Click **"Update Stage"**. | Invokes `CALL sp_advance_stage(...)`. Fires `trg_app_stage_audit`. |
| **UPDATE** | Offer Acceptance | Student: `/student/offers` | 1. Review pending offer.<br>2. Click green **"Accept Offer"** button. | Invokes `CALL sp_accept_offer(...)`. Atomically increments `filled_openings` with `FOR UPDATE`. |
| **UPDATE** | Placement Policies | Admin: `/admin/policies` | Change `max_active_applications` from 5 to 6 and save. | Executes `UPDATE policy_config SET value = ...`. |
| **DELETE / CASCADE** | Competing Applications | Student: `/student/offers` (Acceptance) | When an offer is accepted, the university one-offer rule automatically updates all other active applications to `'Withdrawn'`. | Guarded by partial unique index `uq_student_single_accepted_application` inside `sp_accept_offer`. |
| **DELETE / WITHDRAW** | Candidate Application | Student: `/student/pipeline` | Click **"Withdraw"** on an active application. | Updates stage to `'Withdrawn'` and sets `withdrawn_at = CURRENT_TIMESTAMP`. |

---

## 8. Deliverable 9: Advanced Queries & Trigger Demonstration

### A. Demonstrate Before and After of Triggers
Run the automated demonstration script:
```bash
npm run db:demo-triggers
```

#### Detailed Trigger Explanations:

#### 1. Trigger `trg_block_late_apply` (Deadline & Quota Enforcement)
- **Before State:** Check posting deadline:
  ```sql
  SELECT posting_id, title, deadline FROM internship_posting WHERE posting_id = 4;
  ```
- **Trigger Execution:** Attempt to apply after deadline:
  ```sql
  -- Temporarily set deadline in past for demo
  UPDATE internship_posting SET deadline = CURRENT_TIMESTAMP - INTERVAL '1 hour' WHERE posting_id = 4;
  INSERT INTO application (student_id, posting_id) VALUES (1, 4);
  ```
- **Trigger Error Thrown:**
  `ERROR: Application deadline (...) has passed for this posting.`
- **After State:** Zero rows inserted into `application`.

#### 2. Trigger `trg_interview_clash` (Temporal Overlap Guard)
- **Before State:** Check candidate's existing interview:
  ```sql
  SELECT interview_id, application_id, scheduled_at, duration_min FROM interview WHERE application_id = 1;
  -- Output: 2026-10-28 07:25:45 (45 minutes)
  ```
- **Trigger Execution:** Attempt to insert an interview during that 45-minute window (e.g. 15 minutes after start):
  ```sql
  INSERT INTO interview (application_id, round_no, scheduled_at, duration_min, mode)
  VALUES (1, 2, '2026-10-28 07:40:00+00', 30, 'online');
  ```
- **Trigger Error Thrown:**
  `ERROR: Interview schedule conflict detected! Student ID 1 already has another interview in this time slot.`
- **After State:** Schedule preserved with zero overlaps.

#### 3. Trigger `trg_stage_history_immutable` (Append-Only Audit Guarantee)
- **Before State:** Inspect stage history row:
  ```sql
  SELECT history_id, application_id, to_stage FROM application_stage_history WHERE history_id = 1;
  ```
- **Trigger Execution:** Fraudulent update or deletion attempt:
  ```sql
  UPDATE application_stage_history SET to_stage = 'Accepted' WHERE history_id = 1;
  -- or
  DELETE FROM application_stage_history WHERE history_id = 1;
  ```
- **Trigger Error Thrown:**
  `ERROR: Audit and stage history records are strictly append-only and immutable. Operation UPDATE blocked.`
- **After State:** Row untouched.

#### 4. Trigger `trg_app_stage_audit` (Autonomous Audit Trail)
- **Before State:** Count stage history records:
  ```sql
  SELECT count(*) FROM application_stage_history WHERE application_id = 4; -- Returns 0
  ```
- **Trigger Execution:** Recruiter advances applicant stage:
  ```sql
  UPDATE application SET current_stage = 'Interview' WHERE application_id = 4;
  ```
- **After State:** History record automatically created by trigger:
  ```sql
  SELECT history_id, application_id, from_stage, to_stage, changed_at 
  FROM application_stage_history WHERE application_id = 4;
  -- Returns: from_stage='Shortlisted', to_stage='Interview', changed_at=CURRENT_TIMESTAMP
  ```

---

### B. Where are Stored Procedures & Functions Invoked in Next.js?

| Procedure / Function Name | Type | Purpose | File Path in Codebase | Line Number |
|---|---|---|---|---|
| **`sp_apply`** | Stored Procedure | Handles application validation, CGPA cutoffs, max applications quota. | [app/api/student/apply/route.js](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/student/apply/route.js#L33) | Line 33 |
| **`sp_advance_stage`** | Stored Procedure | Validates legal state machine transitions and logs stage history. | [app/api/recruiter/applications/bulk-stage/route.js](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/recruiter/applications/bulk-stage/route.js#L90) <br> [app/api/recruiter/interviews/route.js](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/recruiter/interviews/route.js#L71) | Line 90 <br> Line 71 |
| **`sp_issue_offer`** | Stored Procedure | Verifies openings and transitions applicant stage to `'Offered'`. | [app/api/recruiter/offers/route.js](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/recruiter/offers/route.js#L35) | Line 35 |
| **`sp_accept_offer`** | Stored Procedure | Concurrency-safe acceptance with `SELECT ... FOR UPDATE` row lock and auto-withdrawal of competing offers. | [app/api/student/offers/route.js](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/student/offers/route.js#L62) | Line 62 |
| **`sp_refresh_skill_demand_mv`** | Stored Function / Procedure | Refreshes the materialized view `mv_skill_demand` concurrently. | [app/api/admin/analytics/skill-demand/route.js](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/admin/analytics/skill-demand/route.js#L41) | Line 41 |
| **`fn_match_score`** | Stored Function | Computes candidate domain skill overlap score (0–100). | [app/api/student/postings/route.js](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/student/postings/route.js#L105) <br> [app/api/student/recommendations/route.js](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/student/recommendations/route.js#L46) | Line 105 <br> Line 46 |
| **`fn_interview_clash`** | Stored Function | Detects overlapping interview intervals using `OVERLAPS`. | [app/api/student/interviews/route.js](file:///Users/Sumukh_Shandilya/Documents/PES%20UNIVERSITY/V%20SEM/DBMS/Mini-Project/Repo/DBMS_Mini-Project/app/api/student/interviews/route.js#L34) | Line 34 |

---

## 9. Deliverable 10: Error-Free Next.js UI Output

- **Development Server:** Running on `http://localhost:3000`
- **Automated Test Suite:** `npm test` passing **40/40 tests** (27 Database/Unit + 13 Live HTTP Integration).
- **Production Build:** `npm run build` succeeds with zero errors across all 55 compiled static and dynamic routes.
- **One-Click Role Switching:** The UI header includes demo switches for:
  - **Student Portal:** Aditi Rao (`sumukh.student@pes.edu`)
  - **Recruiter Portal:** Google Recruiter (`sarah.recruiter@google.com`)
  - **Admin Portal:** PES Placement Director (`admin@pes.edu`)

---

## 10. Quick Command Summary for Viva Presentation

```bash
# 1. Run the full test suite (40/40 passing in ~1.0s)
npm test

# 2. Show CREATE TABLE for any table (Deliverable 6)
npm run db:show-table -- application
npm run db:show-table -- student

# 3. Demonstrate Triggers Before & After (Deliverable 9)
npm run db:demo-triggers

# 4. Open Printable Hardcopy ER Diagram (Deliverable 2)
open docs/ER_DIAGRAM_PRINTABLE.html

# 5. Open Printable Hardcopy Relational Schema (Deliverable 3)
open docs/RELATIONAL_SCHEMA_PRINTABLE.html

# 6. Open Next.js Application in Browser (Deliverable 8 & 10)
open http://localhost:3000
```
