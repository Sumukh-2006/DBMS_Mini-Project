'use client';

// app/login/page.js - Authentication Sign In Page (Light Editorial-Tech Style)
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconSparkles, IconArrowLeft } from '@tabler/icons-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (data.user.role === 'student') router.push('/student');
      else if (data.user.role === 'recruiter') router.push('/recruiter');
      else if (data.user.role === 'admin') router.push('/admin');
      else router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
      }}
    >
      {/* Top back button */}
      <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
        <Link
          href="/"
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <IconArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>
      </div>

      <div
        className="editorial-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '36px 32px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0a0a0a 0%, #3b6b8f 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: '14px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <IconSparkles size={20} />
          </div>

          <div className="mono-eyebrow" style={{ justifyContent: 'center', marginBottom: '6px' }}>
            <span className="indicator-dot" /> AUTHENTICATION GATE
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
            Sign In to InternTrack
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--ink-muted)', marginTop: '4px' }}>
            PES University Placement & Internship Engine
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--accent-faint)',
              border: '1px solid rgba(217, 45, 32, 0.3)',
              color: 'var(--accent)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '18px',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono), monospace',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sumukh.student@pes.edu"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '14px', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'AUTHENTICATING...' : 'SIGN IN →'}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <div
            className="mono-eyebrow"
            style={{
              fontSize: '0.68rem',
              marginBottom: '10px',
              display: 'block',
              textAlign: 'center',
            }}
          >
            QUICK DEMO CREDENTIALS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleDemoSelect('sumukh.student@pes.edu')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.68rem', padding: '6px 8px' }}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('sarah.recruiter@google.com')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.68rem', padding: '6px 8px' }}
            >
              Recruiter
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('admin@pes.edu')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.68rem', padding: '6px 8px' }}
            >
              Admin
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '0.84rem', color: 'var(--ink-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'underline' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
