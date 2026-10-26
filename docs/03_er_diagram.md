# InternTrack — Entity-Relationship (ER) Diagram & Conceptual Schema

**Course:** Database Management Systems (UE22CS341AA / UE23CS351AA) — Experiential Learning Level 3  
**Institution:** PES University, Department of Computer Science and Engineering  

---

## 1. Conceptual ER Modeling Overview

InternTrack models the complete university internship placement lifecycle. The data model distinguishes between:
1. **Core Relational Entities (PostgreSQL):** Users, Students, Recruiters, Companies, Departments, Skills, Internship Postings, Applications, Interviews, Offers, Audit Logs, and Placement Policies.
2. **Semi-Structured Document Entities (MongoDB):** Resumes, Posting Documents, Interview Feedback Rubrics, Experience Reviews, Notifications, and Activity Logs.
3. **High-Dimensional Vector Attributes (pgvector):** Dense 384-dimensional semantic embeddings stored directly on `student.profile_embedding` and `internship_posting.embedding`.

---

## 2. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    APP_USER ||--o| STUDENT : "specializes as"
    APP_USER ||--o| RECRUITER : "specializes as"
    DEPARTMENT ||--o{ STUDENT : "enrolls"
    DEPARTMENT ||--o{ POSTING_ELIGIBLE_DEPT : "whitelisted in"
    
    COMPANY ||--o{ RECRUITER : "employs"
    COMPANY ||--o{ INTERNSHIP_POSTING : "offers"
    
    STUDENT ||--o{ STUDENT_SKILL : "possesses"
    SKILL ||--o{ STUDENT_SKILL : "classified as"
    SKILL ||--o{ POSTING_SKILL : "required in"
    
    INTERNSHIP_POSTING ||--o{ POSTING_SKILL : "specifies"
    INTERNSHIP_POSTING ||--o{ POSTING_ELIGIBLE_DEPT : "restricts to"
    INTERNSHIP_POSTING ||--o{ APPLICATION : "receives"
    
    STUDENT ||--o{ APPLICATION : "submits"
    APPLICATION ||--o{ APPLICATION_STAGE_HISTORY : "tracks"
    APPLICATION ||--o{ INTERVIEW_ROUND : "advances to"
    APPLICATION ||--o| OFFER : "results in"
    
    RECRUITER ||--o{ INTERVIEW_ROUND : "conducts"
    
    APP_USER ||--o{ AUDIT_LOG : "triggers"
    
    %% Entity definitions with key attributes
    APP_USER {
        int user_id PK
        string email UK
        string password_hash
        string role "student | recruiter | admin"
        timestamp created_at
    }

    STUDENT {
        int student_id PK
        int user_id FK
        string usn UK
        string full_name
        int dept_id FK
        decimal cgpa
        int grad_year
        vector profile_embedding "384-d dense vector"
        boolean is_placed
    }

    RECRUITER {
        int recruiter_id PK
        int user_id FK
        int company_id FK
        string full_name
        string designation
        string phone
    }

    COMPANY {
        int company_id PK
        string name UK
        string website
        string industry
        string tier "Tier 1 | Tier 2 | Dream | Open"
        boolean verified
    }

    DEPARTMENT {
        int dept_id PK
        string code UK
        string name
    }

    SKILL {
        int skill_id PK
        string name UK
        string category
    }

    INTERNSHIP_POSTING {
        int posting_id PK
        int company_id FK
        int created_by FK
        string title
        text description
        string location
        decimal stipend
        decimal min_cgpa
        int total_openings
        int filled_openings
        string status "Draft | Active | Closed"
        timestamp deadline
        vector embedding "384-d dense vector"
    }

    APPLICATION {
        int application_id PK
        int student_id FK
        int posting_id FK
        string current_stage "Applied | Shortlisted | Interview | Offered | Accepted | Rejected | Withdrawn"
        decimal match_score
        timestamp applied_at
    }

    APPLICATION_STAGE_HISTORY {
        int history_id PK
        int application_id FK
        string from_stage
        string to_stage
        int changed_by FK
        text notes
        timestamp changed_at
    }

    INTERVIEW_ROUND {
        int interview_id PK
        int application_id FK
        int recruiter_id FK
        int round_number
        string round_type "Technical | HR | Managerial"
        timestamp scheduled_start
        timestamp scheduled_end
        string status "Scheduled | Completed | Cancelled"
        string meeting_link
    }

    OFFER {
        int offer_id PK
        int application_id FK, UK
        decimal stipend
        date start_date
        date expires_at
        string status "issued | accepted | rejected | expired | revoked"
        timestamp responded_at
    }

    AUDIT_LOG {
        int log_id PK
        int user_id FK
        string action
        string entity_name
        int entity_id
        jsonb old_values
        jsonb new_values
        timestamp timestamp
    }
```

---

## 3. Cardinality Ratios & Participation Constraints

| Relationship | Cardinality Ratio | Student / Posting Participation | Justification |
|---|---|---|---|
| `APP_USER` ➔ `STUDENT` | $1 : (0..1)$ | Total for student users; Partial for admin/recruiter. | Every student profile requires exactly one authentication account. |
| `APP_USER` ➔ `RECRUITER` | $1 : (0..1)$ | Total for recruiters; Partial for admin/student. | Recruiters authenticate through `app_user` before linking to a company. |
| `COMPANY` ➔ `RECRUITER` | $1 : N$ | Partial for company; Total for recruiter. | A company may have multiple recruiting officers; each recruiter belongs to one company. |
| `DEPARTMENT` ➔ `STUDENT` | $1 : N$ | Total for student; Partial for department. | Every student must be enrolled in exactly one academic department. |
| `COMPANY` ➔ `INTERNSHIP_POSTING` | $1 : N$ | Total for posting; Partial for company. | A posting is authored by exactly one company; a company can issue multiple postings. |
| `STUDENT` ➔ `APPLICATION` | $1 : N$ | Partial for student; Total for application. | A student can apply to zero or many postings (bounded by policy); an application must be tied to a student. |
| `INTERNSHIP_POSTING` ➔ `APPLICATION` | $1 : N$ | Total for application; Partial for posting. | A posting can receive zero or many candidate applications. |
| `APPLICATION` ➔ `OFFER` | $1 : (0..1)$ | Partial for application; Total for offer. | An application receives at most one formal offer (`UNIQUE (application_id)`). |
| `APPLICATION` ➔ `APPLICATION_STAGE_HISTORY` | $1 : N$ | Total (Weak identification). | Stage history rows cannot exist without a parent application (`ON DELETE CASCADE`). |
| `INTERVIEW_ROUND` ➔ `APPLICATION` | $N : 1$ | Total for interview; Partial for application. | An interview belongs to one candidate application; an application can undergo multiple rounds. |

---

## 4. Weak Entity Identification

- **`APPLICATION_STAGE_HISTORY`**: Represents a temporal weak entity dependent on the `APPLICATION` identifying owner. If an application record is purged, its corresponding stage progression audit records cascade (`ON DELETE CASCADE`), though during normal runtime updates, `trg_history_immutable` prevents modification or deletion.
- **`POSTING_ELIGIBLE_DEPT` & `POSTING_SKILL`**: Associative bridge entities with composite primary keys:
  - `(posting_id, dept_id)`
  - `(posting_id, skill_id)`
- **`STUDENT_SKILL`**: Associative bridge entity with composite primary key:
  - `(student_id, skill_id)`
