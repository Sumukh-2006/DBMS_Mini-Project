'use client';
// app/admin/layout.js - Admin Governance Portal Layout
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';

export default function AdminLayout({ children }) {
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="live-indicator-dot" />
          <span style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
            Authenticating Governance Console...
          </span>
        </div>
      </div>
    );
  }

  return (
    <AppShell role="admin" user={user} onLogout={handleLogout}>
      {children}
    </AppShell>
  );
}
