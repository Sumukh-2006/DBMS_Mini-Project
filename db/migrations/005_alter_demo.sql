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
