'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';

export default function StudentLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated || data.user.role !== 'student') {
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
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'var(--font-mono), monospace',
            fontSize: '0.82rem',
            color: 'var(--ink-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <span className="indicator-dot" /> Loading Student Portal...
        </div>
      </div>
    );
  }

  return (
    <AppShell
      role="student"
      user={{
        ...user,
        fullName: user?.full_name || user?.email,
      }}
      onLogout={handleLogout}
    >
      {children}
    </AppShell>
  );
}
