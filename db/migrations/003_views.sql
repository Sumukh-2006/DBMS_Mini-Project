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
