'use client';

// app/page.js - Premium Editorial-Tech Landing Page with 1-Click Role Switcher
// Design Tone: Matches Vision by Eloqwnt (Warm off-white, near-black ink, floating pills, dot grid, orb visual)

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconSparkles,
  IconArrowRight,
  IconShieldLock,
  IconDatabase,
  IconCpu,
  IconLayersLinked,
  IconPlayerPlay,
  IconCheck,
  IconActivity,
} from '@tabler/icons-react';

export default function LandingPage() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState(null);
  const [error, setError] = useState(null);

  // Exact 1-Click Demo Login Handler — Contract Unchanged
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Floating Pill Navigation Bar (Matching Screenshot Top Nav) */}
      <header
        style={{
          position: 'sticky',
          top: '16px',
          zIndex: 40,
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          className="floating-nav-pill"
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: '1240px',
            justifyContent: 'space-between',
            padding: '8px 16px',
          }}
        >
          {/* Brand Left Pill */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 12px',
              borderRadius: '999px',
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #3b6b8f 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <IconSparkles size={14} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                InternTrack
              </span>
              <span
                className="desktop-center-pill"
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.62rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--ink-muted)',
                }}
              >
                by PESU
              </span>
            </div>
          </Link>

          {/* Center Status Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 16px',
              borderRadius: '999px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
            className="desktop-center-pill"
          >
            <span className="indicator-dot" />
            <span
              style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ink-muted)',
                fontWeight: 600,
              }}
            >
              LIVE DEMO • POSTGRES 16 + PGVECTOR + MONGO 7.0
            </span>
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Link
              href="/login"
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 12px', fontSize: '0.72rem' }}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 14px', fontSize: '0.72rem' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, width: '100%', maxWidth: '1240px', margin: '0 auto', padding: '48px 20px 80px' }}>
        {error && (
          <div
            className="editorial-card"
            style={{
              borderColor: 'rgba(217, 45, 32, 0.3)',
              backgroundColor: 'var(--accent-faint)',
              color: 'var(--accent)',
              padding: '14px 20px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'var(--font-mono), monospace',
              fontSize: '0.8rem',
            }}
          >
            <span className="indicator-dot" />
            {error}
          </div>
        )}

        {/* Hero Grid: Left Content + Right Interactive Orb Visual */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 0.95fr)',
            gap: '48px',
            alignItems: 'center',
            marginBottom: '72px',
            paddingTop: '20px',
          }}
          className="hero-grid"
        >
          {/* Left Column: Eyebrow, Giant Heading, Body, Pill CTAs */}
          <div>
            <div
              className="mono-eyebrow"
              style={{
                marginBottom: '20px',
                padding: '4px 12px',
                borderRadius: '999px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span className="indicator-dot" />
              <span>CAPSTONE • LEVEL 3 DBMS PLATFORM</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2rem, 4.4vw, 3.8rem)',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.035em',
                color: 'var(--ink)',
                marginBottom: '24px',
                wordBreak: 'normal',
                overflowWrap: 'break-word',
              }}
            >
              The intelligent placement layer between students and engineering teams.
            </h1>

            <p
              style={{
                fontSize: '1.08rem',
                color: 'var(--ink-muted)',
                lineHeight: 1.6,
                marginBottom: '36px',
                maxWidth: '560px',
              }}
            >
              InternTrack unifies strict BCNF relational schemas in PostgreSQL 16, pgvector 384-dimensional
              cosine similarity, and MongoDB 7.0 polymorphic feedback rubrics into an institutional-grade platform.
            </p>

            {/* Pill CTAs (Matches Screenshot: PUT VISION ON YOUR SITE + Replay the demo) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleQuickLogin('sumukh.student@pes.edu', '/student')}
                disabled={loadingRole !== null}
                className="btn btn-primary"
                style={{ padding: '13px 28px', fontSize: '0.78rem' }}
              >
                {loadingRole === 'sumukh.student@pes.edu' ? 'AUTHENTICATING...' : 'EXPLORE STUDENT DEMO'}
              </button>

              <a
                href="#demo-roles"
                className="btn btn-secondary"
                style={{ padding: '13px 24px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <IconPlayerPlay size={15} style={{ color: 'var(--ink)' }} />
                <span>Switch Personas</span>
              </a>
            </div>
          </div>

          {/* Right Column: Hero Orb Visual with Radar Dials (Matches Reference Screenshot) */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '440px',
            }}
          >
            {/* Radar Dial Ring Background */}
            <div
              style={{
                position: 'relative',
                width: '360px',
                height: '360px',
                borderRadius: '50%',
                border: '1px dashed rgba(10, 10, 10, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Outer Tick Ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-20px',
                  borderRadius: '50%',
                  border: '1px dotted rgba(10, 10, 10, 0.1)',
                  animation: 'spinSlow 60s linear infinite',
                }}
              />

              {/* Red Indicator Dot on Radar Perimeter (Direct Visual Match) */}
              <div
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '58%',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  boxShadow: '0 0 0 4px rgba(217, 45, 32, 0.2)',
                }}
              />

              {/* Glossy Organic Sphere / Orb Visual (CSS-Only) */}
              <div
                style={{
                  width: '230px',
                  height: '230px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 30%, #a5c7df 0%, #3e6d90 45%, #183348 80%, #0d1e2b 100%)',
                  boxShadow: '0 20px 50px rgba(24, 51, 72, 0.28), inset -12px -12px 30px rgba(0, 0, 0, 0.4), inset 10px 10px 24px rgba(255, 255, 255, 0.45)',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: 'orbFloat 6s ease-in-out infinite',
                }}
              >
                {/* Fluid organic surface reflection highlight */}
                <div
                  style={{
                    position: 'absolute',
                    top: '15%',
                    left: '20%',
                    width: '120px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)',
                    transform: 'rotate(-25deg)',
                    filter: 'blur(3px)',
                  }}
                />
              </div>

              {/* Floating Quote Badge (Matches Reference "We launch in three weeks") */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  boxShadow: 'var(--shadow-soft)',
                  maxWidth: '190px',
                  animation: 'floatBadge 4s ease-in-out infinite',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: '0.62rem',
                    color: 'var(--ink-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '3px',
                  }}
                >
                  COSINE MATCH
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                  &ldquo;89.4% AI Match Score&rdquo;
                </div>
              </div>

              {/* Bottom "THINKING / VERIFIED" Status Badge (Direct Visual Match) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  backgroundColor: 'var(--ink)',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-float)',
                }}
              >
                <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
                  <span style={{ width: '2px', height: '10px', background: '#ffffff', borderRadius: '1px' }} />
                  <span style={{ width: '2px', height: '14px', background: '#ffffff', borderRadius: '1px' }} />
                  <span style={{ width: '2px', height: '8px', background: '#ffffff', borderRadius: '1px' }} />
                </span>
                <span>ACID VERIFIED</span>
              </div>
            </div>
          </div>
        </section>

        {/* 1-Click Persona Access Section */}
        <section id="demo-roles" style={{ marginBottom: '80px', scrollMarginTop: '100px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div className="mono-eyebrow" style={{ marginBottom: '8px' }}>
              <span className="indicator-dot-green" /> EVALUATION ROLES
            </div>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
              Instant One-Click Persona Launchers
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--ink-muted)', maxWidth: '520px', margin: '0 auto' }}>
              Click any portal below to authenticate immediately and inspect the live database subsystems.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Student Persona Card */}
            <div
              className="editorial-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '28px',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(59, 107, 143, 0.08)',
                      color: 'var(--accent-2)',
                      border: '1px solid rgba(59, 107, 143, 0.2)',
                    }}
                  >
                    ROLE: STUDENT
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                    USN: PES1UG22CS001
                  </span>
                </div>

                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px', color: 'var(--ink)' }}>
                  Student Portal
                </h3>

                <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: '20px' }}>
                  Explore Top-N vector recommendations, live full-text search, Kanban application pipeline, and
                  atomic concurrency-safe offer acceptances.
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    color: 'var(--ink-muted)',
                    marginBottom: '24px',
                  }}
                >
                  Account: sumukh.student@pes.edu (CGPA 9.42)
                </div>
              </div>

              <button
                onClick={() => handleQuickLogin('sumukh.student@pes.edu', '/student')}
                disabled={loadingRole !== null}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {loadingRole === 'sumukh.student@pes.edu' ? 'AUTHENTICATING...' : 'LAUNCH STUDENT PORTAL →'}
              </button>
            </div>

            {/* Recruiter Persona Card */}
            <div
              className="editorial-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '28px',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(219, 39, 119, 0.08)',
                      color: '#be185d',
                      border: '1px solid rgba(219, 39, 119, 0.2)',
                    }}
                  >
                    ROLE: RECRUITER
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                    Google India
                  </span>
                </div>

                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px', color: 'var(--ink)' }}>
                  Recruiter Console
                </h3>

                <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: '20px' }}>
                  Create postings with automatic 384-d embeddings, rank candidates by semantic match, schedule
                  clash-free interviews, and issue offers.
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    color: 'var(--ink-muted)',
                    marginBottom: '24px',
                  }}
                >
                  Account: sarah.recruiter@google.com
                </div>
              </div>

              <button
                onClick={() => handleQuickLogin('sarah.recruiter@google.com', '/recruiter')}
                disabled={loadingRole !== null}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {loadingRole === 'sarah.recruiter@google.com' ? 'AUTHENTICATING...' : 'LAUNCH RECRUITER CONSOLE →'}
              </button>
            </div>

            {/* Admin Persona Card */}
            <div
              className="editorial-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '28px',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(217, 119, 6, 0.08)',
                      color: '#b45309',
                      border: '1px solid rgba(217, 119, 6, 0.25)',
                    }}
                  >
                    ROLE: ADMIN
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                    Placement Cell
                  </span>
                </div>

                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px', color: 'var(--ink)' }}>
                  Placement Governance
                </h3>

                <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: '20px' }}>
                  Verify employers, tune policy limits, inspect append-only audit trails, refresh materialized views
                  concurrently, and export CSVs.
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    color: 'var(--ink-muted)',
                    marginBottom: '24px',
                  }}
                >
                  Account: admin@pes.edu
                </div>
              </div>

              <button
                onClick={() => handleQuickLogin('admin@pes.edu', '/admin')}
                disabled={loadingRole !== null}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {loadingRole === 'admin@pes.edu' ? 'AUTHENTICATING...' : 'LAUNCH ADMIN GOVERNANCE →'}
              </button>
            </div>
          </div>
        </section>

        {/* Database Technology Architecture Grid */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div className="mono-eyebrow" style={{ marginBottom: '8px' }}>
              <span className="indicator-dot" /> SYSTEM ARCHITECTURE
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
              Dual-Engine Database Implementation
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
            }}
          >
            <div className="editorial-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
                  <IconDatabase size={20} color="var(--ink)" />
                </div>
                <div className="mono-eyebrow" style={{ fontSize: '0.72rem' }}>POSTGRESQL 16</div>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>17 BCNF Tables & Stored Procedures</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
                Enforces transactional consistency via <code style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>sp_accept_offer</code> and
                pessimistic row locking with <code style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>SELECT ... FOR UPDATE</code>.
              </p>
            </div>

            <div className="editorial-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
                  <IconCpu size={20} color="var(--accent-2)" />
                </div>
                <div className="mono-eyebrow" style={{ fontSize: '0.72rem' }}>PGVECTOR EXTENSION</div>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>384-D Vector Search</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
                Evaluates cosine similarity directly inside SQL queries using the <code style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>&lt;=&gt;</code> distance
                operator backed by HNSW indexing.
              </p>
            </div>

            <div className="editorial-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
                  <IconLayersLinked size={20} color="#15803d" />
                </div>
                <div className="mono-eyebrow" style={{ fontSize: '0.72rem' }}>MONGODB 7.0</div>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>5 Aggregation Pipelines</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
                Stores unstructured resumes, variable interview rubrics, and activity heatmaps with auto-expiring TTL indexes.
              </p>
            </div>

            <div className="editorial-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
                  <IconShieldLock size={20} color="var(--accent)" />
                </div>
                <div className="mono-eyebrow" style={{ fontSize: '0.72rem' }}>AUDIT GUARDS</div>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>Trigger Immutability</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
                Database triggers strictly abort UPDATE and DELETE operations on <code style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>application_stage_history</code>,
                securing audit trails.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Slow Marquee of Feature Phrases (Matches Reference Screenshot Bottom Bar) */}
      <div className="marquee-container">
        <div className="marquee-content">
          <span>• Strict BCNF Relational Integrity</span>
          <span>• 384-Dimensional Cosine Similarity</span>
          <span>• Concurrency-Safe Pessimistic Locking</span>
          <span>• Tamper-Proof Trigger Immutability</span>
          <span>• 5 MongoDB Aggregation Pipelines</span>
          <span>• Real-Time Interview Clash Detection</span>
          <span>• Sub-Millisecond Materialized View Refresh</span>
          <span>• Full ACID Atomic Offer Cascades</span>
          <span>• Strict BCNF Relational Integrity</span>
          <span>• 384-Dimensional Cosine Similarity</span>
          <span>• Concurrency-Safe Pessimistic Locking</span>
          <span>• Tamper-Proof Trigger Immutability</span>
          <span>• 5 MongoDB Aggregation Pipelines</span>
          <span>• Real-Time Interview Clash Detection</span>
          <span>• Sub-Millisecond Materialized View Refresh</span>
          <span>• Full ACID Atomic Offer Cascades</span>
        </div>
      </div>

      {/* Minimal Editorial Footer */}
      <footer
        style={{
          backgroundColor: '#ffffff',
          padding: '24px 20px',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            fontFamily: 'var(--font-mono), monospace',
            fontSize: '0.72rem',
            color: 'var(--ink-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="indicator-dot" />
            <span>InternTrack • PES University Department of Computer Science & Engineering</span>
          </div>
          <div>Level 3 Capstone Evaluation</div>
        </div>
      </footer>

      {/* Global Responsive Styles & Animation Keyframes */}
      <style jsx global>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
        }

        @keyframes floatBadge {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .desktop-center-pill {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
