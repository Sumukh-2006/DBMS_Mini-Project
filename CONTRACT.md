# InternTrack — Frontend UI Contract Snapshot (CONTRACT.md)

**Generated:** Safety Baseline before UI Redesign  
**Branch:** `ui-redesign`  
**Purpose:** Strict contract reference documenting all API endpoints, HTTP methods, payload keys, response keys, form field definitions, and client-side redirects across all 28 UI files in `app/`.  
**Rule:** During redesign, NO fetch URL, HTTP method, body key, query parameter, form input name/id, or redirect target may be modified.

---

## 1. Authentication & Public Entry Pages

### `app/page.js` (Landing / Role Switcher)
- **Fetches:**
  - `POST /api/auth/login`
    - Headers: `{ 'Content-Type': 'application/json' }`
    - Body: `{ email, password: 'password123' }`
    - Response: `{ user: { role } }`
- **Redirects:**
  - `router.push(redirectPath)` where `redirectPath` is `/student`, `/recruiter`, or `/admin`
- **Interactive Controls:**
  - Demo quick-login buttons for Student (`rohan@pesu.pes.edu`), Recruiter (`vikram@google.com`), and Admin (`admin@pesu.pes.edu`)

### `app/login/page.js` (Login Page)
- **Forms & Inputs:**
  - `<form onSubmit={handleSubmit}>`
  - Input `email`: `type="email"`, `value={email}`, `onChange`
  - Input `password`: `type="password"`, `value={password}`, `onChange`
  - Button: `type="submit"`
- **Fetches:**
  - `POST /api/auth/login`
    - Headers: `{ 'Content-Type': 'application/json' }`
    - Body: `{ email, password }`
    - Response: `{ user: { role } }`
- **Redirects:**
  - If `role === 'student'`: `router.push('/student')`
  - Else if `role === 'recruiter'`: `router.push('/recruiter')`
  - Else if `role === 'admin'`: `router.push('/admin')`
  - Else: `router.push('/')`

### `app/register/page.js` (Registration Page)
- **Forms & Inputs:**
  - `<form onSubmit={handleSubmit}>`
  - Role toggles: `'student'` | `'recruiter'`
  - Input `email`: `type="email"`, `name="email"`, `value={formData.email}`
  - Input `password`: `type="password"`, `name="password"`, `value={formData.password}`
  - Student-specific fields:
    - Input `fullName`: `type="text"`, `name="fullName"`
    - Input `usn`: `type="text"`, `name="usn"`
    - Select `deptId`: `name="deptId"`
    - Input `cgpa`: `type="number"`, `step="0.01"`, `name="cgpa"`
    - Input `year`: `type="number"`, `name="year"`
    - Input `gradYear`: `type="number"`, `name="gradYear"`
  - Recruiter-specific fields:
    - Select `companyId`: `name="companyId"`
    - Input `newCompanyName`: `type="text"`, `name="newCompanyName"`
    - Input `industry`: `type="text"`, `name="industry"`
    - Input `designation`: `type="text"`, `name="designation"`
- **Fetches:**
  - `POST /api/auth/register`
    - Headers: `{ 'Content-Type': 'application/json' }`
    - Body: `{ role, ...formData }`
    - Response: `{ user: { role } }`
- **Redirects:**
  - If `role === 'student'`: `router.push('/student')`
  - Else: `router.push('/recruiter')`

---

## 2. Student Portal (`app/student/**`)

### `app/student/layout.js` (Portal Shell & Session Guard)
- **Fetches:**
  - `GET /api/auth/me` -> Response: `{ authenticated: boolean, user: object }`
  - `POST /api/auth/logout` -> Triggered on Sign Out button click
- **Redirects:**
  - If `!data.authenticated || data.user.role !== 'student'`: `router.push('/login')`
  - On error / catch: `router.push('/login')`
  - On logout success: `router.push('/login')`

### `app/student/page.js` (Student Dashboard Overview)
- **Fetches:**
  - `GET /api/student/dashboard`
    - Response keys: `student`, `stats { activeApplications, interviewsScheduled, offersPending, placed }`, `recentApplications[]`, `upcomingInterviews[]`, `pendingOffers[]`
- **Redirects:** None

### `app/student/browse/page.js` (Browse Postings & Search)
- **Inputs & Filters:**
  - Search input: `search` (Full-text query)
  - Mode filter select: `mode` (all, remote, on-site, hybrid)
  - Location input: `location`
  - Min CGPA input: `minCgpa`
- **Fetches:**
  - `GET /api/student/postings?search=...&mode=...&location=...&minCgpa=...`
    - Response keys: `postings[]` with `posting_id`, `title`, `company_name`, `location`, `mode`, `stipend`, `openings`, `filled`, `min_cgpa`, `deadline`, `skills[]`, `applied`, `match_pct`
  - `POST /api/student/apply`
    - Headers: `{ 'Content-Type': 'application/json' }`
    - Body: `{ postingId }`
    - Response: `{ success: true, message: string }`

### `app/student/pipeline/page.js` (Application Lifecycle & Stages)
- **Fetches:**
  - `GET /api/student/pipeline`
    - Response keys: `applications[]` with `application_id`, `posting_id`, `title`, `company_name`, `current_stage`, `applied_at`, `history[]`
  - `POST /api/recruiter/applications/bulk-stage` (Used for student self-withdrawal)
    - Headers: `{ 'Content-Type': 'application/json' }`
    - Body: `{ applicationIds: [applicationId], newStage: 'Withdrawn', reason: 'Student initiated withdrawal from portal' }`
    - Response: `{ results: { successful: [], failed: [] } }`

### `app/student/offers/page.js` (Offer Review & Acceptance Cascade)
- **Fetches:**
  - `GET /api/student/offers`
    - Response keys: `offers[]` with `offer_id`, `application_id`, `title`, `company_name`, `stipend`, `start_date`, `expires_at`, `status`
  - `POST /api/student/offers`
    - Headers: `{ 'Content-Type': 'application/json' }`
    - Body: `{ offerId, action: 'accept' | 'decline' }`
    - Response: `{ success: true, message: string }`

### `app/student/profile/page.js` (Profile, Skills & Resume Parser)
- **Forms & Inputs:**
  - `<form onSubmit={handleSaveProfile}>`
  - Input `phone`: `type="text"`
  - Textarea `about`
  - Input `portfolioUrl`: `type="url"`
  - Skill pills selection / toggle
  - Resume parser textarea: `resumeText` + button "Extract Skills & Auto-Fill"
- **Fetches:**
  - `GET /api/student/profile`
    - Response keys: `student { full_name, usn, cgpa, phone, about, portfolio_url, skills[] }`, `allSkills[]`
  - `PUT /api/student/profile`
    - Headers: `{ 'Content-Type': 'application/json' }`
    - Body: `{ phone, about, portfolioUrl, skills: skillIds[] }`
  - `POST /api/student/resume`
    - Headers: `{ 'Content-Type': 'application/json' }`
    - Body: `{ rawText: resumeText, parsedData: { summary: string } }`
    - Response keys: `{ skillsMatched: string[] }`

### `app/student/recommendations/page.js` (pgvector Cosine Similarity Match)
- **Fetches:**
  - `GET /api/student/recommendations`
    - Response keys: `recommendations[]` with `posting_id`, `title`, `company_name`, `similarity_pct`, `openings`, `deadline`, `required_skills[]`, `applied`
  - `POST /api/student/apply`
    - Body: `{ postingId }`

### `app/student/interviews/page.js` (Scheduled Interviews & Panels)
- **Fetches:**
  - `GET /api/student/interviews`
    - Response keys: `interviews[]` with `interview_id`, `title`, `company_name`, `round_no`, `scheduled_at`, `duration_min`, `mode`, `status`, `link_or_room`, `panelists[]`

### `app/student/reviews/page.js` (Company Experience & Multi-Criteria Ratings)
- **Forms & Inputs:**
  - `<form onSubmit={handleSubmitReview}>`
  - Select `selectedCompanyId`
  - Rating inputs: `culture`, `stipend`, `learning`, `work_life` (1-5 range)
  - Textarea `reviewText`
  - Tags selection / input
- **Fetches:**
  - `GET /api/reviews` -> Response: `reviews[]`, `averages[]`, `topTags[]`
  - `GET /api/student/postings` -> Response: `postings[]`
  - `POST /api/reviews`
    - Headers: `{ 'Content-Type': 'application/json' }`
    - Body: `{ companyId: selectedCompanyId, ratings: { culture, stipend, learning, work_life }, text: reviewText, tags: string[] }`

---

## 3. Recruiter Portal (`app/recruiter/**`)

### `app/recruiter/layout.js` (Recruiter Shell & Session Guard)
- **Fetches:**
  - `GET /api/auth/me` -> Response: `{ authenticated: boolean, user: object }`
  - `POST /api/auth/logout` -> Triggered on Sign Out
- **Redirects:**
  - If `!data.authenticated || data.user.role !== 'recruiter'`: `router.push('/login')`
  - On error / catch: `router.push('/login')`
  - On logout success: `router.push('/login')`

### `app/recruiter/page.js` (Recruiter Dashboard Overview)
- **Fetches:**
  - `GET /api/recruiter/dashboard`
    - Response keys: `company`, `stats { totalPostings, totalApplicants, scheduledInterviews, offersAccepted }`, `recentApplicants[]`, `activePostings[]`

### `app/recruiter/postings/page.js` (Active Job Postings)
- **Fetches:**
  - `GET /api/recruiter/postings`
    - Response keys: `postings[]` with `posting_id`, `title`, `openings`, `filled`, `min_cgpa`, `deadline`, `status`, `applicant_count`

### `app/recruiter/postings/create/page.js` (Create New Internship Posting)
- **Forms & Inputs:**
  - `<form onSubmit={handleSubmit}>`
  - Input `title`: text
  - Textarea `description`: text
  - Input `location`: text
  - Select `mode`: remote | on-site | hybrid
  - Input `stipend`: number
  - Input `openings`: number
  - Input `minCgpa`: number (step 0.01)
  - Input `deadline`: datetime-local
  - Input `startDate`: date
  - Input `durationWeeks`: number
  - Department check checkboxes: `selectedDepts[]`
  - Skills multi-select: `selectedSkills[]`
- **Fetches:**
  - `GET /api/student/profile` -> Response: `{ allSkills: [] }`
  - `POST /api/recruiter/postings`
    - Headers: `{ 'Content-Type': 'application/json' }`
    - Body: `{ title, description, location, mode, stipend, openings, deadline, startDate, durationWeeks, minCgpa, skills: selectedSkills, eligibleDepts: selectedDepts }`
- **Redirects:**
  - On success: `router.push('/recruiter/postings')`

### `app/recruiter/applicants/page.js` (Applicant Funnel, Bulk-Stage & Candidates)
- **Fetches:**
  - `GET /api/recruiter/postings` -> Response: `postings[]`
  - `GET /api/recruiter/postings/${selectedPostingId}/applicants`
    - Response keys: `applicants[]` with `application_id`, `student_id`, `full_name`, `usn`, `cgpa`, `current_stage`, `applied_at`, `skills[]`, `similarity_pct`
  - `POST /api/recruiter/applications/bulk-stage`
    - Headers: `{ 'Content-Type': 'application/json' }`
    - Body: `{ applicationIds: selectedAppIds, newStage: bulkStage, reason: bulkReason }`
  - `GET /api/recruiter/candidates/${studentId}/similar`
    - Response keys: `similarCandidates[]`

### `app/recruiter/interviews/page.js` (Schedule Interview & Feedback Rubric)
- **Forms & Inputs:**
  - `<form onSubmit={handleScheduleSubmit}>`:
    - Select `selectedAppId`
    - Input `roundNo`: number
    - Input `scheduledAt`: datetime-local
    - Input `durationMin`: number
    - Input `linkOrRoom`: text
  - `<form onSubmit={handleFeedbackSubmit}>`:
    - Hidden / selected `feedbackInterviewId`
    - Rubric rating inputs (dynamic keys: problemSolving, coding, communication, domainKnowledge)
    - Textarea `comments`
    - Select `recommendation`: 'strong_hire' | 'hire' | 'hold' | 'no_hire'
- **Fetches:**
  - `GET /api/recruiter/postings`
  - `GET /api/recruiter/postings/${p.posting_id}/applicants`
  - `POST /api/recruiter/interviews`
    - Body: `{ applicationId: selectedAppId, roundNo, scheduledAt, durationMin, linkOrRoom }`
  - `POST /api/recruiter/interviews/feedback`
    - Body: `{ interviewId: feedbackInterviewId, rubric, comments, recommendation }`

### `app/recruiter/offers/page.js` (Issue Formal Offer)
- **Forms & Inputs:**
  - `<form onSubmit={handleIssueOffer}>`
  - Select `selectedAppId`
  - Input `stipend`: number
  - Input `startDate`: date
  - Input `expiryDays`: number
- **Fetches:**
  - `GET /api/recruiter/postings`
  - `GET /api/recruiter/postings/${p.posting_id}/applicants`
  - `POST /api/recruiter/offers`
    - Body: `{ applicationId: selectedAppId, stipend, startDate, expiryDays }`

### `app/recruiter/analytics/page.js` (Posting Funnel Analytics)
- **Fetches:**
  - `GET /api/recruiter/analytics/funnel`
    - Response keys: `funnel[]` with `posting_id`, `title`, `applied`, `shortlisted`, `interview`, `offered`, `accepted`, `rejected`, `withdrawn`

---

## 4. Admin Portal (`app/admin/**`)

### `app/admin/layout.js` (Admin Shell & Session Guard)
- **Fetches:**
  - `GET /api/auth/me` -> Response: `{ authenticated: boolean, user: object }`
  - `POST /api/auth/logout` -> Triggered on Sign Out
- **Redirects:**
  - If `!data.authenticated || data.user.role !== 'admin'`: `router.push('/login')`
  - On error / catch: `router.push('/login')`
  - On logout success: `router.push('/login')`

### `app/admin/page.js` (Admin Dashboard Overview)
- **Fetches:**
  - `GET /api/admin/dashboard`
    - Response keys: `stats { totalStudents, totalCompanies, totalPostings, totalPlaced, placementRate }`, `pendingVerifications[]`, `recentAudits[]`

### `app/admin/analytics/page.js` (Department Placements & Materialized View Refresh)
- **Fetches:**
  - `GET /api/admin/analytics/department` -> Response: `departmentStats[]`
  - `GET /api/admin/analytics/skill-demand` -> Response: `skillDemand[]` (from `mv_skill_demand`)
  - `POST /api/admin/analytics/skill-demand`
    - Triggers non-blocking `sp_refresh_skill_demand_mv()`
    - Response: `{ success: true, message: string }`

### `app/admin/policies/page.js` (University Placement Policies)
- **Fetches:**
  - `GET /api/admin/policies` -> Response: `policies[]` with `key`, `value`, `description`, `updated_at`
  - `PUT /api/admin/policies`
    - Headers: `{ 'Content-Type': 'application/json' }`
    - Body: `{ key, value: editValues[key] }`
    - Response: `{ success: true, message: string }`

### `app/admin/verifications/page.js` (Company Vetting & Approval)
- **Fetches:**
  - `GET /api/admin/verifications` -> Response: `unverifiedCompanies[]` with `company_id`, `name`, `industry`, `created_at`
  - `POST /api/admin/verifications`
    - Headers: `{ 'Content-Type': 'application/json' }`
    - Body: `{ companyId, action: 'approve' | 'reject' }`
    - Response: `{ success: true, message: string }`

### `app/admin/audit-logs/page.js` (Security Audit Log Viewer)
- **Fetches:**
  - `GET /api/admin/audit-logs?limit=...&offset=...&action=...`
    - Response keys: `logs[]` with `log_id`, `user_id`, `email`, `role`, `action`, `entity_type`, `entity_id`, `created_at`, `details`

### `app/admin/export/page.js` (CSV Data Export Engine)
- **Fetches:**
  - `GET /api/admin/reports/export?type=placements | students | postings | audit_logs`
    - Response: CSV text/blob for download

---

## 5. Verification Checklist for Redesign Process

For every portal refactor, this checklist must be re-validated:
- [ ] No fetch URL changed.
- [ ] No HTTP method changed (`GET`, `POST`, `PUT`).
- [ ] No request body key added, removed, or renamed.
- [ ] No JSON response key expectation altered.
- [ ] No form input `name` or `id` attribute modified.
- [ ] No `router.push()` or redirect destination altered.
- [ ] No component state structure or effect dependency array altered.
- [ ] `npm run build` exits 0.
- [ ] `npm test` passes 40/40.
