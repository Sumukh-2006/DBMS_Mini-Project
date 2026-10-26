-- ============================================================================
-- InternTrack — Comprehensive Master DDL Script (all_ddl.sql)
-- Course: Database Management Systems (UE22CS341AA / UE23CS351AA) — Level 3
-- Institution: PES University, Department of Computer Science and Engineering
-- Author: Sumukh Shandilya
-- Database Target: PostgreSQL 16 with pgvector & pg_trgm
-- 
-- CONTENTS:
--   PART 1: Extensions, Drops & Custom Enum Types
--   PART 2: Core Table Definitions (17 Relations with PK, FK, Constraints)
--   PART 3: Advanced Indexing Strategy (B-Tree, Partial, GIN Trigram, HNSW Vector)
--   PART 4: Database Views & Materialized Views (Joins, Projections, Aggregations)
--   PART 5: Stored Procedures, Functions & Triggers (Business Logic & Audit)
--   PART 6: DDL Schema Evolutions & ALTER TABLE Demonstrations
-- ============================================================================



-- ============================================================================
-- SOURCE: db/migrations/001_init.sql
-- ============================================================================

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


-- ============================================================================
-- SOURCE: db/migrations/002_indexes.sql
-- ============================================================================

-- ============================================================================
-- InternTrack - Indexing Strategy & Optimization (002_indexes.sql)
-- Demonstrating B-tree, Partial, GIN Full-Text, GIN Trigram, and HNSW Vector Indexes
-- ============================================================================

-- 1. Student pipeline lookup index (B-tree composite)
-- Optimizes: SELECT ... FROM application WHERE student_id = ? AND current_stage = ?
CREATE INDEX IF NOT EXISTS idx_application_student_stage
ON application (student_id, current_stage);

-- 2. Recruiter candidate review index (B-tree composite)
-- Optimizes: SELECT ... FROM application WHERE posting_id = ? AND current_stage = ?
CREATE INDEX IF NOT EXISTS idx_application_posting_stage
ON application (posting_id, current_stage);

-- 3. Partial index for active open postings by deadline
-- Optimizes student browse queries filtering status='open' ordered by nearest deadline
CREATE INDEX IF NOT EXISTS idx_posting_open_deadline
ON internship_posting (deadline ASC)
WHERE status = 'open';

-- 4. GIN Index on Full-Text Search tsvector (Title + Description)
-- Optimizes: WHERE search_tsv @@ plainto_tsquery('english', '...')
CREATE INDEX IF NOT EXISTS idx_posting_search_tsv
ON internship_posting USING GIN (search_tsv);

-- 5. Trigram GIN index for fuzzy skill search and autocomplete
-- Optimizes: WHERE name ILIKE '%pyth%' or similarity(name, 'pytn') > 0.3
CREATE INDEX IF NOT EXISTS idx_skill_name_trgm
ON skill USING GIN (name gin_trgm_ops);

-- 6. HNSW Vector Index on Internship Postings (pgvector with Cosine Distance)
-- Provides fast Approximate Nearest Neighbor (ANN) search for student recommendations
CREATE INDEX IF NOT EXISTS idx_posting_embedding_hnsw
ON internship_posting USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 7. HNSW Vector Index on Student Profile Embeddings
-- Provides fast similarity search for recruiters finding "Similar Candidates"
CREATE INDEX IF NOT EXISTS idx_student_profile_embedding_hnsw
ON student USING hnsw (profile_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 8. Composite index for interview clash detection and upcoming reminders
-- Optimizes: WHERE scheduled_at BETWEEN ... AND ... AND status = 'scheduled'
CREATE INDEX IF NOT EXISTS idx_interview_scheduled_status
ON interview (scheduled_at, status);

-- 9. Partial index on pending offers for automated expiration sweep
CREATE INDEX IF NOT EXISTS idx_offer_pending_expiry
ON offer (expires_at ASC)
WHERE status = 'pending';

-- 10. Audit log chronological query index
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
ON audit_log (created_at DESC);

-- 11. Foreign key support indexes for fast JOINs
CREATE INDEX IF NOT EXISTS idx_student_dept ON student (dept_id);
CREATE INDEX IF NOT EXISTS idx_posting_company ON internship_posting (company_id);
CREATE INDEX IF NOT EXISTS idx_posting_recruiter ON internship_posting (recruiter_id);
CREATE INDEX IF NOT EXISTS idx_app_stage_hist_app ON application_stage_history (application_id);
CREATE INDEX IF NOT EXISTS idx_interview_app ON interview (application_id);
CREATE INDEX IF NOT EXISTS idx_offer_app ON offer (application_id);

-- 12. University Placement Policy Invariant: Single Accepted Application per Student
-- Guarantees at the database constraint level that no student can have multiple accepted offers
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_single_accepted_application
ON application (student_id)
WHERE current_stage = 'Accepted';


-- ============================================================================
-- SOURCE: db/migrations/003_views.sql
-- ============================================================================

-- ============================================================================
-- InternTrack - Database Views & Materialized Views (003_views.sql)
-- Complex Multi-table Joins, Aggregations, and Analytical Projections
-- ============================================================================

-- Drop views in reverse dependency order
DROP MATERIALIZED VIEW IF EXISTS mv_skill_demand CASCADE;
DROP VIEW IF EXISTS v_department_placement CASCADE;
DROP VIEW IF EXISTS v_upcoming_deadlines CASCADE;
DROP VIEW IF EXISTS v_company_stats CASCADE;
DROP VIEW IF EXISTS v_posting_funnel CASCADE;
DROP VIEW IF EXISTS v_student_pipeline CASCADE;

-- 1. Student Application Pipeline View
-- Joins Student, Application, Posting, Company, Interview, and Offer
CREATE OR REPLACE VIEW v_student_pipeline AS
SELECT 
    a.application_id,
    a.student_id,
    s.usn,
    s.full_name AS student_name,
    p.posting_id,
    p.title AS posting_title,
    c.company_id,
    c.name AS company_name,
    c.industry,
    p.location,
    p.mode,
    p.stipend,
    p.status AS posting_status,
    a.current_stage,
    a.applied_at,
    a.match_score,
    a.withdrawn_at,
    -- Next upcoming scheduled interview (correlated subquery)
    (
        SELECT json_build_object(
            'interview_id', i.interview_id,
            'round_no', i.round_no,
            'scheduled_at', i.scheduled_at,
            'duration_min', i.duration_min,
            'mode', i.mode,
            'link_or_room', i.link_or_room
        )
        FROM interview i
        WHERE i.application_id = a.application_id 
          AND i.status = 'scheduled'
        ORDER BY i.scheduled_at ASC
        LIMIT 1
    ) AS next_interview,
    -- Active offer details if issued
    (
        SELECT json_build_object(
            'offer_id', o.offer_id,
            'stipend', o.stipend,
            'start_date', o.start_date,
            'expires_at', o.expires_at,
            'status', o.status
        )
        FROM offer o
        WHERE o.application_id = a.application_id
        LIMIT 1
    ) AS offer_details
FROM application a
JOIN student s ON a.student_id = s.student_id
JOIN internship_posting p ON a.posting_id = p.posting_id
JOIN company c ON p.company_id = c.company_id;

-- 2. Recruiter & Admin Posting Funnel Conversion View
-- Calculates applicant counts across stages and conversion percentages
CREATE OR REPLACE VIEW v_posting_funnel AS
SELECT 
    p.posting_id,
    c.name AS company_name,
    p.title,
    p.status AS posting_status,
    p.openings,
    p.filled,
    p.deadline,
    COUNT(a.application_id) AS total_applicants,
    COUNT(CASE WHEN a.current_stage = 'Applied' THEN 1 END) AS count_applied,
    COUNT(CASE WHEN a.current_stage = 'Shortlisted' THEN 1 END) AS count_shortlisted,
    COUNT(CASE WHEN a.current_stage = 'Interview' THEN 1 END) AS count_interview,
    COUNT(CASE WHEN a.current_stage = 'Offered' THEN 1 END) AS count_offered,
    COUNT(CASE WHEN a.current_stage = 'Accepted' THEN 1 END) AS count_accepted,
    COUNT(CASE WHEN a.current_stage = 'Rejected' THEN 1 END) AS count_rejected,
    COUNT(CASE WHEN a.current_stage = 'Withdrawn' THEN 1 END) AS count_withdrawn,
    CASE 
        WHEN COUNT(a.application_id) = 0 THEN 0.00
        ELSE ROUND((COUNT(CASE WHEN a.current_stage = 'Accepted' THEN 1 END)::NUMERIC / COUNT(a.application_id)::NUMERIC) * 100, 2)
    END AS conversion_rate_pct
FROM internship_posting p
JOIN company c ON p.company_id = c.company_id
LEFT JOIN application a ON p.posting_id = a.posting_id
GROUP BY p.posting_id, c.name, p.title, p.status, p.openings, p.filled, p.deadline;

-- 3. Company Hiring & Offer Statistics View
CREATE OR REPLACE VIEW v_company_stats AS
SELECT 
    c.company_id,
    c.name AS company_name,
    c.industry,
    c.verified,
    COUNT(DISTINCT p.posting_id) AS total_postings,
    COUNT(DISTINCT CASE WHEN p.status = 'open' THEN p.posting_id END) AS active_postings,
    COUNT(DISTINCT a.application_id) AS total_applicants,
    COUNT(DISTINCT o.offer_id) AS total_offers_issued,
    COUNT(DISTINCT CASE WHEN o.status = 'accepted' THEN o.offer_id END) AS total_offers_accepted,
    CASE 
        WHEN COUNT(DISTINCT o.offer_id) = 0 THEN 0.00
        ELSE ROUND((COUNT(DISTINCT CASE WHEN o.status = 'accepted' THEN o.offer_id END)::NUMERIC / COUNT(DISTINCT o.offer_id)::NUMERIC) * 100, 2)
    END AS offer_acceptance_rate_pct
FROM company c
LEFT JOIN internship_posting p ON c.company_id = p.company_id
LEFT JOIN application a ON p.posting_id = a.posting_id
LEFT JOIN offer o ON a.application_id = o.application_id
GROUP BY c.company_id, c.name, c.industry, c.verified;

-- 4. Upcoming Deadlines View (Postings closing within 7 days)
CREATE OR REPLACE VIEW v_upcoming_deadlines AS
SELECT 
    p.posting_id,
    p.title,
    c.name AS company_name,
    p.location,
    p.stipend,
    p.openings,
    p.openings - p.filled AS openings_remaining,
    p.deadline,
    ROUND(EXTRACT(EPOCH FROM (p.deadline - CURRENT_TIMESTAMP)) / 86400, 1) AS days_remaining,
    COUNT(a.application_id) AS total_applicants
FROM internship_posting p
JOIN company c ON p.company_id = c.company_id
LEFT JOIN application a ON p.posting_id = a.posting_id
WHERE p.status = 'open' 
  AND p.deadline > CURRENT_TIMESTAMP
  AND p.deadline <= CURRENT_TIMESTAMP + INTERVAL '7 days'
GROUP BY p.posting_id, p.title, c.name, p.location, p.stipend, p.openings, p.filled, p.deadline
ORDER BY p.deadline ASC;

-- 5. Institutional Department-wise Placement Analytics View
CREATE OR REPLACE VIEW v_department_placement AS
SELECT 
    d.dept_id,
    d.code AS dept_code,
    d.name AS dept_name,
    COUNT(DISTINCT s.student_id) AS total_students,
    COUNT(DISTINCT CASE WHEN a.current_stage = 'Accepted' THEN s.student_id END) AS placed_students,
    CASE 
        WHEN COUNT(DISTINCT s.student_id) = 0 THEN 0.00
        ELSE ROUND((COUNT(DISTINCT CASE WHEN a.current_stage = 'Accepted' THEN s.student_id END)::NUMERIC / COUNT(DISTINCT s.student_id)::NUMERIC) * 100, 2)
    END AS placement_percentage,
    ROUND(COALESCE(AVG(CASE WHEN a.current_stage = 'Accepted' THEN o.stipend END), 0), 2) AS avg_placed_stipend,
    COALESCE(MAX(CASE WHEN a.current_stage = 'Accepted' THEN o.stipend END), 0) AS max_placed_stipend
FROM department d
LEFT JOIN student s ON d.dept_id = s.dept_id
LEFT JOIN application a ON s.student_id = a.student_id
LEFT JOIN offer o ON a.application_id = o.application_id AND o.status = 'accepted'
GROUP BY d.dept_id, d.code, d.name;

-- 6. Materialized View for Skill Market Demand Analysis
CREATE MATERIALIZED VIEW mv_skill_demand AS
SELECT 
    sk.skill_id,
    sk.name AS skill_name,
    sk.category AS skill_category,
    COUNT(ps.posting_id) AS demand_postings_count,
    COUNT(CASE WHEN ps.is_mandatory = TRUE THEN 1 END) AS mandatory_demand_count,
    COUNT(CASE WHEN ps.is_mandatory = FALSE THEN 1 END) AS preferred_demand_count,
    ROUND(COALESCE(AVG(ps.min_level), 0), 2) AS avg_required_proficiency,
    CURRENT_TIMESTAMP AS last_refreshed_at
FROM skill sk
LEFT JOIN posting_skill ps ON sk.skill_id = ps.skill_id
LEFT JOIN internship_posting p ON ps.posting_id = p.posting_id AND p.status = 'open'
GROUP BY sk.skill_id, sk.name, sk.category
ORDER BY demand_postings_count DESC;

-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX idx_mv_skill_demand_id ON mv_skill_demand (skill_id);

-- Stored procedure to refresh the materialized view
CREATE OR REPLACE FUNCTION sp_refresh_skill_demand_mv()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_skill_demand;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- SOURCE: db/migrations/004_functions_triggers.sql
-- ============================================================================

-- ============================================================================
-- InternTrack - Stored Procedures, Functions & Triggers (004_functions_triggers.sql)
-- Enforcing Placement Rules, State Machine Integrity, Audit Logging & Concurrency
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper: Maintain updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_user_updated ON app_user;
CREATE TRIGGER trg_app_user_updated
    BEFORE UPDATE ON app_user
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

DROP TRIGGER IF EXISTS trg_student_updated ON student;
CREATE TRIGGER trg_student_updated
    BEFORE UPDATE ON student
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

DROP TRIGGER IF EXISTS trg_posting_updated ON internship_posting;
CREATE TRIGGER trg_posting_updated
    BEFORE UPDATE ON internship_posting
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

DROP TRIGGER IF EXISTS trg_application_updated ON application;
CREATE TRIGGER trg_application_updated
    BEFORE UPDATE ON application
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 2. Trigger: Full-Text Search TSVector Maintenance
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_posting_tsvector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv = 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posting_search_vector ON internship_posting;
CREATE TRIGGER trg_posting_search_vector
    BEFORE INSERT OR UPDATE OF title, location, description ON internship_posting
    FOR EACH ROW EXECUTE FUNCTION fn_posting_tsvector_update();

-- ----------------------------------------------------------------------------
-- 3. Trigger: Immutable Audit and Stage History (Append-Only Guarantee)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_prevent_history_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit and stage history records are strictly append-only and immutable. Operation % blocked.', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stage_history_immutable ON application_stage_history;
CREATE TRIGGER trg_stage_history_immutable
    BEFORE UPDATE OR DELETE ON application_stage_history
    FOR EACH ROW EXECUTE FUNCTION fn_prevent_history_modification();

DROP TRIGGER IF EXISTS trg_audit_log_immutable ON audit_log;
CREATE TRIGGER trg_audit_log_immutable
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION fn_prevent_history_modification();

-- ----------------------------------------------------------------------------
-- 4. Trigger: Block Late Applications and Applications to Full/Closed Postings
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_block_late_or_invalid_apply()
RETURNS TRIGGER AS $$
DECLARE
    v_deadline TIMESTAMPTZ;
    v_status posting_status;
    v_openings INT;
    v_filled INT;
BEGIN
    SELECT deadline, status, openings, filled
    INTO v_deadline, v_status, v_openings, v_filled
    FROM internship_posting
    WHERE posting_id = NEW.posting_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Internship posting with ID % does not exist.', NEW.posting_id;
    END IF;

    IF v_status <> 'open' THEN
        RAISE EXCEPTION 'Cannot apply: Posting is currently %.', v_status;
    END IF;

    IF CURRENT_TIMESTAMP > v_deadline THEN
        RAISE EXCEPTION 'Application deadline (%) has passed for this posting.', v_deadline;
    END IF;

    IF v_filled >= v_openings THEN
        RAISE EXCEPTION 'Cannot apply: All % openings have been filled.', v_openings;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_late_apply ON application;
CREATE TRIGGER trg_block_late_apply
    BEFORE INSERT ON application
    FOR EACH ROW EXECUTE FUNCTION fn_block_late_or_invalid_apply();

-- ----------------------------------------------------------------------------
-- 5. Trigger: Enforce One-Accepted-Offer University Placement Rule
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_one_accepted_offer()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id INT;
    v_existing_accepted_count INT;
BEGIN
    IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Find student for this application
        SELECT student_id INTO v_student_id
        FROM application
        WHERE application_id = NEW.application_id;

        -- Check if student already has another accepted offer
        SELECT COUNT(*) INTO v_existing_accepted_count
        FROM offer o
        JOIN application a ON o.application_id = a.application_id
        WHERE a.student_id = v_student_id 
          AND o.status = 'accepted' 
          AND o.offer_id <> NEW.offer_id;

        IF v_existing_accepted_count > 0 THEN
            RAISE EXCEPTION 'Placement Policy Violation: Student ID % already has an accepted offer. One-offer policy enforced.', v_student_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_one_accepted_offer ON offer;
CREATE TRIGGER trg_one_accepted_offer
    BEFORE UPDATE OF status ON offer
    FOR EACH ROW EXECUTE FUNCTION fn_check_one_accepted_offer();

-- ----------------------------------------------------------------------------
-- 6. Trigger: Auto-close Posting when Openings are Filled
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_autoclose_filled_posting()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.filled >= NEW.openings AND NEW.status = 'open' THEN
        UPDATE internship_posting
        SET status = 'closed', updated_at = CURRENT_TIMESTAMP
        WHERE posting_id = NEW.posting_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posting_autoclose ON internship_posting;
CREATE TRIGGER trg_posting_autoclose
    AFTER UPDATE OF filled ON internship_posting
    FOR EACH ROW EXECUTE FUNCTION fn_autoclose_filled_posting();

-- ----------------------------------------------------------------------------
-- 7. Trigger: Auto-record Stage History when current_stage Changes
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_app_stage_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id INT;
BEGIN
    IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
        -- Attempt to extract current actor from transaction local variable if set by app
        BEGIN
            v_actor_id := current_setting('interntrack.current_user_id', true)::INT;
        EXCEPTION WHEN OTHERS THEN
            v_actor_id := NULL;
        END;

        -- Fallback to student's user_id if actor is not set in session
        IF v_actor_id IS NULL THEN
            SELECT user_id INTO v_actor_id FROM student WHERE student_id = NEW.student_id;
        END IF;

        INSERT INTO application_stage_history (
            application_id,
            from_stage,
            to_stage,
            changed_by,
            reason,
            changed_at
        ) VALUES (
            NEW.application_id,
            OLD.current_stage,
            NEW.current_stage,
            COALESCE(v_actor_id, 1),
            'Stage transitioned from ' || OLD.current_stage || ' to ' || NEW.current_stage,
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_stage_audit ON application;
CREATE TRIGGER trg_app_stage_audit
    AFTER UPDATE OF current_stage ON application
    FOR EACH ROW EXECUTE FUNCTION fn_app_stage_audit_trigger();

-- ----------------------------------------------------------------------------
-- 8. Function: Interview Clash Detection
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_interview_clash(
    p_student_id INT,
    p_scheduled_at TIMESTAMPTZ,
    p_duration_min INT,
    p_exclude_interview_id INT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_clash_exists BOOLEAN;
    v_end_time TIMESTAMPTZ;
BEGIN
    v_end_time := p_scheduled_at + (p_duration_min || ' minutes')::INTERVAL;

    SELECT EXISTS (
        SELECT 1
        FROM interview i
        JOIN application a ON i.application_id = a.application_id
        WHERE a.student_id = p_student_id
          AND i.status = 'scheduled'
          AND (p_exclude_interview_id IS NULL OR i.interview_id <> p_exclude_interview_id)
          AND (
              -- Overlapping intervals
              (i.scheduled_at < v_end_time) AND 
              ((i.scheduled_at + (i.duration_min || ' minutes')::INTERVAL) > p_scheduled_at)
          )
    ) INTO v_clash_exists;

    RETURN v_clash_exists;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 9. Trigger: Prevent Scheduling Interview Clashes
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_prevent_interview_clash()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id INT;
BEGIN
    IF NEW.status = 'scheduled' THEN
        SELECT student_id INTO v_student_id
        FROM application
        WHERE application_id = NEW.application_id;

        IF fn_interview_clash(v_student_id, NEW.scheduled_at, NEW.duration_min, NEW.interview_id) THEN
            RAISE EXCEPTION 'Interview schedule conflict detected! Student ID % already has another interview in this time slot.', v_student_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_interview_clash ON interview;
CREATE TRIGGER trg_interview_clash
    BEFORE INSERT OR UPDATE OF scheduled_at, duration_min, status ON interview
    FOR EACH ROW EXECUTE FUNCTION fn_prevent_interview_clash();

-- ----------------------------------------------------------------------------
-- 10. Function: Weighted Skill Match Score Calculation (Domain Algorithm)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_match_score(
    p_student_id INT,
    p_posting_id INT
)
RETURNS NUMERIC AS $$
DECLARE
    v_mandatory_total INT := 0;
    v_mandatory_matched INT := 0;
    v_optional_total INT := 0;
    v_optional_matched INT := 0;
    v_mandatory_score NUMERIC := 0.00;
    v_optional_score NUMERIC := 0.00;
    v_final_score NUMERIC := 0.00;
BEGIN
    -- Check mandatory skills
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN ss.proficiency >= ps.min_level THEN 1 END)
    INTO v_mandatory_total, v_mandatory_matched
    FROM posting_skill ps
    LEFT JOIN student_skill ss 
        ON ps.skill_id = ss.skill_id AND ss.student_id = p_student_id
    WHERE ps.posting_id = p_posting_id AND ps.is_mandatory = TRUE;

    -- Check preferred/optional skills
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN ss.student_id IS NOT NULL THEN 1 END)
    INTO v_optional_total, v_optional_matched
    FROM posting_skill ps
    LEFT JOIN student_skill ss 
        ON ps.skill_id = ss.skill_id AND ss.student_id = p_student_id
    WHERE ps.posting_id = p_posting_id AND ps.is_mandatory = FALSE;

    -- Calculate weighted contribution
    IF v_mandatory_total > 0 THEN
        v_mandatory_score := (v_mandatory_matched::NUMERIC / v_mandatory_total::NUMERIC) * 70.0;
    ELSE
        v_mandatory_score := 70.0; -- default if no mandatory skills explicitly defined
    END IF;

    IF v_optional_total > 0 THEN
        v_optional_score := (v_optional_matched::NUMERIC / v_optional_total::NUMERIC) * 30.0;
    ELSE
        v_optional_score := 30.0;
    END IF;

    v_final_score := ROUND(v_mandatory_score + v_optional_score, 2);
    RETURN v_final_score;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 11. Stored Procedure: Student Application Submission (sp_apply)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_apply(
    p_student_id INT,
    p_posting_id INT,
    INOUT p_application_id INT DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_student_cgpa NUMERIC(4,2);
    v_student_dept_id INT;
    v_student_user_id INT;
    v_posting_min_cgpa NUMERIC(4,2);
    v_is_dept_eligible BOOLEAN;
    v_has_accepted_offer BOOLEAN;
    v_active_apps_count INT;
    v_max_active_apps INT := 5;
    v_calculated_score NUMERIC(5,2);
    v_max_policy_val TEXT;
BEGIN
    -- 1. Fetch student info
    SELECT cgpa, dept_id, user_id INTO v_student_cgpa, v_student_dept_id, v_student_user_id
    FROM student
    WHERE student_id = p_student_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student ID % not found.', p_student_id;
    END IF;

    -- 2. Check if student already has an accepted offer
    SELECT EXISTS (
        SELECT 1 FROM offer o
        JOIN application a ON o.application_id = a.application_id
        WHERE a.student_id = p_student_id AND o.status = 'accepted'
    ) INTO v_has_accepted_offer;

    IF v_has_accepted_offer THEN
        RAISE EXCEPTION 'Placement Policy: You already have an accepted internship offer and cannot submit new applications.';
    END IF;

    -- 3. Check CGPA eligibility
    SELECT min_cgpa INTO v_posting_min_cgpa
    FROM internship_posting
    WHERE posting_id = p_posting_id;

    IF v_student_cgpa < v_posting_min_cgpa THEN
        RAISE EXCEPTION 'Ineligible: Student CGPA (%) is below the minimum required CGPA (%).', v_student_cgpa, v_posting_min_cgpa;
    END IF;

    -- 4. Check department eligibility
    SELECT EXISTS (
        SELECT 1 FROM posting_eligible_dept
        WHERE posting_id = p_posting_id AND dept_id = v_student_dept_id
    ) INTO v_is_dept_eligible;

    -- If specific eligible departments are defined, student must belong to one
    IF EXISTS (SELECT 1 FROM posting_eligible_dept WHERE posting_id = p_posting_id) AND NOT v_is_dept_eligible THEN
        RAISE EXCEPTION 'Ineligible: Your department is not listed under eligible departments for this posting.';
    END IF;

    -- 5. Check maximum active applications policy
    SELECT value INTO v_max_policy_val
    FROM policy_config WHERE key = 'max_active_applications';
    IF v_max_policy_val IS NOT NULL THEN
        v_max_active_apps := v_max_policy_val::INT;
    END IF;

    SELECT COUNT(*) INTO v_active_apps_count
    FROM application
    WHERE student_id = p_student_id AND current_stage NOT IN ('Accepted', 'Rejected', 'Withdrawn');

    IF v_active_apps_count >= v_max_active_apps THEN
        RAISE EXCEPTION 'Placement Policy: Maximum allowed active applications limit (%) reached. Currently active: %.', v_max_active_apps, v_active_apps_count;
    END IF;

    -- 6. Compute initial match score
    v_calculated_score := fn_match_score(p_student_id, p_posting_id);

    -- 7. Insert application
    INSERT INTO application (
        student_id,
        posting_id,
        current_stage,
        match_score,
        applied_at
    ) VALUES (
        p_student_id,
        p_posting_id,
        'Applied',
        v_calculated_score,
        CURRENT_TIMESTAMP
    ) RETURNING application_id INTO p_application_id;

    -- 8. Record initial stage history entry
    INSERT INTO application_stage_history (
        application_id,
        from_stage,
        to_stage,
        changed_by,
        reason,
        changed_at
    ) VALUES (
        p_application_id,
        NULL,
        'Applied',
        v_student_user_id,
        'Candidate initiated application submission',
        CURRENT_TIMESTAMP
    );

    -- 9. Record audit log
    INSERT INTO audit_log (action, entity, entity_id, actor_id, details)
    VALUES (
        'APPLICATION_SUBMITTED',
        'application',
        p_application_id,
        v_student_user_id,
        json_build_object('posting_id', p_posting_id, 'match_score', v_calculated_score)
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 12. Stored Procedure: Advance Lifecycle Stage (sp_advance_stage)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_advance_stage(
    p_application_id INT,
    p_new_stage application_stage,
    p_actor_id INT,
    p_reason TEXT DEFAULT 'Standard recruitment pipeline advancement'
)
LANGUAGE plpgsql AS $$
DECLARE
    v_current_stage application_stage;
    v_is_legal_transition BOOLEAN := FALSE;
BEGIN
    SELECT current_stage INTO v_current_stage
    FROM application
    WHERE application_id = p_application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application ID % not found.', p_application_id;
    END IF;

    -- State machine legal transition checks
    IF v_current_stage = p_new_stage THEN
        RETURN; -- No change needed
    END IF;

    IF v_current_stage = 'Applied' AND p_new_stage IN ('Shortlisted', 'Rejected', 'Withdrawn') THEN
        v_is_legal_transition := TRUE;
    ELSIF v_current_stage = 'Shortlisted' AND p_new_stage IN ('Interview', 'Offered', 'Rejected', 'Withdrawn') THEN
        v_is_legal_transition := TRUE;
    ELSIF v_current_stage = 'Interview' AND p_new_stage IN ('Offered', 'Rejected', 'Withdrawn', 'Interview') THEN
        v_is_legal_transition := TRUE;
    ELSIF v_current_stage = 'Offered' AND p_new_stage IN ('Accepted', 'Rejected', 'Withdrawn') THEN
        v_is_legal_transition := TRUE;
    ELSIF p_new_stage = 'Withdrawn' THEN
        -- Candidate or admin may withdraw anytime prior to final acceptance
        IF v_current_stage <> 'Accepted' THEN
            v_is_legal_transition := TRUE;
        END IF;
    END IF;

    IF NOT v_is_legal_transition THEN
        RAISE EXCEPTION 'Illegal stage transition: Cannot advance from % to % directly.', v_current_stage, p_new_stage;
    END IF;

    -- Update stage (trigger trg_app_stage_audit will automatically create stage history record)
    UPDATE application
    SET current_stage = p_new_stage,
        withdrawn_at = CASE WHEN p_new_stage = 'Withdrawn' THEN CURRENT_TIMESTAMP ELSE withdrawn_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE application_id = p_application_id;

    -- Record audit log
    INSERT INTO audit_log (action, entity, entity_id, actor_id, details)
    VALUES (
        'STAGE_CHANGED',
        'application',
        p_application_id,
        p_actor_id,
        json_build_object('from_stage', v_current_stage, 'to_stage', p_new_stage, 'reason', p_reason)
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 13. Stored Procedure: Issue Offer (sp_issue_offer)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_issue_offer(
    p_application_id INT,
    p_stipend NUMERIC,
    p_start_date TIMESTAMPTZ,
    p_expiry_days INT,
    p_actor_id INT,
    INOUT p_offer_id INT DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_stage application_stage;
    v_posting_id INT;
    v_openings INT;
    v_filled INT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    SELECT current_stage, posting_id INTO v_stage, v_posting_id
    FROM application
    WHERE application_id = p_application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application ID % not found.', p_application_id;
    END IF;

    IF v_stage NOT IN ('Interview', 'Shortlisted') THEN
        RAISE EXCEPTION 'Cannot issue offer: Application must be in Shortlisted or Interview stage (currently: %).', v_stage;
    END IF;

    -- Verify posting has openings available
    SELECT openings, filled INTO v_openings, v_filled
    FROM internship_posting
    WHERE posting_id = v_posting_id;

    IF v_filled >= v_openings THEN
        RAISE EXCEPTION 'Cannot issue offer: All % openings for this posting are already filled.', v_openings;
    END IF;

    v_expires_at := CURRENT_TIMESTAMP + (p_expiry_days || ' days')::INTERVAL;

    -- Insert or update offer
    INSERT INTO offer (
        application_id,
        stipend,
        start_date,
        issued_at,
        expires_at,
        status
    ) VALUES (
        p_application_id,
        p_stipend,
        p_start_date,
        CURRENT_TIMESTAMP,
        v_expires_at,
        'pending'
    )
    ON CONFLICT (application_id) DO UPDATE SET
        stipend = EXCLUDED.stipend,
        start_date = EXCLUDED.start_date,
        expires_at = EXCLUDED.expires_at,
        status = 'pending',
        issued_at = CURRENT_TIMESTAMP
    RETURNING offer_id INTO p_offer_id;

    -- Move application to Offered stage
    CALL sp_advance_stage(p_application_id, 'Offered', p_actor_id, 'Offer issued with stipend ' || p_stipend);

    -- Log audit
    INSERT INTO audit_log (action, entity, entity_id, actor_id, details)
    VALUES (
        'OFFER_ISSUED',
        'offer',
        p_offer_id,
        p_actor_id,
        json_build_object('application_id', p_application_id, 'stipend', p_stipend, 'expires_at', v_expires_at)
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 14. Stored Procedure: Concurrency-Safe Offer Acceptance (sp_accept_offer)
-- Uses SELECT ... FOR UPDATE to avoid race conditions on last openings
-- and auto-withdraws other applications per University Placement Policy
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_accept_offer(
    p_offer_id INT,
    p_student_id INT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_offer RECORD;
    v_posting RECORD;
    v_app RECORD;
    v_user_id INT;
BEGIN
    -- 0. Lock the student row FOR UPDATE to establish global lock hierarchy (Student -> Offer -> App -> Posting)
    -- and serialize offer acceptance operations per student, preventing deadlocks in cascading auto-withdrawals.
    PERFORM 1 FROM student WHERE student_id = p_student_id FOR UPDATE;

    -- 1. Lock the offer row FOR UPDATE to prevent double-accept
    SELECT * INTO v_offer
    FROM offer
    WHERE offer_id = p_offer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Offer ID % not found.', p_offer_id;
    END IF;

    IF v_offer.status <> 'pending' THEN
        RAISE EXCEPTION 'Offer is no longer pending (current status: %).', v_offer.status;
    END IF;

    IF CURRENT_TIMESTAMP > v_offer.expires_at THEN
        UPDATE offer SET status = 'expired' WHERE offer_id = p_offer_id;
        RAISE EXCEPTION 'Offer has expired on % and can no longer be accepted.', v_offer.expires_at;
    END IF;

    -- 2. Lock the application row FOR UPDATE
    SELECT * INTO v_app
    FROM application
    WHERE application_id = v_offer.application_id
    FOR UPDATE;

    IF v_app.student_id <> p_student_id THEN
        RAISE EXCEPTION 'Unauthorized: Offer does not belong to student ID %.', p_student_id;
    END IF;

    SELECT user_id INTO v_user_id FROM student WHERE student_id = p_student_id;

    -- 3. Lock the posting row FOR UPDATE to safely check and claim the opening
    SELECT * INTO v_posting
    FROM internship_posting
    WHERE posting_id = v_app.posting_id
    FOR UPDATE;

    IF v_posting.filled >= v_posting.openings THEN
        RAISE EXCEPTION 'Concurrency conflict: All openings (%/%) were filled by concurrent offers.', v_posting.filled, v_posting.openings;
    END IF;

    -- 4. Mark offer as accepted
    UPDATE offer
    SET status = 'accepted',
        responded_at = CURRENT_TIMESTAMP
    WHERE offer_id = p_offer_id;

    -- 5. Mark application as Accepted
    UPDATE application
    SET current_stage = 'Accepted',
        updated_at = CURRENT_TIMESTAMP
    WHERE application_id = v_app.application_id;

    -- 6. Safely increment filled count on posting
    UPDATE internship_posting
    SET filled = filled + 1,
        status = CASE WHEN filled + 1 >= openings THEN 'closed'::posting_status ELSE status END,
        updated_at = CURRENT_TIMESTAMP
    WHERE posting_id = v_posting.posting_id;

    -- 7. Placement Policy Cascading Rule: Auto-withdraw all other active applications of this student
    UPDATE application
    SET current_stage = 'Withdrawn',
        withdrawn_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE student_id = p_student_id 
      AND application_id <> v_app.application_id
      AND current_stage NOT IN ('Accepted', 'Rejected', 'Withdrawn');

    -- Auto-decline any other active/pending offers for this student
    UPDATE offer
    SET status = 'declined',
        responded_at = CURRENT_TIMESTAMP
    WHERE application_id IN (
        SELECT application_id FROM application 
        WHERE student_id = p_student_id AND application_id <> v_app.application_id
    ) AND status = 'pending';

    -- 8. Audit log
    INSERT INTO audit_log (action, entity, entity_id, actor_id, details)
    VALUES (
        'OFFER_ACCEPTED',
        'offer',
        p_offer_id,
        v_user_id,
        json_build_object(
            'application_id', v_app.application_id,
            'posting_id', v_posting.posting_id,
            'company_id', v_posting.company_id,
            'stipend', v_offer.stipend,
            'policy', 'One-accepted-offer cascade auto-withdraw executed'
        )
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 15. Stored Procedure: Expire Stale Offers (sp_expire_offers)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_expire_offers()
LANGUAGE plpgsql AS $$
DECLARE
    v_expired_count INT;
BEGIN
    WITH expired_offers AS (
        UPDATE offer
        SET status = 'expired'
        WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP
        RETURNING offer_id, application_id
    )
    SELECT COUNT(*) INTO v_expired_count FROM expired_offers;

    IF v_expired_count > 0 THEN
        INSERT INTO audit_log (action, entity, entity_id, actor_id, details)
        VALUES (
            'OFFERS_AUTO_EXPIRED',
            'offer',
            NULL,
            NULL,
            json_build_object('expired_count', v_expired_count, 'executed_at', CURRENT_TIMESTAMP)
        );
    END IF;
END;
$$;


-- ============================================================================
-- SOURCE: db/migrations/005_alter_demo.sql
-- ============================================================================

-- ============================================================================
-- InternTrack - DDL Schema Evolution & Migration Demonstrations (005_alter_demo.sql)
-- Explicitly Demonstrating ALTER TABLE (Column Add, Constraints, Defaults) & DROP
-- Satisfying Assignment Rubric Criterion 5 (DDL: CREATE, ALTER, DROP)
-- ============================================================================

-- 1. ALTER TABLE: Add new metadata columns to entities
ALTER TABLE student 
    ADD COLUMN IF NOT EXISTS github_username VARCHAR(100),
    ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);

ALTER TABLE internship_posting 
    ADD COLUMN IF NOT EXISTS perks TEXT[],
    ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

-- 2. ALTER TABLE: Add check constraints
ALTER TABLE company
    ADD CONSTRAINT chk_company_industry_nonempty 
    CHECK (length(trim(industry)) > 0);

-- 3. ALTER TABLE: Alter column defaults
ALTER TABLE student 
    ALTER COLUMN portfolio_url SET DEFAULT NULL;

-- 4. Demonstration of Safe DROP Operations:
-- Create a demonstration view, index, and column, then safely DROP them
CREATE OR REPLACE VIEW v_temp_demo_view AS 
SELECT student_id, usn, full_name FROM student;

DROP VIEW IF EXISTS v_temp_demo_view;

CREATE INDEX IF NOT EXISTS idx_temp_demo_student_year ON student (year);
DROP INDEX IF EXISTS idx_temp_demo_student_year;
