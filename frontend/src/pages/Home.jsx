import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [budget, setBudget] = useState('Rs.2,000 - Rs.5,000 / Mo');
  const [gender, setGender] = useState('Mixed');
  const [topListings, setTopListings] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';
const sliitLocation = { lat: 6.9147, lng: 79.9723 };

const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mapAnnexes, setMapAnnexes] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch real top-rated properties
  useEffect(() => {
    const fetchTopRated = async () => {
      try {
        const response = await api.get('/quality/top-rated?limit=3');
        if (response.data.success && response.data.properties.length > 0) {
          setTopListings(response.data.properties);
        } else {
          // Fallback to show message if no data
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

  // Helper function to get rating from quality data
  const getRating = (property) => {
    return property.averageRating || property.overallScore || 4.5;
  };

  // Helper function to get price display
  const getPrice = (property) => {
    const price = property.property?.price || property.price;
    if (price) {
      return `Rs.${price.toLocaleString()} / Mo`;
    }
    return 'Rs.5,000 / Mo';
  };

  // Helper function to get image
  const getImage = (property) => {
    const images = property.property?.imageUrls || property.imageUrls;
    if (images && images.length > 0) {
      return `http://localhost:5000${images[0]}`;
    }
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80';
  };

  // Helper function to get location
  const getLocation = (property) => {
    const address = property.property?.selectedAddress || property.selectedAddress;
    if (address) {
      return address.substring(0, 40);
    }
    return 'Near Campus';
  };

  // Helper function to get badge
  const getBadge = (property) => {
    const gender = property.property?.preferredGender || property.preferredGender;
    if (gender === 'Female') return { text: 'FEMALE ONLY', class: 'bg-pink-600/85 text-white' };
    if (gender === 'Male') return { text: 'MALE ONLY', class: 'bg-blue-700/85 text-white' };
    return { text: 'VERIFIED', class: 'bg-green-600/85 text-white' };
  };
  useEffect(() => {
    const fetchMapAnnexes = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/annexes/search?lat=${sliitLocation.lat}&lng=${sliitLocation.lng}&maxDistance=15000`
        );
        setMapAnnexes(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error('Error loading map annexes:', err);
      }
    };

    fetchMapAnnexes();
  }, []);

  const listings = [
    {
      id: 1,
      name: 'The Royal Plaza',
      badge: 'VERIFIED',
      badgeClass: 'bg-green-600/85 text-white',
      price: 'Rs.5,500 / Mo',
      rating: 4.9,
      distance: '0.2 miles from Main Campus',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
      amenities: [
        { icon: '👥', label: 'MIXED' },
        { icon: '📶', label: 'GIGABIT' },
        { icon: '🔒', label: '24/7 SEC' },
      ],
    },
    {
      id: 2,
      name: 'Starlight Residences',
      badge: 'FEMALE ONLY',
      badgeClass: 'bg-pink-600/85 text-white',
      price: 'Rs.10,550 / Mo',
      rating: 4.7,
      distance: '0.5 miles from Campus',
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
      amenities: [
        { icon: '🍽️', label: 'MESS' },
        { icon: '❄️', label: 'AC AVAIL.' },
        { icon: '👕', label: 'LAUNDRY' },
      ],
    },
    {
      id: 3,
      name: 'Horizon Heights',
      badge: 'MALE ONLY',
      badgeClass: 'bg-blue-700/85 text-white',
      price: 'Rs.2,500 / Mo',
      rating: 4.8,
      distance: '0.1 miles from Campus',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
      amenities: [
        { icon: '🏋️', label: 'GYM' },
        { icon: '🏠', label: 'ROOFTOP' },
        { icon: '🅿️', label: 'PARKING' },
      ],
    },
  ];

  const features = [
    { icon: '✅', title: 'Verified Listings',  desc: 'Every property is physically visited and verified by our team.' },
    { icon: '🔐', title: 'Secure Payments',    desc: 'Book with confidence using our secure, escrowed payment system.' },
    { icon: '🎧', title: 'Student Support',    desc: 'Round the clock support for all your housing queries and issues.' },
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
            <li><a href="#listings" className="px-3.5 py-2 rounded-lg text-[#8a96b0] text-sm hover:text-[#f0f4ff] hover:bg-white/5 transition-all duration-300">Top Listings</a></li>
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

          <div className="animate-fade-up delay-3 bg-[#161b25] border border-white/7 rounded-[20px] p-2.5 pl-6 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-0 shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(45,126,247,0.1)] mb-5 search-focus transition-all duration-300">
            <div className="flex-1 py-2 md:pr-5">
              <label className="block text-[0.7rem] font-semibold tracking-[0.08em] text-[#5a6478] mb-1">LOCATION</label>
              <div className="flex items-center gap-2">
                <span className="text-sm">📍</span>
                <input type="text" placeholder="Near which university?" value={searchLocation} onChange={e=>setSearchLocation(e.target.value)}
                  className="bg-transparent border-none text-[#f0f4ff] text-[0.95rem] w-full outline-none placeholder:text-[#5a6478]" />
              </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-white/7 flex-shrink-0" />
            <div className="flex-1 py-2 px-0 md:px-5">
              <label className="block text-[0.7rem] font-semibold tracking-[0.08em] text-[#5a6478] mb-1">BUDGET</label>
              <div className="flex items-center gap-2">
                <span className="text-sm">💰</span>
                <select value={budget} onChange={e=>setBudget(e.target.value)}
                  className="bg-transparent border-none text-[#f0f4ff] text-[0.95rem] w-full outline-none cursor-pointer [&>option]:bg-[#161b25]">
                  <option>Rs.2,000 - Rs.5,000 / Mo</option>
                  <option>Rs.5,000 - Rs.10,000 / Mo</option>
                  <option>Rs.10,000 - Rs.15,000 / Mo</option>
                  <option>Rs.15,000 + / Mo</option>
                </select>
              </div>
          <div className="animate-fade-up delay-3 mb-5">
            <div className="flex justify-center mb-4">
              <Link
                to="/searchAnnex"
                className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-400 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all duration-300"
              >
                Search Annex
              </Link>
            </div>

            <div className="rounded-[20px] overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(45,126,247,0.1)]">
              <div className="h-[250px] sm:h-[290px] md:h-[320px] w-full">
                <Map
                  mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                  initialViewState={{
                    longitude: sliitLocation.lng,
                    latitude: sliitLocation.lat,
                    zoom: 12.5,
                  }}
                  mapStyle="mapbox://styles/mapbox/dark-v11"
                  style={{ width: '100%', height: '100%' }}
                >
                  <Marker longitude={sliitLocation.lng} latitude={sliitLocation.lat}>
                    <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs">
                      🎓
                    </div>
                  </Marker>

                  {mapAnnexes.map((annex) => (
                    <Marker
                      key={annex._id}
                      longitude={annex.location.coordinates[0]}
                      latitude={annex.location.coordinates[1]}
                    >
                      <div className="px-2 py-1 rounded-full border border-[#1f3058] bg-[#0b1628] text-blue-300 text-[10px] font-semibold whitespace-nowrap">
                        {annex.title}
                      </div>
                    </Marker>
                  ))}
                </Map>
              </div>
            </div>
            <Link to="/searchAnnex" className="flex-shrink-0 bg-blue-500 hover:bg-blue-400 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300">Search Annex</Link>
          </div>

          <div className="animate-fade-up delay-4 flex items-center gap-2.5 justify-center flex-wrap">
            <span className="text-[#5a6478] text-sm">Popular:</span>
            {['📶 WiFi','❄️ AC','👕 Laundry','🏋️ Gym'].map(tag=>(
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
        ].map((s,i)=>(
          <div key={s.label} className={`flex-1 max-w-[240px] text-center py-7 px-5 relative ${i>0 ? 'before:content-[""] before:absolute before:left-0 before:top-[25%] before:h-[50%] before:w-px before:bg-white/7' : ''}`}>
            <div className="font-display text-[1.8rem] font-extrabold text-blue-400 mb-1">{s.num}</div>
            <div className="text-[#8a96b0] text-sm">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ════════════ TOP LISTINGS - REAL DATA ════════════ */}
      <section className="py-20 px-8" id="listings">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex justify-between items-end mb-9 flex-wrap gap-2.5">
            <div>
              <h2 className="font-display text-[2rem] font-extrabold text-[#f0f4ff] mb-1.5">Top Rated Annexes</h2>
              <p className="text-[#8a96b0] text-[0.95rem]">Our most popular verified listings based on student reviews</p>
            </div>
            <Link to="/searchAnnex" className="text-blue-400 text-sm font-medium hover:text-blue-300 hover:tracking-wide transition-all duration-300">View All →</Link>
          </div>
          
          {loadingTop ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-400 text-sm">Loading top rated properties...</p>
            </div>
          ) : topListings.length === 0 ? (
            <div className="text-center py-12 bg-[#1a2030] rounded-2xl border border-white/7">
              <p className="text-gray-400">No properties with reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topListings.map((item, i) => {
                const property = item.property || item;
                const badge = getBadge(item);
                const rating = getRating(item);
                const price = getPrice(item);
                const image = getImage(item);
                const location = getLocation(item);
                const title = property?.title || 'Property';
                const propertyId = property?._id || item._id;
                
                return (
                  <div key={propertyId} className="bg-[#1a2030] border border-white/7 rounded-[20px] overflow-hidden animate-slide-card hover:-translate-y-1.5 hover:border-blue-500/30 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(45,126,247,0.15)] hover:bg-[#1e2638] transition-all duration-300"
                    style={{animationDelay:`${i*0.15}s`}}>
                    <div className="relative overflow-hidden h-[200px]">
                      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                      <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[0.7rem] font-bold tracking-[0.05em] ${badge.class}`}>{badge.text}</span>
                      <span className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white text-sm font-semibold border border-white/15">{price}</span>
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-center mb-1.5">
                        <h3 className="font-display text-[1.05rem] font-bold text-[#f0f4ff]">{title}</h3>
                        <span className="text-amber-400 text-sm font-semibold">★ {typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
                      </div>
                      <p className="text-[#5a6478] text-[0.82rem] mb-4">📍 {location}</p>
                      <div className="flex gap-2 mb-4 p-3 rounded-lg bg-white/3 border border-white/7">
                        <div className="flex-1 text-center">
                          <span className="block text-lg mb-1">📶</span>
                          <span className="block text-[0.65rem] text-[#5a6478] font-semibold tracking-[0.05em]">WiFi</span>
                        </div>
                        <div className="flex-1 text-center">
                          <span className="block text-lg mb-1">🔒</span>
                          <span className="block text-[0.65rem] text-[#5a6478] font-semibold tracking-[0.05em]">SECURITY</span>
                        </div>
                        <div className="flex-1 text-center">
                          <span className="block text-lg mb-1">👕</span>
                          <span className="block text-[0.65rem] text-[#5a6478] font-semibold tracking-[0.05em]">LAUNDRY</span>
                        </div>
                      </div>
                      <Link to={`/annex/${propertyId}`} className="block w-full py-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-lg text-sm font-medium text-center cursor-pointer hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-300">
                        View Details
                      </Link>
                    </div>
                  </div>
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
            {features.map((f,i)=>(
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