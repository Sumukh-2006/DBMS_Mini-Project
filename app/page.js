'use client';
// app/page.js - Interactive Landing Page with Live Role Switcher for Demonstration
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState(null);
  const [error, setError] = useState(null);

  // Quick One-Click Demo Login Helper
  const handleQuickLogin = async (email, redirectPath) => {
    try {
      setLoadingRole(email);
      setError(null);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      router.push(redirectPath);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <header style={{
        borderBottom: '1px solid var(--border-color)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(10, 15, 29, 0.85)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
            }}>
              🎯
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                InternTrack
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                PES UNIVERSITY • V SEM DBMS EXPERIENTIAL LEARNING
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="badge badge-shortlisted" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
              PostgreSQL 16 • pgvector • MongoDB 7.0
            </div>
            <Link href="/login" className="btn btn-secondary btn-sm">
              Sign In
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm">
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '60px 24px', width: '100%' }}>
        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
            color: '#fca5a5',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ textAlign: 'center', maxWidth: '850px', margin: '0 auto 50px auto' }}>
          <div className="badge badge-interview" style={{ marginBottom: '16px', padding: '6px 14px' }}>
            DBMS Experiential Learning Level 3 Capstone
          </div>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '20px',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #ffffff 30%, #9ca3af 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Internship Lifecycle Management & Semantic Matching Platform
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
            A polyglot database platform that automates university placement policy enforcement in SQL,
            safeguards candidate stage history with tamper-evident audit trails, and couples
            pgvector dense embeddings with MongoDB semi-structured documents.
          </p>
        </div>

        {/* Quick Role-Based Live Demonstration Grid */}
        <section style={{ marginBottom: '70px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>
              ⚡ Instant Evaluator Demo Access
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Click any persona card below to immediately log in and explore the full live subsystem:
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {/* Student Role */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge badge-applied">Role: Student</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>USN: PES1UG22CS001</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
                  Student Portal
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                  Experience AI-driven Top-N semantic recommendations, browse postings with full-text search,
                  track application Kanban board, check interview schedules, and test the atomic one-offer acceptance rule.
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px', fontFamily: 'var(--font-mono)' }}>
                  User: sumukh.student@pes.edu (CGPA 9.42)
                </div>
              </div>
              <button
                onClick={() => handleQuickLogin('sumukh.student@pes.edu', '/student')}
                disabled={loadingRole !== null}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {loadingRole === 'sumukh.student@pes.edu' ? 'Authenticating...' : 'Launch Student Portal →'}
              </button>
            </div>

            {/* Recruiter Role */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge badge-offered">Role: Recruiter</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Company: Google</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
                  Recruiter Console
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                  Create postings with automatic 384-d vector embeddings, rank applicants by skill & semantic match score,
                  find "Similar Candidates", schedule clash-free interviews, and issue offers.
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px', fontFamily: 'var(--font-mono)' }}>
                  User: sarah.recruiter@google.com
                </div>
              </div>
              <button
                onClick={() => handleQuickLogin('sarah.recruiter@google.com', '/recruiter')}
                disabled={loadingRole !== null}
                className="btn btn-primary"
                style={{ width: '100%', background: 'linear-gradient(135deg, #ec4899, #be185d)' }}
              >
                {loadingRole === 'sarah.recruiter@google.com' ? 'Authenticating...' : 'Launch Recruiter Console →'}
              </button>
            </div>

            {/* Admin Role */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge badge-interview">Role: Admin</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Placement Cell</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
                  Placement Cell Governance
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                  Verify new companies, configure placement policy limits, inspect immutable audit logs,
                  analyze department-wise placement metrics, compare market skill demand vs student supply, and export CSV reports.
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px', fontFamily: 'var(--font-mono)' }}>
                  User: admin@pes.edu
                </div>
              </div>
              <button
                onClick={() => handleQuickLogin('admin@pes.edu', '/admin')}
                disabled={loadingRole !== null}
                className="btn btn-primary"
                style={{ width: '100%', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                {loadingRole === 'admin@pes.edu' ? 'Authenticating...' : 'Launch Admin Governance →'}
              </button>
            </div>
          </div>
        </section>

        {/* Technical Architecture & Database Paradigm Highlights */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, textAlign: 'center', marginBottom: '32px' }}>
            Database Architecture & Technology Justification
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            <div className="glass-card">
              <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>🐘</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
                PostgreSQL Relational Core
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Enforces strict 3NF/BCNF schemas, candidate foreign keys, check constraints, multi-table views,
                and atomic stored procedures (<code style={{ color: '#818cf8' }}>sp_apply</code>, <code style={{ color: '#818cf8' }}>sp_accept_offer</code>)
                with row locks (<code style={{ color: '#818cf8' }}>FOR UPDATE</code>).
              </p>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>📐</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
                pgvector Semantic Search
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Stores 384-dimensional dense vectors alongside relational rows. Enables hybrid retrieval combining
                HNSW cosine distance indexes with SQL pre-filters (CGPA, department eligibility, deadlines) in a single unified query.
              </p>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>🍃</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
                MongoDB Document Store
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Houses semi-structured resumes, variable company feedback rubrics, and experience reviews.
                Powers 5 aggregation pipelines and auto-expiring notifications via TTL indexes.
              </p>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>🛡️</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
                Tamper-Evident Audit Trails
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Database triggers strictly block UPDATE and DELETE operations on <code style={{ color: '#818cf8' }}>application_stage_history</code>
                and <code style={{ color: '#818cf8' }}>audit_log</code>, guaranteeing an immutable historical timeline.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        background: 'rgba(10, 15, 29, 0.95)'
      }}>
        <div>InternTrack • PES University Department of Computer Science and Engineering</div>
        <div style={{ marginTop: '4px' }}>Course Instructor: Dr. Nagasundari S • Academic Year 2024–2025</div>
      </footer>
    </div>
  );
}
