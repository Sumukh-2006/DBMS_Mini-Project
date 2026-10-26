'use client';
// app/recruiter/postings/create/page.js - Create Posting with Vector Embedding Generation
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePostingPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Bengaluru, India');
  const [mode, setMode] = useState('hybrid');
  const [stipend, setStipend] = useState('90000');
  const [openings, setOpenings] = useState('3');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [startDate, setStartDate] = useState(new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10));
  const [durationWeeks, setDurationWeeks] = useState('12');
  const [minCgpa, setMinCgpa] = useState('7.50');
  const [allSkills, setAllSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillInputId, setSkillInputId] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);
  const [minLevel, setMinLevel] = useState('3');
  const [selectedDepts, setSelectedDepts] = useState(['1', '2']); // CSE & AIML default
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/student/profile')
      .then((res) => res.json())
      .then((data) => {
        setAllSkills(data.allSkills || []);
        if (data.allSkills?.length > 0) setSkillInputId(data.allSkills[0].skill_id.toString());
      });
  }, []);

  const handleAddSkill = () => {
    if (!skillInputId) return;
    const skObj = allSkills.find((s) => s.skill_id.toString() === skillInputId.toString());
    if (skObj && !selectedSkills.find((s) => s.skillId.toString() === skillInputId.toString())) {
      setSelectedSkills([
        ...selectedSkills,
        { skillId: skObj.skill_id, name: skObj.name, isMandatory, minLevel: parseInt(minLevel) }
      ]);
    }
  };

  const handleRemoveSkill = (skillId) => {
    setSelectedSkills(selectedSkills.filter((s) => s.skillId !== skillId));
  };

  const handleDeptToggle = (deptId) => {
    if (selectedDepts.includes(deptId)) {
      setSelectedDepts(selectedDepts.filter((d) => d !== deptId));
    } else {
      setSelectedDepts([...selectedDepts, deptId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/recruiter/postings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          location,
          mode,
          stipend,
          openings,
          deadline,
          startDate,
          durationWeeks,
          minCgpa,
          skills: selectedSkills,
          eligibleDepts: selectedDepts,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create posting');

      router.push('/recruiter/postings');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Create New Internship Posting</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Publish an internship role with automatic 384-dimensional vector embedding in pgvector
        </p>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger)',
          color: '#fca5a5',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Internship Title *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Systems Engineering Intern - Cloud & Storage"
              required
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Detailed Job Description (Embedded in pgvector) *</label>
            <textarea
              className="form-textarea"
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe candidate responsibilities, project scope, tech stack, and qualifications..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bengaluru, India"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Work Mode</label>
            <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
              <option value="on-site">On-Site</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Monthly Stipend (₹) *</label>
            <input
              type="number"
              className="form-input"
              value={stipend}
              onChange={(e) => setStipend(e.target.value)}
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Total Openings *</label>
            <input
              type="number"
              className="form-input"
              value={openings}
              onChange={(e) => setOpenings(e.target.value)}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Application Deadline *</label>
            <input
              type="date"
              className="form-input"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Internship Start Date *</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Duration (Weeks)</label>
            <input
              type="number"
              className="form-input"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Minimum Cutoff CGPA (0 - 10)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
              min="0"
              max="10"
              required
            />
          </div>

          {/* Eligible Departments */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Eligible Departments (M:N Relation)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {[
                { id: '1', code: 'CSE', name: 'Computer Science' },
                { id: '2', code: 'AIML', name: 'AI & ML' },
                { id: '3', code: 'ECE', name: 'Electronics & Comm' },
                { id: '4', code: 'ISE', name: 'Information Science' },
                { id: '5', code: 'MECH', name: 'Mechanical' },
                { id: '6', code: 'BT', name: 'Biotechnology' },
              ].map((d) => {
                const isSelected = selectedDepts.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleDeptToggle(d.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: isSelected ? '#a5b4fc' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}{d.code} - {d.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Required Skills Picker */}
          <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '10px' }}>
            <label className="form-label">Skill Requirements (M:N Relation with Mandatory Flag & Min Level)</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <select
                className="form-select"
                style={{ flex: 2 }}
                value={skillInputId}
                onChange={(e) => setSkillInputId(e.target.value)}
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
                value={minLevel}
                onChange={(e) => setMinLevel(e.target.value)}
              >
                <option value="1">Min Lv 1 (Basic)</option>
                <option value="2">Min Lv 2 (Working)</option>
                <option value="3">Min Lv 3 (Competent)</option>
                <option value="4">Min Lv 4 (Proficient)</option>
                <option value="5">Min Lv 5 (Expert)</option>
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                />
                Mandatory
              </label>

              <button type="button" onClick={handleAddSkill} className="btn btn-secondary btn-sm">
                + Add Skill
              </button>
            </div>

            {/* Selected Skills Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {selectedSkills.map((s) => (
                <span
                  key={s.skillId}
                  style={{
                    background: s.isMandatory ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${s.isMandatory ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-color)'}`,
                    color: s.isMandatory ? '#a5b4fc' : 'var(--text-secondary)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {s.name} ({s.isMandatory ? `Req Lv${s.minLevel}` : 'Preferred'})
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
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '28px', background: 'linear-gradient(135deg, #ec4899, #be185d)' }}
          disabled={submitting}
        >
          {submitting ? 'Generating Embeddings & Publishing Posting...' : 'Publish Internship Posting →'}
        </button>
      </form>
    </div>
  );
}
