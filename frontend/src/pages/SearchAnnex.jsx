import { useState, useEffect, useRef } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';
const sliitLocation = { lat: 6.9147, lng: 79.9723 };

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Syne:wght@700;800;900&display=swap');

  @keyframes sa-fadeUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sa-fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes sa-slideLeft { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
  @keyframes sa-spin { to{transform:rotate(360deg)} }
  @keyframes sa-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
  @keyframes sa-orb { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(20px,-15px) scale(1.05)} 70%{transform:translate(-12px,10px) scale(0.97)} }
  @keyframes sa-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes sa-line-grow { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes sa-badge-pop { 0%{transform:scale(0.8);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }

  .sa-sidebar-header {
    background: linear-gradient(180deg,#060f1e 0%,#071222 100%);
    padding: 0.85rem 1rem 0.75rem;
    border-bottom: 1px solid #111e35;
    animation: sa-slideLeft 0.55s cubic-bezier(0.22,1,0.36,1) both;
    position: relative; flex-shrink: 0;
  }
  .sa-sidebar-header::after {
    content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,rgba(59,130,246,0.4),transparent);
    transform-origin:left; animation:sa-line-grow 1.2s 0.3s cubic-bezier(0.22,1,0.36,1) both;
  }
  .sa-brand-dot { width:6px;height:6px;border-radius:50%;background:#3b82f6;animation:sa-pulse-dot 2s ease-in-out infinite; }
  .sa-brand-tag { font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(59,130,246,0.75);font-weight:600; }
  .sa-logo-text { font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:900;color:#fff;line-height:1;letter-spacing:-0.02em; }
  .sa-logo-accent { color:#3b82f6; }
  .sa-tagline { font-size:0.68rem;color:rgba(255,255,255,0.28);margin-top:0.2rem;line-height:1.4; }

  .sa-filters { animation:sa-slideLeft 0.6s 0.08s cubic-bezier(0.22,1,0.36,1) both; flex-shrink:0; }
  .sa-card-list { animation:sa-fadeIn 0.5s 0.2s both; }
  .sa-annex-card { transition:border-color 0.2s,background 0.2s,box-shadow 0.2s,transform 0.18s; }
  .sa-annex-card:hover { transform:translateX(3px); }
  .sa-card-img { transition:transform 0.4s cubic-bezier(0.22,1,0.36,1); }
  .sa-annex-card:hover .sa-card-img { transform:scale(1.07); }
  .sa-scroll-hint { animation:sa-float 2.5s ease-in-out infinite; }

  .sa-landing { background:#060f1e; overflow:hidden; position:relative; }
  .sa-landing-orb-1 { position:absolute;top:-80px;right:-60px;width:420px;height:420px;background:radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%);pointer-events:none;animation:sa-orb 16s ease-in-out infinite; }
  .sa-landing-orb-2 { position:absolute;bottom:200px;left:-80px;width:500px;height:500px;background:radial-gradient(circle,rgba(59,130,246,0.07) 0%,transparent 70%);pointer-events:none;animation:sa-orb 20s ease-in-out infinite reverse; }

  .sa-reveal { opacity:0;transform:translateY(20px);transition:opacity 0.6s cubic-bezier(0.22,1,0.36,1),transform 0.6s cubic-bezier(0.22,1,0.36,1); }
  .sa-reveal.visible { opacity:1;transform:translateY(0); }

  .sa-section-eyebrow { font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(59,130,246,0.75);font-weight:700;display:flex;align-items:center;gap:6px;margin-bottom:0.5rem; }
  .sa-section-eyebrow::before { content:'';display:inline-block;width:16px;height:1px;background:rgba(59,130,246,0.5); }

  .sa-lcard { background:rgba(255,255,255,0.025);border:1px solid #111e35;border-radius:11px;padding:0.85rem 0.95rem;display:flex;align-items:center;gap:11px;transition:border-color 0.2s,background 0.2s,transform 0.2s; }
  .sa-lcard:hover { border-color:rgba(59,130,246,0.3);background:rgba(59,130,246,0.04);transform:translateY(-2px); }
  .sa-lcard-icon { width:30px;height:30px;border-radius:7px;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.2);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;transition:background 0.2s; }
  .sa-lcard:hover .sa-lcard-icon { background:rgba(59,130,246,0.22); }
  .sa-lcard-title { font-family:'Syne',sans-serif;font-size:0.78rem;font-weight:700;color:#e2e8f0; }
  .sa-lcard-sub { font-size:0.66rem;color:rgba(255,255,255,0.28);margin-top:1px; }

  .sa-mini-stat { background:rgba(255,255,255,0.03);border:1px solid rgba(59,130,246,0.12);border-radius:10px;padding:0.75rem 1rem;transition:border-color 0.2s,background 0.2s; }
  .sa-mini-stat:hover { border-color:rgba(59,130,246,0.3);background:rgba(59,130,246,0.05); }
  .sa-mini-num { font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:900;color:#fff;line-height:1; }
  .sa-mini-label { font-size:0.64rem;color:rgba(255,255,255,0.3);margin-top:3px;letter-spacing:0.04em; }

  .sa-team-card { background:rgba(255,255,255,0.02);border:1px solid #111e35;border-radius:10px;padding:0.85rem 0.75rem;text-align:center;transition:border-color 0.2s,background 0.2s,transform 0.2s; }
  .sa-team-card:hover { border-color:rgba(59,130,246,0.3);background:rgba(59,130,246,0.04);transform:translateY(-2px); }
  .sa-avatar { width:40px;height:40px;border-radius:50%;border:2px solid rgba(59,130,246,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 0.5rem;font-family:'Syne',sans-serif;font-size:0.8rem;font-weight:900;color:#60a5fa;background:rgba(59,130,246,0.08);transition:border-color 0.2s; }
  .sa-team-card:hover .sa-avatar { border-color:rgba(59,130,246,0.6); }
  .sa-team-name { font-size:0.74rem;font-weight:600;color:#e2e8f0;margin-bottom:0.1rem; }
  .sa-team-role { font-size:0.61rem;color:rgba(59,130,246,0.6);font-weight:500; }

  .sa-tech-pill { background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:5px;padding:0.2rem 0.55rem;font-size:0.65rem;color:rgba(59,130,246,0.8);font-weight:600;display:inline-block; }

  .sa-divider { border:none;height:1px;background:linear-gradient(90deg,transparent,rgba(59,130,246,0.2),transparent);margin:0; }

  .sa-cta-wrap { background:linear-gradient(135deg,rgba(59,130,246,0.08) 0%,rgba(37,99,235,0.12) 100%);border:1px solid rgba(59,130,246,0.2);border-radius:16px;padding:2rem;text-align:center;position:relative;overflow:hidden; }
  .sa-cta-wrap::before { content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 0%,rgba(59,130,246,0.1) 0%,transparent 70%);pointer-events:none; }
  .sa-cta-title { font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:900;color:#fff;letter-spacing:-0.02em;position:relative;margin-bottom:0.4rem; }

  .sa-btn-primary { background:#2563eb;color:#fff;border:none;border-radius:9px;padding:0.6rem 1.4rem;font-size:0.8rem;font-weight:700;cursor:pointer;transition:background 0.18s,box-shadow 0.18s,transform 0.15s;box-shadow:0 0 16px rgba(37,99,235,0.3);display:inline-flex;align-items:center;gap:6px; }
  .sa-btn-primary:hover { background:#3b82f6;box-shadow:0 0 24px rgba(59,130,246,0.5);transform:translateY(-2px); }
  .sa-btn-outline { background:transparent;color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.15);border-radius:9px;padding:0.6rem 1.4rem;font-size:0.8rem;font-weight:600;cursor:pointer;transition:all 0.18s;display:inline-flex;align-items:center;gap:6px; }
  .sa-btn-outline:hover { border-color:rgba(59,130,246,0.5);color:#93c5fd;background:rgba(59,130,246,0.07);transform:translateY(-2px); }

  .sa-scrollbar::-webkit-scrollbar { width:3px; }
  .sa-scrollbar::-webkit-scrollbar-track { background:transparent; }
  .sa-scrollbar::-webkit-scrollbar-thumb { background:#172240;border-radius:4px; }
  .sa-scrollbar::-webkit-scrollbar-thumb:hover { background:#2a4070; }

  .sa-map-scroll-btn { position:absolute;bottom:6rem;right:1.5rem;background:rgba(6,15,30,0.88);border:1px solid rgba(59,130,246,0.35);border-radius:12px;padding:0.55rem 1rem;color:rgba(255,255,255,0.65);font-size:0.7rem;font-weight:600;cursor:pointer;backdrop-filter:blur(10px);display:flex;align-items:center;gap:6px;transition:all 0.2s;animation:sa-float 3s ease-in-out infinite;z-index:10; }
  .sa-map-scroll-btn:hover { background:rgba(59,130,246,0.18);border-color:rgba(59,130,246,0.6);color:#93c5fd; }
  .sa-map-header { position:absolute;top:14px;left:50%;transform:translateX(-50%);background:rgba(6,15,30,0.88);backdrop-filter:blur(14px);border:1px solid rgba(59,130,246,0.2);border-radius:40px;padding:0.4rem 1.1rem;display:flex;align-items:center;gap:12px;z-index:10;animation:sa-fadeUp 0.7s 0.3s cubic-bezier(0.22,1,0.36,1) both; }
  .sa-map-header-dot { width:6px;height:6px;border-radius:50%;background:#22c55e;animation:sa-pulse-dot 2.5s ease-in-out infinite; }
  .sa-map-header-text { font-size:11px;font-weight:600;color:rgba(255,255,255,0.5);letter-spacing:0.04em; }
  .sa-map-header-count { font-size:11px;font-weight:700;color:#60a5fa;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.25);border-radius:20px;padding:2px 10px; }

  .sa-commute-badge { display:inline-flex;align-items:center;gap:5px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:7px;padding:0.25rem 0.6rem;font-size:11px;font-weight:700;color:#4ade80;animation:sa-badge-pop 0.3s cubic-bezier(0.22,1,0.36,1) both; }
  .sa-rank-badge { position:absolute;top:-1px;right:10px;font-family:'Syne',sans-serif;font-size:9px;font-weight:900;padding:3px 8px;border-radius:0 0 8px 8px;letter-spacing:0.06em;text-transform:uppercase; }

  /* Compact single-row stats strip */
  .sa-stats-strip { display:flex;flex-shrink:0;border-bottom:1px solid #0e1a2e; }
  .sa-stat-cell { flex:1;padding:0.4rem 0.4rem;text-align:center;border-right:1px solid #0e1a2e; }
  .sa-stat-cell:last-child { border-right:none; }
  .sa-stat-cell-val { font-family:'Syne',sans-serif;font-size:0.82rem;font-weight:900;color:#60a5fa;line-height:1; }
  .sa-stat-cell-label { font-size:7.5px;color:#2a4070;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;margin-top:2px; }

  .sa-price-trend { font-size:9px;font-weight:700;padding:2px 5px;border-radius:4px;display:inline-block; }
  .sa-price-trend.low { background:rgba(34,197,94,0.1);color:#4ade80;border:1px solid rgba(34,197,94,0.2); }
  .sa-price-trend.mid { background:rgba(250,204,21,0.1);color:#fbbf24;border:1px solid rgba(250,204,21,0.2); }
  .sa-price-trend.high { background:rgba(239,68,68,0.1);color:#f87171;border:1px solid rgba(239,68,68,0.2); }

  .sa-quick-action { display:flex;align-items:center;gap:7px;background:#0b1628;border:1px solid #172240;border-radius:8px;padding:0.4rem 0.75rem;font-size:11px;font-weight:600;color:#4b6d9e;cursor:pointer;transition:all 0.18s;flex:1;justify-content:center; }
  .sa-quick-action:hover { border-color:rgba(59,130,246,0.4);color:#93c5fd;background:rgba(59,130,246,0.06); }

  /* Landing */
  .sa-land-wrap { max-width:960px;margin:0 auto;padding:0 2.5rem; }
  .sa-land-sec { padding:2.5rem 0;border-top:1px solid #0e1a2e; }
  .sa-land-sec-title { font-family:'Syne',sans-serif;font-size:1.05rem;font-weight:900;color:#fff;margin:0.3rem 0 1.1rem;letter-spacing:-0.01em; }
  .sa-land-sec-title .accent { background:linear-gradient(135deg,#3b82f6 0%,#60a5fa 50%,#93c5fd 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
`;

/* ── Data ── */
const FEATURES = [
  { icon:'🗺️', title:'Live Map Search',    sub:'Mapbox-powered, centred on SLIIT' },
  { icon:'📏', title:'Distance Filtering', sub:'Custom radius from campus' },
  { icon:'💰', title:'Budget Filtering',   sub:'Min / max price range control' },
  { icon:'🚗', title:'Commute Estimator',  sub:'Drive time calculated on hover' },
  { icon:'✅', title:'Verified Listings',  sub:'Manually reviewed before publishing' },
  { icon:'📱', title:'Instant Booking',    sub:'Digital booking, no paperwork' },
];
const STEPS = [
  { num:'01', title:'Set Filters',    sub:'Distance · Budget · Gender' },
  { num:'02', title:'Browse Map',     sub:'Click any pin for quick preview' },
  { num:'03', title:'View Details',   sub:'Photos · Amenities · Owner contact' },
  { num:'04', title:'Book & Confirm', sub:'Fully digital, same-day confirmation' },
];
const TEAM = [
  { initials:'AK', name:'Ashan Kavinda',      role:'Full Stack Lead' },
  { initials:'NP', name:'Nethmi Perera',       role:'UI / UX Design' },
  { initials:'RM', name:'Ravindu Madushanka',  role:'Backend & API' },
  { initials:'ST', name:'Sahan Thilakarathne', role:'Maps & Geo' },
  { initials:'DW', name:'Dinusha Wijesiri',    role:'QA & Testing' },
];
const TECH  = ['React 18','Node.js','MongoDB','Mapbox GL','Express','Tailwind CSS','Axios','JWT Auth'];
const STATS = [
  { num:'120+',   label:'Verified Annexes' },
  { num:'< 2 km', label:'Avg Distance' },
  { num:'500+',   label:'Students Housed' },
  { num:'4.8 ★',  label:'Avg Rating' },
];

/* ── Scroll-reveal ── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } }, { threshold:0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return ref;
}

function getPriceTier(p) {
  if (!p) return null;
  if (p < 15000) return { label:'Budget', cls:'low' };
  if (p < 30000) return { label:'Mid',    cls:'mid' };
  return               { label:'Premium', cls:'high' };
}

const Eyebrow = ({ children }) => <p className="sa-section-eyebrow">{children}</p>;

/* ── Landing sections ── */
function AboutSection({ onBackToMap, onFeatures }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="sa-reveal sa-land-sec" style={{ borderTop:'none', paddingTop:'3rem' }}>
      <div className="sa-land-wrap">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem', marginBottom:'1.25rem' }}>
          <div>
            <Eyebrow>About UNI NEST</Eyebrow>
            <h2 className="sa-land-sec-title" style={{ fontSize:'1.5rem', marginBottom:0 }}>
              Smartest housing search for <span className="accent">SLIIT students.</span>
            </h2>
          </div>
          <div style={{ display:'flex', gap:'0.6rem' }}>
            <button className="sa-btn-primary" onClick={onBackToMap}>↑ Back to Map</button>
            <button className="sa-btn-outline" onClick={onFeatures}>Features →</button>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.6rem' }}>
          {STATS.map((s,i) => (
            <div key={i} className="sa-mini-stat">
              <div className="sa-mini-num">{s.num}</div>
              <div className="sa-mini-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const ref = useReveal();
  return (
    <div id="sa-features" ref={ref} className="sa-reveal sa-land-sec">
      <div className="sa-land-wrap">
        <Eyebrow>Platform Features</Eyebrow>
        <h3 className="sa-land-sec-title">What UNI NEST <span className="accent">offers.</span></h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.55rem' }}>
          {FEATURES.map((f,i) => (
            <div key={i} className="sa-lcard">
              <div className="sa-lcard-icon">{f.icon}</div>
              <div><div className="sa-lcard-title">{f.title}</div><div className="sa-lcard-sub">{f.sub}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HowItWorksSection() {
  const ref = useReveal();
  return (
    <div ref={ref} className="sa-reveal sa-land-sec">
      <div className="sa-land-wrap">
        <Eyebrow>How It Works</Eyebrow>
        <h3 className="sa-land-sec-title">Search to <span className="accent">move-in, in minutes.</span></h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.55rem' }}>
          {STEPS.map((step,i) => (
            <div key={i} className="sa-lcard" style={{ flexDirection:'column', alignItems:'flex-start', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:7, background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:900, color:'#3b82f6', fontFamily:"'Syne',sans-serif" }}>{step.num}</div>
              <div><div className="sa-lcard-title">{step.title}</div><div className="sa-lcard-sub">{step.sub}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TechTeamSection() {
  const ref = useReveal();
  return (
    <div ref={ref} className="sa-reveal sa-land-sec">
      <div className="sa-land-wrap">
        <div style={{ marginBottom:'2rem' }}>
          <Eyebrow>Built With</Eyebrow>
          <h3 className="sa-land-sec-title" style={{ marginBottom:'0.65rem' }}>Modern stack. <span className="accent">Production-grade.</span></h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>{TECH.map((t,i) => <span key={i} className="sa-tech-pill">{t}</span>)}</div>
        </div>
        <div>
          <Eyebrow>The Team</Eyebrow>
          <h3 className="sa-land-sec-title" style={{ marginBottom:'0.65rem' }}>Made by <span className="accent">SLIIT students.</span></h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'0.55rem' }}>
            {TEAM.map((m,i) => (
              <div key={i} className="sa-team-card">
                <div className="sa-avatar">{m.initials}</div>
                <div className="sa-team-name">{m.name}</div>
                <div className="sa-team-role">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CTASection({ onBackToMap }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="sa-reveal sa-land-sec">
      <div className="sa-land-wrap">
        <div className="sa-cta-wrap">
          <Eyebrow>Ready to move in?</Eyebrow>
          <h3 className="sa-cta-title">Find your perfect annex today.</h3>
          <p style={{ fontSize:'0.73rem', color:'rgba(255,255,255,0.3)', marginBottom:'1.25rem', position:'relative' }}>
            120+ verified listings · Set filters · Browse map · Book instantly
          </p>
          <div style={{ display:'flex', gap:'0.6rem', justifyContent:'center', flexWrap:'wrap', position:'relative' }}>
            <button className="sa-btn-primary" onClick={onBackToMap}>Start Searching ↑</button>
            <button className="sa-btn-outline">Contact Support</button>
          </div>
        </div>
        <p style={{ textAlign:'center', fontSize:'0.6rem', color:'rgba(255,255,255,0.12)', marginTop:'1.25rem' }}>
          © {new Date().getFullYear()} UNI NEST · SLIIT Software Engineering Project · All listings verified
        </p>
      </div>
    </div>
  );
}

/* ── Main ── */
function SearchAnnex() {
  const navigate    = useNavigate();
  const landingRef  = useRef(null);

  const [maxDistance, setMaxDistance] = useState(5000);
  const [minPrice,    setMinPrice]    = useState('');
  const [maxPrice,    setMaxPrice]    = useState('');
  const [gender,      setGender]      = useState('');

  const [annexes,       setAnnexes]       = useState([]);
  const [selectedAnnex, setSelectedAnnex] = useState(null);
  const [commuteInfo,   setCommuteInfo]   = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [activeCard,    setActiveCard]    = useState(null);
  const [sortBy,        setSortBy]        = useState('distance');
  const [showSortMenu,  setShowSortMenu]  = useState(false);

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_STYLES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const fetchAnnexes = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/annexes/search?lat=${sliitLocation.lat}&lng=${sliitLocation.lng}&maxDistance=${maxDistance}`;
      if (minPrice) url += `&minPrice=${minPrice}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;
      if (gender)   url += `&gender=${gender}`;
      const res = await axios.get(url);
      setAnnexes(res.data.data);
    } catch (err) { console.error('Error fetching annexes:', err); }
    finally { setLoading(false); }
  };

  const calcKm = (sLat,sLng,eLat,eLng) => {
    const toRad = v => (v*Math.PI)/180, R=6371;
    const dLat=toRad(eLat-sLat), dLng=toRad(eLng-sLng);
    const a=Math.sin(dLat/2)**2+Math.cos(toRad(sLat))*Math.cos(toRad(eLat))*Math.sin(dLng/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  };

  const getCommute = annex => {
    if (!annex?.location?.coordinates||annex.location.coordinates.length<2) { setCommuteInfo(null); return; }
    const [lng,lat] = annex.location.coordinates;
    const d = calcKm(sliitLocation.lat,sliitLocation.lng,lat,lng);
    setCommuteInfo({ distance_km:d.toFixed(2), duration_mins:Math.max(1,Math.round((d/25)*60)), mode:'estimated' });
  };

  useEffect(() => { fetchAnnexes(); }, []);

  const goToDetails     = annex => navigate(`/annex/${annex._id}`, { state:{ annex } });
  const scrollToLanding = ()    => landingRef.current?.scrollIntoView({ behavior:'smooth' });

  const genderBadge = g => {
    if (!g)           return { label:'Any',    bg:'bg-[#0f1e38]',   text:'text-gray-400', border:'border-[#1f3058]' };
    if (g==='Male')   return { label:'Male',   bg:'bg-blue-900/30', text:'text-blue-300', border:'border-blue-700/40' };
    return                   { label:'Female', bg:'bg-pink-900/30', text:'text-pink-300', border:'border-pink-700/40' };
  };

  const sortedAnnexes = [...annexes].sort((a,b) => sortBy==='price'?(a.price||0)-(b.price||0):(a.distance||0)-(b.distance||0));
  const avgPrice = annexes.length ? Math.round(annexes.reduce((s,a)=>s+(a.price||0),0)/annexes.length) : 0;

  return (
    <div className="sa-scrollbar" style={{ fontFamily:"'DM Sans',sans-serif", background:'#060f1e', overflowY:'auto', height:'100vh' }}>

      {/* ── TOP SPLIT ── */}
      <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>

        {/* ════ SIDEBAR ════ */}
        <div className="sa-scrollbar"
          style={{ width:360, flexShrink:0, display:'flex', flexDirection:'column', background:'#060f1e', borderRight:'1px solid #111e35', zIndex:10, overflow:'hidden' }}>

          {/* Header */}
          <div className="sa-sidebar-header">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.45rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div className="sa-brand-dot" />
                <span className="sa-brand-tag">UNI NEST · Live Search</span>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {['Map','About'].map((lbl,i) => (
                  <button key={lbl} onClick={i===1?scrollToLanding:undefined}
                    style={{ background:i===0?'rgba(59,130,246,0.15)':'transparent', border:`1px solid ${i===0?'rgba(59,130,246,0.35)':'#172240'}`, borderRadius:5, padding:'2px 9px', fontSize:9, fontWeight:700, color:i===0?'#60a5fa':'#2a4070', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
              <div>
                <div className="sa-logo-text">UNI <span className="sa-logo-accent">NEST</span></div>
                <p className="sa-tagline">Student housing near SLIIT · distance, price &amp; gender filters.</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.18)', borderRadius:8, padding:'0.3rem 0.5rem', gap:2 }}>
                <span style={{ fontSize:13 }}>✓</span>
                <span style={{ fontSize:7, fontWeight:700, color:'rgba(34,197,94,0.7)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Verified</span>
              </div>
            </div>
          </div>

          {/* Compact stats strip */}
          {annexes.length > 0 && (
            <div className="sa-stats-strip">
              <div className="sa-stat-cell"><div className="sa-stat-cell-val">{annexes.length}</div><div className="sa-stat-cell-label">Found</div></div>
              <div className="sa-stat-cell"><div className="sa-stat-cell-val">Rs.{(avgPrice/1000).toFixed(0)}k</div><div className="sa-stat-cell-label">Avg/mo</div></div>
              <div className="sa-stat-cell"><div className="sa-stat-cell-val">{(maxDistance/1000).toFixed(0)}km</div><div className="sa-stat-cell-label">Radius</div></div>
              <div className="sa-stat-cell"><div className="sa-stat-cell-val">{annexes.filter(a=>a.distance&&a.distance/1000<2).length}</div><div className="sa-stat-cell-label">≤2km</div></div>
            </div>
          )}

          {/* Filters */}
          <div className="sa-filters" style={{ padding:'0.9rem 1rem', borderBottom:'1px solid #111e35' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.65rem' }}>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'0.9rem', fontWeight:700, color:'#fff', margin:0 }}>Find an Annex</h2>
              <span style={{ fontSize:9, color:'#4b6d9e', background:'#0b1628', border:'1px solid #172240', padding:'0.15rem 0.55rem', borderRadius:999 }}>📍 Near SLIIT</span>
            </div>

            {/* Distance slider */}
            <div style={{ marginBottom:'0.7rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <label style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'#4b6d9e', fontWeight:600 }}>Max Distance</label>
                <span style={{ fontSize:12, fontWeight:700, color:'#60a5fa' }}>{(maxDistance/1000).toFixed(0)} km</span>
              </div>
              <input type="range" min="1000" max="15000" step="1000" value={maxDistance} onChange={e=>setMaxDistance(Number(e.target.value))}
                style={{ width:'100%', height:4, borderRadius:9999, appearance:'none', cursor:'pointer', accentColor:'#3b82f6', background:`linear-gradient(to right,#3b82f6 ${((maxDistance-1000)/14000)*100}%,#172240 0%)` }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'#2a4070', marginTop:3 }}><span>1 km</span><span>15 km</span></div>
            </div>

            {/* Price */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:'0.7rem' }}>
              {[['Min Price',minPrice,setMinPrice,'0'],['Max Price',maxPrice,setMaxPrice,'50000']].map(([lbl,val,setter,ph])=>(
                <div key={lbl}>
                  <label style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'#4b6d9e', fontWeight:600, display:'block', marginBottom:4 }}>{lbl}</label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#4b6d9e', fontSize:10 }}>Rs.</span>
                    <input type="number" value={val} onChange={e=>setter(e.target.value)} placeholder={ph}
                      style={{ width:'100%', boxSizing:'border-box', paddingLeft:29, paddingRight:7, paddingTop:7, paddingBottom:7, background:'#0b1628', border:'1px solid #172240', borderRadius:7, fontSize:12, color:'#e2e8f0', outline:'none' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Gender */}
            <div style={{ marginBottom:'0.7rem' }}>
              <label style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'#4b6d9e', fontWeight:600, display:'block', marginBottom:4 }}>Preferred Gender</label>
              <div style={{ display:'flex', gap:5 }}>
                {[['','Any'],['Male','Male'],['Female','Female']].map(([val,lbl])=>(
                  <button key={val} onClick={()=>setGender(val)}
                    style={{ flex:1, padding:'0.38rem', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', background:gender===val?'#2563eb':'#0b1628', border:`1px solid ${gender===val?'#3b82f6':'#172240'}`, color:gender===val?'#fff':'#6b7280', transition:'all 0.18s' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Apply */}
            <button onClick={fetchAnnexes} disabled={loading} className="sa-btn-primary"
              style={{ width:'100%', justifyContent:'center', padding:'0.5rem', borderRadius:9, marginBottom:'0.45rem' }}>
              {loading
                ? <><span style={{ width:13,height:13,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'sa-spin 0.7s linear infinite',display:'inline-block' }} />Searching…</>
                : '🔍  Apply Filters'}
            </button>
            <div style={{ display:'flex', gap:5 }}>
              <button className="sa-quick-action" onClick={()=>{setMinPrice('');setMaxPrice('');setGender('');setMaxDistance(5000);}}>↺ Reset</button>
              <button className="sa-quick-action" onClick={scrollToLanding}>ℹ About</button>
            </div>
          </div>

          {/* ── Card list — fills remaining height ── */}
          <div className="sa-card-list sa-scrollbar" style={{ flex:1, overflowY:'auto', minHeight:0 }}>
            {/* sticky header */}
            <div style={{ padding:'0.55rem 1rem 0.4rem', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'#060f1e', zIndex:10, borderBottom:'1px solid #0e1a2e' }}>
              <p style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'#4b6d9e', fontWeight:600, margin:0 }}>
                {annexes.length} {annexes.length===1?'Annex':'Annexes'} Found
              </p>
              <div style={{ position:'relative' }}>
                <button onClick={()=>setShowSortMenu(v=>!v)}
                  style={{ fontSize:10, color:'#4b6d9e', background:'#0b1628', border:'1px solid #172240', borderRadius:5, padding:'2px 9px', cursor:'pointer' }}>
                  Sort: {sortBy==='distance'?'Distance ↑':'Price ↑'}
                </button>
                {showSortMenu && (
                  <div style={{ position:'absolute', right:0, top:'110%', background:'#0b1628', border:'1px solid #172240', borderRadius:8, overflow:'hidden', zIndex:50, minWidth:130 }}>
                    {[['distance','Nearest First'],['price','Lowest Price']].map(([val,lbl])=>(
                      <button key={val} onClick={()=>{setSortBy(val);setShowSortMenu(false);}}
                        style={{ display:'block', width:'100%', textAlign:'left', padding:'0.45rem 0.8rem', fontSize:10, fontWeight:600, color:sortBy===val?'#60a5fa':'#4b6d9e', background:sortBy===val?'rgba(59,130,246,0.08)':'transparent', border:'none', cursor:'pointer' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* cards */}
            <div style={{ padding:'0.55rem 0.85rem', display:'flex', flexDirection:'column', gap:6 }}>
              {sortedAnnexes.map((annex,idx) => {
                const badge    = genderBadge(annex.preferredGender);
                const isActive = activeCard===annex._id;
                const tier     = getPriceTier(annex.price);
                const isTop    = idx===0 && annexes.length>1;
                return (
                  <div key={annex._id} className="sa-annex-card"
                    style={{ position:'relative', borderRadius:11, border:`1px solid ${isActive?'#2563eb':'#172240'}`, background:isActive?'#0f1e38':'#0b1628', padding:'0.75rem', cursor:'pointer', boxShadow:isActive?'0 4px 20px rgba(37,99,235,0.2)':'none', paddingTop:isTop?'1.2rem':'0.75rem' }}
                    onClick={()=>{ setActiveCard(annex._id); goToDetails(annex); }}
                    onMouseEnter={()=>{ setSelectedAnnex(annex); getCommute(annex); }}>

                    {isTop && <div className="sa-rank-badge" style={{ background:'rgba(59,130,246,0.18)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.3)' }}>★ Top Pick</div>}
                    <div style={{ position:'absolute', left:0, top:8, bottom:8, width:2, borderRadius:9999, background:isActive?'#3b82f6':'transparent', transition:'background 0.2s' }} />

                    <div style={{ display:'flex', gap:9 }}>
                      <div style={{ width:54, height:54, borderRadius:8, overflow:'hidden', flexShrink:0, position:'relative' }}>
                        {annex.imageUrl
                          ? <img src={`${API_BASE}${annex.imageUrl}`} alt={annex.title} className="sa-card-img" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                          : <div style={{ width:'100%', height:'100%', background:'#0f1e38', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#2a4070' }}>No img</div>}
                        <div style={{ position:'absolute', bottom:2, right:2, fontSize:7, fontWeight:700, color:'rgba(255,255,255,0.45)', background:'rgba(0,0,0,0.5)', borderRadius:3, padding:'1px 3px' }}>#{idx+1}</div>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:600, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:'0 0 2px' }}>{annex.title}</p>
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
                          <span style={{ color:'#60a5fa', fontWeight:700, fontSize:13 }}>Rs. {annex.price?.toLocaleString()}<span style={{ color:'#4b6d9e', fontSize:10, fontWeight:400 }}>/mo</span></span>
                          {tier && <span className={`sa-price-trend ${tier.cls}`}>{tier.label}</span>}
                        </div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                          <span className={`${badge.bg} ${badge.text} ${badge.border}`} style={{ fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:999, border:'1px solid', display:'inline-block' }}>{badge.label}</span>
                          {annex.distance && <span style={{ fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:999, background:'rgba(20,150,80,0.2)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.3)' }}>{(annex.distance/1000).toFixed(1)} km</span>}
                          {annex.features?.length>0 && <span style={{ fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:999, background:'#0f1e38', color:'#4b6d9e', border:'1px solid #1f3058' }}>{annex.features.length} amenities</span>}
                        </div>
                      </div>
                    </div>

                    {isActive && commuteInfo && (
                      <div style={{ marginTop:7, paddingTop:7, borderTop:'1px solid #172240', display:'flex', gap:7, alignItems:'center' }}>
                        <span className="sa-commute-badge">🚗 {commuteInfo.distance_km} km · {commuteInfo.duration_mins} min</span>
                        <span style={{ fontSize:9, color:'#2a4070', marginLeft:'auto' }}>to SLIIT</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {!loading && annexes.length===0 && (
                <div style={{ textAlign:'center', padding:'2.5rem 0' }}>
                  <div style={{ fontSize:'2rem', marginBottom:8 }}>🔍</div>
                  <p style={{ fontSize:12, fontWeight:600, color:'#4b6d9e' }}>No annexes found</p>
                  <p style={{ fontSize:10, color:'#2a4070', marginTop:3 }}>Try adjusting your filters</p>
                </div>
              )}
            </div>

            <div style={{ padding:'0.65rem 1rem 1.1rem', textAlign:'center' }}>
              <button onClick={scrollToLanding} className="sa-scroll-hint"
                style={{ background:'rgba(37,99,235,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:9, padding:'0.4rem 1rem', color:'rgba(96,165,250,0.6)', fontSize:10, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5 }}>
                ↓ About UNI NEST
              </button>
            </div>
          </div>
        </div>

        {/* ════ MAP ════ */}
        <div style={{ flex:1, position:'relative' }}>
          <Map mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
            initialViewState={{ longitude:sliitLocation.lng, latitude:sliitLocation.lat, zoom:13 }}
            mapStyle="mapbox://styles/mapbox/dark-v11" style={{ width:'100%', height:'100%' }}>

            <Marker longitude={sliitLocation.lng} latitude={sliitLocation.lat}>
              <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'#dc2626', border:'2px solid #fff', boxShadow:'0 0 16px rgba(220,38,38,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🎓</div>
                <div style={{ position:'absolute', bottom:-18, fontSize:9, color:'#fff', fontWeight:700, background:'rgba(0,0,0,0.65)', padding:'2px 6px', borderRadius:4, whiteSpace:'nowrap' }}>SLIIT</div>
              </div>
            </Marker>

            {annexes.map(annex => (
              <Marker key={annex._id} longitude={annex.location.coordinates[0]} latitude={annex.location.coordinates[1]}
                onClick={e=>{ e.originalEvent.stopPropagation(); setSelectedAnnex(annex); getCommute(annex); setActiveCard(annex._id); }}>
                <div style={{ position:'relative', cursor:'pointer', transform:activeCard===annex._id?'scale(1.12)':'scale(1)', transition:'transform 0.18s', zIndex:activeCard===annex._id?20:1 }}>
                  <div style={{ padding:'4px 10px', borderRadius:999, fontSize:11, fontWeight:700, whiteSpace:'nowrap', background:activeCard===annex._id?'#2563eb':'#0b1628', border:`1px solid ${activeCard===annex._id?'#60a5fa':'#1f3058'}`, color:activeCard===annex._id?'#fff':'#60a5fa', boxShadow:activeCard===annex._id?'0 0 14px rgba(37,99,235,0.5)':'none', transition:'all 0.18s' }}>{annex.title}</div>
                  <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', bottom:-5, width:8, height:8, rotate:'45deg', background:activeCard===annex._id?'#2563eb':'#0b1628', borderRight:`1px solid ${activeCard===annex._id?'#60a5fa':'#1f3058'}`, borderBottom:`1px solid ${activeCard===annex._id?'#60a5fa':'#1f3058'}` }} />
                </div>
              </Marker>
            ))}

            {selectedAnnex && (
              <Popup longitude={selectedAnnex.location.coordinates[0]} latitude={selectedAnnex.location.coordinates[1]}
                anchor="bottom" offset={20} onClose={()=>{ setSelectedAnnex(null); setCommuteInfo(null); setActiveCard(null); }} className="hostel-popup">
                <style>{`.hostel-popup .mapboxgl-popup-content{background:#0b1628;border:1px solid #1a2e50;border-radius:14px;padding:0;box-shadow:0 20px 60px rgba(0,0,0,0.6);font-family:'DM Sans',sans-serif;overflow:hidden;width:230px}.hostel-popup .mapboxgl-popup-tip{border-top-color:#1a2e50}.hostel-popup .mapboxgl-popup-close-button{color:#4a6ba3;font-size:18px;padding:6px 10px;top:2px;right:2px}.hostel-popup .mapboxgl-popup-close-button:hover{color:#fff;background:transparent}`}</style>
                {selectedAnnex.imageUrl
                  ? <div style={{ position:'relative' }}><img src={`${API_BASE}${selectedAnnex.imageUrl}`} alt={selectedAnnex.title} style={{ width:'100%', height:110, objectFit:'cover', display:'block' }} /><div style={{ position:'absolute', bottom:6, left:6, background:'rgba(6,15,30,0.85)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:6, padding:'3px 8px', fontSize:11, fontWeight:700, color:'#60a5fa' }}>Rs. {selectedAnnex.price?.toLocaleString()}/mo</div></div>
                  : <div style={{ width:'100%', height:80, background:'#0f1e38', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#2a4070' }}>No photo</div>}
                <div style={{ padding:'0.85rem 1rem' }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'#e2e8f0', margin:'0 0 2px' }}>{selectedAnnex.title}</p>
                  {selectedAnnex.selectedAddress && <p style={{ fontSize:11, color:'#4b6d9e', marginBottom:10, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📍 {selectedAnnex.selectedAddress}</p>}
                  <div style={{ background:'#0f1e38', border:'1px solid #1f3058', borderRadius:8, padding:'0.55rem 0.75rem', marginBottom:10 }}>
                    {commuteInfo
                      ? <><p style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'#2a4070', marginBottom:4 }}>Commute to SLIIT</p><div style={{ display:'flex', alignItems:'center', gap:10 }}><span style={{ color:'#4ade80', fontWeight:700, fontSize:13 }}>{commuteInfo.distance_km} km</span><span style={{ color:'#2a4070', fontSize:11 }}>•</span><span style={{ color:'#94a3b8', fontSize:11 }}>{commuteInfo.duration_mins} mins by car</span></div></>
                      : <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'#4b6d9e' }}><span style={{ width:12, height:12, border:'1.5px solid #2a4070', borderTopColor:'#3b82f6', borderRadius:'50%', animation:'sa-spin 0.7s linear infinite', display:'inline-block', flexShrink:0 }} />Calculating commute…</div>}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>goToDetails(selectedAnnex)} className="sa-btn-primary" style={{ flex:1, justifyContent:'center', padding:'0.5rem', borderRadius:8, fontSize:12 }}>View Details →</button>
                    <button onClick={()=>{ setSelectedAnnex(null); setCommuteInfo(null); setActiveCard(null); }} style={{ background:'#0f1e38', border:'1px solid #1f3058', borderRadius:8, padding:'0.5rem 0.7rem', color:'#4b6d9e', fontSize:12, cursor:'pointer' }}>✕</button>
                  </div>
                </div>
              </Popup>
            )}
          </Map>

          <div className="sa-map-header">
            <div className="sa-map-header-dot" />
            <span className="sa-map-header-text">Live Map · SLIIT Malabe</span>
            <span className="sa-map-header-count">{annexes.length} listings</span>
          </div>

          <div style={{ position:'absolute', bottom:24, left:16, background:'rgba(11,22,40,0.88)', backdropFilter:'blur(10px)', border:'1px solid #1a2e50', borderRadius:12, padding:'0.5rem 0.85rem', display:'flex', alignItems:'center', gap:13, fontSize:10, color:'#4b6d9e' }}>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:9, height:9, borderRadius:'50%', background:'#dc2626' }} /><span>SLIIT Campus</span></div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:9, height:9, borderRadius:'50%', background:'#2563eb' }} /><span>Annex Listing</span></div>
            <div style={{ color:'#1a2e50' }}>|</div>
            <span>{annexes.length} listings shown</span>
          </div>

          <button onClick={scrollToLanding} className="sa-map-scroll-btn">↓ About UNI NEST</button>
        </div>
      </div>

      {/* ════ LANDING ════ */}
      <div ref={landingRef} className="sa-landing">
        <div className="sa-landing-orb-1" /><div className="sa-landing-orb-2" />
        <hr className="sa-divider" />
        <AboutSection
          onBackToMap={()=>window.scrollTo({top:0,behavior:'smooth'})}
          onFeatures={()=>document.getElementById('sa-features')?.scrollIntoView({behavior:'smooth'})}
        />
        <FeaturesSection />
        <HowItWorksSection />
        <TechTeamSection />
        <CTASection onBackToMap={()=>window.scrollTo({top:0,behavior:'smooth'})} />
      </div>
    </div>
  );
}

export default SearchAnnex;