'use client';
// app/admin/layout.js - Admin Governance Portal Layout
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated || data.user.role !== 'admin') {
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
    { label: 'Governance Overview', path: '/admin', icon: '🏛️' },
    { label: 'Company Verifications', path: '/admin/verifications', icon: '🛡️' },
    { label: 'Placement Policies', path: '/admin/policies', icon: '⚙️' },
    { label: 'Institutional Analytics', path: '/admin/analytics', icon: '📊' },
    { label: 'Audit Log Inspector', path: '/admin/audit-logs', icon: '📜' },
    { label: 'Export Reports (CSV)', path: '/admin/export', icon: '📥' },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading Governance Console...</div>
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
              <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>PLACEMENT CELL ADMIN</div>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div style={{
          padding: '16px 20px',
          margin: '16px',
          background: 'rgba(245, 158, 11, 0.05)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(245, 158, 11, 0.2)'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fbbf24' }}>
            Placement Cell
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {user?.email}
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className="badge badge-interview" style={{ fontSize: '0.68rem' }}>SUPERUSER RBAC</span>
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
                  background: isActive ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
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
