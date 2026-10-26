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
