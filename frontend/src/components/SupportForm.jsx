import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WatchMeTimer from './WatchMeTimer';   // ← NEW IMPORT

function SupportForm() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !token) {
      navigate('/login', { state: { from: '/support', message: 'Please log in to access the support centre.' } });
    }
  }, [user, token, navigate]);

  const [formData, setFormData] = useState({
    firstName:   user?.firstName   || '',
    lastName:    user?.lastName    || '',
    email:       user?.email       || '',
    phoneNumber: user?.phone       || '',
    description: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName:   prev.firstName   || user.firstName || '',
        lastName:    prev.lastName    || user.lastName  || '',
        email:       prev.email       || user.email     || '',
        phoneNumber: prev.phoneNumber || user.phone     || '',
      }));
    }
  }, [user]);

  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [focusedField, setFocusedField] = useState('');
  const [showSuccess, setShowSuccess]   = useState(false);
  const [phoneError, setPhoneError]     = useState('');
  const [visibleSections, setVisibleSections] = useState({});
  const observerRef = useRef(null);
  const sectionRefs = useRef({});

  const sectionRef = useCallback((key) => (el) => {
    if (!el) return;
    sectionRefs.current[key] = el;
    if (observerRef.current) {
      observerRef.current.observe(el);
      el.dataset.section = key;
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const key = entry.target.dataset.section;
            if (key) {
              setVisibleSections(prev => ({ ...prev, [key]: true }));
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observerRef.current = observer;
    Object.entries(sectionRefs.current).forEach(([key, el]) => {
      if (el) { el.dataset.section = key; observer.observe(el); }
    });
    return () => observer.disconnect();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length > 10) return;
      setFormData(prev => ({ ...prev, phoneNumber: digitsOnly }));
      setPhoneError(digitsOnly.length > 0 && digitsOnly.length < 10
        ? 'Phone number must be exactly 10 digits.' : '');
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
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
    transition: 'border-color 0.3s, box-shadow 0.3s',
    resize: 'vertical',
    boxSizing: 'border-box',
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

  const lockedInputStyle = {
    ...baseInput,
    border: '1.5px solid rgba(255,255,255,0.06)',
    color: '#5a6478',
    cursor: 'not-allowed',
    background: 'rgba(255,255,255,0.02)',
  };

  const features = [
    { icon: '⚡', title: 'Fast Response',    desc: 'We typically reply within 24 hours on all working days. Urgent queries are escalated immediately to senior support staff.' },
    { icon: '🔒', title: 'Private & Secure', desc: 'Your personal data is encrypted and never shared with third parties. We follow strict privacy guidelines for all student interactions.' },
    { icon: '🎓', title: 'Student First',    desc: 'Our support system is built exclusively for students and landlords on UniNEST — real people, real solutions, no bots.' },
    { icon: '🌐', title: 'Always Available', desc: 'Submit a request any time of day. Our team monitors the queue during business hours and responds promptly every morning.' },
  ];

  const faqs = [
    { q: 'How long does a response take?',  a: 'Our AI responds instantly — check your profile page for the reply within seconds of submitting.' },
    { q: 'Can landlords use this form?',    a: 'Absolutely. This form is open to all logged-in UniNEST users — students and annex owners alike.' },
    { q: 'What if my issue is urgent?',     a: 'Mark it urgent in your description and we will prioritise your ticket above the regular queue.' },
    { q: 'Where do I see the AI reply?',    a: 'Go to your Profile page and scroll to the AI Support Centre section — your reply will appear there.' },
  ];

  const testimonials = [
    { name: 'Kavya S.',  role: 'Second Year Student', text: 'Got a response in less than 3 hours. The team was incredibly helpful sorting out my booking issue.' },
    { name: 'Rashan P.', role: 'Annex Owner',         text: 'Professional and fast. They resolved a payment dispute within the same day. Highly recommended.' },
    { name: 'Amali W.',  role: 'First Year Student',  text: 'I was confused about my lease agreement and they walked me through everything step by step.' },
  ];

  const fadeIn = (key, delay = 0) => ({
    opacity:   visibleSections[key] ? 1 : 0,
    transform: visibleSections[key] ? 'translateY(0px)' : 'translateY(32px)',
    transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    willChange: 'opacity, transform',
  });

  if (!user || !token) return null;

  // Full student name passed into WatchMeTimer
  const studentFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student';

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#f0f4ff', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }

        @keyframes pulseGlow  { 0%,100%{opacity:.25;transform:scale(1);}50%{opacity:.5;transform:scale(1.06);} }
        @keyframes fadeUpHero { from{opacity:0;transform:translateY(28px);}to{opacity:1;transform:translateY(0);} }
        @keyframes floatY     { 0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);} }
        @keyframes spin       { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
        @keyframes pulse      { 0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.05);opacity:0.8;} }
        @keyframes modalUp    { from{opacity:0;transform:translateY(24px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);} }

        .glow-orb   { animation: pulseGlow 6s ease-in-out infinite; }
        .hero-fade  { animation: fadeUpHero 0.75s ease both; }
        .float-icon { animation: floatY 4s ease-in-out infinite; }

        .support-label { display:block;font-size:0.7rem;font-weight:600;color:#5a6478;letter-spacing:0.08em;margin-bottom:6px; }

        .submit-btn { width:100%;padding:14px;border-radius:14px;font-size:0.97rem;font-weight:600;border:none;cursor:pointer;transition:background 0.3s,transform 0.2s,box-shadow 0.2s; }
        .submit-btn:not(:disabled):hover { background:#60a5fa !important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(45,126,247,0.35); }
        .submit-btn:disabled { cursor:not-allowed; }

        .two-col   { display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px; }
        .field-wrap { margin-bottom:20px; }

        .feature-card { transition:background 0.35s,transform 0.35s;cursor:default; }
        .feature-card:hover { background:rgba(255,255,255,0.06) !important;transform:translateY(-6px) scale(1.02) !important; }

        .faq-item { transition:background 0.2s,border-color 0.2s;cursor:pointer; }
        .faq-item:hover { background:rgba(59,130,246,0.06) !important;border-color:rgba(59,130,246,0.2) !important; }

        .testimonial-card { transition:transform 0.3s,border-color 0.3s; }
        .testimonial-card:hover { transform:translateY(-4px);border-color:rgba(59,130,246,0.3) !important; }

        .nav-link { color:#5a6478;font-size:0.875rem;text-decoration:none;transition:color 0.2s; }
        .nav-link:hover { color:#93c5fd; }
        .nav-link-active { color:#93c5fd; }

        .back-link { display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);color:#5a6478;font-size:0.875rem;text-decoration:none;transition:color 0.2s,border-color 0.2s;background:rgba(255,255,255,0.02); }
        .back-link:hover { color:#93c5fd;border-color:rgba(59,130,246,0.3); }

        .profile-btn { display:inline-block;padding:12px 28px;border-radius:14px;background:#3b82f6;color:white;font-size:0.875rem;font-weight:600;text-decoration:none;transition:background 0.3s;border:none;cursor:pointer; }
        .profile-btn:hover { background:#60a5fa; }

        @media(max-width:768px){
          .two-col   { grid-template-columns:1fr; }
          .main-grid { grid-template-columns:1fr !important; }
          .feat-grid { grid-template-columns:1fr 1fr !important; }
          .about-grid{ grid-template-columns:1fr !important; }
        }
        @media(max-width:480px){
          .feat-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* Background orbs */}
      <div className="glow-orb" style={{ position:'fixed',top:'-200px',left:'20%',width:'800px',height:'700px',borderRadius:'50%',background:'radial-gradient(circle,rgba(45,126,247,0.1) 0%,transparent 70%)',pointerEvents:'none',zIndex:0 }} />
      <div className="glow-orb" style={{ position:'fixed',bottom:'-150px',right:'5%',width:'600px',height:'500px',borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.09) 0%,transparent 70%)',pointerEvents:'none',zIndex:0,animationDelay:'2.5s' }} />
      <div className="glow-orb" style={{ position:'fixed',top:'40%',left:'-100px',width:'400px',height:'400px',borderRadius:'50%',background:'radial-gradient(circle,rgba(52,211,153,0.05) 0%,transparent 70%)',pointerEvents:'none',zIndex:0,animationDelay:'4s' }} />

      {/* NAVBAR */}
      <nav style={{ position:'sticky',top:0,zIndex:100,background:'rgba(13,17,23,0.85)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'14px 32px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
          <div style={{ width:'32px',height:'32px',borderRadius:'8px',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px' }}>U</div>
          <span className="font-display" style={{ fontWeight:700,fontSize:'1rem',color:'#f0f4ff' }}>UniNEST</span>
        </div>
        <div style={{ display:'flex',gap:'28px',alignItems:'center' }}>
          <a href="/" className="nav-link">Home</a>
          <a href="/support" className="nav-link nav-link-active">Support</a>
          <button onClick={() => navigate('/profile')} className="nav-link" style={{ background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px' }}>
            <span style={{ width:'24px',height:'24px',borderRadius:'6px',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,color:'white' }}>
              {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
            </span>
            <span style={{ color:'#93c5fd',fontSize:'0.85rem' }}>My Profile</span>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position:'relative',zIndex:1,padding:'100px 24px 70px',textAlign:'center' }}>
        <div className="hero-fade" style={{ animationDelay:'0s',animationFillMode:'both' }}>
          <div style={{ display:'inline-block',marginBottom:'24px',padding:'6px 20px',borderRadius:'999px',border:'1px solid rgba(59,130,246,0.4)',background:'rgba(59,130,246,0.08)',color:'#93c5fd',fontSize:'0.82rem',fontWeight:500 }}>
            🎧 UniNEST Student Support Centre
          </div>
        </div>
        <div className="hero-fade font-display" style={{ animationDelay:'0.1s',animationFillMode:'both',fontSize:'clamp(2.2rem,5.5vw,3.8rem)',fontWeight:800,lineHeight:1.1,marginBottom:'24px' }}>
          We're here to help<br />
          <span style={{ background:'linear-gradient(135deg,#60a5fa,#a78bfa,#f472b6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>every step of the way</span>
        </div>
        <div className="hero-fade" style={{ animationDelay:'0.2s',animationFillMode:'both',color:'#8a96b0',fontSize:'1.1rem',maxWidth:'580px',margin:'0 auto 20px',lineHeight:1.8 }}>
          Whether you're a student navigating your first rental or a landlord resolving a dispute — our AI-powered support is ready to help instantly.
        </div>
        <div className="hero-fade" style={{ animationDelay:'0.25s',animationFillMode:'both',color:'#5a6478',fontSize:'0.9rem',maxWidth:'460px',margin:'0 auto 56px',lineHeight:1.7 }}>
          Submit your query below and our AI will analyse your issue and post a personalised reply directly to your profile — no email needed.
        </div>
        <div className="hero-fade" style={{ animationDelay:'0.3s',animationFillMode:'both',display:'flex',justifyContent:'center',gap:'56px',flexWrap:'wrap' }}>
          {[['Instant','AI-powered reply'],['5,000+','Students helped'],['98%','Satisfaction rate'],['4.9★','Support rating']].map(([val,label]) => (
            <div key={label} style={{ textAlign:'center' }}>
              <div className="font-display" style={{ fontSize:'2rem',fontWeight:800,color:'#f0f4ff' }}>{val}</div>
              <div style={{ fontSize:'0.8rem',color:'#5a6478',marginTop:'3px' }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:'56px',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px',opacity:0.4 }}>
          <div style={{ width:'1px',height:'48px',background:'linear-gradient(to bottom,transparent,#5a6478)' }} />
          <div style={{ fontSize:'0.72rem',color:'#5a6478',letterSpacing:'0.1em' }}>SCROLL TO EXPLORE</div>
        </div>
      </div>

      {/* ABOUT BANNER */}
      <div ref={sectionRef('about')} style={{ maxWidth:'960px',margin:'0 auto',padding:'0 24px 80px' }}>
        <div style={{ ...fadeIn('about'),background:'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.06))',border:'1px solid rgba(59,130,246,0.15)',borderRadius:'20px',padding:'48px 44px' }}>
          <div className="about-grid" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'40px',alignItems:'center' }}>
            <div>
              <div style={{ fontSize:'0.72rem',fontWeight:600,color:'#3b82f6',letterSpacing:'0.1em',marginBottom:'12px' }}>ABOUT OUR SUPPORT</div>
              <div className="font-display" style={{ fontSize:'1.7rem',fontWeight:800,color:'#f0f4ff',lineHeight:1.25,marginBottom:'16px' }}>Real support from people who understand student life</div>
              <p style={{ color:'#8a96b0',fontSize:'0.95rem',lineHeight:1.8,marginBottom:'14px' }}>
                UniNEST was founded by students, for students. We know that finding the right place to live is one of the most stressful parts of university life — and we built our support system around making that easier.
              </p>
              <p style={{ color:'#8a96b0',fontSize:'0.95rem',lineHeight:1.8 }}>
                Our AI analyses your issue instantly and posts a personalised response directly to your profile page — no waiting for emails.
              </p>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px' }}>
              {[{label:'Tickets resolved',val:'12,400+'},{label:'Avg. resolution time',val:'&lt;1 min'},{label:'Team members',val:'24 staff'},{label:'Cities covered',val:'8 cities'}].map(({label,val}) => (
                <div key={label} style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'20px 16px',textAlign:'center' }}>
                  <div className="font-display" style={{ fontSize:'1.4rem',fontWeight:800,color:'#60a5fa',marginBottom:'4px' }} dangerouslySetInnerHTML={{ __html: val }} />
                  <div style={{ fontSize:'0.75rem',color:'#5a6478' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FEATURE CARDS */}
      <div ref={sectionRef('features')} style={{ maxWidth:'960px',margin:'0 auto',padding:'0 24px 80px' }}>
        <div style={{ textAlign:'center',marginBottom:'40px',...fadeIn('features') }}>
          <div style={{ fontSize:'0.72rem',fontWeight:600,color:'#3b82f6',letterSpacing:'0.1em',marginBottom:'10px' }}>WHY CHOOSE US</div>
          <div className="font-display" style={{ fontSize:'1.8rem',fontWeight:800,color:'#f0f4ff',marginBottom:'12px' }}>Support that actually supports you</div>
          <p style={{ color:'#8a96b0',fontSize:'0.95rem',maxWidth:'480px',margin:'0 auto',lineHeight:1.7 }}>We don't just close tickets — we solve problems. Here's what makes UniNEST support different.</p>
        </div>
        <div className="feat-grid" style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px' }}>
          {features.map(({icon,title,desc},i) => {
            const key = `feat${i}`;
            return (
              <div key={title} className="feature-card" ref={sectionRef(key)} style={{ ...fadeIn(key,i*0.1),background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px',padding:'28px 22px' }}>
                <div className="float-icon" style={{ fontSize:'26px',marginBottom:'16px',display:'inline-block',animationDelay:`${i*0.6}s` }}>{icon}</div>
                <div className="font-display" style={{ fontWeight:700,fontSize:'0.95rem',marginBottom:'10px',color:'#f0f4ff' }}>{title}</div>
                <div style={{ fontSize:'0.82rem',color:'#8a96b0',lineHeight:1.7 }}>{desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN FORM + SIDEBAR */}
      <div ref={sectionRef('form')} className="main-grid" style={{ ...fadeIn('form'),position:'relative',zIndex:1,maxWidth:'1020px',margin:'0 auto',padding:'0 24px 80px',display:'grid',gridTemplateColumns:'1fr 360px',gap:'32px',alignItems:'start' }}>

        {/* ── LEFT COLUMN: Form card + Watch Me Timer ── */}
        <div style={{ display:'flex',flexDirection:'column',gap:'0px' }}>

          {/* Support Form card */}
          <div style={{ background:'#1a2030',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'20px',padding:'44px 40px',boxShadow:'0 24px 80px rgba(0,0,0,0.4)' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'12px',marginBottom:'6px' }}>
              <div style={{ width:'40px',height:'40px',borderRadius:'10px',background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px' }}>🎧</div>
              <h2 className="font-display" style={{ fontSize:'1.6rem',fontWeight:800,color:'#f0f4ff',margin:0 }}>Send us a message</h2>
            </div>
            <p style={{ color:'#8a96b0',marginBottom:'10px',fontSize:'0.9rem',lineHeight:1.7 }}>Fill in your details and describe your issue as clearly as possible. The more context you give us, the faster we can help.</p>
            <p style={{ color:'#5a6478',marginBottom:'32px',fontSize:'0.82rem',lineHeight:1.6 }}>All fields are required. Your information is kept private and used only to respond to your request.</p>

            <div style={{ background:'rgba(59,130,246,0.06)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:'10px',padding:'10px 14px',marginBottom:'24px',display:'flex',alignItems:'center',gap:'10px' }}>
              <span style={{ fontSize:'16px' }}>🤖</span>
              <span style={{ fontSize:'0.8rem',color:'#93c5fd',lineHeight:1.5 }}>
                <strong>AI-Powered:</strong> After you submit, our AI will instantly analyse your issue and post a personalised reply on your Profile page — no email needed.
              </span>
            </div>

            {error && (
              <div style={{ background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#f87171',padding:'10px 14px',borderRadius:'8px',marginBottom:'20px',fontSize:'0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="two-col">
                <div>
                  <label className="support-label">FIRST NAME <span style={{ color:'#3a4a5c' }}>(from your account)</span></label>
                  <input type="text" value={formData.firstName} disabled style={lockedInputStyle} />
                </div>
                <div>
                  <label className="support-label">LAST NAME <span style={{ color:'#3a4a5c' }}>(from your account)</span></label>
                  <input type="text" value={formData.lastName} disabled style={lockedInputStyle} />
                </div>
              </div>

              <div className="field-wrap">
                <label className="support-label">EMAIL ADDRESS <span style={{ color:'#3a4a5c' }}>(from your account)</span></label>
                <input type="email" value={formData.email} disabled style={lockedInputStyle} />
              </div>

              <div className="field-wrap">
                <label className="support-label" style={{ display:'flex',justifyContent:'space-between' }}>
                  <span>PHONE NUMBER</span>
                  <span style={{ color:formData.phoneNumber.length===10?'#34d399':'#5a6478',fontWeight:600,transition:'color 0.2s' }}>
                    {formData.phoneNumber.length}/10
                  </span>
                </label>
                <input
                  type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                  onFocus={() => setFocusedField('phoneNumber')} onBlur={() => setFocusedField('')}
                  placeholder="0771234567" required
                  style={{
                    ...baseInput,
                    border: phoneError
                      ? '1.5px solid rgba(239,68,68,0.6)'
                      : formData.phoneNumber.length===10
                      ? '1.5px solid rgba(52,211,153,0.6)'
                      : focusedField==='phoneNumber'
                      ? '1.5px solid rgba(45,126,247,0.6)'
                      : '1.5px solid rgba(255,255,255,0.1)',
                    boxShadow: phoneError
                      ? '0 0 0 3px rgba(239,68,68,0.1)'
                      : formData.phoneNumber.length===10
                      ? '0 0 0 3px rgba(52,211,153,0.1)'
                      : focusedField==='phoneNumber'
                      ? '0 0 0 3px rgba(45,126,247,0.15)'
                      : 'none',
                  }}
                />
                {phoneError && <div style={{ marginTop:'6px',fontSize:'0.78rem',color:'#f87171',display:'flex',alignItems:'center',gap:'4px' }}>⚠ {phoneError}</div>}
                {formData.phoneNumber.length===10 && !phoneError && <div style={{ marginTop:'6px',fontSize:'0.78rem',color:'#34d399',display:'flex',alignItems:'center',gap:'4px' }}>✓ Looks good!</div>}
              </div>

              <div className="field-wrap">
                <label className="support-label" style={{ display:'flex',justifyContent:'space-between' }}>
                  <span>DESCRIPTION</span>
                  <span style={{ color:'#5a6478',fontWeight:600 }}>{formData.description.length} chars</span>
                </label>
                <textarea
                  name="description" value={formData.description} onChange={handleChange}
                  onFocus={() => setFocusedField('description')} onBlur={() => setFocusedField('')}
                  placeholder="Describe your issue in as much detail as possible. Include your booking ID, annex name, or any relevant dates to help us resolve it faster..." required rows={6}
                  style={inputStyle('description')}
                />
                <div style={{ marginTop:'6px',fontSize:'0.78rem',color:'#5a6478' }}>Tip: Include your booking ID or annex name to speed things up.</div>
              </div>

              <button
                type="submit"
                disabled={loading || !!phoneError || formData.phoneNumber.length !== 10}
                className="submit-btn"
                style={{
                  background:(loading || !!phoneError || formData.phoneNumber.length!==10)?'rgba(59,130,246,0.3)':'#3b82f6',
                  color:(loading || !!phoneError || formData.phoneNumber.length!==10)?'rgba(255,255,255,0.4)':'white',
                }}
              >
                {loading ? '⏳ Submitting...' : '🎧 Submit Support Request'}
              </button>

              <p style={{ textAlign:'center',marginTop:'16px',fontSize:'0.78rem',color:'#5a6478',lineHeight:1.6 }}>
                Your reply will appear on your <span style={{ color:'#60a5fa',cursor:'pointer' }} onClick={() => navigate('/profile')}>Profile page</span> within seconds.
              </p>
            </form>
          </div>

          {/* ── WATCH ME TIMER — sits directly below the form card ── */}
          <WatchMeTimer studentName={studentFullName} />

        </div>{/* end left column */}

        {/* ── RIGHT COLUMN: Sidebar ── */}
        <div style={{ display:'flex',flexDirection:'column',gap:'20px' }}>

          {/* Logged-in user card */}
          <div style={{ background:'linear-gradient(135deg,rgba(45,126,247,0.12),rgba(139,92,246,0.08))',border:'1px solid rgba(45,126,247,0.25)',borderRadius:'16px',padding:'20px 22px',display:'flex',alignItems:'center',gap:'14px' }}>
            <div style={{ width:'44px',height:'44px',borderRadius:'12px',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',fontWeight:700,color:'white',flexShrink:0 }}>
              {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ color:'#f0f4ff',fontWeight:600,fontSize:'0.9rem',margin:0 }}>{user.firstName} {user.lastName}</p>
              <p style={{ color:'#5a6478',fontSize:'0.75rem',margin:'2px 0 0' }}>{user.role === 'landlord' ? '🏠 Annex Owner' : '🎓 Student'} · Logged in</p>
            </div>
          </div>

          {/* Contact card */}
          <div style={{ background:'#1a2030',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px',padding:'28px' }}>
            <div className="font-display" style={{ fontWeight:700,fontSize:'1rem',marginBottom:'6px',color:'#f0f4ff' }}>Other ways to reach us</div>
            <p style={{ fontSize:'0.8rem',color:'#5a6478',marginBottom:'20px',lineHeight:1.6 }}>Prefer a different channel? We're available via email and phone during business hours.</p>
            {[
              {icon:'📧',label:'Email',  value:'support@uninest.lk'},
              {icon:'📞',label:'Hotline',value:'+94 11 234 5678'},
              {icon:'🕐',label:'Hours',  value:'Mon – Fri, 9am – 6pm'},
              {icon:'📍',label:'Office', value:'Colombo 03, Sri Lanka'},
            ].map(({icon,label,value}) => (
              <div key={label} style={{ display:'flex',alignItems:'center',gap:'14px',marginBottom:'14px' }}>
                <div style={{ width:'38px',height:'38px',borderRadius:'10px',background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:'0.68rem',color:'#5a6478',fontWeight:600,letterSpacing:'0.06em' }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize:'0.875rem',color:'#c8d0e0' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Status card */}
          <div style={{ background:'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(139,92,246,0.08))',border:'1px solid rgba(59,130,246,0.2)',borderRadius:'16px',padding:'24px' }}>
            <div style={{ fontSize:'0.7rem',color:'#60a5fa',fontWeight:600,letterSpacing:'0.08em',marginBottom:'10px' }}>CURRENT STATUS</div>
            <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px' }}>
              <div style={{ width:'8px',height:'8px',borderRadius:'50%',background:'#34d399',animation:'pulse 2s ease-in-out infinite',flexShrink:0 }} />
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'#f0f4ff' }}>AI Support is online</span>
            </div>
            <p style={{ fontSize:'0.8rem',color:'#8a96b0',lineHeight:1.6,margin:0 }}>Our AI system is active. Your reply will appear on your Profile page within seconds of submitting.</p>
          </div>

          {/* FAQ card */}
          <div style={{ background:'#1a2030',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px',padding:'28px' }}>
            <div className="font-display" style={{ fontWeight:700,fontSize:'1rem',marginBottom:'6px',color:'#f0f4ff' }}>Common questions</div>
            <p style={{ fontSize:'0.8rem',color:'#5a6478',marginBottom:'16px',lineHeight:1.6 }}>Quick answers before you reach out.</p>
            {faqs.map(({q,a}) => (
              <div key={q} className="faq-item" style={{ background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:'10px',padding:'12px 14px',marginBottom:'10px' }}>
                <div style={{ fontSize:'0.82rem',fontWeight:500,color:'#c8d0e0',marginBottom:'5px' }}>{q}</div>
                <div style={{ fontSize:'0.78rem',color:'#8a96b0',lineHeight:1.6 }}>{a}</div>
              </div>
            ))}
          </div>

          <a href="/" className="back-link">← Back to Home</a>
        </div>{/* end sidebar */}
      </div>{/* end main grid */}

      {/* TESTIMONIALS */}
      <div ref={sectionRef('testimonials')} style={{ background:'rgba(255,255,255,0.01)',borderTop:'1px solid rgba(255,255,255,0.05)',padding:'80px 24px' }}>
        <div style={{ maxWidth:'960px',margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:'48px',...fadeIn('testimonials') }}>
            <div style={{ fontSize:'0.72rem',fontWeight:600,color:'#3b82f6',letterSpacing:'0.1em',marginBottom:'10px' }}>WHAT USERS SAY</div>
            <div className="font-display" style={{ fontSize:'1.8rem',fontWeight:800,color:'#f0f4ff',marginBottom:'12px' }}>Trusted by thousands</div>
            <p style={{ color:'#8a96b0',fontSize:'0.95rem',maxWidth:'420px',margin:'0 auto',lineHeight:1.7 }}>Don't take our word for it — here's what our community says about their support experience.</p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'20px' }}>
            {testimonials.map(({name,role,text},i) => {
              const key = `test${i}`;
              return (
                <div key={name} ref={sectionRef(key)} className="testimonial-card" style={{ ...fadeIn(key,i*0.12),background:'#1a2030',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px',padding:'28px' }}>
                  <div style={{ fontSize:'1.4rem',color:'#fbbf24',marginBottom:'14px' }}>★★★★★</div>
                  <p style={{ fontSize:'0.88rem',color:'#c8d0e0',lineHeight:1.75,marginBottom:'20px',fontStyle:'italic' }}>"{text}"</p>
                  <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
                    <div style={{ width:'36px',height:'36px',borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem',fontWeight:700,color:'white',flexShrink:0 }}>{name[0]}</div>
                    <div>
                      <div style={{ fontSize:'0.85rem',fontWeight:600,color:'#f0f4ff' }}>{name}</div>
                      <div style={{ fontSize:'0.75rem',color:'#5a6478' }}>{role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.06)',padding:'40px 24px',textAlign:'center' }}>
        <div className="font-display" style={{ fontWeight:700,color:'#f0f4ff',marginBottom:'8px' }}>UniNEST Support</div>
        <p style={{ color:'#5a6478',fontSize:'0.82rem',marginBottom:'16px' }}>© 2026 UniNEST. All rights reserved.</p>
        <div style={{ display:'flex',justifyContent:'center',gap:'24px' }}>
          {['Privacy Policy','Terms of Use','Contact Us'].map(link => (
            <a key={link} href="/" className="nav-link" style={{ fontSize:'0.8rem' }}>{link}</a>
          ))}
        </div>
      </footer>

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:'16px' }}>
          <div style={{ background:'#1a2030',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'24px',padding:'52px 44px',maxWidth:'440px',width:'100%',textAlign:'center',boxShadow:'0 32px 100px rgba(0,0,0,0.7)',animation:'modalUp 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}>
            <div style={{ width:'76px',height:'76px',borderRadius:'20px',background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:'2.2rem' }}>🎧</div>
            <div className="font-display" style={{ fontSize:'1.7rem',fontWeight:800,color:'#f0f4ff',marginBottom:'12px' }}>Ticket Submitted!</div>
            <p style={{ color:'#8a96b0',fontSize:'0.95rem',lineHeight:1.8,marginBottom:'10px' }}>
              Thank you, <strong style={{ color:'#f0f4ff' }}>{user.firstName}</strong>! Our AI is analysing your request right now.
            </p>
            <p style={{ color:'#5a6478',fontSize:'0.82rem',lineHeight:1.7,marginBottom:'20px' }}>
              If your issue is urgent, please call our hotline directly at +94 11 234 5678 during business hours.
            </p>
            <div style={{ background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:'10px',padding:'12px 16px',marginBottom:'16px',display:'flex',alignItems:'center',gap:'10px' }}>
              <div style={{ width:'8px',height:'8px',borderRadius:'50%',background:'#34d399',flexShrink:0,animation:'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize:'0.82rem',color:'#34d399' }}>AI is generating your personalised response…</span>
            </div>
            <div style={{ background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:'10px',padding:'12px 16px',marginBottom:'28px',fontSize:'0.82rem',color:'#93c5fd' }}>
              👤 Your reply will appear in the <strong>AI Support Centre</strong> on your Profile page
            </div>
            <div style={{ display:'flex',gap:'12px',justifyContent:'center' }}>
              <button onClick={() => navigate('/profile')} className="profile-btn">View My Profile →</button>
              <button onClick={() => { setShowSuccess(false); setFormData(prev => ({ ...prev, description:'', phoneNumber: user?.phone || '' })); }} style={{ padding:'12px 20px',borderRadius:'14px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'#5a6478',fontSize:'0.875rem',cursor:'pointer' }}>
                Submit Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportForm;