import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { UNIVERSITIES } from '../constants/universities';

const API_BASE = 'http://localhost:5000';
const CAMPUS_RADIUS_KM = 15;
const AMENITY_OPTIONS = ['WiFi', 'AC', 'Parking', 'Security'];

function calcKm(sLat, sLng, eLat, eLng) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(eLat - sLat);
  const dLng = toRad(eLng - sLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(sLat)) * Math.cos(toRad(eLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&q=80';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .font-display { font-family: 'Syne', sans-serif; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(45,126,247,0.35); }
    70%  { box-shadow: 0 0 0 10px rgba(45,126,247,0); }
    100% { box-shadow: 0 0 0 0 rgba(45,126,247,0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes orb-drift {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(30px, -20px) scale(1.04); }
    66%       { transform: translate(-20px, 15px) scale(0.97); }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
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

  .annex-wrap {
    min-height: 100vh;
    background: #050c1a;
    position: relative;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
  }
  .hero-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(45,126,247,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .hero-glow-orb {
    position: absolute; top: -120px; left: -80px;
    width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(45,126,247,0.15) 0%, transparent 70%);
    pointer-events: none;
    animation: orb-drift 14s ease-in-out infinite;
  }
  .cta-glow-orb {
    position: absolute; bottom: -160px; right: -100px;
    width: 600px; height: 600px;
    background: radial-gradient(ellipse, rgba(45,126,247,0.2) 0%, transparent 70%);
    pointer-events: none;
    animation: orb-drift 18s ease-in-out infinite reverse;
  }
  .mid-glow-orb {
    position: absolute; top: 40%; left: 50%;
    transform: translateX(-50%);
    width: 700px; height: 300px;
    background: radial-gradient(ellipse, rgba(45,126,247,0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  .header-animate {
    animation: fadeInDown 0.6s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hero-tagline {
    animation: fadeInDown 0.7s 0.1s cubic-bezier(0.22,1,0.36,1) both;
    text-align: center;
    margin-bottom: 2.2rem;
  }
  .search-wrap {
    animation: fadeInDown 0.7s 0.18s cubic-bezier(0.22,1,0.36,1) both;
    position: relative;
    max-width: 520px;
    margin: 0 auto 2.5rem;
  }
  .search-input {
    width: 100%;
    box-sizing: border-box;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(45,126,247,0.28);
    border-radius: 50px;
    padding: 0.72rem 1.2rem 0.72rem 3rem;
    color: #e8eeff;
    font-size: 0.88rem;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    backdrop-filter: blur(12px);
  }
  .search-input::placeholder { color: rgba(255,255,255,0.3); }
  .search-input:focus {
    border-color: rgba(45,126,247,0.65);
    box-shadow: 0 0 0 3px rgba(45,126,247,0.12);
    background: rgba(255,255,255,0.09);
  }
  .search-icon {
    position: absolute; left: 1rem; top: 50%;
    transform: translateY(-50%);
    width: 16px; height: 16px;
    opacity: 0.45;
    pointer-events: none;
  }
  .search-clear {
    position: absolute; right: 1rem; top: 50%;
    transform: translateY(-50%);
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 50%;
    width: 20px; height: 20px;
    color: rgba(255,255,255,0.6);
    font-size: 12px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .search-clear:hover { background: rgba(45,126,247,0.3); color: #fff; }

  .stats-strip {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 2.5rem;
    animation: fadeInDown 0.7s 0.24s cubic-bezier(0.22,1,0.36,1) both;
    flex-wrap: wrap;
  }
  .stat-pill {
    display: flex; align-items: center; gap: 0.45rem;
    background: rgba(45,126,247,0.1);
    border: 1px solid rgba(45,126,247,0.22);
    border-radius: 50px;
    padding: 0.35rem 1rem;
    font-size: 0.78rem;
    font-family: 'DM Sans', sans-serif;
    color: rgba(255,255,255,0.6);
  }
  .stat-pill strong { color: #7ab8fc; font-weight: 700; }

  .annex-card {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(0,0,0,0.4);
    transition: transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s;
    animation: scaleIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }
  .annex-card:hover {
    transform: translateY(-7px) scale(1.012);
    box-shadow: 0 20px 60px rgba(0,0,0,0.55), 0 0 35px rgba(45,126,247,0.22);
    border-color: rgba(45,126,247,0.25);
  }
  .annex-card:hover .card-img img {
    transform: scale(1.07);
  }
  .card-img img {
    transition: transform 0.5s cubic-bezier(0.22,1,0.36,1);
  }
  .card-img-overlay::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 30%, rgba(5,12,26,0.8) 100%);
  }

  /* ── Gender badge ── */
  .badge-gender {
    background: rgba(45,126,247,0.35);
    border: 1.5px solid rgba(45,126,247,0.75);
    color: #e0f0ff;
    backdrop-filter: blur(10px);
    font-size: 11px;
    font-weight: 800;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.07em;
    padding: 0.32rem 0.85rem;
    border-radius: 999px;
    text-shadow: 0 0 8px rgba(45,126,247,0.8);
  }

  /* ── Available badge — green glowy ── */
  .badge-available {
    background: rgba(16,185,129,0.25);
    border: 1.5px solid rgba(16,185,129,0.65);
    color: #6ee7b7;
    backdrop-filter: blur(10px);
    display: flex; align-items: center; gap: 5px;
    font-size: 11px;
    font-weight: 800;
    font-family: 'DM Sans', sans-serif;
    padding: 0.32rem 0.75rem;
    border-radius: 999px;
    animation: green-pulse 2.2s ease-in-out infinite;
    text-shadow: 0 0 8px rgba(16,185,129,0.7);
  }
  .badge-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 6px 2px rgba(52,211,153,0.8);
    flex-shrink: 0;
  }

  /* ── Location pill — green glowy ── */
  .location-row {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    margin: 0 0 0.65rem !important;
    padding: 0.32rem 0.75rem !important;
    background: rgba(16,185,129,0.12) !important;
    border: 1.5px solid rgba(16,185,129,0.45) !important;
    border-radius: 999px !important;
    width: fit-content !important;
    max-width: 100% !important;
    animation: loc-glow 2.4s ease-in-out infinite !important;
  }
  .location-icon {
    flex-shrink: 0;
    color: #34d399 !important;
    filter: drop-shadow(0 0 4px rgba(52,211,153,0.9)) !important;
  }
  .location-text {
    font-size: 0.76rem !important;
    font-weight: 700 !important;
    font-family: 'DM Sans', sans-serif !important;
    color: #6ee7b7 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    text-shadow: 0 0 10px rgba(16,185,129,0.7) !important;
    letter-spacing: 0.01em !important;
  }

  /* ── Coloured amenity chips ── */
  .amenity-chip {
    border-radius: 6px;
    padding: 0.18rem 0.55rem;
    font-size: 0.68rem;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    white-space: nowrap;
    transition: transform 0.2s;
  }
  .amenity-chip:hover { transform: scale(1.08); }

  .chip-blue {
    background: rgba(45,126,247,0.15);
    border: 1px solid rgba(45,126,247,0.45);
    color: #7ab8fc;
  }
  .chip-purple {
    background: rgba(168,85,247,0.15);
    border: 1px solid rgba(168,85,247,0.45);
    color: #d8b4fe;
  }
  .chip-emerald {
    background: rgba(16,185,129,0.15);
    border: 1px solid rgba(16,185,129,0.45);
    color: #6ee7b7;
  }
  .chip-rose {
    background: rgba(244,63,94,0.15);
    border: 1px solid rgba(244,63,94,0.45);
    color: #fda4af;
  }
  .chip-amber {
    background: rgba(245,158,11,0.15);
    border: 1px solid rgba(245,158,11,0.45);
    color: #fcd34d;
  }
  .chip-cyan {
    background: rgba(6,182,212,0.15);
    border: 1px solid rgba(6,182,212,0.45);
    color: #67e8f9;
  }

  .btn-glass-outline {
    background: transparent;
    border: 1px solid rgba(45,126,247,0.35);
    color: #5ba4fa;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.18s;
  }
  .btn-glass-outline:hover {
    background: rgba(45,126,247,0.12);
    border-color: rgba(45,126,247,0.6);
    color: #93c3fd;
    transform: scale(1.03);
  }
  .btn-glow {
    background: linear-gradient(135deg, #2d7ef7 0%, #1a5fd4 100%);
    box-shadow: 0 0 20px rgba(45,126,247,0.35);
    font-family: 'DM Sans', sans-serif;
    transition: all 0.18s;
  }
  .btn-glow:hover {
    background: linear-gradient(135deg, #4a96ff 0%, #2d7ef7 100%);
    box-shadow: 0 0 32px rgba(45,126,247,0.6);
    transform: scale(1.04);
  }
  .back-glass {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(10px);
    color: rgba(255,255,255,0.75);
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .back-glass:hover {
    background: rgba(45,126,247,0.15);
    border-color: rgba(45,126,247,0.4);
    color: #fff;
  }

  .skeleton {
    background: rgba(255,255,255,0.06);
    border-radius: 18px;
    overflow: hidden;
    position: relative;
  }
  .skeleton::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
    background-size: 600px 100%;
    animation: shimmer 1.5s infinite;
  }

  .empty-state {
    animation: fadeInUp 0.5s ease both;
    text-align: center;
    padding: 5rem 0;
  }
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: float 3s ease-in-out infinite;
    display: block;
  }

  .result-label {
    font-size: 0.78rem;
    font-family: 'DM Sans', sans-serif;
    color: rgba(255,255,255,0.3);
    text-align: center;
    margin-bottom: 1.2rem;
    animation: fadeInDown 0.5s 0.3s both;
  }
  .result-label span { color: #5ba4fa; font-weight: 600; }

  .section-divider {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(45,126,247,0.2), transparent);
    margin: 2rem 0;
  }

  .booking-layout {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
    position: relative;
  }
  @media (max-width: 960px) {
    .booking-layout { flex-direction: column; }
    .filter-sidebar { width: 100% !important; position: relative !important; top: 0 !important; }
  }
  .filter-sidebar {
    width: 280px;
    flex-shrink: 0;
    position: sticky;
    top: 1.25rem;
    align-self: flex-start;
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 18px;
    padding: 1.25rem 1.2rem;
    box-shadow: 0 12px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(45,126,247,0.06);
  }
  .filter-sidebar h3 {
    margin: 0 0 1rem;
    font-size: 0.82rem;
    font-weight: 800;
    font-family: 'Syne', sans-serif;
    color: #e8eeff;
    letter-spacing: 0.02em;
  }
  .filter-block { margin-bottom: 1.15rem; }
  .filter-block-label {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    color: rgba(45,126,247,0.9);
    margin: 0 0 0.5rem;
    font-family: 'DM Sans', sans-serif;
  }
  .filter-row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .filter-inp {
    width: 100%;
    box-sizing: border-box;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(45,126,247,0.25);
    border-radius: 10px;
    padding: 0.45rem 0.55rem;
    color: #e8eeff;
    font-size: 0.8rem;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .filter-inp::placeholder { color: rgba(255,255,255,0.28); }
  .filter-inp:focus {
    border-color: rgba(45,126,247,0.55);
    box-shadow: 0 0 0 2px rgba(45,126,247,0.12);
  }
  .filter-select {
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    background-color: rgba(255, 255, 255, 0.06);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 20 20' fill='%237ab8fc'%3E%3Cpath d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.55rem center;
    padding-right: 1.75rem;
  }

  /* Dark-theme native selects: readable options + matching trigger (AnnexBooking filters) */
  .annex-wrap select,
  .annex-wrap select.filter-inp {
    background-color: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(45, 126, 247, 0.28);
    color: #e8eeff;
    color-scheme: dark;
  }
  .annex-wrap select:focus,
  .annex-wrap select.filter-inp:focus {
    border-color: rgba(45, 126, 247, 0.55);
    box-shadow: 0 0 0 2px rgba(45, 126, 247, 0.12);
  }
  .annex-wrap select option {
    background-color: #050c1a;
    color: #e8eeff;
  }
  .annex-wrap select option:hover,
  .annex-wrap select option:focus,
  .annex-wrap select option:checked {
    background-color: #2d7ef7;
    color: #e8eeff;
  }
  .filter-check {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-bottom: 0.4rem;
    cursor: pointer;
    font-size: 0.78rem;
    color: rgba(255,255,255,0.68);
    font-family: 'DM Sans', sans-serif;
  }
  .filter-check:last-child { margin-bottom: 0; }
  .filter-check input {
    width: 15px;
    height: 15px;
    accent-color: #2d7ef7;
    cursor: pointer;
    flex-shrink: 0;
  }
  .filter-reset {
    width: 100%;
    margin-top: 0.35rem;
    padding: 0.52rem;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.65);
    font-size: 0.78rem;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.18s;
  }
  .filter-reset:hover {
    border-color: rgba(45,126,247,0.4);
    color: #93c3fd;
    background: rgba(45,126,247,0.1);
  }
  .filter-hint {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.32);
    margin: 0.35rem 0 0;
    line-height: 1.4;
    font-family: 'DM Sans', sans-serif;
  }
  .booking-main {
    flex: 1;
    min-width: 0;
  }
`;

const DEFAULT_AMENITIES = ['WiFi', 'AC', 'Parking', 'Security'];
const CHIP_COLOURS = ['chip-blue', 'chip-purple', 'chip-emerald', 'chip-rose', 'chip-amber', 'chip-cyan'];

const generateDesc = (annex) => {
  if (annex.description) return annex.description;
  const loc = annex.selectedAddress || 'near SLIIT Malabe Campus';
  const price = Number(annex.price || 0).toLocaleString();
  return `A comfortable annex located ${loc}, offering a peaceful living environment at Rs. ${price}/mo. Ideal for students seeking quality accommodation close to campus.`;
};

const cardDelay = (i) => `${0.05 + i * 0.07}s`;

function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 340 }} />
      ))}
    </div>
  );
}

function AnnexBookingPage() {
  const navigate = useNavigate();
  const [annexes, setAnnexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterGender, setFilterGender] = useState('Any');
  const [amenityFilters, setAmenityFilters] = useState(() =>
    Object.fromEntries(AMENITY_OPTIONS.map((k) => [k, false]))
  );
  const [filterUniversity, setFilterUniversity] = useState(null);

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, []);

  useEffect(() => {
    const fetchAnnexes = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_BASE}/api/annexes/search`);
        setAnnexes(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error('Error fetching annexes:', err);
        setError('Failed to load annexes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnexes();
  }, []);

  const getImageUrl = (annex) => {
    if (annex?.imageUrl) {
      return annex.imageUrl.startsWith('http') ? annex.imageUrl : `${API_BASE}${annex.imageUrl}`;
    }
    if (Array.isArray(annex?.imageUrls) && annex.imageUrls.length > 0) {
      const firstImage = annex.imageUrls[0];
      return firstImage.startsWith('http') ? firstImage : `${API_BASE}${firstImage}`;
    }
    return FALLBACK_IMAGE;
  };

  const handleViewDetails = (annex) => navigate(`/annex/${annex._id}`, { state: { annex } });

  const handleBookNow = (annex) => {
    navigate('/booking', {
      state: {
        room: {
          annexId: annex._id,
          title: annex.title,
          imageUrl: getImageUrl(annex),
          location: annex.selectedAddress || 'Near SLIIT Malabe Campus',
        },
      },
    });
  };

  const clearFilters = () => {
    setSearch('');
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterGender('Any');
    setAmenityFilters(Object.fromEntries(AMENITY_OPTIONS.map((k) => [k, false])));
    setFilterUniversity(null);
  };

  const hasActiveFilters =
    !!search.trim() ||
    filterPriceMin !== '' ||
    filterPriceMax !== '' ||
    filterGender !== 'Any' ||
    AMENITY_OPTIONS.some((k) => amenityFilters[k]) ||
    filterUniversity != null;

  const filtered = useMemo(() => {
    let list = annexes;

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          (a.title || '').toLowerCase().includes(q) ||
          (a.selectedAddress || '').toLowerCase().includes(q)
      );
    }

    const pMin = filterPriceMin !== '' ? Number(filterPriceMin) : null;
    const pMax = filterPriceMax !== '' ? Number(filterPriceMax) : null;
    if (pMin != null && !Number.isNaN(pMin)) {
      list = list.filter((a) => Number(a.price || 0) >= pMin);
    }
    if (pMax != null && !Number.isNaN(pMax)) {
      list = list.filter((a) => Number(a.price || 0) <= pMax);
    }

    if (filterGender === 'Male' || filterGender === 'Female') {
      list = list.filter((a) => {
        const g = a.preferredGender || 'Any';
        return g === 'Any' || g === filterGender;
      });
    }

    const requiredAmenities = AMENITY_OPTIONS.filter((k) => amenityFilters[k]);
    if (requiredAmenities.length > 0) {
      list = list.filter((a) => {
        const feats = Array.isArray(a.features) ? a.features.map((f) => String(f).toLowerCase()) : [];
        return requiredAmenities.every((key) => {
          const term = key.toLowerCase();
          return feats.some((f) => f.includes(term));
        });
      });
    }

    if (filterUniversity) {
      list = list.filter((a) => {
        const coords = a.location?.coordinates;
        if (!coords || coords.length < 2) return false;
        const [lng, lat] = coords;
        const d = calcKm(filterUniversity.lat, filterUniversity.lng, lat, lng);
        return d <= CAMPUS_RADIUS_KM;
      });
    }

    return list;
  }, [
    annexes,
    search,
    filterPriceMin,
    filterPriceMax,
    filterGender,
    amenityFilters,
    filterUniversity,
  ]);

  return (
    <div className="annex-wrap">
      <div className="hero-bg" />
      <div className="hero-glow-orb" />
      <div className="cta-glow-orb" />
      <div className="mid-glow-orb" />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1240, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

        {/* ── Header ── */}
        <div className="header-animate" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(45,126,247,0.85)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.35rem', fontFamily: "'DM Sans', sans-serif" }}>
              ✦ &nbsp;Student Accommodation
            </p>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', textShadow: '0 0 50px rgba(45,126,247,0.45)', letterSpacing: '-0.01em', margin: 0, fontFamily: "'Syne', sans-serif" }}>
              Annex Booking Gallery
            </h1>
          </div>
          <Link to="/" className="back-glass" style={{ padding: '0.5rem 1.2rem', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>

        {/* ── Hero tagline ── */}
        <div className="hero-tagline">
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.45)', maxWidth: 560, margin: '0 auto', lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif" }}>
            Discover comfortable, affordable annexes located steps from the SLIIT Malabe Campus.
            Browse verified listings, explore amenities, and book your perfect student home — all in one place.
          </p>
        </div>

        {/* ── Stats strip ── */}
        {!loading && !error && (
          <div className="stats-strip">
            <div className="stat-pill"><strong>{filtered.length}</strong> Match filters</div>
            <div className="stat-pill"><strong>{annexes.length}</strong> Total listings</div>
            <div className="stat-pill"><strong>24/7</strong> Support</div>
            <div className="stat-pill"><strong>Verified</strong> Properties</div>
          </div>
        )}

        <div className="booking-layout">
          <aside className="filter-sidebar" aria-label="Filter listings">
            <h3>Filters</h3>

            <div className="filter-block">
              <p className="filter-block-label">Price range (LKR / mo)</p>
              <div className="filter-row-2">
                <input
                  className="filter-inp"
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={filterPriceMin}
                  onChange={(e) => setFilterPriceMin(e.target.value)}
                />
                <input
                  className="filter-inp"
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={filterPriceMax}
                  onChange={(e) => setFilterPriceMax(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-block">
              <p className="filter-block-label">Gender</p>
              <select
                className="filter-inp filter-select"
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
              >
                <option value="Any">Any</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="filter-block">
              <p className="filter-block-label">Amenities</p>
              {AMENITY_OPTIONS.map((key) => (
                <label key={key} className="filter-check">
                  <input
                    type="checkbox"
                    checked={amenityFilters[key]}
                    onChange={() =>
                      setAmenityFilters((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                  />
                  {key}
                </label>
              ))}
            </div>

            <div className="filter-block">
              <p className="filter-block-label">Near campus</p>
              <select
                className="filter-inp filter-select"
                value={filterUniversity?.name ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) setFilterUniversity(null);
                  else setFilterUniversity(UNIVERSITIES.find((u) => u.name === v) ?? null);
                }}
              >
                <option value="">All campuses</option>
                {UNIVERSITIES.map((u) => (
                  <option key={u.name} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
              <p className="filter-hint">Within ~{CAMPUS_RADIUS_KM} km of the selected university.</p>
            </div>

            <button type="button" className="filter-reset" onClick={clearFilters}>
              Reset all filters
            </button>
          </aside>

          <div className="booking-main">
            {/* ── Search bar ── */}
            <div className="search-wrap" style={{ maxWidth: '100%' }}>
              <svg className="search-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="6" stroke="white" strokeWidth="1.8"/>
                <path d="M13.5 13.5L17 17" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <input
                className="search-input"
                type="text"
                placeholder="Search by name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                  ✕
                </button>
              )}
            </div>

            <hr className="section-divider" />

            {loading && <SkeletonGrid />}

            {!loading && error && (
              <div className="empty-state">
                <span className="empty-icon">⚠️</span>
                <p style={{ color: 'rgba(255,100,100,0.7)', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">🔍</span>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                  {annexes.length === 0
                    ? 'No annexes available.'
                    : hasActiveFilters
                      ? 'No annexes match your filters. Try widening price, campus radius, or amenities.'
                      : 'No annexes available.'}
                </p>
                {hasActiveFilters && annexes.length > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    style={{ marginTop: '0.75rem', background: 'rgba(45,126,247,0.15)', border: '1px solid rgba(45,126,247,0.3)', color: '#5ba4fa', borderRadius: 8, padding: '0.4rem 1rem', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <p className="result-label">
                Showing <span>{filtered.length}</span> {filtered.length === 1 ? 'annex' : 'annexes'}
                {search.trim() && <> matching <span>&quot;{search.trim()}&quot;</span></>}
                {hasActiveFilters && !search.trim() && <> with current filters</>}
                {annexes.length > filtered.length && (
                  <> <span style={{ color: 'rgba(255,255,255,0.25)' }}>({annexes.length} total)</span></>
                )}
              </p>
            )}

            {/* ── Grid ── */}
            {!loading && !error && filtered.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.3rem' }}>
            {filtered.map((annex, i) => {
              const amenities =
                Array.isArray(annex.features) && annex.features.length > 0
                  ? annex.features.slice(0, 4)
                  : Array.isArray(annex.amenities) && annex.amenities.length > 0
                  ? annex.amenities.slice(0, 4)
                  : DEFAULT_AMENITIES;

              const desc = generateDesc(annex);

              return (
                <article key={annex._id} className="annex-card" style={{ animationDelay: cardDelay(i) }}>

                  {/* ── Image ── */}
                  <div className="card-img card-img-overlay" style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
                    <img
                      src={getImageUrl(annex)}
                      alt={annex.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    />

                    {/* ── Gender badge ── */}
                    {annex.preferredGender && (
                      <span
                        className="badge-gender"
                        style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}
                      >
                        {annex.preferredGender}
                      </span>
                    )}

                    {/* ── Available badge ── */}
                    <span
                      className="badge-available"
                      style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
                    >
                      <span className="badge-dot" />
                      Available
                    </span>

                    {/* Price overlay */}
                    <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 2 }}>
                      <span style={{ background: 'rgba(5,12,26,0.75)', border: '1px solid rgba(45,126,247,0.3)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '0.28rem 0.65rem', fontSize: '0.8rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: '#7ab8fc' }}>
                        Rs. {Number(annex.price || 0).toLocaleString()} /mo
                      </span>
                    </div>
                  </div>

                  {/* ── Body ── */}
                  <div style={{ padding: '1rem 1.1rem 1.1rem' }}>

                    {/* Title — Syne font */}
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: "'Syne', sans-serif", color: '#e8eeff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 0.5rem' }}>
                      {annex.title}
                    </h2>

                    {/* ── Location — green glowy pill ── */}
                    <div className="location-row">
                      <svg
                        className="location-icon"
                        width="12" height="12"
                        viewBox="0 0 24 24" fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                        <circle cx="12" cy="9" r="2.5" fill="#050c1a"/>
                      </svg>
                      <span className="location-text" title={annex.selectedAddress || 'Near SLIIT Malabe Campus'}>
                        {annex.selectedAddress || 'Near SLIIT Malabe Campus'}
                      </span>
                    </div>

                    {/* Description — DM Sans */}
                    <p style={{ fontSize: '0.76rem', fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.42)', lineHeight: 1.65, margin: '0 0 0.85rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {desc}
                    </p>

                    {/* ── Coloured chips ── */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.9rem' }}>
                      {amenities.map((a, idx) => (
                        <span key={idx} className={`amenity-chip ${CHIP_COLOURS[idx % CHIP_COLOURS.length]}`}>
                          {a}
                        </span>
                      ))}
                    </div>

                    <hr style={{ border: 'none', height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 0 0.9rem' }} />

                    {/* CTA buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleViewDetails(annex)}
                        className="btn-glass-outline"
                        style={{ flex: 1, padding: '0.52rem', borderRadius: 10, fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBookNow(annex)}
                        className="btn-glow"
                        style={{ flex: 1, padding: '0.52rem', borderRadius: 10, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', color: '#fff', border: 'none' }}
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
        </div>

        {/* ── Footer note ── */}
        {!loading && !error && annexes.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: '0.74rem', fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.2)', marginTop: '3rem' }}>
            All listings are verified and updated regularly. Prices may vary based on availability and lease duration.
          </p>
        )}
      </div>
    </div>
  );
}

export default AnnexBookingPage;