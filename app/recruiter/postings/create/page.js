'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '../../../../components/PageHeader';
import {
  IconPlus,
  IconX,
  IconSparkles,
  IconAlertCircle,
  IconArrowLeft,
} from '@tabler/icons-react';
import Link from 'next/link';

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
        { skillId: skObj.skill_id, name: skObj.name, isMandatory, minLevel: parseInt(minLevel) },
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
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        eyebrow="Role Creation • Vector Embedding Pipeline"
        title="Create New Internship Posting"
        subtitle="Publish an internship opening with automatic 384-dimensional vector embedding in pgvector"
        action={
          <Link
            href="/recruiter/postings"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconArrowLeft size={14} /> Back to Postings
          </Link>
        }
      />

      {error && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #fecdd3',
            borderLeft: '4px solid #e11d48',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            color: '#be123c',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <IconAlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Internship Title *</label>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%' }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Systems Engineering Intern - Cloud & Storage"
              required
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Detailed Job Description (Embedded in pgvector) *</label>
            <textarea
              className="form-textarea"
              style={{ width: '100%' }}
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe candidate responsibilities, project scope, tech stack, and qualifications..."
              required
            />
          </div>

          <div>
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%' }}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bengaluru, India"
              required
            />
          </div>

          <div>
            <label className="form-label">Work Mode</label>
            <select className="form-select" style={{ width: '100%' }} value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
              <option value="on-site">On-Site</option>
            </select>
          </div>

          <div>
            <label className="form-label">Monthly Stipend (₹) *</label>
            <input
              type="number"
              className="form-input"
              style={{ width: '100%' }}
              value={stipend}
              onChange={(e) => setStipend(e.target.value)}
              min="0"
              required
            />
          </div>

          <div>
            <label className="form-label">Total Openings *</label>
            <input
              type="number"
              className="form-input"
              style={{ width: '100%' }}
              value={openings}
              onChange={(e) => setOpenings(e.target.value)}
              min="1"
              required
            />
          </div>

          <div>
            <label className="form-label">Application Deadline *</label>
            <input
              type="date"
              className="form-input"
              style={{ width: '100%' }}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Internship Start Date *</label>
            <input
              type="date"
              className="form-input"
              style={{ width: '100%' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Duration (Weeks)</label>
            <input
              type="number"
              className="form-input"
              style={{ width: '100%' }}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              min="1"
              required
            />
          </div>

          <div>
            <label className="form-label">Minimum Cutoff CGPA (0 - 10)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              style={{ width: '100%' }}
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
              min="0"
              max="10"
              required
            />
          </div>

          {/* Eligible Departments */}
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Eligible Academic Departments</label>
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
                      padding: '6px 14px',
                      borderRadius: '999px',
                      border: `1px solid ${isSelected ? 'var(--ink)' : 'var(--border)'}`,
                      backgroundColor: isSelected ? 'var(--ink)' : '#ffffff',
                      color: isSelected ? '#ffffff' : 'var(--ink-muted)',
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {d.code} • {d.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Required Skills Picker */}
          <div style={{ gridColumn: 'span 2', marginTop: '8px' }}>
            <label className="form-label">Skill Requirements (M:N Relation with Mandatory Flag & Min Level)</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="form-select"
                style={{ flex: 2, minWidth: '180px' }}
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
                style={{ flex: 1, minWidth: '130px' }}
                value={minLevel}
                onChange={(e) => setMinLevel(e.target.value)}
              >
                <option value="1">Min Lv 1 (Basic)</option>
                <option value="2">Min Lv 2 (Working)</option>
                <option value="3">Min Lv 3 (Competent)</option>
                <option value="4">Min Lv 4 (Proficient)</option>
                <option value="5">Min Lv 5 (Expert)</option>
              </select>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--ink)', fontFamily: 'var(--font-mono), monospace', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                />
                Mandatory
              </label>

              <button
                type="button"
                onClick={handleAddSkill}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <IconPlus size={14} /> Add Skill
              </button>
            </div>

            {/* Selected Skills Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
              {selectedSkills.map((s) => (
                <span
                  key={s.skillId}
                  style={{
                    backgroundColor: s.isMandatory ? 'var(--surface-subtle)' : '#ffffff',
                    border: '1px solid var(--border)',
                    color: s.isMandatory ? 'var(--ink)' : 'var(--ink-muted)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: '0.74rem',
                    fontWeight: s.isMandatory ? 600 : 400,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {s.name} ({s.isMandatory ? `Req Lv${s.minLevel}` : 'Preferred'})
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s.skillId)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    <IconX size={13} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          disabled={submitting}
        >
          <IconSparkles size={16} />
          {submitting ? 'Generating Embeddings & Publishing Role...' : 'Publish Internship Role →'}
        </button>
      </form>
    </div>
  );
}
