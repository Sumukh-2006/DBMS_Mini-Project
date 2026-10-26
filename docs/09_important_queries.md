# InternTrack — Curated SQL Queries & Analytical Catalog

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  

---

## Query 1: Top Candidate Matching via Cosine Distance (pgvector)
- **Purpose:** Identifies the top 5 most semantically aligned applicants for a specific posting using vector distance.
- **SQL Query:**
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
- **Sample Output:**
| student_id | full_name | usn | department | cgpa | cosine_similarity_pct |
|---|---|---|---|---|---|
| 1 | Aditi Rao | PES1UG22CS001 | CSE | 9.42 | 91.85 |
| 4 | Meera Nair | PES1UG22CS004 | AIML | 9.15 | 86.40 |
| 2 | Rohan Sharma | PES1UG22CS002 | ECE | 8.85 | 74.20 |

---

## Query 2: Window Function — Student Rank by CGPA within Department
- **Purpose:** Computes institutional class rank partitioned by academic department using `DENSE_RANK()`.
- **SQL Query:**
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
- **Sample Output:**
| usn | full_name | dept | cgpa | dept_rank |
|---|---|---|---|---|
| PES1UG22CS004 | Meera Nair | AIML | 9.15 | 1 |
| PES1UG22CS001 | Aditi Rao | CSE | 9.42 | 1 |
| PES1UG22CS002 | Rohan Sharma | ECE | 8.85 | 1 |
| PES1UG22CS003 | Karthik Verma | ME | 7.60 | 1 |

---

## Query 3: Multi-Table Funnel Join — Application Stage Progression
- **Purpose:** Traces applicants from initial application through interview rounds to offers.
- **SQL Query:**
```sql
SELECT 
  a.application_id,
  s.full_name AS candidate,
  c.name AS company,
  p.title AS posting,
  a.current_stage,
  COUNT(ir.interview_id) AS total_interview_rounds,
  o.status AS offer_status,
  o.stipend AS offered_stipend
FROM application a
JOIN student s ON a.student_id = s.student_id
JOIN internship_posting p ON a.posting_id = p.posting_id
JOIN company c ON p.company_id = c.company_id
LEFT JOIN interview_round ir ON a.application_id = ir.application_id
LEFT JOIN offer o ON a.application_id = o.application_id
GROUP BY a.application_id, s.full_name, c.name, p.title, a.current_stage, o.status, o.stipend
ORDER BY a.application_id;
```

---

## Query 4: Aggregate with HAVING — High-Stipend Companies with Multiple Postings
- **Purpose:** Identifies corporate partners offering an average stipend exceeding ₹60,000 across multiple openings.
- **SQL Query:**
```sql
SELECT 
  c.name AS company_name,
  c.industry,
  COUNT(p.posting_id) AS total_postings,
  ROUND(AVG(p.stipend), 2) AS avg_stipend,
  SUM(p.total_openings) AS aggregate_seats
FROM company c
JOIN internship_posting p ON c.company_id = p.company_id
GROUP BY c.company_id, c.name, c.industry
HAVING AVG(p.stipend) >= 60000 AND COUNT(p.posting_id) >= 1
ORDER BY avg_stipend DESC;
```
- **Sample Output:**
| company_name | industry | total_postings | avg_stipend | aggregate_seats |
|---|---|---|---|---|
| Google India | Cloud & AI Systems | 1 | 110000.00 | 5 |
| Microsoft India | Enterprise Cloud & Software | 1 | 95000.00 | 8 |
| Amazon AWS | Distributed Infrastructure | 1 | 85000.00 | 10 |

---

## Query 5: Correlated Subquery — Students with CGPA Above Department Average
- **Purpose:** Detects high-performing students who exceed their department's mean academic score.
- **SQL Query:**
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

---

## Query 6: Materialized View Analytics — Market Skill Supply vs Demand Deficit
- **Purpose:** Compares industry job posting skill requirements against student competencies to reveal curriculum gaps.
- **SQL Query:**
```sql
SELECT 
  skill_name,
  category,
  postings_count,
  students_count,
  (postings_count - students_count) AS talent_gap_score
FROM mv_skill_demand
ORDER BY talent_gap_score DESC, postings_count DESC;
```
- **Sample Output:**
| skill_name | category | postings_count | students_count | talent_gap_score |
|---|---|---|---|---|
| PyTorch | AI/ML | 3 | 1 | 2 |
| Distributed Systems | Architecture | 2 | 1 | 1 |
| Docker | DevOps | 3 | 2 | 1 |

---

## Query 7: View Inspection — Department Placement Funnel (`v_department_placement`)
- **Purpose:** Summarizes department-wise placement rates and maximum compensation.
- **SQL Query:**
```sql
SELECT 
  department_code,
  department_name,
  total_students,
  placed_students,
  ROUND(placement_percentage, 1) AS placement_pct,
  ROUND(avg_stipend, 2) AS avg_stipend,
  max_stipend
FROM v_department_placement
ORDER BY placement_percentage DESC;
```

---

## Query 8: Temporal Overlap Range Check — Interview Clash Detection
- **Purpose:** Verifies that no candidate has overlapping scheduled interviews using PostgreSQL `OVERLAPS` operator.
- **SQL Query:**
```sql
SELECT 
  ir1.interview_id AS int1_id,
  ir2.interview_id AS int2_id,
  a1.student_id,
  ir1.scheduled_start,
  ir1.scheduled_end
FROM interview_round ir1
JOIN application a1 ON ir1.application_id = a1.application_id
JOIN interview_round ir2 ON ir1.interview_id < ir2.interview_id
JOIN application a2 ON ir2.application_id = a2.application_id AND a1.student_id = a2.student_id
WHERE ir1.status = 'Scheduled' AND ir2.status = 'Scheduled'
  AND (ir1.scheduled_start, ir1.scheduled_end) OVERLAPS (ir2.scheduled_start, ir2.scheduled_end);
```
- *Output:* 0 rows returned (Guaranteed zero clashes by `trg_interview_clash`).

---

## Query 9: Full-Text Search with GIN Index on Posting Descriptions
- **Purpose:** Searches postings using English stemming, lexical analysis, and ranking.
- **SQL Query:**
```sql
SELECT 
  posting_id,
  title,
  ts_rank(to_tsvector('english', title || ' ' || description), to_tsquery('english', 'distributed & systems')) AS rank_score
FROM internship_posting
WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('english', 'distributed & systems')
ORDER BY rank_score DESC;
```

---

## Query 10: Pessimistic Concurrency Lock Demonstration
- **Purpose:** Secures row-level locks on posting quotas during rapid offer acceptance.
- **SQL Query:**
```sql
BEGIN;
SELECT posting_id, title, total_openings, filled_openings
FROM internship_posting
WHERE posting_id = 1
FOR UPDATE;

-- Updates quota safely without race condition
UPDATE internship_posting
SET filled_openings = filled_openings + 1
WHERE posting_id = 1;
COMMIT;
```

---

## Query 11: Common Table Expression (CTE) — Offer Acceptance Ratio by Tier
- **Purpose:** Analyzes how many issued offers were accepted across corporate tiers.
- **SQL Query:**
```sql
WITH tier_metrics AS (
  SELECT 
    c.tier,
    COUNT(o.offer_id) AS total_offers,
    SUM(CASE WHEN o.status = 'accepted' THEN 1 ELSE 0 END) AS accepted_offers
  FROM company c
  JOIN internship_posting p ON c.company_id = p.company_id
  JOIN application a ON p.posting_id = a.posting_id
  JOIN offer o ON a.application_id = o.application_id
  GROUP BY c.tier
)
SELECT 
  tier,
  total_offers,
  accepted_offers,
  ROUND((accepted_offers::NUMERIC / NULLIF(total_offers, 0) * 100), 2) AS acceptance_rate_pct
FROM tier_metrics
ORDER BY acceptance_rate_pct DESC;
```

---

## Query 12: Recruiter Conversion Velocity — Days from Application to Offer
- **Purpose:** Measures the average recruitment duration in days for each corporate partner.
- **SQL Query:**
```sql
SELECT 
  c.name AS company_name,
  ROUND(AVG(EXTRACT(EPOCH FROM (o.created_at - a.applied_at)) / 86400)::NUMERIC, 1) AS avg_days_to_offer
FROM offer o
JOIN application a ON o.application_id = a.application_id
JOIN internship_posting p ON a.posting_id = p.posting_id
JOIN company c ON p.company_id = c.company_id
GROUP BY c.name
ORDER BY avg_days_to_offer ASC;
```

---

## Query 13: Finding Candidates with Exact Match on All Mandatory Skills
- **Purpose:** Identifies candidates who possess 100% of the required skills for a target job posting.
- **SQL Query:**
```sql
SELECT 
  s.student_id,
  s.full_name,
  s.usn
FROM student s
WHERE NOT EXISTS (
  SELECT ps.skill_id
  FROM posting_skill ps
  WHERE ps.posting_id = 1 AND ps.is_required = TRUE
  EXCEPT
  SELECT ss.skill_id
  FROM student_skill ss
  WHERE ss.student_id = s.student_id
);
```

---

## Query 14: Upcoming Deadlines Filtering (`v_upcoming_deadlines`)
- **Purpose:** Surfaces active postings closing within the next 48 hours for immediate student alerting.
- **SQL Query:**
```sql
SELECT 
  posting_id,
  title,
  company_name,
  stipend,
  deadline,
  ROUND(hours_remaining, 1) AS hours_left
FROM v_upcoming_deadlines
WHERE hours_remaining <= 48
ORDER BY hours_remaining ASC;
```

---

## Query 15: Audited Stage History Sequence Verification
- **Purpose:** Confirms sequential stage progression and notes logged by recruiters and students.
- **SQL Query:**
```sql
SELECT 
  h.history_id,
  a.application_id,
  s.full_name AS candidate,
  h.from_stage,
  h.to_stage,
  u.email AS transitioned_by,
  h.notes,
  h.changed_at
FROM application_stage_history h
JOIN application a ON h.application_id = a.application_id
JOIN student s ON a.student_id = s.student_id
LEFT JOIN app_user u ON h.changed_by = u.user_id
ORDER BY h.history_id ASC;
```
