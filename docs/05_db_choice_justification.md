# InternTrack — Polyglot Persistence & Database Choice Justification

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  

---

## 1. Architectural Motivation for Polyglot Persistence

An enterprise-grade campus placement platform exhibits fundamentally divergent data access patterns and storage requirements that cannot be optimally satisfied by a single database paradigm:

```
+---------------------------------------------------------------------------------------+
|                                    INTERNTRACK                                        |
|                          POLYGLOT PERSISTENCE ARCHITECTURE                            |
+---------------------------------------------------------------------------------------+
|                                           |                                           |
|       POSTGRESQL 16 + PGVECTOR            |                    MONGODB 7.0            |
|   (ACID Core & Semantic Retrieval)        |           (Document & Analytics Store)    |
|                                           |                                           |
| - Users, Auth, & RBAC                     | - Polymorphic Resumes (projects, educ)    |
| - Normalized 3NF/BCNF Schema              | - Multi-Criteria Interview Rubrics        |
| - Declarative & Procedural Constraints    | - Experiential Company Reviews            |
| - Atomic State Machine & Cascades         | - Ephemeral Notifications (TTL Index)     |
| - High-Dimensional Vector Search (HNSW)   | - Audit Log Payloads & Aggregations       |
| - Analytical Views & Materialized Views   | - Dynamic Schema Evolution                |
+-------------------------------------------+-------------------------------------------+
```

---

## 2. PostgreSQL 16 + pgvector Rationale

### 2.1 ACID Guarantees & Financial/Placement Accuracy
Placement operations are high-stakes, legally audited events:
- **Atomicity:** When an offer is accepted (`sp_accept_offer`), the student's status must update, the posting's filled count must increment, and all competing applications must cascade to `Withdrawn` in a single atomic transaction.
- **Consistency:** Database check constraints (`cgpa BETWEEN 0.00 AND 10.00`, `filled_openings <= total_openings`) and referential constraints (`ON DELETE RESTRICT`) ensure that corrupt states cannot be committed.
- **Isolation:** Under concurrent applicant surges (e.g. 500 students applying for 10 openings in the last 2 minutes), pessimistic row locks (`SELECT ... FOR UPDATE`) prevent race conditions.
- **Durability:** Write-Ahead Logging (WAL) guarantees that committed offers survive unexpected system outages.

### 2.2 Advanced Procedural Logic (PL/pgSQL Triggers)
PostgreSQL supports sophisticated in-database business rules:
- `trg_history_immutable`: Protects audit trails and stage histories against tampering (`BEFORE UPDATE OR DELETE`).
- `trg_block_late_apply`: Dynamically validates posting status and application deadlines prior to insertion.
- `trg_interview_clash`: Executes temporal intersection tests over timestamp ranges.

### 2.3 Integrated pgvector Semantic Engine
Rather than hosting a disparate external vector database (such as Pinecone, Milvus, or Qdrant) which introduces network latency, network failure modes, and eventual consistency desynchronization:
- High-dimensional dense embeddings (`vector(384)`) are stored directly alongside applicant relational rows.
- **Hierarchical Navigable Small World (HNSW)** indexing delivers logarithmic-time nearest-neighbor retrieval with cosine distance (`<=>`).
- Permits single-query hybrid search combining relational pre-filters (`WHERE dept_id IN (...) AND cgpa >= min_cgpa`) with semantic vector proximity.

---

## 3. MongoDB 7.0 Rationale

### 3.1 Polymorphic & Unstructured Resume Documents
Student resumes cannot be cleanly mapped to rigid relational columns:
- A student in CSE might document 6 GitHub repositories, 2 Hackathon awards, and Docker/Kubernetes container configurations.
- A student in Biotechnology might list molecular biology lab protocols, PCR techniques, and bio-informatics tools.
- MongoDB collections allow deeply nested, polymorphic JSON documents (`projects: [{title, stack, metrics}]`) without complex multiple-table JOIN operations or expensive relational alterations.

### 3.2 Dynamic Multi-Dimensional Interview Rubrics
Interviewers evaluate candidates on diverse, role-dependent dimensions:
- Software Engineer: `Data Structures (9/10)`, `System Design (8/10)`, `Concurrency (7/10)`.
- Product Manager: `Market Analysis (9/10)`, `User Empathy (10/10)`, `Prioritization (8/10)`.
- MongoDB stores these variable key-value metrics within a nested `rubric` sub-document, while MongoDB's aggregation pipelines compute average scores per criterion effortlessly.

### 3.3 Automated Ephemeral Data Cleanup (TTL Indexes)
Notification delivery generates massive write throughput:
- MongoDB native Time-To-Live (TTL) indexes automatically purge notifications older than 30 days (`{ "created_at": 1 }, { expireAfterSeconds: 2592000 }`), freeing storage space without requiring external cron jobs or heavy relational deletions.

---

## 4. Multi-Paradigm Comparison Matrix

| Architectural Dimension | PostgreSQL 16 + pgvector | MongoDB 7.0 | Disparate Vector DB (e.g. Pinecone) |
|---|---|---|---|
| **Primary Data Model** | Relational + Dense Vectors | Document (BSON / JSON) | Approximate Nearest Neighbor Vectors |
| **Transaction Semantics** | Full ACID (Serializable) | ACID at document/replica level | Eventual consistency |
| **Schema Flexibility** | Rigid, Strongly Typed | Schema-Free / Polymorphic | Rigid Metadata Map |
| **Integrity Enforcement** | Foreign Keys, Check, Triggers | Application Validation Rules | None (External Key Reference) |
| **Semantic Search** | HNSW / IVFFlat Cosine Index | Atlas Search (External Add-on) | Proprietary Graph ANN Index |
| **Operational Overhead** | Low (Single In-Process Engine) | Moderate (Standard Mongoose Pool) | High (Network Hops, Separate Cloud Billing) |
| **InternTrack Role** | Relational Backbone & Vector Search | Resumes, Feedback, Reviews, TTL | Rejected due to synchronization latency |

---

## 5. Synchronization Strategy

1. **Relational Anchoring:** All MongoDB documents store the integer `student_id`, `recruiter_id`, `application_id`, or `posting_id` as foreign references.
2. **Synchronous Profile Embedding Updates:** When a student updates their skills and profile, the Next.js API generates the 384-dimensional vector, persists the raw resume JSON into MongoDB, and updates `student.profile_embedding` in PostgreSQL within the same request lifecycle.
3. **Graceful Fallback:** If a non-critical MongoDB write fails (such as logging an ephemeral notification), the core relational transaction still safely commits, ensuring high system availability.
