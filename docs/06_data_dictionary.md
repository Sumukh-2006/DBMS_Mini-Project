# InternTrack — Comprehensive Data Dictionary

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  

---

## 1. PostgreSQL Relational Data Dictionary

### 1.1 `app_user`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `user_id` | SERIAL | NO | PK | Nextval | Unique identifier for system user. |
| `email` | VARCHAR(255) | NO | UK | None | User email. Must match regex `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`. |
| `password_hash` | VARCHAR(255) | NO | - | None | Bcrypt hashed salt + password. |
| `role` | VARCHAR(20) | NO | - | None | CHECK (`role IN ('student', 'recruiter', 'admin')`). |
| `is_active` | BOOLEAN | NO | - | TRUE | User account active state toggle. |
| `created_at` | TIMESTAMPTZ | NO | - | CURRENT_TIMESTAMP | Account creation timestamp. |
| `last_login` | TIMESTAMPTZ | YES | - | NULL | Timestamp of most recent authentication. |

### 1.2 `department`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `dept_id` | SERIAL | NO | PK | Nextval | Unique identifier for department. |
| `code` | VARCHAR(10) | NO | UK | None | University department code (e.g., 'CSE', 'ECE', 'AIML'). |
| `name` | VARCHAR(100) | NO | - | None | Full department name. |

### 1.3 `student`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `student_id` | SERIAL | NO | PK | Nextval | Unique student record identifier. |
| `user_id` | INT | NO | FK, UK | None | References `app_user(user_id) ON DELETE CASCADE`. |
| `usn` | VARCHAR(20) | NO | UK | None | University Seat Number (e.g., 'PES1UG22CS001'). |
| `full_name` | VARCHAR(100) | NO | - | None | Legal full name of student. |
| `dept_id` | INT | NO | FK | None | References `department(dept_id) ON DELETE RESTRICT`. |
| `cgpa` | NUMERIC(4,2) | NO | - | None | CHECK (`cgpa >= 0.00 AND cgpa <= 10.00`). Cumulative GPA. |
| `grad_year` | INT | NO | - | None | CHECK (`grad_year >= 2020`). Graduation batch. |
| `phone` | VARCHAR(20) | YES | - | NULL | Contact telephone number. |
| `profile_embedding` | vector(384) | YES | - | NULL | 384-dimensional dense semantic embedding vector. |
| `is_placed` | BOOLEAN | NO | - | FALSE | Flag indicating confirmed offer acceptance. |

### 1.4 `skill`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `skill_id` | SERIAL | NO | PK | Nextval | Unique skill identifier. |
| `name` | VARCHAR(100) | NO | UK | None | Skill title (e.g., 'PostgreSQL', 'PyTorch'). |
| `category` | VARCHAR(50) | NO | - | 'General' | Skill domain (e.g., 'Backend', 'AI/ML', 'Frontend'). |

### 1.5 `student_skill`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `student_id` | INT | NO | PK, FK | None | References `student(student_id) ON DELETE CASCADE`. |
| `skill_id` | INT | NO | PK, FK | None | References `skill(skill_id) ON DELETE CASCADE`. |
| `proficiency_level` | VARCHAR(20) | NO | - | 'Intermediate' | CHECK (`proficiency_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')`). |

### 1.6 `company`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `company_id` | SERIAL | NO | PK | Nextval | Unique company identifier. |
| `name` | VARCHAR(150) | NO | UK | None | Registered company name. |
| `website` | VARCHAR(255) | YES | - | NULL | Official corporate URL. |
| `industry` | VARCHAR(100) | NO | - | 'Technology' | Sector category (e.g., 'Cloud & SaaS', 'Fintech'). |
| `tier` | VARCHAR(20) | NO | - | 'Tier 1' | CHECK (`tier IN ('Tier 1', 'Tier 2', 'Dream', 'Open')`). |
| `verified` | BOOLEAN | NO | - | FALSE | Placement cell administrative vetting flag. |
| `created_at` | TIMESTAMPTZ | NO | - | CURRENT_TIMESTAMP | Company onboarding timestamp. |

### 1.7 `recruiter`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `recruiter_id` | SERIAL | NO | PK | Nextval | Unique recruiter identifier. |
| `user_id` | INT | NO | FK, UK | None | References `app_user(user_id) ON DELETE CASCADE`. |
| `company_id` | INT | NO | FK | None | References `company(company_id) ON DELETE RESTRICT`. |
| `full_name` | VARCHAR(100) | NO | - | None | Recruiter's full name. |
| `designation` | VARCHAR(100) | YES | - | NULL | Corporate job title. |
| `phone` | VARCHAR(20) | YES | - | NULL | Contact phone number. |

### 1.8 `internship_posting`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `posting_id` | SERIAL | NO | PK | Nextval | Unique posting identifier. |
| `company_id` | INT | NO | FK | None | References `company(company_id) ON DELETE CASCADE`. |
| `created_by` | INT | NO | FK | None | References `recruiter(recruiter_id) ON DELETE RESTRICT`. |
| `title` | VARCHAR(150) | NO | - | None | Internship position title. |
| `description` | TEXT | NO | - | None | Detailed role requirements and expectations. |
| `location` | VARCHAR(100) | NO | - | 'Bangalore' | Office location or 'Remote'. |
| `stipend` | NUMERIC(10,2) | NO | - | 0.00 | CHECK (`stipend >= 0`). Monthly stipend in INR. |
| `min_cgpa` | NUMERIC(4,2) | NO | - | 0.00 | CHECK (`min_cgpa >= 0.00 AND min_cgpa <= 10.00`). |
| `total_openings` | INT | NO | - | 1 | CHECK (`total_openings > 0`). Available seats. |
| `filled_openings` | INT | NO | - | 0 | CHECK (`filled_openings >= 0 AND filled_openings <= total_openings`). |
| `status` | VARCHAR(20) | NO | - | 'Active' | CHECK (`status IN ('Draft', 'Active', 'Closed')`). |
| `deadline` | TIMESTAMPTZ | NO | - | None | Application cutoff timestamp. |
| `embedding` | vector(384) | YES | - | NULL | 384-dimensional dense semantic embedding. |
| `created_at` | TIMESTAMPTZ | NO | - | CURRENT_TIMESTAMP | Posting submission timestamp. |

### 1.9 `posting_eligible_dept`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `posting_id` | INT | NO | PK, FK | None | References `internship_posting(posting_id) ON DELETE CASCADE`. |
| `dept_id` | INT | NO | PK, FK | None | References `department(dept_id) ON DELETE CASCADE`. |

### 1.10 `posting_skill`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `posting_id` | INT | NO | PK, FK | None | References `internship_posting(posting_id) ON DELETE CASCADE`. |
| `skill_id` | INT | NO | PK, FK | None | References `skill(skill_id) ON DELETE CASCADE`. |
| `is_required` | BOOLEAN | NO | - | TRUE | Whether skill is mandatory or preferred. |

### 1.11 `application`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `application_id` | SERIAL | NO | PK | Nextval | Unique application identifier. |
| `student_id` | INT | NO | FK | None | References `student(student_id) ON DELETE CASCADE`. |
| `posting_id` | INT | NO | FK | None | References `internship_posting(posting_id) ON DELETE CASCADE`. |
| `current_stage` | VARCHAR(30) | NO | - | 'Applied' | Stage ENUM (`Applied`, `Shortlisted`, `Interview`, `Offered`, `Accepted`, `Rejected`, `Withdrawn`). |
| `match_score` | NUMERIC(5,2) | YES | - | NULL | Computed hybrid semantic matching score (0.00–100.00%). |
| `applied_at` | TIMESTAMPTZ | NO | - | CURRENT_TIMESTAMP | Submission timestamp. |
| `updated_at` | TIMESTAMPTZ | NO | - | CURRENT_TIMESTAMP | Last transition timestamp. |

*Unique Constraint:* `UNIQUE(student_id, posting_id)`

### 1.12 `application_stage_history`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `history_id` | SERIAL | NO | PK | Nextval | Unique stage transition audit identifier. |
| `application_id` | INT | NO | FK | None | References `application(application_id) ON DELETE CASCADE`. |
| `from_stage` | VARCHAR(30) | YES | - | NULL | Previous stage. |
| `to_stage` | VARCHAR(30) | NO | - | None | New stage. |
| `changed_by` | INT | YES | FK | NULL | References `app_user(user_id) ON DELETE SET NULL`. |
| `notes` | TEXT | YES | - | NULL | Justification for stage change. |
| `changed_at` | TIMESTAMPTZ | NO | - | CURRENT_TIMESTAMP | Timestamp of state transition. |

*Trigger Guarantee:* `trg_history_immutable` strictly forbids `UPDATE` and `DELETE`.

### 1.13 `interview_round`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `interview_id` | SERIAL | NO | PK | Nextval | Unique interview record identifier. |
| `application_id` | INT | NO | FK | None | References `application(application_id) ON DELETE CASCADE`. |
| `recruiter_id` | INT | NO | FK | None | References `recruiter(recruiter_id) ON DELETE RESTRICT`. |
| `round_number` | INT | NO | - | 1 | Sequence number (Round 1, Round 2). |
| `round_type` | VARCHAR(30) | NO | - | 'Technical' | CHECK (`round_type IN ('Technical', 'HR', 'Managerial', 'Online Assessment')`). |
| `scheduled_start` | TIMESTAMPTZ | NO | - | None | Interview start time. |
| `scheduled_end` | TIMESTAMPTZ | NO | - | None | Interview end time. CHECK (`scheduled_end > scheduled_start`). |
| `status` | VARCHAR(20) | NO | - | 'Scheduled' | CHECK (`status IN ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled')`). |
| `meeting_link` | VARCHAR(255) | YES | - | NULL | Video call URL (e.g. Google Meet). |

*Trigger Guarantee:* `trg_interview_clash` detects and rejects overlapping interview intervals.

### 1.14 `offer`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `offer_id` | SERIAL | NO | PK | Nextval | Unique offer identifier. |
| `application_id` | INT | NO | FK, UK | None | References `application(application_id) ON DELETE CASCADE`. |
| `stipend` | NUMERIC(10,2) | NO | - | None | Monthly compensation in INR. |
| `start_date` | DATE | NO | - | None | Internship onboarding date. |
| `expires_at` | DATE | NO | - | None | Offer acceptance deadline. CHECK (`expires_at >= CURRENT_DATE`). |
| `status` | VARCHAR(20) | NO | - | 'issued' | CHECK (`status IN ('issued', 'accepted', 'rejected', 'expired', 'revoked')`). |
| `created_at` | TIMESTAMPTZ | NO | - | CURRENT_TIMESTAMP | Offer issuance timestamp. |
| `responded_at` | TIMESTAMPTZ | YES | - | NULL | Acceptance/Rejection timestamp. |

### 1.15 `placement_policy`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `policy_id` | SERIAL | NO | PK | Nextval | Unique policy identifier. |
| `name` | VARCHAR(100) | NO | - | None | Human readable policy name. |
| `policy_key` | VARCHAR(50) | NO | UK | None | Unique machine key (e.g. `max_active_applications`). |
| `policy_value` | VARCHAR(255) | NO | - | None | Value configuration string or JSON. |
| `description` | TEXT | YES | - | NULL | Policy documentation. |
| `is_active` | BOOLEAN | NO | - | TRUE | Whether policy is currently active. |
| `updated_at` | TIMESTAMPTZ | NO | - | CURRENT_TIMESTAMP | Last modification timestamp. |

### 1.16 `audit_log`
| Column | Type | Nullable | Key | Default | Description / Constraints |
|---|---|---|---|---|---|
| `log_id` | SERIAL | NO | PK | Nextval | Unique audit log sequence number. |
| `user_id` | INT | YES | FK | NULL | References `app_user(user_id) ON DELETE SET NULL`. |
| `action` | VARCHAR(100) | NO | - | None | Action identifier (e.g., `OFFER_ACCEPTED`, `COMPANY_VERIFIED`). |
| `entity_name` | VARCHAR(50) | NO | - | None | Target table name. |
| `entity_id` | INT | YES | - | NULL | Target row primary key. |
| `old_values` | JSONB | YES | - | NULL | Row state before mutation. |
| `new_values` | JSONB | YES | - | NULL | Row state after mutation. |
| `ip_address` | VARCHAR(45) | YES | - | NULL | Client IP address. |
| `timestamp` | TIMESTAMPTZ | NO | - | CURRENT_TIMESTAMP | Event recording timestamp. |

---

## 2. MongoDB Document Data Dictionary

### 2.1 `resumes`
- **Purpose:** Stores rich polymorphic student resume documents, project portfolios, education milestones, and GitHub links.
- **Indexes:** `{ student_id: 1, is_active: 1 }`
- **Fields:**
  - `student_id` (Number, Required): Relational foreign key to `student.student_id`.
  - `parsed_text` (String): Raw text extracted for full-text search.
  - `skills` (Array of Strings): Tagged competencies extracted from resume.
  - `projects` (Array of Objects): `[{ title: String, description: String, technologies: [String], github_url: String }]`.
  - `education` (Array of Objects): `[{ degree: String, institution: String, score: String, year: Number }]`.
  - `is_active` (Boolean): Active resume flag.
  - `created_at` (Date): Upload timestamp.

### 2.2 `posting_documents`
- **Purpose:** Stores recruiter-attached PDFs, brochures, JD attachments, and custom hiring criteria.
- **Indexes:** `{ posting_id: 1 }`
- **Fields:**
  - `posting_id` (Number, Required): References `internship_posting.posting_id`.
  - `document_type` (String): e.g., `'Job_Description_PDF'`, `'Test_Instructions'`.
  - `file_url` (String): URI path or object key.
  - `content_text` (String): Parsed document text.
  - `uploaded_at` (Date): Timestamp.

### 2.3 `interview_feedback`
- **Purpose:** Stores multi-criteria evaluation rubrics submitted by technical and HR interviewers.
- **Indexes:** `{ interview_id: 1, candidate_id: 1 }`
- **Fields:**
  - `interview_id` (Number, Required): References `interview_round.interview_id`.
  - `candidate_id` (Number, Required): References `student.student_id`.
  - `recruiter_id` (Number, Required): References `recruiter.recruiter_id`.
  - `rubric` (Object): Dynamic key-value scores, e.g. `{ problem_solving: 9, coding: 8, communication: 9 }`.
  - `overall_score` (Number): 1–10 summary score.
  - `recommendation` (String): `'Strong Hire'`, `'Hire'`, `'Borderline'`, `'Reject'`.
  - `comments` (String): Qualitative notes.
  - `submitted_at` (Date): Timestamp.

### 2.4 `experience_reviews`
- **Purpose:** Peer internship reviews and company culture ratings submitted by students.
- **Indexes:** `{ company_id: 1, rating: -1 }`
- **Fields:**
  - `company_id` (Number, Required): References `company.company_id`.
  - `student_id` (Number, Required): References `student.student_id`.
  - `rating` (Number): 1–5 stars.
  - `work_life_balance` (Number): 1–5.
  - `learning_curve` (Number): 1–5.
  - `stipend_fairness` (Number): 1–5.
  - `tags` (Array of Strings): e.g. `['Mentorship', 'Challenging Projects', 'PPO Offered']`.
  - `review_text` (String): Qualitative commentary.
  - `created_at` (Date): Timestamp.

### 2.5 `notifications`
- **Purpose:** High-throughput transactional alerts with automatic lifecycle cleanup.
- **Indexes:** `{ user_id: 1, is_read: 1 }`, `{ created_at: 1 } (expireAfterSeconds: 2592000)`
- **Fields:**
  - `user_id` (Number, Required): References `app_user.user_id`.
  - `title` (String): Notification subject.
  - `message` (String): Notification body.
  - `type` (String): `'OFFER'`, `'INTERVIEW'`, `'STAGE_CHANGE'`, `'SYSTEM'`.
  - `is_read` (Boolean, Default: false).
  - `created_at` (Date, Required): Timestamp utilized by MongoDB TTL engine.

### 2.6 `activity_logs`
- **Purpose:** Detailed frontend telemetry, search queries, filter patterns, and session activity tracking.
- **Indexes:** `{ user_id: 1, timestamp: -1 }`
- **Fields:**
  - `user_id` (Number): Authenticated user ID.
  - `action` (String): e.g., `'SEARCH_POSTINGS'`, `'VIEW_APPLICANT'`.
  - `metadata` (Object): Query parameters and filter state.
  - `timestamp` (Date): Event occurrence timestamp.
