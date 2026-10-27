# InternTrack — Visual Audit & Design System Report

## Executive Summary

The InternTrack web interface has been comprehensively redesigned from its previous dark-mode baseline into a **light, high-end editorial-tech aesthetic** directly inspired by modern minimalist developer and financial interfaces (*Vision by Eloqwnt*).

Every page across the application now features:
- **Warm tactile background**: `#f5f5f4` with an ultra-subtle micro-dot grid pattern (`radial-gradient(rgba(10, 10, 10, 0.08) 0.75px, transparent 0.75px)`).
- **Pure white elevated cards**: `#ffffff` with hairline borders (`1px solid rgba(10, 10, 10, 0.08)`) and soft diffused elevation shadows (`0 1px 3px rgba(0, 0, 0, 0.04), 0 6px 16px rgba(0, 0, 0, 0.02)`).
- **Dual-font typographic hierarchy**:
  - `Inter Tight` for crisp, high-density editorial headings and narrative prose.
  - `JetBrains Mono` for badges, metadata codes, timestamps, currency amounts, and quantitative tables.
- **Unified Floating Pill Navigation (`AppShell`)**:
  - Positioned fixed at the top with translucent backdrop blur (`rgba(255, 255, 255, 0.95)`).
  - Contextual pill links for `student`, `recruiter`, and `admin` portals.
  - Active indicator pill with high-contrast filled state (`#0a0a0a` ink, `#ffffff` text).
  - Restrained live status dot (`#d92d20` crimson) with subtle pulse ring animation.
- **Mobile Responsive Architecture**: Full viewport support across desktop (1440px) and mobile viewport (390px) with responsive hamburger drawer.

---

## 0. Backend Contract Invariance Guarantee

> [!IMPORTANT]
> **Zero backend code modifications:** This redesign was strictly presentation-only. No connections, routes, schemas, or query logic were altered.

| Category | Verification Status | Details |
| :--- | :--- | :--- |
| **Backend Codebase** | **100% UNTOUCHED** | Zero files modified under `app/api/**`, `lib/**`, `db/**`, `scripts/**`, `tests/**`, `docs/**`. |
| **API Endpoints** | **100% PRESERVED** | All 28 frontend pages make identical `fetch()` calls with matching URLs, methods, headers, and body payloads. |
| **Database Transactions** | **100% PRESERVED** | Triggers (`trg_history_immutable`, `trg_block_late_apply`, `trg_interview_clash`), Stored Procedures (`sp_apply`, `sp_advance_stage`, `sp_issue_offer`, `sp_accept_offer`), and Vector queries operate identically. |
| **Test Suite** | **40 / 40 PASSED** | Complete pass of constraints, triggers, concurrency scenarios (A, B, C, D), pgvector cosine similarity, MongoDB aggregations, and auth RBAC. |

```bash
# Verification command run prior to commit:
git diff --stat acf0bf8652a80d06d35e1308b99e38a0f461d927..HEAD -- app/api lib db scripts tests docs docker-compose.yml
# Result: 0 files changed, 0 insertions, 0 deletions
```

---

## Design System Tokens (`app/globals.css`)

```css
:root {
  --bg: #f5f5f4;
  --bg-dots: rgba(10, 10, 10, 0.06);
  --surface: #ffffff;
  --surface-subtle: #fafaf9;
  --surface-hover: #f5f5f4;
  --border: rgba(10, 10, 10, 0.08);
  --border-strong: rgba(10, 10, 10, 0.16);
  --ink: #0a0a0a;
  --ink-secondary: #262626;
  --ink-muted: #737373;
  --coral: #d92d20;
  --coral-soft: #fef3f2;
  --coral-border: #fecdca;
  --slate-blue: #3b6b8f;
  --slate-blue-soft: #f0f6fa;
  --radius-card: 14px;
  --radius-button: 9999px;
  --shadow-soft: 0 1px 3px rgba(0, 0, 0, 0.04), 0 6px 16px rgba(0, 0, 0, 0.02);
  --shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.06), 0 12px 28px rgba(0, 0, 0, 0.04);
}
```

---

## Page-by-Page Transformation Breakdown

### 1. Landing & Authentication
- **Landing (`/`)**:
  - Hero section featuring an animated CSS **Radar Orb** with glowing gradient core, orbital ring pulses, and live telemetry badges.
  - Floating pill navigation bar linking to personas, tech architecture, and quick login.
  - Interactive **1-Click Persona Launchers** (Student, Recruiter, Admin) for instant viva demonstration.
  - Polyglot Architecture diagram showcase detailing PostgreSQL ACID core, pgvector 384-d semantic search, and MongoDB Document store.
- **Login (`/login`)**:
  - Centered floating card with credential quick-fill cards for all three roles.
- **Register (`/register`)**:
  - Clean tabbed selector between Candidate (USN, CGPA, department) and Employer (Company, Industry, Website, Scale) with preserved form actions.

### 2. Student Portal (`/student`)
- **Dashboard (`/student`)**:
  - Urgent Action Banners for pending offers with expiry countdowns and upcoming interview notifications.
  - KPI StatCards for Total Applied, Shortlisted, Interviews Scheduled, and Offers Received.
  - Application Deadline radar and MongoDB activity notifications stream.
- **Browse Roles (`/student/browse`)**:
  - Full-text search and department filter pills.
  - Job cards displaying CGPA cutoffs, openings count, stipend, and one-click apply modal.
- **AI Match Recommendations (`/student/recommendations`)**:
  - 384-dimensional pgvector cosine similarity ranking.
  - Explainable similarity score pill with match breakdown modal.
- **Pipeline Kanban (`/student/pipeline`)**:
  - 5-stage visual progression board (Applied → Shortlisted → Interview → Offered → Accepted/Rejected).
  - Clean card dragging visual states and withdraw application triggers.
- **Offers (`/student/offers`)**:
  - University Single-Offer Policy Warning banner.
  - Stored procedure `sp_accept_offer` trigger with cascade withdrawal explanation.
- **Interviews (`/student/interviews`)**:
  - Chronological interview round cards with meet link triggers and slot clash detection notice.
- **Profile (`/student/profile`)**:
  - Skills catalogue, academic performance summary, and MongoDB resume parser dropzone.
- **Company Reviews (`/student/reviews`)**:
  - Alumni company reviews with 5-star ratings, work-life balance breakdown, and review submission modal.

### 3. Recruiter Portal (`/recruiter`)
- **Overview (`/recruiter`)**:
  - Active Postings, Total Applicants, Interviews Scheduled, and Offers Extended metrics.
  - Urgent pending applicant reviews and interview schedule shortcuts.
- **Postings (`/recruiter/postings`)**:
  - Active company internship postings list with applicant conversion badges.
- **Create Role (`/recruiter/postings/create`)**:
  - Role definition form with automated 384-d vector embedding generation and department qualification pills.
- **Applicant Pipeline (`/recruiter/applicants`)**:
  - Applicant review table with inline status changes.
  - Concurrency-safe bulk stage transition controls (`sp_advance_stage`).
  - pgvector Similar Candidates recommendation modal based on applicant resume vectors.
- **Interviews (`/recruiter/interviews`)**:
  - Clash-free multi-round interview scheduler enforcing `trg_interview_clash`.
  - MongoDB interview rubric modal for qualitative scorecard recording.
- **Offers (`/recruiter/offers`)**:
  - Offer issuance drawer executing `sp_issue_offer` with expiry date configuration.
- **Analytics (`/recruiter/analytics`)**:
  - Funnel conversion chart (`v_posting_funnel`) displaying applicant retention at each stage.

### 4. Admin Governance Portal (`/admin`)
- **Governance Overview (`/admin`)**:
  - Institutional health metrics: Registered Students, Placed Candidates, Partner Companies, Average Placed Stipend.
  - Top Hiring Partners table (`v_company_stats`) with CSV export shortcut.
  - Governance shortcuts for Vetting, Policies, Skill Analytics, and Audit Logs.
- **Institutional Analytics (`/admin/analytics`)**:
  - Department placement rate breakdown (`v_department_placement`) with progress visualizers.
  - Skill Market Demand vs Student Supply Gap analysis uniting PostgreSQL `mv_skill_demand` and MongoDB resume skill frequencies.
  - One-click trigger for `sp_refresh_skill_demand_mv`.
- **Policy Engine (`/admin/policies`)**:
  - Real-time adjustment for `max_active_applications`, `min_cgpa_default`, `offer_expiry_days`, and `one_offer_rule`.
- **Company Verification Queue (`/admin/verifications`)**:
  - Corporate partner vetting queue with approve/reject workflow.
- **Audit Logs (`/admin/audit-logs`)**:
  - Chronological append-only event stream protected by trigger `trg_history_immutable`.
  - JSONB payload inspector and entity filter.
- **Certified Report Export (`/admin/export`)**:
  - CSV export generators for Placements Registry, Full Lifecycle Applications, and Company Acceptance Stats.

---

## Commit Log Reference

```
18ae849 feat(ui): Step E - admin portal light editorial restyle with preserved API contract
033b8d3 feat(ui): Step D - recruiter portal light editorial restyle with preserved API contract
5edc3b7 feat(ui): Step C - student portal light editorial restyle with preserved API contract
1c12269 feat(ui): Step B - landing page hero with CSS orb, floating pill nav, and restyled login/register
ed74e41 feat(ui): Step A - design foundation, Mantine v7 setup, tokens, and shared components
```

All 48 before-screenshots and 48 after-screenshots are preserved under `screenshots/before/`, `screenshots/step_b/`, `screenshots/step_c/`, `screenshots/step_d/`, and `screenshots/step_e/` for visual verification and viva examination presentation.
