'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import {
  IconCheck,
  IconAlertCircle,
  IconFileCode,
  IconPlus,
  IconX,
  IconSparkles,
  IconUserCheck,
} from '@tabler/icons-react';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('3');
  const [resumeText, setResumeText] = useState('');
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchProfile = () => {
    setLoading(true);
    fetch('/api/student/profile')
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setPhone(data.student.phone || '');
        setAbout(data.student.about || '');
        setPortfolioUrl(data.student.portfolio_url || '');
        setSkills(data.skills.map((s) => ({ skillId: s.skill_id, name: s.name, proficiency: s.proficiency })));
        setAllSkills(data.allSkills || []);
        if (data.allSkills?.length > 0) setSelectedSkillId(data.allSkills[0].skill_id.toString());
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAddSkill = () => {
    if (!selectedSkillId) return;
    const exists = skills.find((s) => s.skillId.toString() === selectedSkillId.toString());
    const skObj = allSkills.find((s) => s.skill_id.toString() === selectedSkillId.toString());
    if (exists) {
      setSkills(skills.map((s) => s.skillId.toString() === selectedSkillId.toString() ? { ...s, proficiency: parseInt(selectedLevel) } : s));
    } else if (skObj) {
      setSkills([...skills, { skillId: skObj.skill_id, name: skObj.name, proficiency: parseInt(selectedLevel) }]);
    }
  };

  const handleRemoveSkill = (skillId) => {
    setSkills(skills.filter((s) => s.skillId !== skillId));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          about,
          portfolioUrl,
          skills,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setMessage(data.message);
      fetchProfile();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleParseResume = async () => {
    if (!resumeText.trim()) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/student/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: resumeText,
          parsedData: {
            summary: resumeText.slice(0, 300),
            extractedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse resume');
      setMessage(`Resume parsed into MongoDB! Extracted skills: ${data.extractedSkills.join(', ')}`);
      fetchProfile();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        <div style={{ height: '400px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
        <div style={{ height: '400px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        eyebrow="Academic Registry • Verified Identity"
        title="Student Profile & Skills"
        subtitle="Manage your verified academic profile, skill competencies, and MongoDB parsed resume"
        action={
          <div
            style={{
              fontFamily: 'var(--font-mono), monospace',
              fontSize: '0.74rem',
              color: '#047857',
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconUserCheck size={14} />
            <span>PES Verified Student</span>
          </div>
        }
      />

      {message && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #bbf7d0',
            borderLeft: '4px solid #16a34a',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            color: '#15803d',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <IconCheck size={18} />
          <span>{message}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Left: Academic & Bio Form */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--ink)' }}>
            Academic Record & Bio
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontFamily: 'var(--font-mono), monospace',
              fontSize: '0.78rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--ink-muted)' }}>Name: </span>
              <strong style={{ color: 'var(--ink)' }}>{profile.student.full_name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ink-muted)' }}>USN: </span>
              <strong style={{ color: 'var(--ink)' }}>{profile.student.usn}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ink-muted)' }}>Dept: </span>
              <strong style={{ color: 'var(--ink)' }}>{profile.student.dept_name} ({profile.student.dept_code})</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ink-muted)' }}>CGPA: </span>
              <strong style={{ color: '#047857' }}>{profile.student.cgpa} / 10.00</strong>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%' }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
              />
            </div>

            <div>
              <label className="form-label">Portfolio / GitHub Link</label>
              <input
                type="url"
                className="form-input"
                style={{ width: '100%' }}
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://github.com/..."
              />
            </div>

            <div>
              <label className="form-label">Professional Summary (Influences Vector Embeddings)</label>
              <textarea
                className="form-textarea"
                style={{ width: '100%' }}
                rows="4"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Describe your technical background, projects, and specialties..."
              />
            </div>

            {/* Skills Editor */}
            <div style={{ marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--ink)',
                  marginBottom: '10px',
                }}
              >
                Skills Catalogue (Level 1 to 5)
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <select
                  className="form-select"
                  style={{ flex: 2, minWidth: '160px' }}
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                >
                  {allSkills.map((sk) => (
                    <option key={sk.skill_id} value={sk.skill_id}>
                      {sk.name} ({sk.category})
                    </option>
                  ))}
                </select>

                <select
                  className="form-select"
                  style={{ flex: 1, minWidth: '120px' }}
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                >
                  <option value="1">Level 1 (Basic)</option>
                  <option value="2">Level 2 (Working)</option>
                  <option value="3">Level 3 (Competent)</option>
                  <option value="4">Level 4 (Proficient)</option>
                  <option value="5">Level 5 (Expert)</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <IconPlus size={14} /> Add
                </button>
              </div>

              {/* Skills Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {skills.map((s) => (
                  <span
                    key={s.skillId}
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.74rem',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--surface-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--ink)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {s.name} (Lv {s.proficiency})
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s.skillId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                      }}
                      title="Remove skill"
                    >
                      <IconX size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '16px', width: '100%' }}
              disabled={saving}
            >
              {saving ? 'Updating Profile & Vectors...' : 'Save Profile & Re-Embed in pgvector'}
            </button>
          </form>
        </div>

        {/* Right: MongoDB Resume Upload & Preview */}
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--ink)' }}>
            Resume Document Parser (MongoDB)
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
            Parsed resume text is stored in MongoDB document collections and automatically re-embedded into pgvector.
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Paste Raw Resume Text / Project Summaries</label>
            <textarea
              className="form-textarea"
              style={{ width: '100%', fontFamily: 'var(--font-mono), monospace', fontSize: '0.8rem' }}
              rows="8"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste raw resume text, education, projects, technical skills..."
            />
          </div>

          <button
            type="button"
            onClick={handleParseResume}
            disabled={saving || !resumeText.trim()}
            className="btn btn-secondary"
            style={{ width: '100%', marginBottom: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <IconSparkles size={16} /> Extract Skills & Save to MongoDB Document Store
          </button>

          {profile.resume && (
            <div
              style={{
                marginTop: 'auto',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--ink-muted)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <IconFileCode size={14} /> Stored MongoDB Document
              </div>
              <pre
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.72rem',
                  color: 'var(--ink)',
                  margin: 0,
                  overflowX: 'auto',
                  maxHeight: '200px',
                  lineHeight: 1.4,
                }}
              >
                {JSON.stringify(profile.resume, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
