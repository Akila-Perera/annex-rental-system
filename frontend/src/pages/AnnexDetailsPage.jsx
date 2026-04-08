import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

// ─── Placeholder images (replace with your actual asset paths) ───────────────
const PLACEHOLDER = 'https://placehold.co/800x500/0a1429/1e3a6e?text=No+Photo';

export default function AnnexDetailsPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [annex, setAnnex] = useState(state?.annex || null);
  const [loading, setLoading] = useState(!state?.annex);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [roomType, setRoomType] = useState('Single Room');
  const [leasePeriod, setLeasePeriod] = useState('Full Semester (5 Months)');

  useEffect(() => {
    setError('');
    if (!state?.annex) {
      setLoading(true);
    }

    axios
      .get(`${API_BASE}/api/annexes/${id}`)
      .then((res) => setAnnex(res.data.data))
      .catch(() => {
        if (!state?.annex) setError('Failed to load annex details.');
      })
      .finally(() => {
        if (!state?.annex) setLoading(false);
      });
  }, [id, state?.annex]);

  const imageUrls = useMemo(() => {
    if (!annex) return [];
    if (Array.isArray(annex.imageUrls) && annex.imageUrls.length > 0)
      return annex.imageUrls.map((u) => `${API_BASE}${u}`);
    if (annex.imageUrl) return [`${API_BASE}${annex.imageUrl}`];
    return [];
  }, [annex]);

  const displayImages = imageUrls.length > 0 ? imageUrls : [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER, PLACEHOLDER, PLACEHOLDER];
  const coordinates = annex?.location?.coordinates;
  const lat = typeof coordinates?.[1] === 'number' ? coordinates[1].toFixed(5) : null;
  const lng = typeof coordinates?.[0] === 'number' ? coordinates[0].toFixed(5) : null;
  const listingType = annex?.location?.type || 'Annex';
  const tags = Array.isArray(annex?.tags) ? annex.tags : [];
  const ownerDisplayName = useMemo(() => {
    if (!annex?.ownerId) return 'Annex Owner';

    if (typeof annex.ownerId === 'object') {
      const firstName = annex.ownerId.firstName || '';
      const lastName = annex.ownerId.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;
      if (annex.ownerId.name) return annex.ownerId.name;
      if (annex.ownerId._id) return `Owner ${String(annex.ownerId._id).slice(-6)}`;
      return 'Annex Owner';
    }

    if (typeof annex.ownerId === 'string' && annex.ownerId.trim()) {
      return `Owner ${annex.ownerId.slice(-6)}`;
    }

    return 'Annex Owner';
  }, [annex]);
  const ownerInitial = ownerDisplayName.charAt(0).toUpperCase() || 'A';

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060f1e] text-gray-400 text-lg tracking-wide">
        Loading annex details…
      </div>
    );

  if (error || !annex)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#060f1e] text-gray-300">
        <p>{error || 'Annex not found.'}</p>
        <button
          onClick={() => navigate('/searchAnnex')}
          className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition"
        >
          ← Back to Search
        </button>
      </div>
    );

  const amenityIcons = {
    'High-speed Wi-Fi': '📶',
    'Full Air Conditioning': '❄️',
    'Laundry Room': '🧺',
    'Fitness Center': '🏋️',
    'Shared Kitchen': '🍳',
    'Bicycle Parking': '🚲',
    'CCTV Security': '📷',
    'Study Room': '📚',
  };

  return (
    <div className="min-h-screen bg-[#060f1e] text-gray-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />


      {/* ── Breadcrumb ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-1 text-xs text-gray-500 flex items-center gap-1.5">
        <a href="#" className="hover:text-gray-300 transition">Home</a>
        <span>›</span>
        <Link to="/searchAnnex" className="hover:text-gray-300 transition">Annexes</Link>
        <span>›</span>
        <span className="text-gray-300">{annex.title}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">

        {/* ── Photo Gallery ── */}
        <div className="relative rounded-2xl overflow-hidden grid grid-cols-4 grid-rows-2 gap-2 h-[420px]">
          {/* Main big image */}
          <div className="col-span-2 row-span-2 relative group cursor-pointer" onClick={() => setActiveImg(0)}>
            <img src={displayImages[0]} alt={annex.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="relative group cursor-pointer overflow-hidden"
              onClick={() => setActiveImg(i)}
            >
              <img
                src={displayImages[i] || PLACEHOLDER}
                alt={`${annex.title} ${i}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {i === 4 && imageUrls.length > 5 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-1.5">
                  <span className="text-sm font-semibold">🖼 View all {imageUrls.length} photos</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Badge Row ── */}
        <div className="flex flex-wrap items-center gap-3 mt-5 mb-1">
          <span className="bg-blue-600/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30 uppercase tracking-wider">
            {listingType}
          </span>
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="bg-indigo-600/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-wider">
              {tag}
            </span>
          ))}
          <div className="flex items-center gap-1 text-yellow-400 text-sm font-semibold">
            ★ 4.8
            <span className="text-gray-400 font-normal">(124 reviews)</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="w-9 h-9 rounded-full border border-[#1f2f4f] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#3a5a9f] transition text-sm">↗</button>
            <button className="w-9 h-9 rounded-full border border-[#1f2f4f] flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/40 transition text-sm">♡</button>
          </div>
        </div>

        {/* ── Title + Address ── */}
        <h1 style={{ fontFamily: "'Syne', sans-serif" }} className="text-3xl md:text-4xl font-bold text-white leading-tight">
          {annex.title}
        </h1>
        <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
          <span>📍</span> {annex.selectedAddress || 'Address not provided'}
        </p>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '🎓', label: 'LISTING TYPE', value: listingType },
                { icon: '🚻', label: 'OCCUPANCY', value: annex.preferredGender || 'Any Gender' },
                { icon: '🔒', label: 'FEATURES', value: `${annex.features?.length || 0} available` },
                { icon: '🧹', label: 'RULES', value: `${annex.rulesAndConditions?.length || 0} listed` },
              ].map((s) => (
                <div key={s.label} className="bg-[#0b1628] border border-[#172240] rounded-xl p-4">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">{s.label}</p>
                  <p className="text-sm font-semibold text-gray-100 mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>

            {/* About */}
            <Section title="About this Annex">
              <p className="text-gray-300 leading-7 text-sm">
                {annex.description || 'No description provided.'}
              </p>
            </Section>

            {/* Amenities */}
            <Section title="Popular Amenities">
              {annex.features?.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {annex.features.slice(0, 6).map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-gray-200">
                        <span>{amenityIcons[f] || '✓'}</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  {annex.features.length > 6 && (
                    <button className="mt-3 text-sm font-semibold text-blue-400 underline underline-offset-2 hover:text-blue-300 transition">
                      Show all {annex.features.length} amenities
                    </button>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-sm">No features added.</p>
              )}
            </Section>

            {/* Rules */}
            <Section title="Hostel Rules & Conditions">
              {annex.rulesAndConditions?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {annex.rulesAndConditions.map((rule) => {
                    const [title, ...rest] = rule.split(':');
                    return (
                      <div key={rule} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0f1e38] border border-[#1f3058] flex items-center justify-center text-sm shrink-0">⏰</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-200">{title}</p>
                          {rest.length > 0 && <p className="text-xs text-gray-500 mt-0.5">{rest.join(':').trim()}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No rules added.</p>
              )}
            </Section>

            -000{/* Reviews */}
            <Section title="Student Reviews">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="text-center shrink-0">
                  <p className="text-6xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>4.8</p>
                  <div className="flex justify-center gap-0.5 text-yellow-400 text-lg mt-1">★★★★★</div>
                  <p className="text-xs text-gray-500 mt-1">Based on 124 reviews</p>
                </div>
                <div className="flex-1 space-y-2 w-full">
                  {[['5 Star', 85], ['4 Star', 12], ['3 Star', 2], ['2 Star', 1]].map(([label, pct]) => (
                    <div key={label} className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="w-12 shrink-0">{label}</span>
                      <div className="flex-1 bg-[#0f1e38] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right">{pct}%</span>
                    </div>
                  ))}
                </div>
                <button className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition shrink-0">Write a review</button>
              </div>

              {/* Sample reviews */}
              <div className="mt-5 space-y-5 divide-y divide-[#111e35]">
                {[
                  { name: 'Sarah Jenkins', role: 'Engineering Student', time: '6 months ago', rating: 5, text: 'The study rooms are incredibly quiet and well-maintained. The proximity to the engineering block is a lifesaver for early morning classes.' },
                  { name: 'David Chen', role: 'Business Student', time: '1 year ago', rating: 4, text: 'Overall great experience. The management is very responsive to maintenance requests. The only downside is the curfew on weekdays.' },
                ].map((r) => (
                  <div key={r.name} className="pt-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-sm font-bold">
                          {r.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-100">{r.name}</p>
                          <p className="text-xs text-gray-500">{r.role} · {r.time}</p>
                        </div>
                      </div>
                      <div className="text-yellow-400 text-sm">{'★'.repeat(r.rating)}</div>
                    </div>
                    <p className="text-sm text-gray-400 italic leading-6">"{r.text}"</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* ── RIGHT COLUMN: Sticky Booking Card ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="bg-[#0b1628] border border-[#1a2e50] rounded-2xl p-5 shadow-2xl">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Starting from</p>
                    <p className="text-4xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                      Rs. {annex.price}
                    </p>
                    <p className="text-xs text-gray-500">/month</p>
                  </div>
                  <span className="bg-red-500/20 text-red-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-500/30">
                    {tags[0] || 'Available now'}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1">Lease Period</label>
                    <select
                      value={leasePeriod}
                      onChange={(e) => setLeasePeriod(e.target.value)}
                      className="w-full bg-[#0f1e38] border border-[#1f3058] text-gray-200 text-sm rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-blue-500 transition"
                    >
                      <option>Full Semester (5 Months)</option>
                      <option>Monthly</option>
                      <option>Annual</option>
                    </select>
                  </div>
                </div>

                <button
                  className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm mb-2"
                  onClick={() =>
                    navigate('/booking', {
                      state: {
                        room: {
                          annexId: annex._id,
                          title: annex.title,
                          imageUrl: displayImages[0],
                          location: annex.selectedAddress || 'Near SLIIT Malabe Campus',
                        },
                      },
                    })
                  }
                >
                  Book Now
                </button>
                <button className="w-full bg-transparent border border-[#1f3058] hover:border-blue-500 text-gray-300 hover:text-white font-semibold py-3 rounded-xl transition text-sm">
                  Send Inquiry
                </button>
                <p className="text-xs text-gray-600 text-center mt-2">No credit card required to request inquiry</p>

                <div className="mt-4 pt-4 border-t border-[#111e35] space-y-1.5">
                  {[
                    `Preferred Gender: ${annex.preferredGender || 'Any'}`,
                    `Photos uploaded: ${imageUrls.length}`,
                    `Rules listed: ${annex.rulesAndConditions?.length || 0}`
                  ].map((p) => (
                    <p key={p} className="text-xs text-gray-400 flex items-center gap-2">
                      <span className="text-green-400">✓</span> {p}
                    </p>
                  ))}
                </div>
              </div>

              {/* Map Card */}
              <div className="bg-[#0b1628] border border-[#1a2e50] rounded-2xl overflow-hidden">
                <div className="h-36 bg-[#0a1429] relative flex items-center justify-center">
                  {/* Fake map grid */}
                  <svg viewBox="0 0 300 150" className="w-full h-full opacity-40">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <line key={`h${i}`} x1="0" y1={i * 30} x2="300" y2={i * 30} stroke="#1e3a6e" strokeWidth="1" />
                    ))}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <line key={`v${i}`} x1={i * 34} y1="0" x2={i * 34} y2="150" stroke="#1e3a6e" strokeWidth="1" />
                    ))}
                  </svg>
                  <div className="absolute w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-xl shadow-lg shadow-blue-900/50">
                    🏠
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-100">Perfect Location</p>
                  <p className="text-xs text-gray-500 mt-0.5">{annex.selectedAddress || 'Address not provided'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lat && lng ? `Lat ${lat}, Lng ${lng}` : 'Coordinates not available'}
                  </p>
                </div>
              </div>

              {/* Host Card */}
              <div className="bg-[#0b1628] border border-[#1a2e50] rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-lg font-bold shrink-0">{ownerInitial}</div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Managed by</p>
                  <p className="text-sm font-semibold text-gray-100">{ownerDisplayName}</p>
                  <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Super Host
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

     
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-[#0b1628] border border-[#172240] rounded-2xl p-5">
      <h2 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</h2>
      {children}
    </div>
  );
}