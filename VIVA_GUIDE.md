# InternTrack — Technical Viva & Review Examination Guide

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  
**Subject:** High-Frequency Viva Questions, Comprehensive Answers, and Theoretical Justifications  

---

## Question 1: What is the difference between 3NF and BCNF, and how did you verify that InternTrack tables satisfy BCNF?

**Answer:**
- A table is in **3NF** if for every non-trivial functional dependency $X \rightarrow Y$:
  1. $X$ is a superkey, **OR**
  2. $Y$ is a prime attribute (part of any candidate key).
- A table is in **Boyce-Codd Normal Form (BCNF)** if for every non-trivial functional dependency $X \rightarrow Y$, $X$ **must strictly be a superkey**. BCNF eliminates all dependencies of candidate keys on non-prime or overlapping key attributes.
- In InternTrack, we conducted formal FD analysis for all 17 tables (detailed in `docs/04_relational_schema.md`):
  - In `student`, candidate keys are `student_id`, `usn`, and `user_id`. Every single non-trivial FD has one of these candidate keys as its determinant.
  - In `application`, the candidate keys are `application_id` and `{student_id, posting_id}`. Both determinants are candidate keys.
  - In `offer`, the candidate keys are `offer_id` and `application_id`. Both determinants are candidate keys.
  - Because all determinants across all tables are superkeys, the entire schema strictly satisfies BCNF, preventing insertion, deletion, and update anomalies.

---

## Question 2: Why did you adopt a Polyglot Persistence architecture instead of putting everything into PostgreSQL?

**Answer:**
- While PostgreSQL 16 is outstanding for structured ACID transactions and relational joins, real-world placement platforms exhibit data that is fundamentally semi-structured and polymorphic:
  1. **Polymorphic Student Resumes:** Resumes feature arbitrary structures—CSE students have GitHub repositories, Docker configs, and papers; Biotech students have lab techniques. Storing this in relational columns leads to sparse tables with dozens of `NULL` fields or excessive join overhead across 5+ auxiliary tables. MongoDB document collections store these nested JSON objects natively.
  2. **Dynamic Multi-Criteria Interview Rubrics:** Different roles (Software Engineer vs Product Manager) evaluate candidates on completely different criteria (e.g., Coding vs User Empathy). MongoDB's schema flexibility allows storing variable key-value rubric criteria within `interview_feedback.rubric`.
  3. **High-Frequency Ephemeral Notifications:** Transactional notifications require high write throughput and automated expiration. MongoDB's native TTL index (`expireAfterSeconds: 2592000`) removes expired notifications automatically in background threads without costly relational locks or external cron jobs.
  4. **Integrated pgvector:** Vector embeddings are retained inside PostgreSQL because candidate embeddings must be queried in conjunction with relational constraints (CGPA cutoffs, department eligibility).

---

## Question 3: How does `sp_accept_offer` prevent race conditions and over-filling posting quotas?

**Answer:**
- When an offer is accepted, multiple applicants might be attempting to accept the last remaining opening for a popular company simultaneously.
- To prevent a race condition, `sp_accept_offer` initiates a transaction and issues:
  ```sql
  SELECT filled_openings, total_openings 
  FROM internship_posting 
  WHERE posting_id = v_posting_id 
  FOR UPDATE;
  ```
- **Pessimistic Locking Mechanism:** `SELECT ... FOR UPDATE` places an exclusive write lock on that specific row. Any competing transaction trying to inspect or accept that posting is forced to pause at the database engine level until the current transaction commits or rolls back.
- If `filled_openings >= total_openings`, the procedure immediately raises a `Contention Exception`, ensuring the quota is never breached.
- In the same atomic boundary, it updates `student.is_placed = TRUE` and auto-withdraws all other active applications.

---

## Question 4: Why use a Database Trigger instead of Application-Level code for interview clash detection?

**Answer:**
- Application-level validation is vulnerable to:
  1. Multiple application instances (e.g. horizontally scaled web servers) interleaving read and write operations.
  2. Bypassing validation via direct SQL scripts, admin tools, or data migrations.
- By implementing `trg_interview_clash` directly on `interview_round`:
  ```sql
  (NEW.scheduled_start, NEW.scheduled_end) OVERLAPS (ir.scheduled_start, ir.scheduled_end)
  ```
- The constraint is enforced atomically by PostgreSQL's transaction engine. If an overlapping interval exists for either the student or the recruiter, PostgreSQL aborts the transaction immediately regardless of which API or tool initiated the write.

---

## Question 5: What is the difference between a Standard View and a Materialized View in your implementation?

**Answer:**
- **Standard View (e.g. `v_student_pipeline`):**
  - A stored query that is executed dynamically every time it is referenced.
  - It stores **no physical data on disk**.
  - Always returns the latest, up-to-the-millisecond data. Ideal for real-time dashboards where row states change frequently.
- **Materialized View (e.g. `mv_skill_demand`):**
  - Physically persists the query results to disk as an internal table.
  - Reads are instantaneous ($O(1)$ disk reads) because PostgreSQL does not have to re-compute expensive multi-table joins and `GROUP BY` aggregations across thousands of records.
  - Needs periodic refreshing when underlying tables change:
    ```sql
    CREATE OR REPLACE PROCEDURE sp_refresh_skill_demand_mv()
    AS $$
    BEGIN
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_skill_demand;
    END;
    $$ LANGUAGE plpgsql;
    ```
  - Ideal for analytical telemetry (like curriculum skill supply vs demand) that does not require millisecond-level real-time freshness.

---

## Question 6: How does pgvector's HNSW index work and why is it superior to IVFFlat or exact KNN?

**Answer:**
- **Exact KNN (`ORDER BY embedding <=> query_vector` without index):**
  - Computes exact cosine distance against every single vector in the table ($O(N)$ brute-force linear scan). Unacceptable for large datasets.
- **IVFFlat (Inverted File Flat):**
  - Partitions vector space into Voronoi cells using k-means clustering. Fast, but requires the index to be rebuilt whenever significant new data is inserted.
- **HNSW (Hierarchical Navigable Small World):**
  - Constructs a multi-layer graph where bottom layers contain all vectors and upper layers act as "expressways" for fast routing (similar to a Skip List).
  - Offers logarithmic search complexity ($O(\log N)$) with near-perfect recall (95–99%).
  - Does not require rebuilding as new rows are added.
  - In InternTrack, we set `m = 16` (connections per node) and `ef_construction = 64` (search depth during build), delivering sub-15ms vector queries.

---

## Question 7: Explain the role of `$unwind` and `$group` in your MongoDB resume skills aggregation pipeline.

**Answer:**
- In MongoDB, student resume documents store skills as an array:
  `{ "student_id": 1, "skills": ["PostgreSQL", "Docker", "Node.js"] }`
- **`$unwind: '$skills'`:**
  - Deconstructs the array field from the input document to output a distinct document for *each* element of the array.
  - A document with 3 skills becomes 3 individual documents, each having a single scalar `skills` value.
- **`$group: { _id: { $toLower: '$skills' }, student_count: { $sum: 1 } }`:**
  - Groups all unwound documents by the lowercase skill name and increments the counter.
- **`$sort: { student_count: -1 }`:**
  - Ranks skills from most common to least common, revealing the university's strongest technical competencies.

---

## Question 8: Explain Referential Integrity Actions: `ON DELETE CASCADE` vs `ON DELETE RESTRICT`.

**Answer:**
- **`ON DELETE CASCADE`:**
  - If the referenced parent record is deleted, all dependent child rows are automatically deleted.
  - *Example in InternTrack:* `student_skill` references `student(student_id) ON DELETE CASCADE`. If a student record is removed, all their associated skill mappings are purged automatically.
- **`ON DELETE RESTRICT`:**
  - Prevents the deletion of a parent record if any child record still references it, throwing a foreign key violation error.
  - *Example in InternTrack:* `recruiter` references `company(company_id) ON DELETE RESTRICT`. A company cannot be deleted if active recruiters are currently employed under it. Similarly, `student` references `department(dept_id) ON DELETE RESTRICT` so departments cannot be dropped while enrolled students exist.

---

## Question 9: How did you implement immutability on the `application_stage_history` and `audit_log` tables?

**Answer:**
- In compliance with university audit requirements, once a stage transition or audit log entry is written, it must be mathematically impossible for anyone—including administrative users—to edit or delete it.
- We created a `BEFORE UPDATE OR DELETE` trigger on both tables:
  ```sql
  CREATE OR REPLACE FUNCTION fn_prevent_history_tampering()
  RETURNS TRIGGER AS $$
  BEGIN
    RAISE EXCEPTION 'Audit Violation: Mutation or deletion of stage history and audit records is strictly prohibited by university policy.';
  END;
  $$ LANGUAGE plpgsql;
  ```
- Any `UPDATE` or `DELETE` statement targeting these tables immediately triggers this exception and aborts the transaction.

---

## Question 10: How does InternTrack combine keyword matching and vector similarity for hybrid scoring?

**Answer:**
- Pure keyword search fails on semantic synonyms, while pure vector search may overlook critical hard requirements.
- InternTrack implements a **hybrid ranking formula**:
  $$\text{Score} = \left(0.70 \times \text{Vector Similarity} + 0.30 \times \text{Domain Skill Overlap}\right) \times 100$$
- Before ranking, SQL declarative pre-filters guarantee that only eligible candidates are scored:
  `WHERE s.cgpa >= p.min_cgpa AND p.status = 'Active' AND p.deadline >= NOW() AND dept_id IN (eligible_departments)`.
- This ensures that high semantic similarity can never bypass core academic eligibility rules.
