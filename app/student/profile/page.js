'use client';
// app/student/profile/page.js - Profile, Skills Catalogue, and MongoDB Resume Parser
import React, { useEffect, useState } from 'react';

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
            extractedAt: new Date().toISOString()
          }
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

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading profile...</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Student Profile & Skills</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Manage your verified academic profile, skill competencies, and MongoDB parsed resume
        </p>
      </div>

      {message && (
        <div style={{
          background: 'var(--success-bg)',
          border: '1px solid var(--success)',
          color: '#6ee7b7',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left: Academic & Bio Form */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Academic & Contact Details</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontSize: '0.88rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Full Name: </span>
              <strong>{profile.student.full_name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>USN: </span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{profile.student.usn}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Department: </span>
              <strong>{profile.student.dept_name} ({profile.student.dept_code})</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>CGPA: </span>
              <strong style={{ color: '#34d399' }}>{profile.student.cgpa} / 10.00</strong>
            </div>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Portfolio / GitHub Link</label>
              <input
                type="url"
                className="form-input"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://github.com/..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Professional Summary (Influences Semantic Embeddings)</label>
              <textarea
                className="form-textarea"
                rows="4"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Describe your technical background, projects, and specialties..."
              />
            </div>

            {/* Skills Editor */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>
                Skills & Proficiency Levels (1 = Basic, 5 = Expert)
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <select
                  className="form-select"
                  style={{ flex: 2 }}
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
                  style={{ flex: 1 }}
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                >
                  <option value="1">Level 1 (Basic)</option>
                  <option value="2">Level 2 (Working)</option>
                  <option value="3">Level 3 (Competent)</option>
                  <option value="4">Level 4 (Proficient)</option>
                  <option value="5">Level 5 (Expert)</option>
                </select>

                <button type="button" onClick={handleAddSkill} className="btn btn-secondary btn-sm">
                  + Add Skill
                </button>
              </div>

              {/* Skills Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skills.map((s) => (
                  <span
                    key={s.skillId}
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#a5b4fc',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {s.name} (Lv {s.proficiency})
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s.skillId)}
                      style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 800 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '24px', width: '100%' }} disabled={saving}>
              {saving ? 'Updating Profile & Recomputing Vectors...' : 'Save Profile & Update Embeddings'}
            </button>
          </form>
        </div>

        {/* Right: MongoDB Resume Upload & Preview */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
            📄 Resume Parser (MongoDB)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Parsed resume text is stored in MongoDB and automatically re-embedded in pgvector.
          </p>

          <div className="form-group">
            <label className="form-label">Paste Resume Content / Project Highlights</label>
            <textarea
              className="form-textarea"
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
            style={{ width: '100%', marginBottom: '24px' }}
          >
            Extract Skills & Save to MongoDB Document Store →
          </button>

          {profile.resume && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              fontSize: '0.82rem'
            }}>
              <div style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Current Stored MongoDB Resume Data:
              </div>
              <pre style={{ color: '#818cf8', overflowX: 'auto', fontFamily: 'var(--font-mono)' }}>
                {JSON.stringify(profile.resume, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
