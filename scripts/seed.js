// scripts/seed.js
// Comprehensive seed script for PostgreSQL and MongoDB
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { pool, query, withTransaction } = require('../lib/db');
const { getMongoDb, initMongoIndexes } = require('../lib/mongo');
const { hashPassword } = require('../lib/auth');
const { generateEmbedding, vectorToSql } = require('../lib/embeddings');

async function seed() {
  console.log('--- Starting InternTrack Database Seeding ---');

  // Safety Guard: Abort if running in production without explicit confirmation
  const isProduction = process.env.NODE_ENV === 'production';
  const allowDestructive = process.env.ALLOW_DESTRUCTIVE_SEED === 'true';

  if (isProduction && !allowDestructive) {
    console.error('CRITICAL SAFETY ABORT: scripts/seed.js was invoked in a PRODUCTION environment without ALLOW_DESTRUCTIVE_SEED=true.');
    console.error('Seeding performs a destructive TRUNCATE across all 17 tables and deletes all MongoDB documents.');
    console.error('To proceed, explicitly set ALLOW_DESTRUCTIVE_SEED=true.');
    process.exit(1);
  }

  // 1. Password hash for demo users
  const demoHash = await hashPassword('password123');

  // 2. Initialize MongoDB Indexes
  await initMongoIndexes();
  const mongoDb = await getMongoDb();

  // Clear existing MongoDB collections
  await mongoDb.collection('resumes').deleteMany({});
  await mongoDb.collection('posting_documents').deleteMany({});
  await mongoDb.collection('interview_feedback').deleteMany({});
  await mongoDb.collection('experience_reviews').deleteMany({});
  await mongoDb.collection('notifications').deleteMany({});
  await mongoDb.collection('activity_logs').deleteMany({});
  console.log('Cleaned existing MongoDB collections.');

  // 3. PostgreSQL Seeding
  await withTransaction(async (client) => {
    // Truncate existing relational data
    await client.query(`
      TRUNCATE TABLE 
        audit_log, policy_config, offer, interview_panelist, interview,
        application_stage_history, application, posting_eligible_dept,
        posting_skill, internship_posting, student_skill, skill,
        recruiter, company, student, department, app_user
      RESTART IDENTITY CASCADE;
    `);
    console.log('Truncated PostgreSQL tables.');

    // Seed Policy Config
    await client.query(`
      INSERT INTO policy_config (key, value, description) VALUES
      ('max_active_applications', '5', 'Maximum number of concurrent active applications per student'),
      ('one_offer_rule', 'true', 'Placement policy enforcing single accepted offer per academic session'),
      ('offer_expiry_days', '7', 'Standard window in days before an unaccepted offer expires'),
      ('min_cgpa_default', '6.00', 'Institutional default cutoff CGPA for eligibility');
    `);

    // Seed Departments
    const deptRes = await client.query(`
      INSERT INTO department (name, code) VALUES
      ('Computer Science and Engineering', 'CSE'),
      ('Artificial Intelligence & Machine Learning', 'AIML'),
      ('Electronics and Communication Engineering', 'ECE'),
      ('Information Science and Engineering', 'ISE'),
      ('Mechanical Engineering', 'MECH'),
      ('Biotechnology', 'BT')
      RETURNING dept_id, code;
    `);
    const depts = {};
    deptRes.rows.forEach(r => { depts[r.code] = r.dept_id; });

    // Seed Skills
    const skillsList = [
      { name: 'Python', category: 'Languages' },
      { name: 'Java', category: 'Languages' },
      { name: 'C++', category: 'Languages' },
      { name: 'TypeScript', category: 'Languages' },
      { name: 'JavaScript', category: 'Languages' },
      { name: 'Go', category: 'Languages' },
      { name: 'Rust', category: 'Languages' },
      { name: 'SQL', category: 'Databases' },
      { name: 'PostgreSQL', category: 'Databases' },
      { name: 'MongoDB', category: 'Databases' },
      { name: 'Redis', category: 'Databases' },
      { name: 'React', category: 'Frontend' },
      { name: 'Next.js', category: 'Frontend' },
      { name: 'Tailwind CSS', category: 'Frontend' },
      { name: 'Node.js', category: 'Backend' },
      { name: 'Express', category: 'Backend' },
      { name: 'Distributed Systems', category: 'Systems' },
      { name: 'Microservices', category: 'Systems' },
      { name: 'Docker', category: 'Cloud & DevOps' },
      { name: 'Kubernetes', category: 'Cloud & DevOps' },
      { name: 'AWS', category: 'Cloud & DevOps' },
      { name: 'CI/CD', category: 'Cloud & DevOps' },
      { name: 'Linux', category: 'Systems' },
      { name: 'Data Structures & Algorithms', category: 'Computer Science' },
      { name: 'Machine Learning', category: 'AI & Data' },
      { name: 'Deep Learning', category: 'AI & Data' },
      { name: 'PyTorch', category: 'AI & Data' },
      { name: 'TensorFlow', category: 'AI & Data' },
      { name: 'NLP', category: 'AI & Data' },
      { name: 'Computer Vision', category: 'AI & Data' },
      { name: 'Network Protocols', category: 'Networking' },
      { name: 'Cybersecurity', category: 'Security' },
      { name: 'REST APIs', category: 'Backend' },
      { name: 'GraphQL', category: 'Backend' }
    ];

    const skills = {};
    for (const sk of skillsList) {
      const res = await client.query(
        'INSERT INTO skill (name, category) VALUES ($1, $2) RETURNING skill_id, name',
        [sk.name, sk.category]
      );
      skills[sk.name] = res.rows[0].skill_id;
    }

    // Seed Admin User
    const adminUser = await client.query(
      `INSERT INTO app_user (email, password_hash, role) VALUES ($1, $2, 'admin') RETURNING user_id`,
      ['admin@pes.edu', demoHash]
    );

    // Seed Companies
    const companyData = [
      { name: 'Google', website: 'https://google.com', industry: 'Cloud & AI', size: '100,000+', verified: true },
      { name: 'Microsoft', website: 'https://microsoft.com', industry: 'Cloud & Enterprise', size: '100,000+', verified: true },
      { name: 'Amazon', website: 'https://amazon.jobs', industry: 'Cloud & E-Commerce', size: '100,000+', verified: true },
      { name: 'Adobe', website: 'https://adobe.com', industry: 'Creative Cloud & Media', size: '25,000+', verified: true },
      { name: 'Cisco Systems', website: 'https://cisco.com', industry: 'Networking & Security', size: '75,000+', verified: true },
      { name: 'Databricks', website: 'https://databricks.com', industry: 'Data Intelligence', size: '5,000+', verified: false },
      { name: 'NeoTech Labs', website: 'https://neotech.dev', industry: 'AI Autonomous Systems', size: '100-500', verified: false }
    ];

    const companies = {};
    for (const c of companyData) {
      const res = await client.query(
        `INSERT INTO company (name, website, industry, size, verified, verified_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING company_id, name`,
        [c.name, c.website, c.industry, c.size, c.verified, c.verified ? adminUser.rows[0].user_id : null]
      );
      companies[c.name] = res.rows[0].company_id;
    }

    // Seed Recruiters
    const recruiterData = [
      { email: 'sarah.recruiter@google.com', company: 'Google', designation: 'Staff University Talent Partner' },
      { email: 'alex.talent@microsoft.com', company: 'Microsoft', designation: 'Senior Technical Recruiter' },
      { email: 'priya.hr@amazon.com', company: 'Amazon', designation: 'AWS Campus Hiring Lead' },
      { email: 'rahul.recruiter@adobe.com', company: 'Adobe', designation: 'University Relations Specialist' },
      { email: 'kavya.hr@cisco.com', company: 'Cisco Systems', designation: 'Lead Systems Talent Partner' }
    ];

    const recruiters = {};
    for (const r of recruiterData) {
      const uRes = await client.query(
        `INSERT INTO app_user (email, password_hash, role) VALUES ($1, $2, 'recruiter') RETURNING user_id`,
        [r.email, demoHash]
      );
      const recRes = await client.query(
        `INSERT INTO recruiter (user_id, company_id, designation) VALUES ($1, $2, $3) RETURNING recruiter_id`,
        [uRes.rows[0].user_id, companies[r.company], r.designation]
      );
      recruiters[r.email] = {
        userId: uRes.rows[0].user_id,
        recruiterId: recRes.rows[0].recruiter_id,
        companyId: companies[r.company]
      };
    }

    // Seed Students with real profiles and 384-d semantic profile embeddings
    const studentData = [
      {
        email: 'sumukh.student@pes.edu',
        usn: 'PES1UG22CS001',
        name: 'Sumukh Shandilya',
        dept: 'CSE',
        year: 3,
        cgpa: 9.42,
        gradYear: 2026,
        phone: '+919876543210',
        about: 'Passionate backend engineer and systems builder. Extensive experience building distributed systems with Go, PostgreSQL, Redis, Docker, and Kubernetes.',
        skills: [
          { name: 'Go', level: 5 },
          { name: 'Distributed Systems', level: 5 },
          { name: 'PostgreSQL', level: 5 },
          { name: 'Docker', level: 4 },
          { name: 'Kubernetes', level: 4 },
          { name: 'Linux', level: 4 },
          { name: 'Python', level: 4 }
        ]
      },
      {
        email: 'aditi.rao@pes.edu',
        usn: 'PES1UG22CS102',
        name: 'Aditi Rao',
        dept: 'CSE',
        year: 3,
        cgpa: 8.85,
        gradYear: 2026,
        phone: '+919876543211',
        about: 'Full-stack developer experienced in Java Spring Boot, microservices architecture, Next.js, and relational schema optimization.',
        skills: [
          { name: 'Java', level: 5 },
          { name: 'SQL', level: 5 },
          { name: 'Microservices', level: 4 },
          { name: 'React', level: 4 },
          { name: 'REST APIs', level: 4 }
        ]
      },
      {
        email: 'rohan.sharma@pes.edu',
        usn: 'PES1UG22AI045',
        name: 'Rohan Sharma',
        dept: 'AIML',
        year: 3,
        cgpa: 9.15,
        gradYear: 2026,
        phone: '+919876543212',
        about: 'AI researcher focusing on large language models, NLP, embeddings, and vector similarity retrieval pipelines using PyTorch.',
        skills: [
          { name: 'Python', level: 5 },
          { name: 'PyTorch', level: 5 },
          { name: 'Machine Learning', level: 5 },
          { name: 'Deep Learning', level: 4 },
          { name: 'NLP', level: 4 }
        ]
      },
      {
        email: 'ananya.deshmukh@pes.edu',
        usn: 'PES1UG22EC078',
        name: 'Ananya Deshmukh',
        dept: 'ECE',
        year: 3,
        cgpa: 8.20,
        gradYear: 2026,
        phone: '+919876543213',
        about: 'Embedded systems and networking engineer interested in hardware-software interfaces, Linux kernel internals, and socket programming.',
        skills: [
          { name: 'C++', level: 5 },
          { name: 'Linux', level: 4 },
          { name: 'Network Protocols', level: 4 },
          { name: 'Python', level: 3 }
        ]
      },
      {
        email: 'karthik.nair@pes.edu',
        usn: 'PES1UG22CS210',
        name: 'Karthik Nair',
        dept: 'CSE',
        year: 3,
        cgpa: 7.60,
        gradYear: 2026,
        phone: '+919876543214',
        about: 'Frontend specialist building interactive modern web interfaces using Next.js, Tailwind CSS, TypeScript, and state management.',
        skills: [
          { name: 'JavaScript', level: 5 },
          { name: 'TypeScript', level: 4 },
          { name: 'React', level: 5 },
          { name: 'Next.js', level: 4 },
          { name: 'Tailwind CSS', level: 4 }
        ]
      },
      {
        email: 'meera.iyer@pes.edu',
        usn: 'PES1UG22AI089',
        name: 'Meera Iyer',
        dept: 'AIML',
        year: 3,
        cgpa: 9.50,
        gradYear: 2026,
        phone: '+919876543215',
        about: 'Computer vision and multimodal learning researcher. Published papers on object detection with PyTorch and OpenCV.',
        skills: [
          { name: 'Python', level: 5 },
          { name: 'Deep Learning', level: 5 },
          { name: 'Computer Vision', level: 5 },
          { name: 'PyTorch', level: 5 }
        ]
      }
    ];

    const students = {};
    for (const s of studentData) {
      const uRes = await client.query(
        `INSERT INTO app_user (email, password_hash, role) VALUES ($1, $2, 'student') RETURNING user_id`,
        [s.email, demoHash]
      );
      const userId = uRes.rows[0].user_id;

      // Compute profile vector embedding
      const profileText = `${s.name} ${s.about} ${s.skills.map(sk => sk.name).join(' ')}`;
      const profileVec = generateEmbedding(profileText);

      const stRes = await client.query(
        `INSERT INTO student (user_id, dept_id, usn, full_name, year, cgpa, grad_year, phone, about, profile_embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector) RETURNING student_id`,
        [userId, depts[s.dept], s.usn, s.name, s.year, s.cgpa, s.gradYear, s.phone, s.about, vectorToSql(profileVec)]
      );
      const studentId = stRes.rows[0].student_id;
      students[s.email] = { userId, studentId };

      // Student skills
      for (const sk of s.skills) {
        if (skills[sk.name]) {
          await client.query(
            `INSERT INTO student_skill (student_id, skill_id, proficiency) VALUES ($1, $2, $3)`,
            [studentId, skills[sk.name], sk.level]
          );
        }
      }

      // MongoDB parsed resume document
      await mongoDb.collection('resumes').insertOne({
        student_id: studentId,
        uploaded_at: new Date(),
        raw_text: `${s.name} - ${s.usn}\nDepartment: ${s.dept}, PES University\nCGPA: ${s.cgpa}\nSummary: ${s.about}`,
        parsed: {
          education: [
            { institution: 'PES University', degree: 'B.Tech', major: s.dept, cgpa: s.cgpa, year: '2022-2026' }
          ],
          projects: [
            {
              name: `${s.name.split(' ')[0]} Systems Project`,
              tech: s.skills.slice(0, 3).map(x => x.name),
              desc: `Engineered high-performance production-ready application demonstrating core concepts.`
            }
          ],
          experience: [
            { role: 'Undergraduate Research Assistant', company: 'PES Center for Data Sciences', duration: '6 Months' }
          ],
          certifications: ['AWS Certified Cloud Practitioner', 'Algorithms Specialization']
        },
        extracted_skills: s.skills.map(x => x.name)
      });
    }

    // Seed Internship Postings
    const postingsData = [
      {
        company: 'Google',
        recruiter: 'sarah.recruiter@google.com',
        title: 'Software Engineering Intern - Cloud & Distributed Systems',
        description: 'Join the Google Cloud Storage and Core Infrastructure team. You will build highly scalable distributed storage subsystems, optimize low-latency RPC networks, and work with Kubernetes and Go.',
        location: 'Bengaluru, India',
        mode: 'hybrid',
        stipend: 110000.00,
        openings: 3,
        deadlineDays: 14,
        startDays: 60,
        durationWeeks: 12,
        minCgpa: 8.50,
        eligibleDepts: ['CSE', 'AIML', 'ISE'],
        skills: [
          { name: 'Distributed Systems', mandatory: true, minLevel: 4 },
          { name: 'Go', mandatory: true, minLevel: 3 },
          { name: 'Kubernetes', mandatory: false, minLevel: 2 },
          { name: 'PostgreSQL', mandatory: false, minLevel: 3 }
        ]
      },
      {
        company: 'Microsoft',
        recruiter: 'alex.talent@microsoft.com',
        title: 'AI & ML Systems Engineering Intern',
        description: 'Work with Microsoft Azure AI and Turing models team. Build model serving inference engines, optimize embeddings, and deploy scalable deep learning workloads with PyTorch and Python.',
        location: 'Hyderabad / Bengaluru',
        mode: 'hybrid',
        stipend: 100000.00,
        openings: 2,
        deadlineDays: 10,
        startDays: 50,
        durationWeeks: 10,
        minCgpa: 8.00,
        eligibleDepts: ['CSE', 'AIML'],
        skills: [
          { name: 'Python', mandatory: true, minLevel: 4 },
          { name: 'PyTorch', mandatory: true, minLevel: 4 },
          { name: 'Machine Learning', mandatory: true, minLevel: 3 },
          { name: 'Docker', mandatory: false, minLevel: 2 }
        ]
      },
      {
        company: 'Amazon',
        recruiter: 'priya.hr@amazon.com',
        title: 'Software Development Engineer Intern (AWS)',
        description: 'Build enterprise microservices powering Amazon DynamoDB and AWS Core. Solve complex scalability challenges using Java, AWS, distributed caching, and microservices.',
        location: 'Bengaluru, India',
        mode: 'on-site',
        stipend: 95000.00,
        openings: 4,
        deadlineDays: 4, // upcoming deadline within 7 days for view demonstration!
        startDays: 45,
        durationWeeks: 16,
        minCgpa: 7.50,
        eligibleDepts: ['CSE', 'AIML', 'ISE', 'ECE'],
        skills: [
          { name: 'Java', mandatory: true, minLevel: 4 },
          { name: 'Microservices', mandatory: true, minLevel: 3 },
          { name: 'SQL', mandatory: false, minLevel: 3 },
          { name: 'AWS', mandatory: false, minLevel: 2 }
        ]
      },
      {
        company: 'Adobe',
        recruiter: 'rahul.recruiter@adobe.com',
        title: 'Frontend Engineering Intern - Web Platform',
        description: 'Design and develop the next generation of creative web interfaces for Adobe Creative Cloud Web. Deep focus on React, Next.js, TypeScript, canvas rendering, and state management.',
        location: 'Noida / Bengaluru',
        mode: 'remote',
        stipend: 85000.00,
        openings: 2,
        deadlineDays: 20,
        startDays: 70,
        durationWeeks: 12,
        minCgpa: 7.00,
        eligibleDepts: ['CSE', 'AIML', 'ISE'],
        skills: [
          { name: 'React', mandatory: true, minLevel: 4 },
          { name: 'TypeScript', mandatory: true, minLevel: 3 },
          { name: 'Next.js', mandatory: false, minLevel: 3 },
          { name: 'Tailwind CSS', mandatory: false, minLevel: 3 }
        ]
      },
      {
        company: 'Cisco Systems',
        recruiter: 'kavya.hr@cisco.com',
        title: 'Network Systems & Protocols Engineering Intern',
        description: 'Engineer high-throughput packet processing engines, programmable switches, and security software using modern C++, Linux kernel primitives, and network protocols.',
        location: 'Bengaluru, India',
        mode: 'on-site',
        stipend: 75000.00,
        openings: 3,
        deadlineDays: 5, // upcoming deadline within 7 days
        startDays: 40,
        durationWeeks: 12,
        minCgpa: 7.50,
        eligibleDepts: ['ECE', 'CSE', 'ISE'],
        skills: [
          { name: 'C++', mandatory: true, minLevel: 4 },
          { name: 'Linux', mandatory: true, minLevel: 3 },
          { name: 'Network Protocols', mandatory: true, minLevel: 3 },
          { name: 'Python', mandatory: false, minLevel: 2 }
        ]
      }
    ];

    const postings = [];
    for (const p of postingsData) {
      const rec = recruiters[p.recruiter];
      const now = new Date();
      const deadline = new Date(now.getTime() + p.deadlineDays * 86400000);
      const startDate = new Date(now.getTime() + p.startDays * 86400000);

      // Compute posting vector embedding
      const postingText = `${p.title} ${p.description} ${p.location} ${p.skills.map(s => s.name).join(' ')}`;
      const postingVec = generateEmbedding(postingText);

      const postRes = await client.query(`
        INSERT INTO internship_posting (
          company_id, recruiter_id, title, description, location, mode,
          stipend, openings, filled, deadline, start_date, duration_weeks,
          min_cgpa, status, embedding
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11, $12, 'open', $13::vector
        ) RETURNING posting_id, title
      `, [
        rec.companyId, rec.recruiterId, p.title, p.description, p.location, p.mode,
        p.stipend, p.openings, deadline, startDate, p.durationWeeks, p.minCgpa,
        vectorToSql(postingVec)
      ]);

      const postingId = postRes.rows[0].posting_id;
      postings.push({ postingId, title: p.title, company: p.company });

      // Posting skills
      for (const sk of p.skills) {
        if (skills[sk.name]) {
          await client.query(`
            INSERT INTO posting_skill (posting_id, skill_id, is_mandatory, min_level)
            VALUES ($1, $2, $3, $4)
          `, [postingId, skills[sk.name], sk.mandatory, sk.minLevel]);
        }
      }

      // Eligible departments
      for (const dCode of p.eligibleDepts) {
        if (depts[dCode]) {
          await client.query(`
            INSERT INTO posting_eligible_dept (posting_id, dept_id)
            VALUES ($1, $2)
          `, [postingId, depts[dCode]]);
        }
      }

      // MongoDB posting document
      await mongoDb.collection('posting_documents').insertOne({
        posting_id: postingId,
        raw_jd: p.description,
        responsibilities: [
          'Design and implement robust production components.',
          'Collaborate with global engineering teams and mentors.',
          'Participate in code reviews, design docs, and testing.'
        ],
        perks: ['Competitive monthly stipend', 'Free university transport', 'Mentorship program', 'Certificate of Completion'],
        created_at: new Date()
      });
    }

    console.log(`Seeded ${postings.length} internship postings.`);

    // Seed Applications across pipeline stages
    // 1. Sumukh -> Google Cloud (Stage: Interview)
    const app1 = await client.query(`
      INSERT INTO application (student_id, posting_id, current_stage, match_score)
      VALUES ($1, $2, 'Interview', 94.50) RETURNING application_id
    `, [students['sumukh.student@pes.edu'].studentId, postings[0].postingId]);

    // Schedule interview round 1 for Sumukh
    const round1Date = new Date(Date.now() + 2 * 86400000);
    const int1 = await client.query(`
      INSERT INTO interview (application_id, round_no, scheduled_at, duration_min, mode, link_or_room, status)
      VALUES ($1, 1, $2, 45, 'online', 'https://meet.google.com/xyz-pes-demo', 'scheduled')
      RETURNING interview_id
    `, [app1.rows[0].application_id, round1Date]);

    await client.query(`
      INSERT INTO interview_panelist (interview_id, recruiter_id)
      VALUES ($1, $2)
    `, [int1.rows[0].interview_id, recruiters['sarah.recruiter@google.com'].recruiterId]);

    // 2. Aditi Rao -> Microsoft (Stage: Accepted, with Offer)
    const app2 = await client.query(`
      INSERT INTO application (student_id, posting_id, current_stage, match_score)
      VALUES ($1, $2, 'Accepted', 88.00) RETURNING application_id
    `, [students['aditi.rao@pes.edu'].studentId, postings[1].postingId]);

    await client.query(`
      INSERT INTO offer (application_id, stipend, start_date, expires_at, status, responded_at)
      VALUES ($1, 100000.00, $2, $3, 'accepted', CURRENT_TIMESTAMP)
    `, [app2.rows[0].application_id, new Date(Date.now() + 40 * 86400000), new Date(Date.now() + 10 * 86400000)]);

    // Update Microsoft posting filled count
    await client.query(`
      UPDATE internship_posting SET filled = filled + 1 WHERE posting_id = $1
    `, [postings[1].postingId]);

    // 3. Rohan Sharma -> Microsoft (Stage: Offered, with Pending Offer)
    const app3 = await client.query(`
      INSERT INTO application (student_id, posting_id, current_stage, match_score)
      VALUES ($1, $2, 'Offered', 96.00) RETURNING application_id
    `, [students['rohan.sharma@pes.edu'].studentId, postings[1].postingId]);

    await client.query(`
      INSERT INTO offer (application_id, stipend, start_date, expires_at, status)
      VALUES ($1, 100000.00, $2, $3, 'pending')
    `, [app3.rows[0].application_id, new Date(Date.now() + 40 * 86400000), new Date(Date.now() + 6 * 86400000)]);

    // 4. Karthik Nair -> Adobe (Stage: Shortlisted)
    await client.query(`
      INSERT INTO application (student_id, posting_id, current_stage, match_score)
      VALUES ($1, $2, 'Shortlisted', 82.50)
    `, [students['karthik.nair@pes.edu'].studentId, postings[3].postingId]);

    // 5. Ananya Deshmukh -> Cisco (Stage: Applied)
    await client.query(`
      INSERT INTO application (student_id, posting_id, current_stage, match_score)
      VALUES ($1, $2, 'Applied', 85.00)
    `, [students['ananya.deshmukh@pes.edu'].studentId, postings[4].postingId]);

    // 6. Meera Iyer -> Google (Stage: Shortlisted)
    await client.query(`
      INSERT INTO application (student_id, posting_id, current_stage, match_score)
      VALUES ($1, $2, 'Shortlisted', 91.00)
    `, [students['meera.iyer@pes.edu'].studentId, postings[0].postingId]);

    // Refresh Materialized View
    await client.query('SELECT sp_refresh_skill_demand_mv();');
    console.log('Refreshed materialized view mv_skill_demand.');
  });

  // 4. Seed MongoDB specific collections: interview_feedback, reviews, notifications, activity logs
  console.log('Seeding MongoDB collections...');

  // Interview Feedback with variable rubric
  await mongoDb.collection('interview_feedback').insertMany([
    {
      interview_id: 1,
      panelist_id: 1,
      rubric: {
        dsa: 4.5,
        system_design: 4.8,
        concurrency: 4.6,
        communication: 4.2
      },
      comments: 'Exceptional understanding of distributed locking and transaction isolation levels. Strong candidate for Google Cloud.',
      recommendation: 'Strong Hire',
      created_at: new Date()
    }
  ]);

  // Experience Reviews from students
  await mongoDb.collection('experience_reviews').insertMany([
    {
      company_id: 1,
      company_name: 'Google',
      student_id: 1,
      student_name: 'Alumni 2024',
      ratings: {
        mentorship: 5,
        learning: 5,
        work_life_balance: 4,
        compensation: 5
      },
      text: 'Working on Google Cloud was the best engineering experience of my undergraduate degree. True distributed systems at scale.',
      tags: ['Mentorship', 'High Scale', 'Go', 'PPO Offered'],
      created_at: new Date(Date.now() - 30 * 86400000)
    },
    {
      company_id: 2,
      company_name: 'Microsoft',
      student_id: 2,
      student_name: 'Alumni 2024',
      ratings: {
        mentorship: 4,
        learning: 5,
        work_life_balance: 5,
        compensation: 4
      },
      text: 'Great work culture and supportive team. Got to work on Azure ML pipelines directly impacting customers.',
      tags: ['Work Culture', 'Azure', 'Machine Learning'],
      created_at: new Date(Date.now() - 45 * 86400000)
    },
    {
      company_id: 3,
      company_name: 'Amazon',
      student_id: 3,
      student_name: 'Alumni 2024',
      ratings: {
        mentorship: 4,
        learning: 4,
        work_life_balance: 3,
        compensation: 5
      },
      text: 'Fast paced development with deep ownership. AWS leadership principles are put into practice daily.',
      tags: ['Fast Paced', 'AWS', 'High Ownership'],
      created_at: new Date(Date.now() - 60 * 86400000)
    }
  ]);

  // Notifications (with TTL expiry date)
  await mongoDb.collection('notifications').insertMany([
    {
      user_id: 3, // Sumukh's user_id
      type: 'INTERVIEW_SCHEDULED',
      title: 'Google Technical Interview Round 1 Scheduled',
      message: 'Your Round 1 Technical Interview for Google Cloud & Distributed Systems is scheduled for 2 days from now.',
      read: false,
      created_at: new Date(),
      expireAt: new Date(Date.now() + 30 * 86400000) // TTL 30 days
    },
    {
      user_id: 5, // Rohan Sharma
      type: 'OFFER_ISSUED',
      title: 'Offer Received from Microsoft!',
      message: 'Congratulations! Microsoft has issued an internship offer with stipend ₹1,00,000/mo. Please review and respond before deadline.',
      read: false,
      created_at: new Date(),
      expireAt: new Date(Date.now() + 30 * 86400000)
    }
  ]);

  // Activity stream
  await mongoDb.collection('activity_logs').insertMany([
    {
      user_id: 1,
      action: 'SYSTEM_BOOTSTRAP',
      meta: { message: 'InternTrack database initialized and seeded successfully' },
      ts: new Date()
    },
    {
      user_id: 2,
      action: 'COMPANY_VERIFIED',
      meta: { company: 'Google', verified_by: 'Placement Cell Admin' },
      ts: new Date()
    }
  ]);

  console.log('MongoDB collections seeded successfully.');
  console.log('--- Seed Completed Successfully! ---');
  await pool.end();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed Error:', err);
  process.exit(1);
});
