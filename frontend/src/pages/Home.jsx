import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80';

/** Major Sri Lankan universities / campuses (map + default search anchor). */
const UNIVERSITIES = [
  { Name: 'SLIIT Malabe', Lat: 6.9147, Lng: 79.9723 },
  { Name: 'University of Moratuwa', Lat: 6.7953, Lng: 79.9011 },
  { Name: 'University of Peradeniya', Lat: 7.2546, Lng: 80.5974 },
  { Name: 'University of Colombo', Lat: 6.902, Lng: 79.8587 },
  { Name: 'University of Kelaniya', Lat: 6.9765, Lng: 79.9176 },
  { Name: 'University of Sri Jayewardenepura', Lat: 6.8881, Lng: 79.8885 },
  { Name: 'NIBM', Lat: 6.8878, Lng: 79.8964 },
  { Name: 'KIU University', Lat: 6.90787, Lng: 79.928689 },
  { Name: 'NSBM', Lat: 6.8214, Lng: 80.0398 },
];

const DEFAULT_CAMPUS = UNIVERSITIES[0];

/* ── Inline styles for top-rated cards (matches AnnexBookingPage exactly) ── */
const topRatedStyles = `
  @keyframes green-pulse {
    0%   { box-shadow: 0 0 4px 1px rgba(16,185,129,0.5); }
    50%  { box-shadow: 0 0 12px 4px rgba(16,185,129,0.9); }
    100% { box-shadow: 0 0 4px 1px rgba(16,185,129,0.5); }
  }
  @keyframes loc-glow {
    0%   { box-shadow: 0 0 5px 1px rgba(16,185,129,0.3), inset 0 0 8px rgba(16,185,129,0.05); }
    50%  { box-shadow: 0 0 12px 3px rgba(16,185,129,0.6), inset 0 0 12px rgba(16,185,129,0.1); }
    100% { box-shadow: 0 0 5px 1px rgba(16,185,129,0.3), inset 0 0 8px rgba(16,185,129,0.05); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Card shell — identical to AnnexBookingPage .annex-card ── */
  .tr-card {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(0,0,0,0.4);
    transition: transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s, border-color 0.28s;
    animation: scaleIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }
  .tr-card:hover {
    transform: translateY(-7px) scale(1.012);
    box-shadow: 0 20px 60px rgba(0,0,0,0.55), 0 0 35px rgba(45,126,247,0.22);
    border-color: rgba(45,126,247,0.25);
  }
  .tr-card:hover .tr-card-img { transform: scale(1.07); }
  .tr-card-img { transition: transform 0.5s cubic-bezier(0.22,1,0.36,1); }

  /* ── Badges ── */
  .tr-badge-gender {
    background: rgba(45,126,247,0.35);
    border: 1.5px solid rgba(45,126,247,0.75);
    color: #e0f0ff;
    backdrop-filter: blur(10px);
    font-size: 11px; font-weight: 800; letter-spacing: 0.07em;
    padding: 0.32rem 0.85rem; border-radius: 999px;
    text-shadow: 0 0 8px rgba(45,126,247,0.8);
    position: absolute; top: 12px; left: 12px; z-index: 2;
  }
  .tr-badge-available {
    background: rgba(16,185,129,0.25);
    border: 1.5px solid rgba(16,185,129,0.65);
    color: #6ee7b7; backdrop-filter: blur(10px);
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 800;
    padding: 0.32rem 0.75rem; border-radius: 999px;
    animation: green-pulse 2.2s ease-in-out infinite;
    text-shadow: 0 0 8px rgba(16,185,129,0.7);
    position: absolute; top: 12px; right: 12px; z-index: 2;
  }
  .tr-badge-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #34d399; box-shadow: 0 0 6px 2px rgba(52,211,153,0.8);
    flex-shrink: 0;
  }

  /* ── Location pill ── */
  .tr-location-row {
    display: flex !important; align-items: center !important; gap: 6px !important;
    margin: 0 0 0.65rem !important; padding: 0.32rem 0.75rem !important;
    background: rgba(16,185,129,0.12) !important;
    border: 1.5px solid rgba(16,185,129,0.45) !important;
    border-radius: 999px !important; width: fit-content !important; max-width: 100% !important;
    animation: loc-glow 2.4s ease-in-out infinite !important;
  }
  .tr-location-icon { flex-shrink: 0; color: #34d399 !important; filter: drop-shadow(0 0 4px rgba(52,211,153,0.9)) !important; }
  .tr-location-text {
    font-size: 0.76rem !important; font-weight: 700 !important; color: #6ee7b7 !important;
    overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important;
    text-shadow: 0 0 10px rgba(16,185,129,0.7) !important; letter-spacing: 0.01em !important;
  }

  /* ── Amenity chips ── */
  .tr-amenity-chip { border-radius: 6px; padding: 0.18rem 0.55rem; font-size: 0.68rem; font-weight: 600; white-space: nowrap; transition: transform 0.2s; }
  .tr-amenity-chip:hover { transform: scale(1.08); }
  .tr-chip-blue   { background: rgba(45,126,247,0.15);  border: 1px solid rgba(45,126,247,0.45);  color: #7ab8fc; }
  .tr-chip-purple { background: rgba(168,85,247,0.15);  border: 1px solid rgba(168,85,247,0.45);  color: #d8b4fe; }
  .tr-chip-emerald{ background: rgba(16,185,129,0.15);  border: 1px solid rgba(16,185,129,0.45);  color: #6ee7b7; }
  .tr-chip-rose   { background: rgba(244,63,94,0.15);   border: 1px solid rgba(244,63,94,0.45);   color: #fda4af; }
  .tr-chip-amber  { background: rgba(245,158,11,0.15);  border: 1px solid rgba(245,158,11,0.45);  color: #fcd34d; }
  .tr-chip-cyan   { background: rgba(6,182,212,0.15);   border: 1px solid rgba(6,182,212,0.45);   color: #67e8f9; }

  /* ── Rating ── */
  .tr-rating-row { display: flex; align-items: center; gap: 6px; margin-bottom: 0.45rem; }
  .tr-rating-score {
    background: rgba(251,191,36,0.15); border: 1px solid rgba(251,191,36,0.4);
    color: #fbbf24; font-size: 0.72rem; font-weight: 800;
    padding: 0.15rem 0.5rem; border-radius: 999px;
  }

  /* ── CTA buttons ── */
  .tr-btn-outline {
    flex: 1; padding: 0.52rem; border-radius: 10px; font-size: 0.76rem; font-weight: 600;
    cursor: pointer; background: transparent; border: 1px solid rgba(45,126,247,0.35);
    color: #5ba4fa; transition: all 0.18s; text-align: center; text-decoration: none;
    display: flex; align-items: center; justify-content: center;
  }
  .tr-btn-outline:hover { background: rgba(45,126,247,0.12); border-color: rgba(45,126,247,0.6); color: #93c3fd; transform: scale(1.03); }
  .tr-btn-glow {
    flex: 1; padding: 0.52rem; border-radius: 10px; font-size: 0.76rem; font-weight: 700;
    cursor: pointer; color: #fff; border: none;
    background: linear-gradient(135deg, #2d7ef7 0%, #1a5fd4 100%);
    box-shadow: 0 0 20px rgba(45,126,247,0.35); transition: all 0.18s;
    display: flex; align-items: center; justify-content: center;
  }
  .tr-btn-glow:hover { background: linear-gradient(135deg, #4a96ff 0%, #2d7ef7 100%); box-shadow: 0 0 32px rgba(45,126,247,0.6); transform: scale(1.04); }
`;

const CHIP_CLASSES = ['tr-chip-blue','tr-chip-purple','tr-chip-emerald','tr-chip-rose','tr-chip-amber','tr-chip-cyan'];

const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [budget, setBudget] = useState('Rs.2,000 - Rs.5,000 / Mo');
  const [gender, setGender] = useState('Mixed');
  const [topListings, setTopListings] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [mapAnnexes, setMapAnnexes] = useState([]);
  const [viewState, setViewState] = useState({
    longitude: DEFAULT_CAMPUS.Lng,
    latitude: DEFAULT_CAMPUS.Lat,
    zoom: 12.5,
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchTopRated = async () => {
      try {
        const response = await api.get('/quality/top-rated?limit=3');
        if (response.data.success && response.data.properties.length > 0) {
          setTopListings(response.data.properties);
        } else {
          setTopListings([]);
        }
      } catch (error) {
        console.error('Error fetching top rated:', error);
        setTopListings([]);
      } finally {
        setLoadingTop(false);
      }
    };
    fetchTopRated();
  }, []);

  useEffect(() => {
    const fetchMapAnnexes = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/annexes/search?lat=${DEFAULT_CAMPUS.Lat}&lng=${DEFAULT_CAMPUS.Lng}&maxDistance=15000`
        );
        setMapAnnexes(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error('Error loading map annexes:', err);
      }
    };
    fetchMapAnnexes();
  }, []);

  /* ── Helpers: resolve nested property object from /quality/top-rated ── */
  const resolveProperty = (item) => item.property || item;

  const getRating = (item) =>
    item.averageRating ?? item.overallScore ?? resolveProperty(item).averageRating ?? null;

  const getPrice = (item) => {
    const prop = resolveProperty(item);
    const price = prop.price ?? item.price;
    return price != null ? `Rs. ${Number(price).toLocaleString()} /mo` : null;
  };

  const getImage = (item) => {
    const prop = resolveProperty(item);
    const urls = prop.imageUrls ?? item.imageUrls;
    if (Array.isArray(urls) && urls.length > 0) {
      const src = urls[0];
      return src.startsWith('http') ? src : `${API_BASE}${src}`;
    }
    const single = prop.imageUrl ?? item.imageUrl;
    if (single) return single.startsWith('http') ? single : `${API_BASE}${single}`;
    return FALLBACK_IMAGE;
  };

  const getLocation = (item) => {
    const prop = resolveProperty(item);
    return prop.selectedAddress ?? item.selectedAddress ?? null;
  };

  const getGender = (item) => {
    const prop = resolveProperty(item);
    return prop.preferredGender ?? item.preferredGender ?? null;
  };

  const getTitle = (item) => {
    const prop = resolveProperty(item);
    return prop.title ?? item.title ?? 'Property';
  };

  const getPropertyId = (item) => {
    const prop = resolveProperty(item);
    return prop._id ?? item._id;
  };

  /* ── REAL features only — no dummy fallbacks ── */
  const getFeatures = (item) => {
    const prop = resolveProperty(item);
    const feats = prop.features ?? item.features;
    if (Array.isArray(feats) && feats.length > 0) return feats.slice(0, 5);
    const amen = prop.amenities ?? item.amenities;
    if (Array.isArray(amen) && amen.length > 0) return amen.slice(0, 5);
    return [];
  };

  /* ── Real description only ── */
  const getDescription = (item) => {
    const prop = resolveProperty(item);
    return prop.description ?? item.description ?? null;
  };

  const handleBookNow = (item) => {
    const prop = resolveProperty(item);
    navigate('/booking', {
      state: {
        room: {
          annexId: getPropertyId(item),
          title: getTitle(item),
          imageUrl: getImage(item),
          location: getLocation(item) || 'Near SLIIT Malabe Campus',
        },
      },
    });
  };

  const renderStars = (rating) => {
    const num = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
    return [1,2,3,4,5].map(s => (
      <span key={s} style={{ color: s <= Math.round(num) ? '#fbbf24' : 'rgba(255,255,255,0.15)', fontSize: 13 }}>★</span>
    ));
  };

  const features = [
    { icon: '✅', title: 'Verified Listings', desc: 'Every property is physically visited and verified by our team.' },
    { icon: '🔐', title: 'Secure Payments', desc: 'Book with confidence using our secure, escrowed payment system.' },
    { icon: '🎧', title: 'Student Support', desc: 'Round the clock support for all your housing queries and issues.' },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f4ff] overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        body { font-family: 'DM Sans', sans-serif; }

        @keyframes fadeUp      { from{opacity:0;transform:translateY(28px);} to{opacity:1;transform:translateY(0);} }
        @keyframes pulseGlow   { 0%,100%{opacity:.4;transform:scale(1);} 50%{opacity:.7;transform:scale(1.08);} }
        @keyframes slideInCard { from{opacity:0;transform:translateY(40px);} to{opacity:1;transform:translateY(0);} }

        .animate-fade-up  { animation: fadeUp 0.7s ease forwards; opacity:0; }
        .delay-1          { animation-delay:0.15s; }
        .delay-2          { animation-delay:0.30s; }
        .delay-3          { animation-delay:0.45s; }
        .delay-4          { animation-delay:0.60s; }
        .animate-pulse-glow { animation: pulseGlow 5s ease-in-out infinite; }
        .animate-slide-card { animation: slideInCard 0.6s ease forwards; opacity:0; }

        .hero-highlight { color:#2d7ef7; text-shadow:0 0 40px rgba(45,126,247,0.5); }
        .hero-bg        { background:radial-gradient(ellipse 80% 60% at 50% 0%, rgba(45,126,247,0.12) 0%, transparent 70%); }
        .hero-glow-orb  { background:radial-gradient(circle, rgba(45,126,247,0.15) 0%, transparent 70%); }
        .features-bg    { background:radial-gradient(ellipse 80% 50% at 50% 50%, rgba(45,126,247,0.06) 0%, transparent 70%); }
        .cta-glow-orb   { background:radial-gradient(ellipse, rgba(45,126,247,0.2) 0%, transparent 70%); }
        .search-focus:focus-within { border-color:rgba(45,126,247,0.4) !important; box-shadow:0 20px 60px rgba(0,0,0,0.4), 0 0 0 2px rgba(45,126,247,0.25) !important; }

        ${topRatedStyles}
      `}</style>

      {/* ════════════ NAVBAR ════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-[999] transition-all duration-300 ${scrolled ? 'bg-[#0d1117]/92 backdrop-blur-lg border-b border-white/7 py-3' : 'py-[18px]'}`}>
        <div className="max-w-[1200px] mx-auto px-8 flex items-center gap-8">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 bg-blue-500 rounded-[10px] flex items-center justify-center text-lg">🏠</div>
            <span className="font-display text-[1.3rem] font-extrabold text-[#f0f4ff]">Uni<span className="text-blue-400">NEST</span></span>
          </div>

          <ul className="hidden md:flex gap-1 ml-auto">
            <li><a href="#browse" className="px-3.5 py-2 rounded-lg text-[#8a96b0] text-sm hover:text-[#f0f4ff] hover:bg-white/5 transition-all duration-300">Home</a></li>
            <li><Link to="/annex-bookings" className="px-3.5 py-2 rounded-lg text-[#8a96b0] text-sm hover:text-[#f0f4ff] hover:bg-white/5 transition-all duration-300">Bookings</Link></li>
            <li><Link to="/support" className="px-3.5 py-2 rounded-lg text-[#8a96b0] text-sm hover:text-[#f0f4ff] hover:bg-white/5 transition-all duration-300">Student Support</Link></li>
            <li><Link to="/about" className="px-3.5 py-2 rounded-lg text-[#8a96b0] text-sm hover:text-[#f0f4ff] hover:bg-white/5 transition-all duration-300">About Us</Link></li>
          </ul>

          <div className="hidden md:flex gap-2.5 items-center ml-4 flex-shrink-0">
            {user ? (
              <button onClick={() => navigate('/profile')} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/8 transition-all duration-300">
                <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold select-none">
                  {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                </div>
                <span className="text-[#f0f4ff] text-sm font-medium">{user.firstName}</span>
                <span className="text-[#5a6478] text-xs">▾</span>
              </button>
            ) : (
              <>
                <Link to="/signup" className="px-5 py-2 rounded-lg text-[#8a96b0] text-sm hover:text-[#f0f4ff] transition-all duration-300">Sign Up</Link>
                <Link to="/login" className="px-5 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-400 hover:-translate-y-px hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300">Log In</Link>
              </>
            )}
          </div>

          <button className="md:hidden ml-auto bg-transparent text-[#f0f4ff] text-2xl cursor-pointer" aria-label="menu">☰</button>
        </div>
      </nav>

      {/* ════════════ HERO ════════════ */}
      <section className="min-h-screen relative overflow-hidden flex items-center justify-center px-8 pt-[100px] pb-[60px] hero-bg">
        <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full hero-glow-orb animate-pulse-glow pointer-events-none" />
        <div className="max-w-[860px] text-center relative z-10">
          <div className="animate-fade-up inline-block mb-5 px-4 py-2 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-300 text-sm font-medium">
            🎓 Trusted by 10,000+ Students
          </div>
          <h1 className="font-display animate-fade-up delay-1 text-[clamp(2.6rem,6vw,4.2rem)] font-extrabold leading-[1.1] mb-5 text-[#f0f4ff]">
            Find Your <span className="hero-highlight">Home</span> Away From Home
          </h1>
          <p className="animate-fade-up delay-2 text-[#8a96b0] text-lg max-w-[560px] mx-auto mb-9 leading-[1.7]">
            Join 10,000+ students finding safe, verified, and affordable student housing near top universities.
          </p>

          {/* Search Bar */}
          <div className="animate-fade-up delay-3 bg-[#161b25] border border-white/7 rounded-[20px] p-2.5 pl-6 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-0 shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(45,126,247,0.1)] mb-5 search-focus transition-all duration-300">
            <div className="flex-1 py-2 md:pr-5">
              <label className="block text-[0.7rem] font-semibold tracking-[0.08em] text-[#5a6478] mb-1">LOCATION</label>
              <div className="flex items-center gap-2">
                <span className="text-sm">📍</span>
                <input type="text" placeholder="Near which university?" value={searchLocation} onChange={e => setSearchLocation(e.target.value)}
                  className="bg-transparent border-none text-[#f0f4ff] text-[0.95rem] w-full outline-none placeholder:text-[#5a6478]" />
              </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-white/7 flex-shrink-0" />
            <div className="flex-1 py-2 px-0 md:px-5">
              <label className="block text-[0.7rem] font-semibold tracking-[0.08em] text-[#5a6478] mb-1">BUDGET</label>
              <div className="flex items-center gap-2">
                <span className="text-sm">💰</span>
                <select value={budget} onChange={e => setBudget(e.target.value)}
                  className="bg-transparent border-none text-[#f0f4ff] text-[0.95rem] w-full outline-none cursor-pointer [&>option]:bg-[#161b25]">
                  <option>Rs.2,000 - Rs.5,000 / Mo</option>
                  <option>Rs.5,000 - Rs.10,000 / Mo</option>
                  <option>Rs.10,000 - Rs.15,000 / Mo</option>
                  <option>Rs.15,000 + / Mo</option>
                </select>
              </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-white/7 flex-shrink-0" />
            <div className="py-2 px-0 md:px-5">
              <label className="block text-[0.7rem] font-semibold tracking-[0.08em] text-[#5a6478] mb-1">GENDER</label>
              <div className="flex items-center gap-2">
                <span className="text-sm">👤</span>
                <select value={gender} onChange={e => setGender(e.target.value)}
                  className="bg-transparent border-none text-[#f0f4ff] text-[0.95rem] w-full outline-none cursor-pointer [&>option]:bg-[#161b25]">
                  <option>Mixed</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
            </div>
            <Link to="/searchAnnex" className="flex-shrink-0 bg-blue-500 hover:bg-blue-400 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300">Search Annex</Link>
          </div>

          {/* Map */}
          <div className="animate-fade-up delay-3 mb-5">
            <div className="rounded-[20px] overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(45,126,247,0.1)]">
              <div className="h-[250px] sm:h-[290px] md:h-[320px] w-full">
                <Map
                  mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                  {...viewState}
                  onMove={(e) => setViewState(e.viewState)}
                  mapStyle="mapbox://styles/mapbox/dark-v11"
                  style={{ width: '100%', height: '100%' }}
                >
                  {UNIVERSITIES.map((uni) => (
                    <Marker key={uni.Name} longitude={uni.Lng} latitude={uni.Lat}>
                      <div className="relative flex flex-col items-center">
                        <div
                          className={`flex items-center justify-center rounded-full border-2 border-white shadow-lg text-xs ${
                            uni.Name === DEFAULT_CAMPUS.Name
                              ? 'w-8 h-8 bg-red-600 text-white'
                              : 'w-7 h-7 bg-[#0b1628] text-[#6b84c9] border-[#1f3058]'
                          }`}
                        >
                          🎓
                        </div>
                        <div
                          className="absolute max-w-[140px] truncate rounded bg-black/70 px-1.5 py-0.5 text-center text-[8px] font-bold text-white"
                          style={{ bottom: -18 }}
                          title={uni.Name}
                        >
                          {uni.Name}
                        </div>
                      </div>
                    </Marker>
                  ))}
                  {mapAnnexes.map((annex) => (
                    <Marker key={annex._id} longitude={annex.location.coordinates[0]} latitude={annex.location.coordinates[1]}>
                      <div className="px-2 py-1 rounded-full border border-[#1f3058] bg-[#0b1628] text-blue-300 text-[10px] font-semibold whitespace-nowrap">
                        {annex.title}
                      </div>
                    </Marker>
                  ))}
                </Map>
              </div>
            </div>
          </div>

          <div className="animate-fade-up delay-4 flex items-center gap-2.5 justify-center flex-wrap">
            <span className="text-[#5a6478] text-sm">Popular:</span>
            {['📶 WiFi','❄️ AC','👕 Laundry','🏋️ Gym'].map(tag => (
              <button key={tag} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/7 text-[#8a96b0] text-sm cursor-pointer hover:bg-blue-500/12 hover:border-blue-500/40 hover:text-blue-300 transition-all duration-300">{tag}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ STATS ════════════ */}
      <section className="bg-[#161b25] border-t border-b border-white/7 flex justify-center flex-wrap">
        {[
          {num:'10,000+',label:'Students Housed'},
          {num:'500+',   label:'Verified Listings'},
          {num:'50+',    label:'Universities Covered'},
          {num:'4.9★',  label:'Average Rating'},
        ].map((s,i) => (
          <div key={s.label} className={`flex-1 max-w-[240px] text-center py-7 px-5 relative ${i>0 ? 'before:content-[""] before:absolute before:left-0 before:top-[25%] before:h-[50%] before:w-px before:bg-white/7' : ''}`}>
            <div className="font-display text-[1.8rem] font-extrabold text-blue-400 mb-1">{s.num}</div>
            <div className="text-[#8a96b0] text-sm">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ════════════ TOP RATED — real data, Booking page card style ════════════ */}
      <section className="py-20 px-8" id="listings" style={{ background: '#050c1a' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="flex justify-between items-end mb-9 flex-wrap gap-2.5">
            <div>
              <p style={{ fontSize: 11, color: 'rgba(45,126,247,0.85)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                ✦ &nbsp;Highest Rated
              </p>
              <h2 className="font-display text-[2rem] font-extrabold text-[#f0f4ff] mb-1.5">Top Rated Annexes</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>Our most popular verified listings based on student reviews</p>
            </div>
            <Link to="/searchAnnex" className="text-blue-400 text-sm font-medium hover:text-blue-300 hover:tracking-wide transition-all duration-300">View All →</Link>
          </div>

          {loadingTop ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Loading top rated properties...</p>
            </div>
          ) : topListings.length === 0 ? (
            <div className="text-center py-12 bg-[#1a2030] rounded-2xl border border-white/7">
              <p className="text-gray-400">No properties with reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.3rem' }}>
              {topListings.map((item, i) => {
                const rating      = getRating(item);
                const price       = getPrice(item);
                const image       = getImage(item);
                const location    = getLocation(item);
                const title       = getTitle(item);
                const propertyId  = getPropertyId(item);
                const genderVal   = getGender(item);
                const chipFeats   = getFeatures(item);
                const description = getDescription(item);

                return (
                  <article
                    key={propertyId}
                    className="tr-card"
                    style={{ animationDelay: `${0.05 + i * 0.1}s` }}
                  >
                    {/* ── Image ── */}
                    <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
                      <img
                        src={image}
                        alt={title}
                        className="tr-card-img"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                      />
                      {/* dark gradient overlay */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(5,12,26,0.8) 100%)' }} />

                      {/* Gender badge */}
                      {genderVal && <span className="tr-badge-gender">{genderVal}</span>}

                      {/* Available badge */}
                      <span className="tr-badge-available">
                        <span className="tr-badge-dot" />
                        Available
                      </span>

                      {/* Price */}
                      {price && (
                        <span style={{ background: 'rgba(5,12,26,0.75)', border: '1px solid rgba(45,126,247,0.3)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '0.28rem 0.65rem', fontSize: '0.8rem', fontWeight: 700, color: '#7ab8fc', position: 'absolute', bottom: 12, left: 12, zIndex: 2 }}>
                          {price}
                        </span>
                      )}
                    </div>

                    {/* ── Body ── */}
                    <div style={{ padding: '1rem 1.1rem 1.1rem' }}>

                      {/* Title */}
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e8eeff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 0.5rem' }}>
                        {title}
                      </h3>

                      {/* ── Rating row (only if we have a real rating) ── */}
                      {rating != null && (
                        <div className="tr-rating-row">
                          <span className="tr-rating-score">★ {typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
                          <div style={{ display: 'flex', gap: 2 }}>{renderStars(rating)}</div>
                          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)' }}>/ 5.0</span>
                        </div>
                      )}

                      {/* ── Location green pill (only if real address exists) ── */}
                      {location && (
                        <div className="tr-location-row">
                          <svg className="tr-location-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                            <circle cx="12" cy="9" r="2.5" fill="#050c1a"/>
                          </svg>
                          <span className="tr-location-text" title={location}>{location}</span>
                        </div>
                      )}

                      {/* ── Real description (only if exists) ── */}
                      {description && (
                        <p style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.65, margin: '0 0 0.85rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {description}
                        </p>
                      )}

                      {/* ── Real feature chips (only if property has them) ── */}
                      {chipFeats.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.9rem' }}>
                          {chipFeats.map((f, idx) => (
                            <span
                              key={idx}
                              className={`tr-amenity-chip ${CHIP_CLASSES[idx % CHIP_CLASSES.length]}`}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}

                      <hr style={{ border: 'none', height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 0 0.9rem' }} />

                      {/* ── CTA buttons — same as Booking page ── */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to={`/annex/${propertyId}`} className="tr-btn-outline">
                          View Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleBookNow(item)}
                          className="tr-btn-glow"
                        >
                          Book Now →
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ════════════ FEATURES ════════════ */}
      <section className="py-20 px-8 features-bg">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-[2rem] font-extrabold text-center mb-12 text-[#f0f4ff] animate-fade-up">Why Students Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f,i) => (
              <div key={f.title} className="bg-[#1a2030] border border-white/7 rounded-[20px] p-9 text-center animate-slide-card hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)] transition-all duration-300 group"
                style={{animationDelay:`${i*0.15}s`}}>
                <div className="w-16 h-16 rounded-[18px] bg-blue-500/12 border border-blue-500/25 flex items-center justify-center mx-auto mb-5 text-2xl group-hover:bg-blue-500/22 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">{f.icon}</div>
                <h3 className="font-display text-[1.1rem] font-bold mb-2.5 text-[#f0f4ff]">{f.title}</h3>
                <p className="text-[#8a96b0] text-sm leading-[1.6]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ CTA ════════════ */}
      <section className="py-20 px-8 text-center relative overflow-hidden bg-[#161b25] border-t border-b border-white/7">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] cta-glow-orb animate-pulse-glow pointer-events-none" />
        <div className="relative z-10">
          <h2 className="font-display text-[2.2rem] font-extrabold mb-3.5 text-[#f0f4ff]">Ready to Find Your Perfect Annex?</h2>
          <p className="text-[#8a96b0] text-base mb-8">Join thousands of students already living in verified, comfortable housing.</p>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <Link to="/searchAnnex" className="px-9 py-3.5 rounded-[14px] bg-blue-500 text-white text-base font-semibold hover:bg-blue-400 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300">Search Now</Link>
            <a href="#post" className="px-9 py-3.5 rounded-[14px] border border-white/10 text-[#8a96b0] text-base font-medium hover:border-blue-500/40 hover:text-[#f0f4ff] hover:-translate-y-0.5 transition-all duration-300">List Your Property</a>
          </div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="bg-[#161b25] px-8 pt-[60px]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.5fr] gap-12 pb-12 border-b border-white/7">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-blue-500 rounded-[10px] flex items-center justify-center text-lg">🏠</div>
              <span className="font-display text-[1.3rem] font-extrabold text-[#f0f4ff]">Uni<span className="text-blue-400">NEST</span></span>
            </div>
            <p className="text-[#5a6478] text-sm leading-[1.6] mb-5 max-w-[280px]">The ultimate destination for student housing. Find, book, and live in the best annexes and hostels across the country.</p>
            <div className="flex gap-2.5">
              <a href="#" className="w-9 h-9 rounded-[10px] bg-white/6 border border-white/7 text-[#8a96b0] flex items-center justify-center text-sm font-bold hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all duration-300">f</a>
              <a href="#" className="w-9 h-9 rounded-[10px] bg-white/6 border border-white/7 text-[#8a96b0] flex items-center justify-center text-sm font-bold hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all duration-300">@</a>
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-[#f0f4ff] mb-4">Explore</h4>
            <ul className="flex flex-col gap-3">
              <li><a href="#find" className="text-[#5a6478] text-sm hover:text-blue-300 hover:pl-1 transition-all duration-300">Find a Room</a></li>
              <li><a href="#maps" className="text-[#5a6478] text-sm hover:text-blue-300 hover:pl-1 transition-all duration-300">University Maps</a></li>
              <li><a href="#how" className="text-[#5a6478] text-sm hover:text-blue-300 hover:pl-1 transition-all duration-300">How it works</a></li>
              <li><a href="#reviews" className="text-[#5a6478] text-sm hover:text-blue-300 hover:pl-1 transition-all duration-300">Reviews</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-[#f0f4ff] mb-4">For Owners</h4>
            <ul className="flex flex-col gap-3">
              <li><a href="#list" className="text-[#5a6478] text-sm hover:text-blue-300 hover:pl-1 transition-all duration-300">List your property</a></li>
              <li><a href="#dashboard" className="text-[#5a6478] text-sm hover:text-blue-300 hover:pl-1 transition-all duration-300">Owner Dashboard</a></li>
              <li><a href="#safety" className="text-[#5a6478] text-sm hover:text-blue-300 hover:pl-1 transition-all duration-300">Safety Standards</a></li>
              <li><a href="#pricing" className="text-[#5a6478] text-sm hover:text-blue-300 hover:pl-1 transition-all duration-300">Pricing Plans</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-[#f0f4ff] mb-4">Newsletter</h4>
            <p className="text-[#5a6478] text-sm mb-3.5 leading-[1.5]">Get the latest housing deals delivered to your inbox.</p>
            <div className="flex overflow-hidden rounded-lg border border-white/7">
              <input type="email" placeholder="Email address" className="flex-1 px-3.5 py-2.5 bg-white/4 text-[#f0f4ff] text-sm placeholder:text-[#5a6478] outline-none" />
              <button className="px-4 py-2.5 bg-blue-500 text-white text-base hover:bg-blue-400 transition-all duration-300 cursor-pointer">→</button>
            </div>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto py-5 text-center text-[#5a6478] text-xs">© 2024 UniNEST. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default Home;