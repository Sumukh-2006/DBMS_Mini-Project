-- ============================================================================
-- InternTrack - Database Initialization & DDL Script (001_init.sql)
-- Relational Schema: 3NF/BCNF with Keys, Referential Actions & Integrity Constraints
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop Tables and Types in Reverse Dependency Order (for clean resets if needed)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS policy_config CASCADE;
DROP TABLE IF EXISTS offer CASCADE;
DROP TABLE IF EXISTS interview_panelist CASCADE;
DROP TABLE IF EXISTS interview CASCADE;
DROP TABLE IF EXISTS application_stage_history CASCADE;
DROP TABLE IF EXISTS application CASCADE;
DROP TABLE IF EXISTS posting_eligible_dept CASCADE;
DROP TABLE IF EXISTS posting_skill CASCADE;
DROP TABLE IF EXISTS internship_posting CASCADE;
DROP TABLE IF EXISTS student_skill CASCADE;
DROP TABLE IF EXISTS skill CASCADE;
DROP TABLE IF EXISTS recruiter CASCADE;
DROP TABLE IF EXISTS company CASCADE;
DROP TABLE IF EXISTS student CASCADE;
DROP TABLE IF EXISTS department CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;

DROP TYPE IF EXISTS offer_status CASCADE;
DROP TYPE IF EXISTS interview_status CASCADE;
DROP TYPE IF EXISTS interview_mode CASCADE;
DROP TYPE IF EXISTS application_stage CASCADE;
DROP TYPE IF EXISTS posting_mode CASCADE;
DROP TYPE IF EXISTS posting_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 3. Create Custom ENUM Types
CREATE TYPE user_role AS ENUM ('student', 'recruiter', 'admin');
CREATE TYPE posting_status AS ENUM ('draft', 'open', 'closed', 'cancelled');
CREATE TYPE posting_mode AS ENUM ('remote', 'hybrid', 'on-site');
CREATE TYPE application_stage AS ENUM (
    'Applied',
    'Shortlisted',
    'Interview',
    'Offered',
    'Accepted',
    'Rejected',
    'Withdrawn'
);
CREATE TYPE interview_mode AS ENUM ('online', 'in-person');
CREATE TYPE interview_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- 4. User Accounts & RBAC
CREATE TABLE app_user (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_app_user_email UNIQUE (email),
    CONSTRAINT chk_app_user_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 5. Departments
CREATE TABLE department (
    dept_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_dept_code UNIQUE (code)
);

-- 6. Students (Specialization of app_user with 1:1 relationship)
CREATE TABLE student (
    student_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    dept_id INT NOT NULL,
    usn VARCHAR(30) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    cgpa NUMERIC(4,2) NOT NULL,
    grad_year INT NOT NULL,
    phone VARCHAR(20),
    about TEXT,
    portfolio_url VARCHAR(255),
    profile_embedding vector(384),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_user_id UNIQUE (user_id),
    CONSTRAINT uq_student_usn UNIQUE (usn),
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_student_dept FOREIGN KEY (dept_id) REFERENCES department(dept_id) ON DELETE RESTRICT,
    CONSTRAINT chk_student_year CHECK (year BETWEEN 1 AND 5),
    CONSTRAINT chk_student_cgpa CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    CONSTRAINT chk_student_grad_year CHECK (grad_year >= 2020 AND grad_year <= 2035),
    CONSTRAINT chk_student_phone CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{10,15}$')
);

-- 7. Companies
CREATE TABLE company (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    website VARCHAR(255),
    industry VARCHAR(100) NOT NULL,
    size VARCHAR(50) DEFAULT '10-50',
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_name UNIQUE (name),
    CONSTRAINT fk_company_verified_by FOREIGN KEY (verified_by) REFERENCES app_user(user_id) ON DELETE SET NULL,
    CONSTRAINT chk_company_website CHECK (website IS NULL OR website ~ '^https?://')
);

-- 8. Recruiters (Specialization of app_user representing a company)
CREATE TABLE recruiter (
    recruiter_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    designation VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_recruiter_user_id UNIQUE (user_id),
    CONSTRAINT fk_recruiter_user FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_recruiter_company FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE RESTRICT
);

-- 9. Skills Catalogue
CREATE TABLE skill (
    skill_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    CONSTRAINT uq_skill_name UNIQUE (name)
);

-- 10. Student Skills (M:N Association between Student and Skill)
CREATE TABLE student_skill (
    student_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency INT NOT NULL,
    PRIMARY KEY (student_id, skill_id),
    CONSTRAINT fk_ss_student FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_ss_skill FOREIGN KEY (skill_id) REFERENCES skill(skill_id) ON DELETE RESTRICT,
    CONSTRAINT chk_ss_proficiency CHECK (proficiency BETWEEN 1 AND 5)
);

-- 11. Internship Postings
CREATE TABLE internship_posting (
    posting_id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    recruiter_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(100) NOT NULL DEFAULT 'Bengaluru',
    mode posting_mode NOT NULL DEFAULT 'hybrid',
    stipend NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    openings INT NOT NULL,
    filled INT NOT NULL DEFAULT 0,
    deadline TIMESTAMPTZ NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    duration_weeks INT NOT NULL DEFAULT 12,
    min_cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    status posting_status NOT NULL DEFAULT 'open',
    remote_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    embedding vector(384),
    search_tsv tsvector,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_posting_company FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE RESTRICT,
    CONSTRAINT fk_posting_recruiter FOREIGN KEY (recruiter_id) REFERENCES recruiter(recruiter_id) ON DELETE RESTRICT,
    CONSTRAINT chk_posting_stipend CHECK (stipend >= 0),
    CONSTRAINT chk_posting_openings CHECK (openings > 0),
    CONSTRAINT chk_posting_filled CHECK (filled >= 0 AND filled <= openings),
    CONSTRAINT chk_posting_min_cgpa CHECK (min_cgpa >= 0.00 AND min_cgpa <= 10.00),
    CONSTRAINT chk_posting_duration CHECK (duration_weeks > 0),
    CONSTRAINT chk_posting_deadline_start CHECK (deadline < start_date)
);

-- 12. Posting Skills (M:N Association with Mandatory flag and Min Level)
CREATE TABLE posting_skill (
    posting_id INT NOT NULL,
    skill_id INT NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    min_level INT NOT NULL DEFAULT 1,
    PRIMARY KEY (posting_id, skill_id),
    CONSTRAINT fk_ps_posting FOREIGN KEY (posting_id) REFERENCES internship_posting(posting_id) ON DELETE CASCADE,
    CONSTRAINT fk_ps_skill FOREIGN KEY (skill_id) REFERENCES skill(skill_id) ON DELETE RESTRICT,
    CONSTRAINT chk_ps_min_level CHECK (min_level BETWEEN 1 AND 5)
);

-- 13. Posting Eligible Departments (M:N Association)
CREATE TABLE posting_eligible_dept (
    posting_id INT NOT NULL,
    dept_id INT NOT NULL,
    PRIMARY KEY (posting_id, dept_id),
    CONSTRAINT fk_ped_posting FOREIGN KEY (posting_id) REFERENCES internship_posting(posting_id) ON DELETE CASCADE,
    CONSTRAINT fk_ped_dept FOREIGN KEY (dept_id) REFERENCES department(dept_id) ON DELETE RESTRICT
);

-- 14. Applications (Associative Entity between Student and Internship Posting)
CREATE TABLE application (
    application_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    posting_id INT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_stage application_stage NOT NULL DEFAULT 'Applied',
    match_score NUMERIC(5,2) DEFAULT 0.00,
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_posting_application UNIQUE (student_id, posting_id),
    CONSTRAINT fk_app_student FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_app_posting FOREIGN KEY (posting_id) REFERENCES internship_posting(posting_id) ON DELETE CASCADE
);

-- 15. Application Stage History (Immutable Audit Log of Lifecycle Stage Transitions)
CREATE TABLE application_stage_history (
    history_id SERIAL PRIMARY KEY,
    application_id INT NOT NULL,
    from_stage application_stage,
    to_stage application_stage NOT NULL,
    changed_by INT NOT NULL,
    reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ash_app FOREIGN KEY (application_id) REFERENCES application(application_id) ON DELETE CASCADE,
    CONSTRAINT fk_ash_user FOREIGN KEY (changed_by) REFERENCES app_user(user_id) ON DELETE RESTRICT
);

-- 16. Interviews (Multiple rounds per application)
CREATE TABLE interview (
    interview_id SERIAL PRIMARY KEY,
    application_id INT NOT NULL,
    round_no INT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_min INT NOT NULL DEFAULT 45,
    mode interview_mode NOT NULL DEFAULT 'online',
    link_or_room VARCHAR(255),
    status interview_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_interview_round UNIQUE (application_id, round_no),
    CONSTRAINT fk_interview_app FOREIGN KEY (application_id) REFERENCES application(application_id) ON DELETE CASCADE,
    CONSTRAINT chk_interview_round_no CHECK (round_no > 0),
    CONSTRAINT chk_interview_duration CHECK (duration_min > 0)
);

-- 17. Interview Panelists (M:N between Interview and Recruiter)
CREATE TABLE interview_panelist (
    interview_id INT NOT NULL,
    recruiter_id INT NOT NULL,
    PRIMARY KEY (interview_id, recruiter_id),
    CONSTRAINT fk_ip_interview FOREIGN KEY (interview_id) REFERENCES interview(interview_id) ON DELETE CASCADE,
    CONSTRAINT fk_ip_recruiter FOREIGN KEY (recruiter_id) REFERENCES recruiter(recruiter_id) ON DELETE RESTRICT
);

-- 18. Offers (1:1 with Application)
CREATE TABLE offer (
    offer_id SERIAL PRIMARY KEY,
    application_id INT NOT NULL,
    stipend NUMERIC(10,2) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    status offer_status NOT NULL DEFAULT 'pending',
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_offer_application UNIQUE (application_id),
    CONSTRAINT fk_offer_application FOREIGN KEY (application_id) REFERENCES application(application_id) ON DELETE CASCADE,
    CONSTRAINT chk_offer_stipend CHECK (stipend >= 0),
    CONSTRAINT chk_offer_expiry CHECK (expires_at > issued_at)
);

-- 19. Policy Configuration (Placement cell business rules)
CREATE TABLE policy_config (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 20. Audit Log (System-wide sensitive action logging)
CREATE TABLE audit_log (
    audit_id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id INT,
    actor_id INT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES app_user(user_id) ON DELETE SET NULL
);
