'use client';

// app/register/page.js - Registration for Student and Recruiter (Light Editorial Style)
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconSparkles, IconArrowLeft } from '@tabler/icons-react';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    // Student fields
    usn: '',
    fullName: '',
    deptId: '1',
    cgpa: '8.50',
    year: '3',
    phone: '+919876543299',
    about: '',
    // Recruiter fields
    companyName: '',
    industry: 'Technology',
    designation: 'Technical Talent Acquisition',
    website: 'https://',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, ...formData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      if (role === 'student') router.push('/student');
      else router.push('/recruiter');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
      }}
    >
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
          maxWidth: '560px',
          width: '100%',
          padding: '36px 32px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
              marginBottom: '12px',
            }}
          >
            <IconSparkles size={20} />
          </div>

          <div className="mono-eyebrow" style={{ justifyContent: 'center', marginBottom: '6px' }}>
            <span className="indicator-dot" /> NEW REGISTRATION
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
            Create an Account
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--ink-muted)', marginTop: '4px' }}>
            InternTrack • PES University Placement Platform
          </p>

          {/* Floating Pill Role Toggle */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--surface-subtle)',
              borderRadius: '999px',
              padding: '4px',
              marginTop: '16px',
              border: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => setRole('student')}
              style={{
                padding: '6px 20px',
                borderRadius: '999px',
                border: 'none',
                fontFamily: 'var(--font-mono), monospace',
                fontWeight: 600,
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                background: role === 'student' ? 'var(--ink)' : 'transparent',
                color: role === 'student' ? '#ffffff' : 'var(--ink-muted)',
                transition: 'all 0.16s ease',
              }}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('recruiter')}
              style={{
                padding: '6px 20px',
                borderRadius: '999px',
                border: 'none',
                fontFamily: 'var(--font-mono), monospace',
                fontWeight: 600,
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                background: role === 'recruiter' ? 'var(--ink)' : 'transparent',
                color: role === 'recruiter' ? '#ffffff' : 'var(--ink-muted)',
                transition: 'all 0.16s ease',
              }}
            >
              Recruiter
            </button>
          </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder={role === 'student' ? 'student@pes.edu' : 'recruiter@company.com'}
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                required
              />
            </div>

            {role === 'student' ? (
              <>
                <div className="form-group">
                  <label className="form-label">USN *</label>
                  <input
                    type="text"
                    name="usn"
                    className="form-input"
                    value={formData.usn}
                    onChange={handleChange}
                    placeholder="PES1UG22CS..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    className="form-input"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Your Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select name="deptId" className="form-select" value={formData.deptId} onChange={handleChange}>
                    <option value="1">CSE - Computer Science</option>
                    <option value="2">AIML - Artificial Intelligence</option>
                    <option value="3">ECE - Electronics & Comm</option>
                    <option value="4">ISE - Information Science</option>
                    <option value="5">MECH - Mechanical</option>
                    <option value="6">BT - Biotechnology</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Current CGPA (0 - 10) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cgpa"
                    className="form-input"
                    value={formData.cgpa}
                    onChange={handleChange}
                    min="0"
                    max="10"
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Professional Summary / About</label>
                  <textarea
                    name="about"
                    className="form-textarea"
                    rows="2"
                    value={formData.about}
                    onChange={handleChange}
                    placeholder="Short summary of technical interests and skills..."
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    className="form-input"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="e.g. Acme Technologies"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Industry *</label>
                  <input
                    type="text"
                    name="industry"
                    className="form-input"
                    value={formData.industry}
                    onChange={handleChange}
                    placeholder="e.g. Cloud & AI"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Designation *</label>
                  <input
                    type="text"
                    name="designation"
                    className="form-input"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="e.g. University Recruiter"
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Company Website</label>
                  <input
                    type="url"
                    name="website"
                    className="form-input"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://company.com"
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '16px', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'CREATING ACCOUNT...' : `REGISTER AS ${role === 'student' ? 'STUDENT' : 'RECRUITER'} →`}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '0.84rem', color: 'var(--ink-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'underline' }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
