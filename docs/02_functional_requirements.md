# InternTrack — Functional & Non-Functional Requirements Specification

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  

---

## 1. Functional Requirements Matrix

### 1.1 Student Portal (FR-S1 to FR-S6)

| Req ID | Title | Description | Database Tier Enforcement |
|---|---|---|---|
| **FR-S1** | Profile & Skills Management | Students manage their personal, academic (USN, CGPA, department), and technical skills profile. | `student`, `student_skill`, `department` tables with foreign keys and check constraints (`cgpa BETWEEN 0.00 AND 10.00`). |
| **FR-S2** | Unstructured Resume Parser & Storage | Students upload unstructured JSON/text resumes with projects, education, certifications, and GitHub links. | MongoDB `resumes` collection with compound index on `(student_id, is_active)`. |
| **FR-S3** | Semantic Recommendation Engine | Students receive AI recommendations ranked by cosine similarity between student embedding and active posting embeddings. | PostgreSQL `pgvector` HNSW index with hybrid scoring formula (`0.70 * vector_sim + 0.30 * keyword_sim`). |
| **FR-S4** | Eligibility-Checked Application | Students apply for internship postings. Applications are rejected if CGPA is below cutoff, department is excluded, or deadline has elapsed. | Enforced in stored procedure `sp_apply` and trigger `trg_block_late_apply`. |
| **FR-S5** | Real-Time Pipeline Tracker | Students track their active applications across lifecycle stages: `Applied` ➔ `Shortlisted` ➔ `Interview` ➔ `Offered` ➔ `Accepted`/`Rejected`/`Withdrawn`. | Real-time query over `application` and analytical view `v_student_pipeline`. |
| **FR-S6** | Offer Review & Acceptance Cascade | Students review offers with stipend, expiry date, and conditions. Accepting an offer triggers automatic cascading withdrawal of all other active applications. | Enforced in atomic stored procedure `sp_accept_offer` using `SELECT ... FOR UPDATE` and university policy check. |

---

### 1.2 Recruiter Portal (FR-R1 to FR-R6)

| Req ID | Title | Description | Database Tier Enforcement |
|---|---|---|---|
| **FR-R1** | Company Profile & Recruiter Onboarding | Recruiters register under corporate entities. Admin verification is required before postings go public. | `company`, `recruiter` tables; `company.verified` boolean flag. |
| **FR-R2** | Internship Posting Creation | Recruiters publish postings with title, description, openings, stipend, CGPA cutoff, and eligible departments. Auto-generates 384-d vector embedding. | `internship_posting`, `posting_skill`, `posting_eligible_dept`; `internship_posting.embedding vector(384)`. |
| **FR-R3** | Applicant Funnel & Bulk Stage Transition | Recruiters review applicants, filter by match score, and transition candidate stages in bulk or individually according to the valid state machine. | Enforced in `sp_advance_stage` with strict transition validation and trigger `trg_app_stage_audit`. |
| **FR-R4** | Similar Candidate Vector Retrieval | Recruiters finding an exemplary candidate can click "Find Similar Candidates" to retrieve matching profiles using candidate vector distance. | Cosine distance query: `SELECT * FROM student WHERE student_id != $1 ORDER BY profile_embedding <=> $target_emb LIMIT 5;`. |
| **FR-R5** | Interview Scheduling & Conflict Detection | Recruiters schedule interview rounds (Technical, HR, Managerial) with automated schedule clash prevention for both candidate and interviewer. | Trigger `trg_interview_clash` calling `fn_interview_clash` checking for overlapping temporal intervals `[scheduled_start, scheduled_end]`. |
| **FR-R6** | Offer Issuance & Quota Control | Recruiters issue formal offers with stipends and expiry deadlines. Over-issuing beyond available openings is strictly prevented. | Enforced in `sp_issue_offer` using row-level locking on `internship_posting` and check constraint `filled_openings <= total_openings`. |

---

### 1.3 Placement Cell Admin Portal (FR-A1 to FR-A6)

| Req ID | Title | Description | Database Tier Enforcement |
|---|---|---|---|
| **FR-A1** | Corporate Vetting Queue | Placement officers review and verify newly registered companies before they can accept applications. | `company.verified` toggle; audited via `audit_log`. |
| **FR-A2** | Placement Policy Management | Administrators configure institutional placement rules: `max_active_applications`, `offer_acceptance_freeze_policy`, `min_cgpa_override`. | `placement_policy` table; dynamic JSON / key-value parameter store. |
| **FR-A3** | Department Placement Analytics | Placement officers inspect department-wise metrics: total eligible students, placed students, average and maximum stipends. | Database view `v_department_placement`. |
| **FR-A4** | Market Skill Demand vs Supply Matrix | Placement cell evaluates curriculum alignment by analyzing high-demand industry skills vs student skill supply. | Materialized view `mv_skill_demand` with scheduled refresh function `sp_refresh_skill_demand_mv()`. |
| **FR-A5** | Tamper-Proof Audit Log Inspector | Administrators inspect system actions (stage transitions, offer acceptances, policy overrides). Updating or deleting audit records is strictly prevented. | Trigger `trg_history_immutable` on `audit_log` and `application_stage_history`. |
| **FR-A6** | Accreditations Compliance Data Export | One-click export of placement registry, applications funnel, and company stats in standard CSV format for NAAC/NBA reviews. | Next.js API route `/api/admin/reports/export` with direct SQL streaming. |

---

### 1.4 Cross-Cutting & Non-Functional Requirements (FR-X1 to FR-X5)

| Req ID | Title | Specification | Implementation Strategy |
|---|---|---|---|
| **FR-X1** | Polyglot Data Integrity | Consistent dual-database state across PostgreSQL relational transactions and MongoDB document writes. | Application-tier transaction boundaries; fallback rollbacks; relational IDs referenced in MongoDB schemas. |
| **FR-X2** | Role-Based Access Control (RBAC) | Strict boundary separation between `student`, `recruiter`, and `admin` roles. | JWT claims verified in HTTP-only cookies and Next.js middleware / API route gates. |
| **FR-X3** | Concurrency & Race-Condition Safety | High-contention operations (simultaneous application submissions, last-opening acceptance) must never corrupt data. | PostgreSQL `SELECT ... FOR UPDATE` row locks; transaction isolation level `READ COMMITTED` / `SERIALIZABLE`. |
| **FR-X4** | Automatic Storage Housekeeping | Ephemeral notifications and session activity logs must automatically clean up to prevent database bloat. | MongoDB TTL Indexes (`expireAfterSeconds: 2592000` = 30 days) on `notifications.created_at`. |
| **FR-X5** | Sub-100ms Query Latency | Analytical views, recommendation vector searches, and applicant filters must execute in under 100ms. | PostgreSQL B-tree, GIN full-text, GIN trigram, and pgvector HNSW indexing (`m=16, ef_construction=64`). |
