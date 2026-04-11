import { useState, useEffect, useRef } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';
const sliitLocation = { lat: 6.9147, lng: 79.9723 };

function getPriceTier(p) {
  if (!p) return null;
  if (p < 15000) return { label: 'Budget',  color: 'text-[#4ade80]', bg: 'bg-green-500/10',  border: 'border-green-500/20' };
  if (p < 30000) return { label: 'Mid',     color: 'text-[#fbbf24]', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
  return               { label: 'Premium', color: 'text-[#f87171]', bg: 'bg-red-500/10',    border: 'border-red-500/20' };
}

const inputCls = 'w-full rounded-xl border border-[#232E45] bg-[#060F1E] px-3 py-2 text-sm text-gray-100 placeholder-gray-600 transition-colors focus:border-[#3b4f86] focus:outline-none focus:ring-1 focus:ring-[#3b4f86] hover:border-[#2e3c5e]';

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500">{label}</label>
      {children}
    </div>
  );
}

/* ════ Main ════ */
function SearchAnnex() {
  const navigate   = useNavigate();
  const wrapperRef = useRef(null);

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

  const calcKm = (sLat, sLng, eLat, eLng) => {
    const toRad = v => (v * Math.PI) / 180, R = 6371;
    const dLat = toRad(eLat - sLat), dLng = toRad(eLng - sLng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(sLat)) * Math.cos(toRad(eLat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const getCommute = annex => {
    if (!annex?.location?.coordinates || annex.location.coordinates.length < 2) { setCommuteInfo(null); return; }
    const [lng, lat] = annex.location.coordinates;
    const d = calcKm(sliitLocation.lat, sliitLocation.lng, lat, lng);
    setCommuteInfo({ distance_km: d.toFixed(2), duration_mins: Math.max(1, Math.round((d / 25) * 60)), mode: 'estimated' });
  };

  useEffect(() => { fetchAnnexes(); }, []);

  const goToDetails = annex => navigate(`/annex/${annex._id}`, { state: { annex } });

  const genderBadge = g => {
    if (!g)             return { label: 'Any',    cls: 'bg-[#232E45] text-gray-400 border-[#2e3c5e]' };
    if (g === 'Male')   return { label: 'Male',   cls: 'bg-blue-900/30 text-blue-300 border-blue-700/40' };
    return                     { label: 'Female', cls: 'bg-pink-900/30 text-pink-300 border-pink-700/40' };
  };

  const sortedAnnexes = [...annexes].sort((a, b) =>
    sortBy === 'price' ? (a.price || 0) - (b.price || 0) : (a.distance || 0) - (b.distance || 0)
  );
  const avgPrice = annexes.length ? Math.round(annexes.reduce((s, a) => s + (a.price || 0), 0) / annexes.length) : 0;

  return (
    <div
      ref={wrapperRef}
      style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden', background: '#060F1E', fontFamily: "'DM Sans', sans-serif" }}
      className="text-gray-100"
    >
      {/* ── Google Fonts (same as Home.jsx) ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .sa-font-display { font-family: 'Syne', sans-serif; }
        .annexrent-popup .mapboxgl-popup-content { font-family: 'DM Sans', sans-serif; background:#0B1628; border:1px solid #232E45; border-radius:16px; padding:0; box-shadow:0 20px 60px rgba(0,0,0,0.7); overflow:hidden; width:230px; }
        .annexrent-popup .mapboxgl-popup-tip     { border-top-color:#232E45; }
        .annexrent-popup .mapboxgl-popup-close-button { color:#4b6d9e; font-size:18px; padding:6px 10px; top:2px; right:2px; }
        .annexrent-popup .mapboxgl-popup-close-button:hover { color:#fff; background:transparent; }
      `}</style>

      {/* ══ SPLIT VIEW (100vh) ══ */}
      <div style={{ height: '100vh', display: 'flex', flexShrink: 0, overflow: 'hidden' }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #111e35', background: '#060F1E', zIndex: 10 }}>

          {/* Header */}
          <div style={{ flexShrink: 0, borderBottom: '1px solid #111e35', padding: '1rem' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6b84c9]">UNI NEST · Live</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-[#6b84c9] mb-0.5">AnnexRent</p>
                <h1 className="sa-font-display text-lg font-bold text-white leading-tight">UNI NEST</h1>
                <p className="text-[11px] text-gray-500 mt-0.5">Student housing near SLIIT</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-green-500/20 bg-green-500/10 px-2.5 py-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#4ade80]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-[9px] font-semibold text-[#4ade80] uppercase tracking-wider">Verified</span>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          {annexes.length > 0 && (
            <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid #0e1a2e' }}>
              {[
                { val: annexes.length, label: 'Found' },
                { val: `Rs.${(avgPrice / 1000).toFixed(0)}k`, label: 'Avg/mo' },
                { val: `${(maxDistance / 1000).toFixed(0)}km`, label: 'Radius' },
                { val: annexes.filter(a => a.distance && a.distance / 1000 < 2).length, label: '≤2km' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, borderRight: i < 3 ? '1px solid #0e1a2e' : 'none', padding: '0.4rem', textAlign: 'center' }}>
                  <div className="sa-font-display text-sm font-bold text-[#6b84c9]">{s.val}</div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-600 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div style={{ flexShrink: 0, borderBottom: '1px solid #0e1a2e', padding: '0.85rem 1rem' }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="sa-font-display text-sm font-semibold text-white">Find an Annex</h2>
              <span className="rounded-full border border-[#232E45] bg-[#0B1628] px-2 py-0.5 text-[9px] text-gray-500">📍 Near SLIIT</span>
            </div>

            <Field label="Max Distance">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-500">Radius</span>
                <span className="sa-font-display text-xs font-bold text-[#6b84c9]">{(maxDistance / 1000).toFixed(0)} km</span>
              </div>
              <input type="range" min="1000" max="15000" step="1000" value={maxDistance}
                onChange={e => setMaxDistance(Number(e.target.value))}
                className="w-full h-1 rounded-full cursor-pointer"
                style={{ accentColor: '#3b4f86', background: `linear-gradient(to right,#3b4f86 ${((maxDistance - 1000) / 14000) * 100}%,#232E45 0%)` }}
              />
              <div className="flex justify-between text-[9px] text-gray-600 mt-1"><span>1 km</span><span>15 km</span></div>
            </Field>

            <div className="grid grid-cols-2 gap-2">
              {[['Min Price', minPrice, setMinPrice, '0'], ['Max Price', maxPrice, setMaxPrice, '50000']].map(([lbl, val, setter, ph]) => (
                <Field key={lbl} label={lbl}>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 pointer-events-none">Rs.</span>
                    <input type="number" value={val} onChange={e => setter(e.target.value)} placeholder={ph}
                      className={`${inputCls} pl-8 text-xs py-1.5`} />
                  </div>
                </Field>
              ))}
            </div>

            <Field label="Preferred Gender">
              <div className="flex gap-2">
                {[['', 'Any'], ['Male', 'Male'], ['Female', 'Female']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setGender(val)}
                    className={`flex-1 rounded-xl border py-1.5 text-xs font-semibold transition-colors
                      ${gender === val
                        ? 'border-[#3b4f86] bg-[#3b4f86] text-white'
                        : 'border-[#232E45] bg-transparent text-gray-500 hover:border-[#3b4f86] hover:text-gray-300'}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </Field>

            <button onClick={fetchAnnexes} disabled={loading}
              className="sa-font-display inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3b4f86] py-2 text-sm font-semibold text-white hover:bg-[#4c62a3] disabled:opacity-50 transition-colors">
              {loading ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Searching…
                </>
              ) : '🔍  Apply Filters'}
            </button>

            <button onClick={() => { setMinPrice(''); setMaxPrice(''); setGender(''); setMaxDistance(5000); }}
              className="w-full rounded-xl border border-[#232E45] py-1.5 text-xs font-semibold text-gray-500 hover:border-[#3b4f86] hover:text-gray-300 transition-colors">
              ↺ Reset Filters
            </button>
          </div>

          {/* Card list */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, scrollbarWidth: 'thin', scrollbarColor: '#172240 transparent' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#060F1E', borderBottom: '1px solid #0e1a2e' }}
              className="flex items-center justify-between px-4 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                {annexes.length} {annexes.length === 1 ? 'Annex' : 'Annexes'} Found
              </p>
              <div className="relative">
                <button onClick={() => setShowSortMenu(v => !v)}
                  className="rounded-lg border border-[#232E45] bg-[#0B1628] px-2.5 py-1 text-[10px] font-semibold text-gray-500 hover:border-[#3b4f86] hover:text-gray-300 transition-colors">
                  Sort: {sortBy === 'distance' ? 'Distance ↑' : 'Price ↑'}
                </button>
                {showSortMenu && (
                  <div className="absolute right-0 top-full mt-1 z-50 overflow-hidden rounded-xl border border-[#232E45] bg-[#0B1628]" style={{ minWidth: 130 }}>
                    {[['distance', 'Nearest First'], ['price', 'Lowest Price']].map(([val, lbl]) => (
                      <button key={val} onClick={() => { setSortBy(val); setShowSortMenu(false); }}
                        className={`block w-full px-4 py-2.5 text-left text-[11px] font-semibold transition-colors hover:bg-[#232E45] ${sortBy === val ? 'text-[#6b84c9]' : 'text-gray-500'}`}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 flex flex-col gap-2">
              {sortedAnnexes.map((annex, idx) => {
                const badge    = genderBadge(annex.preferredGender);
                const isActive = activeCard === annex._id;
                const tier     = getPriceTier(annex.price);
                const isTop    = idx === 0 && annexes.length > 1;
                return (
                  <div key={annex._id}
                    onClick={() => { setActiveCard(annex._id); goToDetails(annex); }}
                    onMouseEnter={() => { setSelectedAnnex(annex); getCommute(annex); }}
                    className={`relative rounded-2xl border p-3 cursor-pointer transition-all duration-200
                      ${isActive
                        ? 'border-[#3b4f86] bg-[#0B1628] shadow-lg shadow-[#3b4f86]/10'
                        : 'border-[#232E45] bg-[#0B1628] hover:border-[#2e3c5e] hover:translate-x-0.5'}`}>

                    {isActive && <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-[#3b4f86]" />}

                    {isTop && (
                      <div className="absolute -top-px right-3 rounded-b-lg border border-t-0 border-[#3b4f86]/30 bg-[#3b4f86]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#6b84c9]">
                        ★ Top Pick
                      </div>
                    )}

                    <div className="flex gap-3" style={{ paddingTop: isTop ? '0.5rem' : 0 }}>
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-[#232E45]">
                        {annex.imageUrl
                          ? <img src={`${API_BASE}${annex.imageUrl}`} alt={annex.title}
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                          : <div className="flex h-full w-full items-center justify-center bg-[#232E45] text-[9px] text-gray-600">No img</div>}
                        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 py-px text-[8px] font-bold text-gray-400">#{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="sa-font-display truncate text-xs font-semibold text-white mb-1">{annex.title}</p>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="sa-font-display text-sm font-bold text-[#6b84c9]">
                            Rs. {annex.price?.toLocaleString()}
                            <span className="text-[10px] font-normal text-gray-600">/mo</span>
                          </span>
                          {tier && (
                            <span className={`rounded border px-1.5 py-px text-[9px] font-bold ${tier.bg} ${tier.color} ${tier.border}`}>
                              {tier.label}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className={`rounded-full border px-2 py-px text-[9px] font-semibold ${badge.cls}`}>{badge.label}</span>
                          {annex.distance && (
                            <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-px text-[9px] font-semibold text-[#4ade80]">
                              {(annex.distance / 1000).toFixed(1)} km
                            </span>
                          )}
                          {annex.features?.length > 0 && (
                            <span className="rounded-full border border-[#232E45] bg-[#060F1E] px-2 py-px text-[9px] font-semibold text-gray-500">
                              {annex.features.length} amenities
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isActive && commuteInfo && (
                      <div className="mt-2.5 flex items-center gap-2 border-t border-[#232E45] pt-2.5">
                        <span className="sa-font-display inline-flex items-center gap-1.5 rounded-lg border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[10px] font-bold text-[#4ade80]">
                          🚗 {commuteInfo.distance_km} km · {commuteInfo.duration_mins} min
                        </span>
                        <span className="ml-auto text-[9px] text-gray-600">to SLIIT</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {!loading && annexes.length === 0 && (
                <div className="py-12 text-center">
                  <div className="text-3xl mb-3">🔍</div>
                  <p className="sa-font-display text-sm font-semibold text-gray-500">No annexes found</p>
                  <p className="text-xs text-gray-600 mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MAP ── */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Map
            mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
            initialViewState={{ longitude: sliitLocation.lng, latitude: sliitLocation.lat, zoom: 13 }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            style={{ width: '100%', height: '100%' }}
          >
            <Marker longitude={sliitLocation.lng} latitude={sliitLocation.lat}>
              <div className="relative flex items-center justify-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-red-600 text-base shadow-lg shadow-red-500/40">🎓</div>
                <div className="absolute whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ bottom: -20 }}>SLIIT</div>
              </div>
            </Marker>

            {annexes.map(annex => (
              <Marker key={annex._id}
                longitude={annex.location.coordinates[0]}
                latitude={annex.location.coordinates[1]}
                onClick={e => { e.originalEvent.stopPropagation(); setSelectedAnnex(annex); getCommute(annex); setActiveCard(annex._id); }}>
                <div className={`cursor-pointer transition-transform duration-200 ${activeCard === annex._id ? 'scale-110' : 'scale-100'}`}>
                  <div className={`sa-font-display rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap border transition-all duration-200
                    ${activeCard === annex._id
                      ? 'bg-[#3b4f86] border-[#6b84c9] text-white shadow-lg shadow-[#3b4f86]/50'
                      : 'bg-[#0B1628] border-[#232E45] text-[#6b84c9]'}`}>
                    {annex.title}
                  </div>
                  <div
                    className={`mx-auto rotate-45 border-r border-b ${activeCard === annex._id ? 'bg-[#3b4f86] border-[#6b84c9]' : 'bg-[#0B1628] border-[#232E45]'}`}
                    style={{ width: 8, height: 8, marginTop: -1 }}
                  />
                </div>
              </Marker>
            ))}

            {selectedAnnex && (
              <Popup
                longitude={selectedAnnex.location.coordinates[0]}
                latitude={selectedAnnex.location.coordinates[1]}
                anchor="bottom" offset={20}
                onClose={() => { setSelectedAnnex(null); setCommuteInfo(null); setActiveCard(null); }}
                className="annexrent-popup">
                {selectedAnnex.imageUrl
                  ? <div className="relative">
                      <img src={`${API_BASE}${selectedAnnex.imageUrl}`} alt={selectedAnnex.title}
                        style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                      <div className="sa-font-display absolute bottom-2 left-2 rounded-lg border border-[#3b4f86]/40 bg-[#060F1E]/90 px-2 py-0.5 text-[11px] font-bold text-[#6b84c9]">
                        Rs. {selectedAnnex.price?.toLocaleString()}/mo
                      </div>
                    </div>
                  : <div className="flex items-center justify-center bg-[#232E45] text-[11px] text-gray-600" style={{ height: 80 }}>No photo</div>}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="sa-font-display text-sm font-semibold text-white leading-tight">{selectedAnnex.title}</p>
                    {selectedAnnex.selectedAddress && (
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">📍 {selectedAnnex.selectedAddress}</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-[#232E45] bg-[#060F1E] p-3">
                    {commuteInfo
                      ? <>
                          <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600 mb-1">Commute to SLIIT</p>
                          <div className="flex items-center gap-2">
                            <span className="sa-font-display text-sm font-bold text-[#4ade80]">{commuteInfo.distance_km} km</span>
                            <span className="text-gray-600">·</span>
                            <span className="text-xs text-gray-400">{commuteInfo.duration_mins} min by car</span>
                          </div>
                        </>
                      : <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Calculating commute…
                        </div>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => goToDetails(selectedAnnex)}
                      className="sa-font-display flex-1 inline-flex items-center justify-center rounded-xl bg-[#3b4f86] py-2 text-xs font-semibold text-white hover:bg-[#4c62a3] transition-colors">
                      View Details →
                    </button>
                    <button onClick={() => { setSelectedAnnex(null); setCommuteInfo(null); setActiveCard(null); }}
                      className="rounded-xl border border-[#232E45] bg-[#060F1E] px-3 py-2 text-xs text-gray-500 hover:border-[#3b4f86] hover:text-gray-300 transition-colors">
                      ✕
                    </button>
                  </div>
                </div>
              </Popup>
            )}
          </Map>

          {/* Map overlays */}
          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 flex items-center gap-3 rounded-full border border-[#232E45] bg-[#060F1E]/90 px-4 py-2 backdrop-blur-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[11px] font-semibold text-gray-500">Live Map · SLIIT Malabe</span>
            <span className="sa-font-display rounded-full border border-[#3b4f86]/30 bg-[#3b4f86]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#6b84c9]">{annexes.length} listings</span>
          </div>

          <div className="absolute bottom-6 left-4 flex items-center gap-4 rounded-2xl border border-[#232E45] bg-[#060F1E]/90 px-4 py-2.5 backdrop-blur-sm text-[10px] text-gray-600">
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-600" /><span>SLIIT Campus</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-[#3b4f86]" /><span>Annex Listing</span></div>
            <div className="text-gray-700">|</div>
            <span>{annexes.length} listings shown</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchAnnex;