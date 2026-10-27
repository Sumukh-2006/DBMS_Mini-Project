'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconMenu2,
  IconX,
  IconLogout,
  IconUser,
  IconSparkles,
} from '@tabler/icons-react';

const STUDENT_NAV = [
  { label: 'Overview', path: '/student' },
  { label: 'Browse', path: '/student/browse' },
  { label: 'Pipeline', path: '/student/pipeline' },
  { label: 'Matches', path: '/student/recommendations' },
  { label: 'Offers', path: '/student/offers' },
  { label: 'Interviews', path: '/student/interviews' },
  { label: 'Profile', path: '/student/profile' },
  { label: 'Reviews', path: '/student/reviews' },
];

const RECRUITER_NAV = [
  { label: 'Overview', path: '/recruiter' },
  { label: 'Postings', path: '/recruiter/postings' },
  { label: 'Applicants', path: '/recruiter/applicants' },
  { label: 'Interviews', path: '/recruiter/interviews' },
  { label: 'Offers', path: '/recruiter/offers' },
  { label: 'Analytics', path: '/recruiter/analytics' },
];

const ADMIN_NAV = [
  { label: 'Overview', path: '/admin' },
  { label: 'Analytics', path: '/admin/analytics' },
  { label: 'Policies', path: '/admin/policies' },
  { label: 'Verifications', path: '/admin/verifications' },
  { label: 'Audit Logs', path: '/admin/audit-logs' },
  { label: 'Export', path: '/admin/export' },
];

export default function AppShell({
  role = 'student', // 'student' | 'recruiter' | 'admin'
  user = null,
  onLogout = null,
  children,
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  let navItems = STUDENT_NAV;
  if (role === 'recruiter') navItems = RECRUITER_NAV;
  else if (role === 'admin') navItems = ADMIN_NAV;

  const roleLabel = role === 'student' ? 'STUDENT' : role === 'recruiter' ? 'RECRUITER' : 'ADMIN';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Floating Pill Header Bar */}
      <header
        style={{
          position: 'sticky',
          top: '16px',
          zIndex: 40,
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none', // Allow clicks through to sides
        }}
      >
        <div
          className="floating-nav-pill"
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: '1240px',
            justifyContent: 'space-between',
            padding: '8px 14px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Brand Left Pill */}
          <Link
            href={`/${role}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 10px',
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
                fontSize: '0.8rem',
              }}
            >
              <IconSparkles size={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                InternTrack
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.58rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--ink-muted)',
                  lineHeight: 1,
                }}
              >
                {roleLabel} • PESU
              </span>
            </div>
          </Link>

          {/* Desktop Center Navigation Pills */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflowX: 'auto',
            }}
            className="desktop-nav-links"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    fontWeight: 600,
                    transition: 'all 0.16s ease',
                    backgroundColor: isActive ? 'var(--ink)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--ink-muted)',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--surface-subtle)';
                      e.currentTarget.style.color = 'var(--ink)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--ink-muted)';
                    }
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Controls Right Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user && (
              <div
                style={{
                  display: 'none',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-subtle)',
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.72rem',
                  color: 'var(--ink-muted)',
                }}
                className="desktop-user-pill"
              >
                <span className="indicator-dot-green" />
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.fullName || user.email || 'Active'}
                </span>
              </div>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.72rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Sign Out"
              >
                <IconLogout size={14} />
                <span className="logout-text">Exit</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                padding: '6px',
                cursor: 'pointer',
                color: 'var(--ink)',
              }}
              className="mobile-menu-btn"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 35,
            backgroundColor: 'rgba(245, 245, 244, 0.98)',
            padding: '90px 24px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="mono-eyebrow" style={{ marginBottom: '8px' }}>
            <span className="indicator-dot" /> Navigation Menu
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                  backgroundColor: isActive ? 'var(--ink)' : '#ffffff',
                  color: isActive ? '#ffffff' : 'var(--ink)',
                  border: '1px solid var(--border)',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Main Page Content */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '36px 20px 64px',
        }}
      >
        {children}
      </main>

      {/* Editorial Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          backgroundColor: '#ffffff',
          padding: '24px 20px',
          marginTop: 'auto',
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
            <span>InternTrack Placement Engine • Level 3 DBMS</span>
          </div>
          <div>PES University • Polyglot Persistence Architecture</div>
        </div>
      </footer>

      <style jsx global>{`
        @media (max-width: 900px) {
          .desktop-nav-links {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .desktop-user-pill {
            display: none !important;
          }
        }
        @media (min-width: 901px) {
          .desktop-user-pill {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
