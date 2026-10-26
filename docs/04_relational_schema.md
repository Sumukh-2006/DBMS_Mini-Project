# InternTrack — Relational Schema & Normalization Analysis

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  

---

## 1. Classification of Entities: Strong vs. Weak vs. Associative

In relational database design (and standard PES University DBMS academic evaluations), relations are categorized based on their existential independence, identification mechanism, and cardinalities:

| Entity Type | Relation / Table | Primary Key | Identifying Owner Entity | Discriminator / Partial Key | Cascade Semantics | Description & Relational Justification |
|---|---|---|---|---|---|---|
| **STRONG ENTITY** | `app_user` | `user_id` | *None (Independent)* | — | — | Autonomous authentication root with its own surrogate key `user_id` and candidate key `email`. |
| **STRONG ENTITY** | `department` | `dept_id` | *None (Independent)* | — | — | Autonomous academic department master table. Candidate key: `code`. |
| **STRONG ENTITY** | `company` | `company_id` | *None (Independent)* | — | — | Corporate partner directory with independent primary key `company_id` and unique `name`. |
| **STRONG ENTITY** | `skill` | `skill_id` | *None (Independent)* | — | — | Canonical skill taxonomy with independent primary key `skill_id` and unique `name`. |
| **STRONG ENTITY** | `policy_config` | `policy_id` | *None (Independent)* | — | — | University placement governance configuration with candidate key `policy_key`. |
| **STRONG ENTITY** | `audit_log` | `log_id` | *None (Independent)* | — | — | System-wide immutable event ledger. Exists autonomously to log actions across all roles. |
| **STRONG ENTITY (Subtype)** | `student` | `student_id` | `app_user` (Specialization) | — | `ON DELETE CASCADE` | 1:1 Specialization of `app_user`. Possesses independent domain candidate key `usn`. |
| **STRONG ENTITY (Subtype)** | `recruiter` | `recruiter_id` | `app_user` (Specialization) | — | `ON DELETE CASCADE` | 1:1 Specialization of `app_user` representing corporate hiring staff. |
| **STRONG ENTITY** | `internship_posting` | `posting_id` | `company` (Owner) | — | `ON DELETE CASCADE` | Job opening record with independent primary key `posting_id`. |
| **WEAK ENTITY** | `application_stage_history` | `history_id` | `application` | `changed_at` / `to_stage` | `ON DELETE CASCADE` | **Weak Entity:** Existence-dependent on `application`. If an application is purged, its entire lifecycle history cascades. Has no meaning without a parent application. Guarded by `trg_stage_history_immutable`. |
| **WEAK ENTITY** | `interview` | `interview_id` | `application` | `round_no` | `ON DELETE CASCADE` | **Weak Entity:** Represents evaluation rounds subordinate to an active `application`. Identified per application by partial discriminator `round_no` with constraint `UNIQUE(application_id, round_no)`. |
| **WEAK ENTITY / DEPENDENT** | `offer` | `offer_id` | `application` | — | `ON DELETE CASCADE` | **Dependent Entity:** 1:1 Dependent relation with identifying owner `application` (`UNIQUE(application_id)`). Represents the terminal compensation contract of an application. |
| **ASSOCIATIVE ENTITY** | `student_skill` | `(student_id, skill_id)` | `student`, `skill` | Composite PK | `CASCADE / RESTRICT` | Bridge relation resolving the M:N relationship between `student` and `skill`. Non-key attribute: `proficiency_level`. |
| **ASSOCIATIVE ENTITY** | `posting_skill` | `(posting_id, skill_id)` | `internship_posting`, `skill` | Composite PK | `CASCADE / CASCADE` | Bridge relation resolving the M:N relationship between `internship_posting` and required `skill`s. Non-key attribute: `min_level`. |
| **ASSOCIATIVE ENTITY** | `posting_eligible_dept` | `(posting_id, dept_id)` | `internship_posting`, `department` | Composite PK | `CASCADE / RESTRICT` | Bridge relation resolving the M:N eligibility whitelist between postings and academic departments. |
| **ASSOCIATIVE ENTITY** | `interview_panelist` | `(interview_id, recruiter_id)` | `interview`, `recruiter` | Composite PK | `CASCADE / RESTRICT` | Bridge relation resolving the M:N relationship between interview rounds and conducting recruiters. |
| **ASSOCIATIVE ENTITY** | `application` | `application_id` | `student`, `internship_posting` | `(student_id, posting_id)` | `CASCADE / CASCADE` | Core associative entity resolving M:N relationship between `student` and `internship_posting`, extended with lifecycle state attributes (`current_stage`, `match_score`). |

---

## 2. Relational Schema Representation

Under standard relational database notation, primary keys are marked with **underline** or `(PK)`, and foreign keys are denoted with `(FK)`.

1. **`app_user`** [STRONG ENTITY]  
   (<u>`user_id`</u>, `email`, `password_hash`, `role`, `is_active`, `created_at`, `updated_at`)  
   *Candidate Keys:* `{user_id}`, `{email}`

2. **`department`** [STRONG ENTITY]  
   (<u>`dept_id`</u>, `name`, `code`, `created_at`)  
   *Candidate Keys:* `{dept_id}`, `{code}`

3. **`student`** [STRONG ENTITY — Subtype of `app_user`]  
   (<u>`student_id`</u>, `user_id`*, `usn`, `full_name`, `dept_id`*, `cgpa`, `year_of_study`, `grad_year`, `phone`, `bio`, `profile_embedding`, `created_at`, `updated_at`)  
   *Candidate Keys:* `{student_id}`, `{usn}`, `{user_id}`  
   *Foreign Keys:* `user_id ➔ app_user(user_id) ON DELETE CASCADE`, `dept_id ➔ department(dept_id) ON DELETE RESTRICT`  
   *Note on Placement Status:* Placement is normalized via `application.current_stage = 'Accepted'` and guarded by partial unique index `uq_student_single_accepted_application`.

4. **`skill`** [STRONG ENTITY]  
   (<u>`skill_id`</u>, `name`, `category`, `created_at`)  
   *Candidate Keys:* `{skill_id}`, `{name}`

5. **`student_skill`** [ASSOCIATIVE ENTITY]  
   (<u>`student_id`*</u>, <u>`skill_id`*</u>, `proficiency_level`, `created_at`)  
   *Primary Key:* `{student_id, skill_id}`  
   *Foreign Keys:* `student_id ➔ student(student_id) ON DELETE CASCADE`, `skill_id ➔ skill(skill_id) ON DELETE RESTRICT`

6. **`company`** [STRONG ENTITY]  
   (<u>`company_id`</u>, `name`, `website`, `industry`, `size_range`, `verified`, `verified_by`*, `created_at`)  
   *Candidate Keys:* `{company_id}`, `{name}`  
   *Foreign Keys:* `verified_by ➔ app_user(user_id) ON DELETE SET NULL`

7. **`recruiter`** [STRONG ENTITY — Subtype of `app_user`]  
   (<u>`recruiter_id`</u>, `user_id`*, `company_id`*, `full_name`, `designation`, `phone`, `created_at`)  
   *Candidate Keys:* `{recruiter_id}`, `{user_id}`  
   *Foreign Keys:* `user_id ➔ app_user(user_id) ON DELETE CASCADE`, `company_id ➔ company(company_id) ON DELETE RESTRICT`

8. **`internship_posting`** [STRONG ENTITY]  
   (<u>`posting_id`</u>, `company_id`*, `created_by`*, `title`, `description`, `location`, `stipend`, `openings`, `filled`, `min_cgpa`, `deadline`, `mode`, `status`, `embedding`, `search_tsv`, `created_at`, `updated_at`)  
   *Primary Key:* `{posting_id}`  
   *Foreign Keys:* `company_id ➔ company(company_id) ON DELETE RESTRICT`, `created_by ➔ recruiter(recruiter_id) ON DELETE RESTRICT`

9. **`posting_eligible_dept`** [ASSOCIATIVE ENTITY]  
   (<u>`posting_id`*</u>, <u>`dept_id`*</u>)  
   *Primary Key:* `{posting_id, dept_id}`  
   *Foreign Keys:* `posting_id ➔ internship_posting(posting_id) ON DELETE CASCADE`, `dept_id ➔ department(dept_id) ON DELETE RESTRICT`

10. **`posting_skill`** [ASSOCIATIVE ENTITY]  
    (<u>`posting_id`*</u>, <u>`skill_id`*</u>, `min_level`)  
    *Primary Key:* `{posting_id, skill_id}`  
    *Foreign Keys:* `posting_id ➔ internship_posting(posting_id) ON DELETE CASCADE`, `skill_id ➔ skill(skill_id) ON DELETE CASCADE`

11. **`application`** [ASSOCIATIVE ENTITY with Lifecycle Attributes]  
    (<u>`application_id`</u>, `student_id`*, `posting_id`*, `applied_at`, `current_stage`, `match_score`, `withdrawn_at`, `created_at`, `updated_at`)  
    *Candidate Keys:* `{application_id}`, `{student_id, posting_id}`  
    *Foreign Keys:* `student_id ➔ student(student_id) ON DELETE CASCADE`, `posting_id ➔ internship_posting(posting_id) ON DELETE CASCADE`

12. **`application_stage_history`** [WEAK ENTITY — Identifying Owner: `application`]  
    (<u>`history_id`</u>, `application_id`*, `from_stage`, `to_stage`, `changed_by`*, `reason`, `changed_at`)  
    *Primary Key:* `{history_id}`  
    *Foreign Keys:* `application_id ➔ application(application_id) ON DELETE CASCADE`, `changed_by ➔ app_user(user_id) ON DELETE RESTRICT`

13. **`interview`** [WEAK ENTITY — Identifying Owner: `application`]  
    (<u>`interview_id`</u>, `application_id`*, `round_no`, `scheduled_at`, `duration_min`, `mode`, `link_or_room`, `status`, `created_at`)  
    *Primary Key:* `{interview_id}`  
    *Candidate Keys:* `{interview_id}`, `{application_id, round_no}` (Discriminator: `round_no`)  
    *Foreign Keys:* `application_id ➔ application(application_id) ON DELETE CASCADE`

14. **`interview_panelist`** [ASSOCIATIVE ENTITY]  
    (<u>`interview_id`*</u>, <u>`recruiter_id`*</u>)  
    *Primary Key:* `{interview_id, recruiter_id}`  
    *Foreign Keys:* `interview_id ➔ interview(interview_id) ON DELETE CASCADE`, `recruiter_id ➔ recruiter(recruiter_id) ON DELETE RESTRICT`

15. **`offer`** [WEAK / DEPENDENT ENTITY — Identifying Owner: `application`]  
    (<u>`offer_id`</u>, `application_id`*, `stipend`, `start_date`, `expires_at`, `status`, `created_at`, `responded_at`)  
    *Candidate Keys:* `{offer_id}`, `{application_id}`  
    *Foreign Keys:* `application_id ➔ application(application_id) ON DELETE CASCADE`

16. **`policy_config`** [STRONG ENTITY]  
    (<u>`policy_id`</u>, `policy_key`, `policy_value`, `description`, `updated_by`*, `updated_at`)  
    *Candidate Keys:* `{policy_id}`, `{policy_key}`  
    *Foreign Keys:* `updated_by ➔ app_user(user_id) ON DELETE RESTRICT`

17. **`audit_log`** [STRONG ENTITY]  
    (<u>`log_id`</u>, `user_id`*, `action`, `entity_name`, `entity_id`, `details`, `ip_address`, `created_at`)  
    *Primary Key:* `{log_id}`  
    *Foreign Keys:* `user_id ➔ app_user(user_id) ON DELETE RESTRICT`

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
