# InternTrack — Objectives & Problem Statement

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  
**Project Title:** InternTrack — Internship Lifecycle Management & Semantic Matching Platform  

---

## 1. Executive Summary

In premier engineering universities like PES University, managing the campus internship and placement drive involves coordinating thousands of students, hundreds of corporate recruiters, and strict institutional placement policies. Traditional placement workflows rely on fragmented spreadsheets, generic email threads, and disconnected Google Forms. This causes critical institutional bottlenecks:

1. **Eligibility Enforcement Gaps:** Students apply to companies whose CGPA cutoffs, department restrictions, or active backlog rules they violate. Manual verification by placement officers is slow, error-prone, and causes compliance disputes.
2. **Offer Hoarding & Policy Evasion:** Students who secure an internship frequently fail to withdraw their competing active applications. This blocks other deserving peers from interview shortlists, violating the university's "One-Student-One-Offer" or tier-based acceptance rules.
3. **Interview Schedule Clashes:** Recruiters independently schedule interview rounds for shared candidate shortlists, resulting in double-booking and wasted corporate interviewing bandwidth.
4. **Keyword Matching Failure:** Traditional Boolean keyword search fails to identify semantic relevance between unstructured student resumes (projects, publications, open-source work) and evolving internship job descriptions (e.g., matching "Distributed Systems" with "Raft, Kubernetes, gRPC" without exact string overlaps).
5. **Lack of Auditable Governance:** Postings, applications, and status transitions lack immutable audit trails, hindering NAAC/NBA accreditation data gathering and post-hoc dispute resolution.

**InternTrack** resolves these challenges by introducing a **production-grade polyglot database architecture** combining **PostgreSQL 16 with pgvector** (for ACID transactions, relational integrity, state-machine triggers, and high-dimensional vector similarity) and **MongoDB 7.0** (for dynamic JSON documents, unstructured resumes, rubrics, and automated TTL cleanup).

---

## 2. Core Objectives (O1 – O8)

### O1: Polyglot Persistence Architecture
Design and implement a hybrid persistence engine pairing PostgreSQL 16 (for relational integrity, financial/stipend precision, and ACID transactions) with MongoDB 7.0 (for polymorphic unstructured resumes, interview rubrics, and ephemeral notifications).

### O2: Strict BCNF/3NF Relational Modeling
Construct a fully normalized relational schema (17 tables) enforcing Boyce-Codd Normal Form / Third Normal Form to eradicate insert, update, and delete anomalies while guaranteeing referential actions (`ON DELETE CASCADE`, `ON DELETE RESTRICT`).

### O3: Algorithmic & Institutional Constraint Automation
Enforce university placement bylaws at the database engine tier using declarative constraints (`CHECK`, `UNIQUE`, `NOT NULL`) and procedural PostgreSQL triggers (`BEFORE/AFTER INSERT/UPDATE/DELETE`), preventing invalid states regardless of application-layer bypasses.

### O4: Concurrency-Safe Offer Cascading & Race Condition Prevention
Implement atomic stored procedures (`sp_accept_offer`, `sp_issue_offer`) utilizing pessimistic locking (`SELECT ... FOR UPDATE`) to guarantee that the instant a student accepts an offer, all competing applications are atomically withdrawn without race conditions or over-filling quotas.

### O5: High-Dimensional Semantic Talent Matching
Integrate pgvector with dense 384-dimensional vector embeddings (`all-MiniLM-L6-v2` dimensionality) and Hierarchical Navigable Small World (HNSW) indexing using Cosine Distance (`<=>`), delivering sub-15ms semantic matching between candidate profiles and job descriptions with hybrid domain re-ranking.

### O6: Real-Time Interview Conflict & Clash Detection
Implement database-tier temporal overlap detection (`fn_interview_clash` / `trg_interview_clash`) that mathematically blocks scheduling conflicting interviews for either the candidate or the recruiter across overlapping time windows.

### O7: Document Aggregation & Rich Analytical Telemetry
Harness MongoDB 7.0 aggregation pipelines (5 custom analytical pipelines) and PostgreSQL views / materialized views (`mv_skill_demand`, `v_posting_funnel`, `v_company_stats`) to compute real-time placement statistics, recruiter rubrics, and curriculum skill-gap heatmaps.

### O8: Production-Grade Role-Based Interface
Deliver an institutional Next.js web portal featuring dedicated portals for **Students**, **Recruiters**, and **Placement Cell Officers**, backed by JWT authentication, HTTP-only cookie sessions, and an evaluator 1-click role switcher.
