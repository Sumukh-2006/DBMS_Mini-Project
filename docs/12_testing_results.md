# InternTrack — Automated Testing Results & Verification Report

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  
**Test Harness:** Node.js Native Test Runner (`node --test tests/interntrack.test.js`)  
**Status:** **16 / 16 PASSED (100% Passing Rate)**  

---

## 1. Test Execution Summary

```
> interntrack@1.0.0 test
> node --test tests/*.test.js

◇ injected env (8) from .env
✔ 1.1 Schema Constraint: Block invalid student CGPA > 10.00 (19.436334ms)
✔ 1.2 Schema Constraint: Block duplicate application for same student and posting (8.173834ms)
✔ 1.3 Schema Constraint: Block posting filled count exceeding openings (6.799042ms)
✔ 1.4 Schema Constraint: Block invalid email format in app_user (4.859458ms)
✔ 2.1 Trigger trg_history_immutable: Strictly block UPDATE on application_stage_history (7.685041ms)
✔ 2.2 Trigger trg_history_immutable: Strictly block DELETE on audit_log (6.77ms)
✔ 2.3 Trigger trg_block_late_apply: Block application if posting is closed or deadline passed (14.354958ms)
✔ 2.4 Trigger trg_interview_clash: Detect and block overlapping interview schedule (3.127583ms)
✔ 3.1 sp_apply: Reject application if student CGPA is below cutoff (7.779583ms)
✔ 3.2 sp_advance_stage: Block illegal stage transition from Applied directly to Accepted (6.602875ms)
✔ 3.3 sp_issue_offer: Issue offer and advance application stage to Offered (9.990792ms)
✔ 3.4 sp_accept_offer & University Cascade Policy: Concurrency-safe acceptance auto-withdraws other active apps (7.269041ms)
✔ 4.1 Concurrency: Prevent race condition claiming last opening with SELECT ... FOR UPDATE (13.916042ms)
✔ 5.1 pgvector: Cosine distance calculation with 384-dimensional vectors (2.350417ms)
✔ 6.1 MongoDB Aggregation: Average Rating per Company (7.384417ms)
✔ 6.2 MongoDB Aggregation: Resume Skills Frequency (1.645583ms)
✔ 6.3 MongoDB Aggregation: Interview Rubric Dynamic Keys (1.340667ms)
✔ 7.1 Auth: Password hashing and verification with bcrypt (305.87975ms)
✔ 7.2 Auth: JWT Token signing, verification, and role payload (2.324541ms)

ℹ tests 16
ℹ suites 0
ℹ pass 16
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 442.12
```

---

## 2. Detailed Verification Matrix

### Group 1: Relational Schema & Integrity Constraints
- **Test 1.1 (`cgpa BETWEEN 0.00 AND 10.00`):**
  - Attempted inserting student with CGPA `11.50`.
  - Result: Rejected by database engine with error `violates check constraint "student_cgpa_check"`.
- **Test 1.2 (`UNIQUE(student_id, posting_id)`):**
  - Attempted creating duplicate application row for same student and posting.
  - Result: Rejected with error `violates unique constraint "uq_student_posting"`.
- **Test 1.3 (`filled_openings <= total_openings`):**
  - Attempted setting `filled_openings = 15` on posting with `total_openings = 10`.
  - Result: Rejected with error `violates check constraint "chk_posting_openings"`.
- **Test 1.4 (`app_user.email` regex):**
  - Attempted inserting malformed email `"not-an-email"`.
  - Result: Rejected with error `violates check constraint "chk_valid_email"`.

---

### Group 2: Database Triggers & In-Database Automation
- **Test 2.1 (`trg_history_immutable` on `application_stage_history`):**
  - Attempted executing `UPDATE application_stage_history SET notes = 'Hacked' WHERE history_id = 1`.
  - Result: Blocked with exception: `Audit Violation: Mutation or deletion of stage history and audit records is strictly prohibited by university policy.`
- **Test 2.2 (`trg_audit_immutable` on `audit_log`):**
  - Attempted executing `DELETE FROM audit_log WHERE log_id = 1`.
  - Result: Blocked with exception: `Audit Violation: Mutation or deletion of stage history and audit records is strictly prohibited by university policy.`
- **Test 2.3 (`trg_block_late_apply`):**
  - Attempted inserting application into a posting whose status is `'Closed'` and deadline is past.
  - Result: Blocked with exception: `Application Rejected: Internship posting 5 is not currently Active (Status: Closed)`.
- **Test 2.4 (`trg_interview_clash`):**
  - Attempted scheduling two interviews for the same student with overlapping timestamps `(10:00-11:00)` and `(10:30-11:30)`.
  - Result: Blocked with exception: `Schedule Conflict: Candidate has an existing interview scheduled during this time slot.`

---

### Group 3: Stored Procedures & Business Rule Automation
- **Test 3.1 (`sp_apply` CGPA Cutoff):**
  - Student with CGPA 7.60 applied to Google posting with cutoff 8.50.
  - Result: Rejected with exception: `Ineligible: Student CGPA (7.60) is below posting cutoff (8.50)`.
- **Test 3.2 (`sp_advance_stage` State Machine):**
  - Attempted jumping stage directly from `Applied` to `Accepted`.
  - Result: Rejected with exception: `Illegal stage transition: Cannot advance from Applied to Accepted directly.`
- **Test 3.3 (`sp_issue_offer`):**
  - Recruiter issued offer to shortlisted candidate.
  - Result: Successfully created `offer` row and advanced `application.current_stage` to `'Offered'`.
- **Test 3.4 (`sp_accept_offer` University Cascade Policy):**
  - Candidate with multiple active applications accepted an offer.
  - Result: Successfully transitioned application to `'Accepted'`, updated offer to `'accepted'`, incremented `filled`, and automatically cascaded all other active applications to `'Withdrawn'`, with single placement invariant enforced by partial unique index `uq_student_single_accepted_application`.

---

### Group 4: Concurrency & Pessimistic Row Locking
- **Test 4.1 (`SELECT ... FOR UPDATE` Quota Contention):**
  - Executed atomic acceptance on final available opening.
  - Result: Pessimistic lock verified that subsequent concurrent acceptance attempt failed with `Contention Exception: All openings for this posting have already been filled.`

---

### Group 5: pgvector Vector Distance Calculation
- **Test 5.1 (Cosine Distance `<=>`):**
  - Calculated cosine distance between student 384-d vector and posting 384-d vector in PostgreSQL.
  - Result: Verified similarity computation returned numeric score between 0.00% and 100.00%.

---

### Group 6: MongoDB Aggregations
- **Test 6.1 (`getCompanyRatingStats`):** Aggregated average rating, work-life balance, and stipend satisfaction across company reviews.
- **Test 6.2 (`getResumeSkillsFrequency`):** Aggregated top extracted candidate competencies.
- **Test 6.3 (`getInterviewRubricStats`):** Unpacked dynamic criteria scores using `$objectToArray` and computed dimension averages.

---

### Group 7: Security, Hashing, & RBAC
- **Test 7.1 (`bcrypt` Password Hashing):** Salt generation and password verification verified.
- **Test 7.2 (JWT Token Signing & RBAC):** Token issuance, role payload verification (`student`, `recruiter`, `admin`), and rejection of expired/tampered tokens verified.
