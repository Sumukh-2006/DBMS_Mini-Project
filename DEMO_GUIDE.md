# InternTrack — Rubric-Mapped Demonstration Guide

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  
**Target Audience:** Faculty Evaluators, Reviewers, and Viva Examiners  

---

## 1. Quick Demonstration Setup

Ensure both Docker containers and the Next.js development server are running:

```bash
# 1. Verify Docker Database Containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. Run Database Migrations & Seed Sample Data
npm run db:migrate
npm run db:seed

# 3. Start Application
npm run dev
# Open browser at: http://localhost:3000
```

---

## 2. One-Click Evaluator Demo Switcher

On the landing page (`http://localhost:3000`), three instant demo login buttons are provided for zero-friction evaluation:
- 🔵 **Launch Student Portal** (`sumukh.student@pes.edu` / `password123`)
- 🟢 **Launch Recruiter Portal** (`sarah.recruiter@google.com` / `password123`)
- 🟡 **Launch Placement Cell Admin** (`admin@pes.edu` / `password123`)

---

## 3. Step-by-Step Live Demonstration Walkthrough

### Step 1: Relational Modeling & Schema Verification (Rubric: Relational Design)
1. Navigate to the terminal or use `psql` via Docker:
   ```bash
   docker exec -it interntrack_postgres psql -U postgres -d interntrack_db -c "\dt"
   ```
2. **Show the Evaluator:**
   - 17 fully normalized tables in BCNF/3NF with strict foreign keys and check constraints.
   - Point to `docs/04_relational_schema.md` for the formal Functional Dependency proof.

---

### Step 2: Semantic AI Recommendations & pgvector Search (Rubric: Vector DB)
1. Log in as **Student** (`sumukh.student@pes.edu`).
2. Navigate to **AI Matches** (`/student/recommendations`).
3. **Show the Evaluator:**
   - Top-ranked postings with a calculated percentage (e.g. `91.85% Match`).
   - Click on the posting details to show that the ranking combines 60% domain skill overlap (`fn_match_score`) with 40% vector Cosine Similarity (`<=>`) and CGPA cutoff pre-filtering.
4. Terminal verification of HNSW Index in PostgreSQL:
   ```bash
   docker exec -it interntrack_postgres psql -U postgres -d interntrack_db -c "\d internship_posting"
   ```
   Show the `idx_posting_embedding_hnsw` index on `embedding vector(384)`.

---

### Step 3: Eligibility Enforcement & State-Machine Application (`sp_apply`)
1. In the Student Portal, click **Browse Postings** (`/student/browse`).
2. Try applying for **Microsoft India** (Posting #2).
3. The stored procedure `sp_apply` executes:
   - Validates student CGPA $\ge 8.00$.
   - Validates student department (`CSE`) is listed under `posting_eligible_dept`.
   - Validates trigger `trg_block_late_apply` (posting is active, deadline is in the future).
4. Navigate to **My Pipeline** (`/student/pipeline`).
5. **Show the Evaluator:** The interactive Kanban board shows the new application in the **Applied** column.

---

### Step 4: Recruiter Funnel, Candidate Progression, & Similar Candidates
1. Log out or open a private window, then click **Launch Recruiter Portal** (`sarah.recruiter@google.com`).
2. Navigate to **Applicant Funnel** (`/recruiter/applicants`).
3. **Show the Evaluator:**
   - Real-time applicant cards showing USN, department, CGPA, and Match Score.
   - Click **Find Similar Candidates** on any candidate to execute nearest-neighbor vector search finding candidates with similar profiles.
   - Advance candidate stage from `Applied` ➔ `Shortlisted` ➔ `Interview`.
   - Explain how `sp_advance_stage` prevents illegal jumps (e.g. jumping directly from `Applied` to `Accepted` throws an exception).

---

### Step 5: Real-Time Interview Conflict Detection (`trg_interview_clash`)
1. In the Recruiter Portal, navigate to **Interview Rounds** (`/recruiter/interviews`).
2. Demonstrate scheduling an interview round for candidate #1 from `10:00 AM` to `11:00 AM`.
3. Attempt to schedule a second interview for candidate #1 overlapping from `10:30 AM` to `11:30 AM`.
4. **Show the Evaluator:** The database trigger `trg_interview_clash` intercepts the request and throws an error:  
   `Schedule Conflict: Candidate has an existing interview scheduled during this time slot.`

---

### Step 6: Atomic Offer Acceptance & University Cascading Policy (`sp_accept_offer`)
1. In the Recruiter Portal, navigate to **Issue Offers** (`/recruiter/offers`).
2. Issue an offer of ₹1,10,000/month to the shortlisted student.
3. Switch back to **Student Portal** (`sumukh.student@pes.edu`) and navigate to **My Offers** (`/student/offers`).
4. **Show the Evaluator:**
   - Active offer card displaying company, monthly stipend, and expiry date.
   - Note the student has multiple applications in progress across other companies.
5. Click **Accept Offer & Confirm Placement**.
6. **Show the Evaluator the Real-Time Cascade:**
   - The accepted application moves to `Accepted` stage.
   - The accepted offer status moves to `accepted`.
   - Engine-level partial unique index `uq_student_single_accepted_application` guarantees only one accepted offer per student.
   - **Crucial Rule:** All other active applications across competing companies are atomically updated to `Withdrawn` by `sp_accept_offer` using `SELECT ... FOR UPDATE` row locks!

---

### Step 7: NoSQL Document Store & 5 Aggregation Pipelines (Rubric: NoSQL Aggregations)
1. Demonstrate MongoDB collections via terminal:
   ```bash
   docker exec -it interntrack_mongodb mongosh interntrack_mongo --eval "db.getCollectionNames()"
   ```
2. Show the TTL index on notifications:
   ```bash
   docker exec -it interntrack_mongodb mongosh interntrack_mongo --eval "db.notifications.getIndexes()"
   ```
3. Run test verifying all 5 aggregation pipelines:
   ```bash
   npm test -- --test-name-pattern="MongoDB Aggregation"
   ```

---

### Step 8: Placement Cell Governance, Materialized View, & Audit Immutability
1. Log in as **Placement Cell Admin** (`admin@pes.edu`).
2. Navigate to **Governance Overview** (`/admin`).
3. Show **Placement Policies** (`/admin/policies`) with dynamic policy overrides.
4. Show **Institutional Analytics** (`/admin/analytics`):
   - Department placement rates and average stipends (`v_department_placement`).
   - Materialized View `mv_skill_demand`: Market Demand vs Student Supply Gap.
   - Click **⚡ Refresh Materialized View** to execute `sp_refresh_skill_demand_mv()`.
5. Show **Audit Log Inspector** (`/admin/audit-logs`):
   - All actions recorded with user, action, and JSON timestamps.
   - Explain trigger `trg_history_immutable`: Attempting to delete an audit log row raises an immediate exception.
6. Show **Export Reports (CSV)** (`/admin/export`):
   - Download official Placed Students Registry CSV, Applications Funnel CSV, or Company Stats CSV.

---

### Step 9: Automated Test Suite Execution (Rubric: Verification)
In the terminal, run the complete 40-test suite:
```bash
npm test
```
**Show the Evaluator:** All 40 automated tests (27 DB/unit + 13 HTTP integration) pass with 0 failures in ~1s.
