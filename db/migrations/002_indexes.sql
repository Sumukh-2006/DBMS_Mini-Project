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
