import { useState, useEffect } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';
const sliitLocation = { lat: 6.9147, lng: 79.9723 };

function SearchAnnex() {
  const navigate = useNavigate();

  // Filter state
  const [maxDistance, setMaxDistance] = useState(5000);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [gender, setGender] = useState('');

  // Data state
  const [annexes, setAnnexes] = useState([]);
  const [selectedAnnex, setSelectedAnnex] = useState(null);
  const [commuteInfo, setCommuteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  const fetchAnnexes = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/annexes/search?lat=${sliitLocation.lat}&lng=${sliitLocation.lng}&maxDistance=${maxDistance}`;
      if (minPrice) url += `&minPrice=${minPrice}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;
      if (gender) url += `&gender=${gender}`;
      const res = await axios.get(url);
      setAnnexes(res.data.data);
    } catch (err) {
      console.error('Error fetching annexes:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCommute = async (annexId) => {
    setCommuteInfo(null);
    try {
      const res = await axios.get(`${API_BASE}/api/annexes/${annexId}/distance`);
      setCommuteInfo(res.data.commute);
    } catch (err) {
      console.error('Error fetching commute:', err);
    }
  };

  useEffect(() => { fetchAnnexes(); }, []);

  const goToDetails = (annex) => navigate(`/annex/${annex._id}`, { state: { annex } });

  const genderBadge = (g) => {
    if (!g) return { label: 'Any', bg: 'bg-[#0f1e38]', text: 'text-gray-400', border: 'border-[#1f3058]' };
    if (g === 'Male') return { label: 'Male', bg: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-700/40' };
    return { label: 'Female', bg: 'bg-pink-900/30', text: 'text-pink-300', border: 'border-pink-700/40' };
  };

  return (
    <div className="flex h-screen bg-[#060f1e] overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* ── LEFT SIDEBAR ── */}
      <div className="w-[380px] shrink-0 flex flex-col bg-[#060f1e] border-r border-[#111e35] z-10">

       

        {/* Filters */}
        <div className="px-5 py-5 border-b border-[#111e35] shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 style={{ fontFamily: "'Syne', sans-serif" }} className="text-xl font-bold text-white">Find an Annex</h2>
            <span className="text-xs text-gray-500 bg-[#0b1628] border border-[#172240] px-2.5 py-1 rounded-full">
              Near SLIIT
            </span>
          </div>

          {/* Distance Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Max Distance</label>
              <span className="text-sm font-bold text-blue-400">{(maxDistance / 1000).toFixed(0)} km</span>
            </div>
            <input
              type="range" min="1000" max="15000" step="1000"
              value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#3b82f6', background: `linear-gradient(to right, #3b82f6 ${((maxDistance - 1000) / 14000) * 100}%, #172240 0%)` }}
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>1 km</span><span>15 km</span>
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold block mb-1.5">Min Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rs.</span>
                <input
                  type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 bg-[#0b1628] border border-[#172240] rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold block mb-1.5">Max Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rs.</span>
                <input
                  type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="50000"
                  className="w-full pl-8 pr-3 py-2 bg-[#0b1628] border border-[#172240] rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold block mb-1.5">Preferred Gender</label>
            <div className="flex gap-2">
              {[['', 'Any'], ['Male', 'Male'], ['Female', 'Female']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setGender(val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                    gender === val
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-[#0b1628] border-[#172240] text-gray-400 hover:border-blue-500 hover:text-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Apply */}
          <button
            onClick={fetchAnnexes}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching…
              </>
            ) : (
              'Apply Filters'
            )}
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-[#060f1e] z-10 border-b border-[#0e1a2e]">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
              {annexes.length} {annexes.length === 1 ? 'Annex' : 'Annexes'} Found
            </p>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition flex items-center gap-1">
              Sort ↕
            </button>
          </div>

          <div className="px-4 py-3 space-y-2">
            {annexes.map((annex) => {
              const badge = genderBadge(annex.preferredGender);
              const isActive = activeCard === annex._id;
              return (
                <div
                  key={annex._id}
                  className={`relative rounded-xl border p-4 cursor-pointer transition-all group ${
                    isActive
                      ? 'bg-[#0f1e38] border-blue-600 shadow-lg shadow-blue-900/20'
                      : 'bg-[#0b1628] border-[#172240] hover:border-[#2a4070] hover:bg-[#0d1930]'
                  }`}
                  onClick={() => {
                    setActiveCard(annex._id);
                    goToDetails(annex);
                  }}
                  onMouseEnter={() => {
                    setSelectedAnnex(annex);
                    getCommute(annex._id);
                  }}
                >
                  {/* Left accent bar */}
                  <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full transition-all ${isActive ? 'bg-blue-500' : 'bg-transparent group-hover:bg-blue-700'}`} />

                  {/* Image + info */}
                  <div className="flex gap-3">
                    {annex.imageUrl ? (
                      <img
                        src={`${API_BASE}${annex.imageUrl}`}
                        alt={annex.title}
                        className="w-16 h-16 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[#0f1e38] shrink-0 flex items-center justify-center text-gray-600 text-xs">
                        No img
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-100 truncate leading-snug">{annex.title}</p>
                      <p className="text-blue-400 font-bold text-base mt-0.5">
                        Rs. {annex.price?.toLocaleString()}
                        <span className="text-gray-500 text-xs font-normal"> /mo</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                        {annex.distance && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 border border-green-700/40">
                            {(annex.distance / 1000).toFixed(1)} km
                          </span>
                        )}
                        {annex.features?.length > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0f1e38] text-gray-400 border border-[#1f3058]">
                            {annex.features.length} amenities
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && annexes.length === 0 && (
              <div className="text-center py-16 text-gray-600">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm font-semibold text-gray-500">No annexes found</p>
                <p className="text-xs mt-1 text-gray-600">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAP SIDE ── */}
      <div className="flex-1 relative">
        <Map
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          initialViewState={{ longitude: sliitLocation.lng, latitude: sliitLocation.lat, zoom: 13 }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{ width: '100%', height: '100%' }}
        >
          {/* SLIIT Campus Marker */}
          <Marker longitude={sliitLocation.lng} latitude={sliitLocation.lat}>
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
                🎓
              </div>
              <div className="absolute -bottom-5 text-[10px] text-white font-semibold whitespace-nowrap bg-black/60 px-1.5 py-0.5 rounded">
                SLIIT
              </div>
            </div>
          </Marker>

          {/* Annex Markers */}
          {annexes.map((annex) => (
            <Marker
              key={annex._id}
              longitude={annex.location.coordinates[0]}
              latitude={annex.location.coordinates[1]}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedAnnex(annex);
                getCommute(annex._id);
                setActiveCard(annex._id);
              }}
            >
              <div
                className={`relative group cursor-pointer transition-transform hover:scale-110 ${
                  activeCard === annex._id ? 'scale-110 z-20' : ''
                }`}
              >
                <div
                  className={`px-2.5 py-1 rounded-full border shadow-lg text-xs font-bold whitespace-nowrap transition-all ${
                    activeCard === annex._id
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-[#0b1628] border-[#1f3058] text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-400'
                  }`}
                >
                  Rs. {annex.price?.toLocaleString()}
                </div>
                <div className={`absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-2 h-2 rotate-45 border-r border-b ${
                  activeCard === annex._id ? 'bg-blue-600 border-blue-400' : 'bg-[#0b1628] border-[#1f3058]'
                }`} />
              </div>
            </Marker>
          ))}

          {/* Popup */}
          {selectedAnnex && (
            <Popup
              longitude={selectedAnnex.location.coordinates[0]}
              latitude={selectedAnnex.location.coordinates[1]}
              anchor="bottom"
              offset={20}
              onClose={() => { setSelectedAnnex(null); setCommuteInfo(null); setActiveCard(null); }}
              className="hostel-popup"
            >
              <style>{`
                .hostel-popup .mapboxgl-popup-content {
                  background: #0b1628;
                  border: 1px solid #1a2e50;
                  border-radius: 14px;
                  padding: 0;
                  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
                  font-family: 'DM Sans', sans-serif;
                  overflow: hidden;
                  width: 230px;
                }
                .hostel-popup .mapboxgl-popup-tip {
                  border-top-color: #1a2e50;
                }
                .hostel-popup .mapboxgl-popup-close-button {
                  color: #4a6ba3;
                  font-size: 18px;
                  padding: 6px 10px;
                  top: 2px;
                  right: 2px;
                  line-height: 1;
                }
                .hostel-popup .mapboxgl-popup-close-button:hover {
                  color: #fff;
                  background: transparent;
                }
              `}</style>

              {/* Popup image */}
              {selectedAnnex.imageUrl ? (
                <img
                  src={`${API_BASE}${selectedAnnex.imageUrl}`}
                  alt={selectedAnnex.title}
                  className="w-full h-28 object-cover"
                />
              ) : (
                <div className="w-full h-20 bg-[#0f1e38] flex items-center justify-center text-gray-600 text-xs">
                  No photo
                </div>
              )}

              <div className="p-3.5">
                <p className="text-sm font-bold text-gray-100 leading-snug">{selectedAnnex.title}</p>
                <p className="text-blue-400 font-bold text-lg mt-0.5">
                  Rs. {selectedAnnex.price?.toLocaleString()}
                  <span className="text-gray-500 text-xs font-normal"> /mo</span>
                </p>

                {selectedAnnex.selectedAddress && (
                  <p className="text-xs text-gray-500 mt-1 truncate">📍 {selectedAnnex.selectedAddress}</p>
                )}

                {/* Commute Info */}
                <div className="mt-3 bg-[#0f1e38] border border-[#1f3058] rounded-lg px-3 py-2">
                  {commuteInfo ? (
                    <>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Commute to SLIIT</p>
                      <div className="flex items-center gap-3">
                        <span className="text-green-400 font-bold text-sm">{commuteInfo.distance_km} km</span>
                        <span className="text-gray-500 text-xs">•</span>
                        <span className="text-gray-300 text-xs">{commuteInfo.duration_mins} mins by car</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-3 h-3 border border-gray-600 border-t-blue-500 rounded-full animate-spin shrink-0" />
                      Calculating commute…
                    </div>
                  )}
                </div>

                <button
                  onClick={() => goToDetails(selectedAnnex)}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-lg transition"
                >
                  View Details →
                </button>
              </div>
            </Popup>
          )}
        </Map>

        {/* Map Legend */}
        <div className="absolute bottom-6 left-4 bg-[#0b1628]/90 backdrop-blur border border-[#1a2e50] rounded-xl px-4 py-3 flex items-center gap-5 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>SLIIT Campus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Annex Listing</span>
          </div>
          <div className="text-gray-600">|</div>
          <span>{annexes.length} listings shown</span>
        </div>
      </div>
    </div>
  );
}

export default SearchAnnex;