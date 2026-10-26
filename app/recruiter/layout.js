'use client';
// app/recruiter/layout.js - Recruiter Console Navigation Layout
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function RecruiterLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated || data.user.role !== 'recruiter') {
          router.push('/login');
        } else {
          setUser(data.user);
          setLoading(false);
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/recruiter', icon: '📊' },
    { label: 'My Postings', path: '/recruiter/postings', icon: '📢' },
    { label: 'Create Posting', path: '/recruiter/postings/create', icon: '➕' },
    { label: 'Applicants Manager', path: '/recruiter/applicants', icon: '👥' },
    { label: 'Interviews & Feedback', path: '/recruiter/interviews', icon: '📅' },
    { label: 'Issue Offers', path: '/recruiter/offers', icon: '🎁' },
    { label: 'Funnel Analytics', path: '/recruiter/analytics', icon: '📈' },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading Recruiter Console...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'rgba(17, 24, 39, 0.95)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🎯</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>InternTrack</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>RECRUITER CONSOLE</div>
            </div>
          </Link>
        </div>

        {/* Company Card */}
        <div style={{
          padding: '16px 20px',
          margin: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
            {user?.company_name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {user?.designation}
          </div>
          <div style={{ marginTop: '8px' }}>
            {user?.verified ? (
              <span className="badge badge-accepted" style={{ fontSize: '0.68rem' }}>✓ Verified Partner</span>
            ) : (
              <span className="badge badge-interview" style={{ fontSize: '0.68rem' }}>Pending Verification</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(135deg, #ec4899, #be185d)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <main style={{ flex: 1, padding: '32px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
