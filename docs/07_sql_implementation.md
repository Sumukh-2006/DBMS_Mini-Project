# InternTrack — SQL Implementation, Triggers, & Stored Procedures

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  

---

## 1. Overview of Database Schema Scripts

The relational implementation is organized into structured migrations under `db/migrations/`:
1. `001_init.sql`: Core schema creation with 17 normalized tables, ENUM-like check constraints, and foreign key referential actions.
2. `002_indexes.sql`: B-tree, Partial B-tree, GIN Full-Text Search, GIN Trigram, and pgvector HNSW indexes.
3. `003_views.sql`: 5 real-time analytical views and 1 materialized view for high-throughput aggregation.
4. `004_functions_triggers.sql`: State machine validation, interview clash detection, match scoring, and transactional stored procedures.
5. `005_alter_demo.sql`: Academic demonstration of `ALTER TABLE` (columns, constraints, defaults) and `DROP` statements.
6. `006_seed.sql`: Realistic dataset dump for demonstration.

---

## 2. Advanced Procedural Logic (Triggers)

### 2.1 Immutable Audit Log & Stage History (`trg_history_immutable`)
- **Objective:** Strictly guarantee that no user or administrative action can alter or delete historical stage progression rows or audit log records.
- **Trigger Code:**
```sql
CREATE OR REPLACE FUNCTION fn_prevent_history_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit Violation: Mutation or deletion of stage history and audit records is strictly prohibited by university policy.';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_history_immutable
BEFORE UPDATE OR DELETE ON application_stage_history
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_history_tampering();

CREATE OR REPLACE TRIGGER trg_audit_immutable
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_history_tampering();
```

---

### 2.2 Late Application Blocking (`trg_block_late_apply`)
- **Objective:** Block any attempt to insert an application into an inactive posting or after its deadline has elapsed.
- **Trigger Code:**
```sql
CREATE OR REPLACE FUNCTION fn_block_late_apply()
RETURNS TRIGGER AS $$
DECLARE
  v_status VARCHAR(20);
  v_deadline TIMESTAMPTZ;
BEGIN
  SELECT status, deadline INTO v_status, v_deadline
  FROM internship_posting
  WHERE posting_id = NEW.posting_id;

  IF v_status != 'Active' THEN
    RAISE EXCEPTION 'Application Rejected: Internship posting % is not currently Active (Status: %)', NEW.posting_id, v_status;
  END IF;

  IF v_deadline < CURRENT_TIMESTAMP THEN
    RAISE EXCEPTION 'Application Rejected: Deadline for posting % expired at %', NEW.posting_id, v_deadline;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_block_late_apply
BEFORE INSERT ON application
FOR EACH ROW
EXECUTE FUNCTION fn_block_late_apply();
```

---

### 2.3 Real-Time Interview Conflict Detection (`trg_interview_clash`)
- **Objective:** Prevent overlapping interview rounds for both candidate and interviewer across overlapping temporal windows `[scheduled_start, scheduled_end]`.
- **Trigger Code:**
```sql
CREATE OR REPLACE FUNCTION fn_interview_clash()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id INT;
  v_clash_id INT;
BEGIN
  -- Obtain candidate ID
  SELECT student_id INTO v_student_id
  FROM application
  WHERE application_id = NEW.application_id;

  -- 1. Check for Student Double-Booking
  SELECT ir.interview_id INTO v_clash_id
  FROM interview_round ir
  JOIN application a ON ir.application_id = a.application_id
  WHERE a.student_id = v_student_id
    AND ir.interview_id != COALESCE(NEW.interview_id, -1)
    AND ir.status = 'Scheduled'
    AND (NEW.scheduled_start, NEW.scheduled_end) OVERLAPS (ir.scheduled_start, ir.scheduled_end)
  LIMIT 1;

  IF v_clash_id IS NOT NULL THEN
    RAISE EXCEPTION 'Schedule Conflict: Candidate has an existing interview (ID: %) scheduled during this time slot.', v_clash_id;
  END IF;

  -- 2. Check for Recruiter Double-Booking
  SELECT ir.interview_id INTO v_clash_id
  FROM interview_round ir
  WHERE ir.recruiter_id = NEW.recruiter_id
    AND ir.interview_id != COALESCE(NEW.interview_id, -1)
    AND ir.status = 'Scheduled'
    AND (NEW.scheduled_start, NEW.scheduled_end) OVERLAPS (ir.scheduled_start, ir.scheduled_end)
  LIMIT 1;

  IF v_clash_id IS NOT NULL THEN
    RAISE EXCEPTION 'Schedule Conflict: Recruiter has an existing interview (ID: %) scheduled during this time slot.', v_clash_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_interview_clash
BEFORE INSERT OR UPDATE ON interview_round
FOR EACH ROW
EXECUTE FUNCTION fn_interview_clash();
```

---

## 3. High-Concurrency Stored Procedures

### 3.1 Eligibility-Checked Application (`sp_apply`)
Validates student CGPA, department whitelisting, active backlog policy, and computes hybrid match score upon submission.
```sql
CREATE OR REPLACE PROCEDURE sp_apply(
  IN p_student_id INT,
  IN p_posting_id INT,
  OUT p_application_id INT,
  OUT p_status_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_cgpa NUMERIC(4,2);
  v_min_cgpa NUMERIC(4,2);
  v_dept_id INT;
  v_has_accepted_offer BOOLEAN;
  v_match_score NUMERIC(5,2);
BEGIN
  -- Verify student status and existing placements
  SELECT cgpa, dept_id INTO v_cgpa, v_dept_id
  FROM student WHERE student_id = p_student_id;

  SELECT EXISTS (
    SELECT 1 FROM offer o
    JOIN application a ON o.application_id = a.application_id
    WHERE a.student_id = p_student_id AND o.status = 'accepted'
  ) INTO v_has_accepted_offer;

  IF v_has_accepted_offer THEN
    RAISE EXCEPTION 'Placement Policy: You already have an accepted internship offer and cannot submit new applications.';
  END IF;

  -- Check posting minimum CGPA
  SELECT min_cgpa INTO v_min_cgpa
  FROM internship_posting WHERE posting_id = p_posting_id;

  IF v_cgpa < v_min_cgpa THEN
    RAISE EXCEPTION 'Ineligible: Student CGPA (%) is below posting cutoff (%)', v_cgpa, v_min_cgpa;
  END IF;

  -- Check department whitelisting
  SELECT EXISTS (
    SELECT 1 FROM posting_eligible_dept 
    WHERE posting_id = p_posting_id AND dept_id = v_dept_id
  ) INTO v_is_eligible_dept;

  IF NOT v_is_eligible_dept THEN
    RAISE EXCEPTION 'Ineligible: Your department is not listed under eligible departments for this posting.';
  END IF;

  -- Calculate hybrid match score
  v_match_score := fn_match_score(p_student_id, p_posting_id);

  INSERT INTO application(student_id, posting_id, current_stage, match_score)
  VALUES (p_student_id, p_posting_id, 'Applied', v_match_score)
  RETURNING application_id INTO p_application_id;

  p_status_message := 'Application submitted successfully with match score: ' || v_match_score || '%';
END;
$$;
```

---

### 3.2 Atomic Offer Acceptance & University Cascading Withdrawal (`sp_accept_offer`)
This procedure demonstrates **transaction isolation and pessimistic locking**. When a student accepts an offer, the system locks the posting with `SELECT ... FOR UPDATE`, checks quota availability, marks the student as placed, and automatically withdraws all other active applications.

```sql
CREATE OR REPLACE PROCEDURE sp_accept_offer(
  IN p_offer_id INT,
  IN p_student_id INT,
  OUT p_success BOOLEAN,
  OUT p_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_app_id INT;
  v_posting_id INT;
  v_offer_status VARCHAR(20);
  v_expires_at DATE;
  v_filled INT;
  v_openings INT;
  v_withdrawn_count INT := 0;
BEGIN
  -- 1. Fetch and validate offer
  SELECT o.application_id, o.status, o.expires_at, a.posting_id
  INTO v_app_id, v_offer_status, v_expires_at, v_posting_id
  FROM offer o
  JOIN application a ON o.application_id = a.application_id
  WHERE o.offer_id = p_offer_id AND a.student_id = p_student_id;

  IF v_app_id IS NULL THEN
    RAISE EXCEPTION 'Offer not found or does not belong to this student.';
  END IF;

  IF v_offer_status != 'issued' THEN
    RAISE EXCEPTION 'Cannot accept offer with status %', v_offer_status;
  END IF;

  IF v_expires_at < CURRENT_DATE THEN
    RAISE EXCEPTION 'Offer expired on %', v_expires_at;
  END IF;

  -- 2. Concurrency Control: Lock posting row for update to prevent race conditions
  SELECT filled_openings, total_openings INTO v_filled, v_openings
  FROM internship_posting
  WHERE posting_id = v_posting_id
  FOR UPDATE;

  IF v_filled >= v_openings THEN
    RAISE EXCEPTION 'Contention Exception: All openings for this posting have already been filled.';
  END IF;

  -- 3. Update Offer and Application status
  UPDATE offer 
  SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
  WHERE offer_id = p_offer_id;

  UPDATE application
  SET current_stage = 'Accepted', updated_at = CURRENT_TIMESTAMP
  WHERE application_id = v_app_id;

  -- 4. Guaranteed single placement invariant enforced by uq_student_single_accepted_application

  -- 5. University Placement Cascade Policy: Auto-withdraw all other active applications
  WITH withdrawn_apps AS (
    UPDATE application
    SET current_stage = 'Withdrawn', updated_at = CURRENT_TIMESTAMP
    WHERE student_id = p_student_id 
      AND application_id != v_app_id
      AND current_stage IN ('Applied', 'Shortlisted', 'Interview', 'Offered')
    RETURNING application_id
  )
  SELECT COUNT(*) INTO v_withdrawn_count FROM withdrawn_apps;

  -- 6. Increment filled openings
  UPDATE internship_posting
  SET filled_openings = filled_openings + 1
  WHERE posting_id = v_posting_id;

  p_success := TRUE;
  p_message := FORMAT('Offer accepted successfully! University policy cascade auto-withdrew %s other active application(s).', v_withdrawn_count);
END;
$$;
```

---

## 4. Analytical & Materialized Views

| View Name | Type | Underlying Tables | Purpose |
|---|---|---|---|
| `v_student_pipeline` | Standard View | `application`, `student`, `internship_posting`, `company`, `department` | Real-time candidate tracking across all stages. |
| `v_posting_funnel` | Standard View | `internship_posting`, `company`, `application` | Recruiter conversion funnel from Applied to Accepted. |
| `v_company_stats` | Standard View | `company`, `internship_posting`, `application`, `offer` | Placement cell partner metrics and acceptance rates. |
| `v_upcoming_deadlines` | Standard View | `internship_posting`, `company` | Time-sensitive posting countdown filter. |
| `v_department_placement` | Standard View | `department`, `student`, `application`, `offer` | Institutional placement statistics by department. |
| `mv_skill_demand` | Materialized View | `skill`, `posting_skill`, `student_skill` | High-performance snapshot of market demand vs student supply. Refreshed via `sp_refresh_skill_demand_mv()`. |
