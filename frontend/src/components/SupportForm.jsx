import React, { useState } from 'react';
import axios from 'axios';

function SupportForm() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phoneNumber: '', description: '',
  });
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [focusedField, setFocusedField] = useState('');
  const [showSuccess, setShowSuccess]   = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/support', formData);
      setShowSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const baseInput = {
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '8px',
    color: '#f0f4ff',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    transition: 'all 0.3s',
    resize: 'vertical',
  };

  const inputStyle = (name) => ({
    ...baseInput,
    border: focusedField === name
      ? '1.5px solid rgba(45,126,247,0.6)'
      : '1.5px solid rgba(255,255,255,0.1)',
    boxShadow: focusedField === name
      ? '0 0 0 3px rgba(45,126,247,0.15)'
      : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '32px 16px', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes pulseGlow { 0%,100%{opacity:.4;transform:scale(1);} 50%{opacity:.7;transform:scale(1.08);} }
        .glow-orb { background: radial-gradient(circle, rgba(45,126,247,0.15) 0%, transparent 70%); animation: pulseGlow 5s ease-in-out infinite; }
        .support-label { display: block; font-size: 0.7rem; font-weight: 600; color: #5a6478; letter-spacing: 0.08em; margin-bottom: 6px; }
        .back-link { color: #5a6478; font-size: 0.875rem; text-decoration: none; transition: color 0.2s; }
        .back-link:hover { color: #93c5fd; }
        .submit-btn { width: 100%; padding: 14px; border-radius: 14px; font-size: 0.97rem; font-weight: 600; border: none; cursor: pointer; margin-top: 8px; transition: all 0.3s; }
        .submit-btn:not(:disabled):hover { background: #60a5fa; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(45,126,247,0.35); }
        .submit-btn:disabled { cursor: not-allowed; }
        .home-btn { display: inline-block; width: 100%; padding: 12px; border-radius: 14px; background: #3b82f6; color: white; font-size: 0.875rem; font-weight: 600; text-align: center; text-decoration: none; transition: all 0.3s; box-sizing: border-box; }
        .home-btn:hover { background: #60a5fa; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .field-wrap { margin-bottom: 20px; }
      `}</style>

      {/* Background glow */}
      <div className="glow-orb" style={{ position: 'fixed', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '600px', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      {/* Success Pop-up */}
      {showSuccess && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: '#1a2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '40px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.8rem' }}>
              🎧
            </div>
            <h3 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f0f4ff', marginBottom: '8px' }}>Thank You!</h3>
            <p style={{ color: '#8a96b0', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '28px' }}>
              Thank you for contacting us — we will get back to you soon.
            </p>
            <a href="/" className="home-btn">← Back to Home</a>
          </div>
        </div>
      )}

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '620px', background: '#1a2030', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '48px 44px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

        {/* Badge */}
        <div style={{ display: 'inline-block', marginBottom: '16px', padding: '6px 16px', borderRadius: '999px', border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.1)', color: '#93c5fd', fontSize: '0.82rem', fontWeight: 500 }}>
          🎧 Student Support
        </div>

        <h2 className="font-display" style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f0f4ff', marginBottom: '8px', lineHeight: 1.2 }}>How Can We Help You?</h2>
        <p style={{ color: '#8a96b0', marginBottom: '32px', fontSize: '0.95rem', lineHeight: 1.6 }}>Fill in the details below and our team will get back to you shortly.</p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* First + Last name */}
          <div className="two-col">
            {[['firstName','FIRST NAME','Enter first name'],['lastName','LAST NAME','Enter last name']].map(([name, label, placeholder]) => (
              <div key={name}>
                <label className="support-label">{label}</label>
                <input
                  type="text" name={name} value={formData[name]} onChange={handleChange}
                  onFocus={() => setFocusedField(name)} onBlur={() => setFocusedField('')}
                  onKeyDown={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
                  placeholder={placeholder} required style={inputStyle(name)}
                />
              </div>
            ))}
          </div>

          {/* Email */}
          <div className="field-wrap">
            <label className="support-label">EMAIL ADDRESS</label>
            <input
              type="email" name="email" value={formData.email} onChange={handleChange}
              onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField('')}
              placeholder="example@gmail.com" required style={inputStyle('email')}
            />
          </div>

          {/* Phone */}
          <div className="field-wrap">
            <label className="support-label">PHONE NUMBER</label>
            <input
              type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
              onFocus={() => setFocusedField('phoneNumber')} onBlur={() => setFocusedField('')}
              onKeyDown={(e) => { if (/[a-zA-Z]/.test(e.key) && e.key.length === 1) e.preventDefault(); }}
              placeholder="+94 XX XXX XXX" required style={inputStyle('phoneNumber')}
            />
          </div>

          {/* Description */}
          <div className="field-wrap">
            <label className="support-label">DESCRIPTION</label>
            <textarea
              name="description" value={formData.description} onChange={handleChange}
              onFocus={() => setFocusedField('description')} onBlur={() => setFocusedField('')}
              placeholder="Describe your issue or support request..." required rows={5}
              style={inputStyle('description')}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="submit-btn"
            style={{ background: loading ? 'rgba(59,130,246,0.3)' : '#3b82f6', color: loading ? 'rgba(255,255,255,0.5)' : 'white' }}
          >
            {loading ? 'Submitting...' : '🎧 Submit Support Request'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px' }}>
          <a href="/" className="back-link">← Back to Home</a>
        </p>
      </div>
    </div>
  );
}

export default SupportForm;