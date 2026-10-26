# InternTrack — Relational Schema & Normalization Analysis

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  

---

## 1. Relational Schema Representation

Under standard relational database notation, primary keys are marked with **underline** or `(PK)`, and foreign keys are denoted with `(FK)`.

1. **`app_user`** (<u>`user_id`</u>, `email`, `password_hash`, `role`, `created_at`, `last_login`, `is_active`)  
   *Candidate Keys:* `{user_id}`, `{email}`

2. **`department`** (<u>`dept_id`</u>, `code`, `name`)  
   *Candidate Keys:* `{dept_id}`, `{code}`

3. **`student`** (<u>`student_id`</u>, `user_id`*, `usn`, `full_name`, `dept_id`*, `year`, `cgpa`, `grad_year`, `phone`, `bio`, `profile_embedding`)  
   *Candidate Keys:* `{student_id}`, `{usn}`, `{user_id}`  
   *Foreign Keys:* `user_id ➔ app_user(user_id)`, `dept_id ➔ department(dept_id)`  
   *Note on Placement Status:* Placement is normalized via `application.current_stage = 'Accepted'` and guarded by partial unique index `uq_student_single_accepted_application`.

4. **`skill`** (<u>`skill_id`</u>, `name`, `category`)  
   *Candidate Keys:* `{skill_id}`, `{name}`

5. **`student_skill`** (<u>`student_id`*</u>, <u>`skill_id`*</u>, `proficiency_level`)  
   *Primary Key:* `{student_id, skill_id}`  
   *Foreign Keys:* `student_id ➔ student(student_id)`, `skill_id ➔ skill(skill_id)`

6. **`company`** (<u>`company_id`</u>, `name`, `website`, `industry`, `tier`, `verified`, `created_at`)  
   *Candidate Keys:* `{company_id}`, `{name}`

7. **`recruiter`** (<u>`recruiter_id`</u>, `user_id`*, `company_id`*, `full_name`, `designation`, `phone`)  
   *Candidate Keys:* `{recruiter_id}`, `{user_id}`  
   *Foreign Keys:* `user_id ➔ app_user(user_id)`, `company_id ➔ company(company_id)`

8. **`internship_posting`** (<u>`posting_id`</u>, `company_id`*, `created_by`*, `title`, `description`, `location`, `stipend`, `min_cgpa`, `total_openings`, `filled_openings`, `status`, `deadline`, `embedding`, `created_at`)  
   *Primary Key:* `{posting_id}`  
   *Foreign Keys:* `company_id ➔ company(company_id)`, `created_by ➔ recruiter(recruiter_id)`

9. **`posting_eligible_dept`** (<u>`posting_id`*</u>, <u>`dept_id`*</u>)  
   *Primary Key:* `{posting_id, dept_id}`  
   *Foreign Keys:* `posting_id ➔ internship_posting(posting_id)`, `dept_id ➔ department(dept_id)`

10. **`posting_skill`** (<u>`posting_id`*</u>, <u>`skill_id`*</u>, `is_required`)  
    *Primary Key:* `{posting_id, skill_id}`  
    *Foreign Keys:* `posting_id ➔ internship_posting(posting_id)`, `skill_id ➔ skill(skill_id)`

11. **`application`** (<u>`application_id`</u>, `student_id`*, `posting_id`*, `current_stage`, `match_score`, `applied_at`, `updated_at`)  
    *Candidate Keys:* `{application_id}`, `{student_id, posting_id}`  
    *Foreign Keys:* `student_id ➔ student(student_id)`, `posting_id ➔ internship_posting(posting_id)`

12. **`application_stage_history`** (<u>`history_id`</u>, `application_id`*, `from_stage`, `to_stage`, `changed_by`*, `notes`, `changed_at`)  
    *Primary Key:* `{history_id}`  
    *Foreign Keys:* `application_id ➔ application(application_id)`, `changed_by ➔ app_user(user_id)`

13. **`interview_round`** (<u>`interview_id`</u>, `application_id`*, `recruiter_id`*, `round_number`, `round_type`, `scheduled_start`, `scheduled_end`, `status`, `meeting_link`, `created_at`)  
    *Primary Key:* `{interview_id}`  
    *Foreign Keys:* `application_id ➔ application(application_id)`, `recruiter_id ➔ recruiter(recruiter_id)`

14. **`offer`** (<u>`offer_id`</u>, `application_id`*, `stipend`, `start_date`, `expires_at`, `status`, `created_at`, `responded_at`)  
    *Candidate Keys:* `{offer_id}`, `{application_id}`  
    *Foreign Keys:* `application_id ➔ application(application_id)`

15. **`placement_policy`** (<u>`policy_id`</u>, `name`, `policy_key`, `policy_value`, `description`, `is_active`, `updated_at`)  
    *Candidate Keys:* `{policy_id}`, `{policy_key}`

16. **`audit_log`** (<u>`log_id`</u>, `user_id`*, `action`, `entity_name`, `entity_id`, `old_values`, `new_values`, `ip_address`, `timestamp`)  
    *Primary Key:* `{log_id}`  
    *Foreign Keys:* `user_id ➔ app_user(user_id)`

---

## 2. Normalization & Formal Functional Dependency (FD) Analysis

To guarantee that the relational schema is free of **Update Anomalies**, **Insertion Anomalies**, and **Deletion Anomalies**, each relation was decomposed and verified against **Boyce-Codd Normal Form (BCNF)** and **Third Normal Form (3NF)**.

### Definition of BCNF:
A relation $R$ is in **BCNF** if and only if for every non-trivial functional dependency $X \rightarrow Y$, $X$ is a **Superkey** of $R$.

---

### Table 1: `student`
- **Attributes:** `{student_id, user_id, usn, full_name, dept_id, year, cgpa, grad_year, phone, bio, profile_embedding}`
- **Candidate Keys:** $K_1 = \{\text{student\_id}\}$, $K_2 = \{\text{usn}\}$, $K_3 = \{\text{user\_id}\}$
- **Functional Dependencies:**
  1. $\text{student\_id} \rightarrow \{\text{user\_id, usn, full\_name, dept\_id, year, cgpa, grad\_year, phone, bio, profile\_embedding}\}$
  2. $\text{usn} \rightarrow \{\text{student\_id, user\_id, full\_name, dept\_id, year, cgpa, grad\_year, phone, bio, profile\_embedding}\}$
  3. $\text{user\_id} \rightarrow \{\text{student\_id, usn, full\_name, dept\_id, year, cgpa, grad\_year, phone, bio, profile\_embedding}\}$
- **BCNF Analysis:** In all three FDs, the determinant is a candidate key / superkey. Therefore, `student` satisfies **BCNF**.
- **Anomaly Elimination:** Separating `dept_id` into a distinct `department` table prevents the repetition of department names. Normalizing placement state via `application.current_stage = 'Accepted'` rather than a denormalized `is_placed` flag eliminates transitive update anomalies.

---

### Table 2: `application`
- **Attributes:** `{application_id, student_id, posting_id, current_stage, match_score, applied_at, updated_at}`
- **Candidate Keys:** $K_1 = \{\text{application\_id}\}$, $K_2 = \{\text{student\_id, posting\_id}\}$
- **Functional Dependencies:**
  1. $\text{application\_id} \rightarrow \{\text{student\_id, posting\_id, current\_stage, match_score, applied_at, updated_at}\}$
  2. $\{\text{student\_id, posting\_id}\} \rightarrow \{\text{application\_id, current\_stage, match_score, applied_at, updated_at}\}$
- **BCNF Analysis:** Both determinants are candidate keys. There are no partial dependencies (satisfies 2NF) and no transitive dependencies (satisfies 3NF). Every determinant is a superkey, satisfying **BCNF**.
- **Constraint Enforcement:** `UNIQUE(student_id, posting_id)` guarantees one application per student per posting at the relational engine level.

---

### Table 3: `offer`
- **Attributes:** `{offer_id, application_id, stipend, start_date, expires_at, status, created_at, responded_at}`
- **Candidate Keys:** $K_1 = \{\text{offer\_id}\}$, $K_2 = \{\text{application\_id}\}$
- **Functional Dependencies:**
  1. $\text{offer\_id} \rightarrow \{\text{application\_id, stipend, start\_date, expires\_at, status, created\_at, responded\_at}\}$
  2. $\text{application\_id} \rightarrow \{\text{offer\_id, stipend, start\_date, expires\_at, status, created\_at, responded\_at}\}$
- **BCNF Analysis:** Both determinants are candidate keys. Since an application can only receive at most one active offer, `{application_id}` has a unique constraint. Every determinant is a superkey, placing `offer` strictly in **BCNF**.

---

### Table 4: Associative Bridge Tables (`student_skill`, `posting_eligible_dept`, `posting_skill`)
- All bridge tables have composite primary keys:
  - `student_skill`: Primary key is $\{\text{student\_id, skill\_id}\}$. The only non-key attribute is `proficiency_level`, with FD $\{\text{student\_id, skill\_id}\} \rightarrow \text{proficiency\_level}$.
  - Determinant is the entire candidate key. No partial dependencies exist. All bridge relations are in **BCNF**.

---

## 3. Summary of Normalization Guarantees

| Table Name | Normal Form | Primary Determinants | Addressed Anomaly |
|---|---|---|---|
| `app_user` | BCNF | `user_id`, `email` | Eradicates user profile modification anomalies. |
| `department` | BCNF | `dept_id`, `code` | Prevents redundant department naming across students. |
| `student` | BCNF | `student_id`, `usn`, `user_id` | Prevents student demographic update inconsistencies. |
| `company` | BCNF | `company_id`, `name` | Separates company metadata from individual postings. |
| `internship_posting` | BCNF | `posting_id` | Prevents posting duplication and vacancy desynchronization. |
| `application` | BCNF | `application_id`, `(student_id, posting_id)` | Prevents duplicate applications and out-of-order stage changes. |
| `interview_round` | BCNF | `interview_id` | Prevents round duplication and scheduling conflicts. |
| `offer` | BCNF | `offer_id`, `application_id` | Eliminates multiple conflicting offers per application. |
| `audit_log` | BCNF | `log_id` | Append-only audit records with zero update anomalies. |
