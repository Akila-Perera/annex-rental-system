import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UNIVERSITIES } from '../constants/universities';
import { FaCar, FaWalking } from 'react-icons/fa';

const API_BASE = 'http://localhost:5000';

const AI_VIEW_STORAGE_KEY = 'annexRent_ai_lastAnnexView';
const AI_VIEW_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function haversineKm(sLat, sLng, eLat, eLng) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(eLat - sLat);
  const dLng = toRad(eLng - sLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(sLat)) * Math.cos(toRad(eLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isSliitUniversityContext(universityName) {
  return typeof universityName === 'string' && universityName.includes('SLIIT');
}

function priceTierKey(price) {
  const p = Number(price) || 0;
  if (p < 15000) return 'budget';
  if (p < 30000) return 'mid';
  return 'premium';
}

/** Pick up to 3 annexes with shorter commute & similar price tier when possible */
function pickAiRecommendations(annexes, lastView) {
  if (!lastView || !Array.isArray(annexes) || annexes.length === 0) return [];
  const viewedKm = Number(lastView.viewedCommuteKm);
  if (Number.isNaN(viewedKm) || viewedKm <= 0) return [];
  const uniLat = lastView.universityLat;
  const uniLng = lastView.universityLng;
  const tier = lastView.priceTier || priceTierKey(lastView.price);
  const excludeId = lastView.annexId;

  const candidates = annexes
    .filter((a) => a._id && a._id !== excludeId && a.location?.coordinates?.length >= 2)
    .map((a) => {
      const [lng, lat] = a.location.coordinates;
      const km = haversineKm(uniLat, uniLng, lat, lng);
      const sameTier = priceTierKey(a.price) === tier;
      return { annex: a, km, sameTier };
    })
    .filter((x) => x.km > 0 && x.km < viewedKm);

  candidates.sort((a, b) => {
    if (a.sameTier !== b.sameTier) return a.sameTier ? -1 : 1;
    return a.km - b.km;
  });

  return candidates.slice(0, 3).map((x) => ({
    annex: x.annex,
    commuteKm: x.km,
    commuteMins: Math.max(1, Math.round((x.km / 25) * 60)),
  }));
}

function annexThumbSrc(a) {
  if (!a?.imageUrl) return null;
  return a.imageUrl.startsWith('http') ? a.imageUrl : `${API_BASE}${a.imageUrl}`;
}

/** Tilequery POI → display kind (colors: grocery green, food orange, bus blue) */
const POI_COLORS = {
  grocery: '#22c55e',
  restaurant: '#f97316',
  cafe: '#fb923c',
  bus_stop: '#2563eb',
};

/** Student Essentials toggle — circular markers */
const ESSENTIAL_COLORS = {
  grocery: '#22c55e',
  bus_stop: '#2563eb',
  atm: '#eab308',
  pharmacy: '#c084fc',
};

function categorizeEssentialFeature(f) {
  const p = f.properties || {};
  const maki = String(p.maki || '').toLowerCase();
  const cls = String(p.class || '').toLowerCase();
  const typ = String(p.type || '').toLowerCase();
  const hay = `${maki} ${cls} ${typ}`;
  const layer = String(p.tilequery?.layer || '');

  if (layer === 'transit_label' || hay.includes('bus_stop') || maki === 'bus' || cls === 'bus_stop') {
    return 'bus_stop';
  }
  if (maki === 'grocery' || hay.includes('grocery') || typ.includes('supermarket') || cls.includes('supermarket')) {
    return 'grocery';
  }
  if (maki === 'atm' || cls.includes('atm') || hay.includes('atm') || typ.includes('atm')) {
    return 'atm';
  }
  if (maki === 'pharmacy' || hay.includes('pharmacy') || typ.includes('pharmacy') || cls.includes('pharmacy')) {
    return 'pharmacy';
  }
  return null;
}

function poiNameFromProps(p) {
  if (!p || typeof p !== 'object') return 'Place';
  if (p.name_en) return String(p.name_en);
  if (p.name) return String(p.name);
  const key = Object.keys(p).find((k) => k.startsWith('name_') && typeof p[k] === 'string' && p[k]);
  return key ? String(p[key]) : 'Place';
}

function categorizeTilequeryFeature(f) {
  const p = f.properties || {};
  const maki = String(p.maki || '').toLowerCase();
  const cls = String(p.class || '').toLowerCase();
  const typ = String(p.type || '').toLowerCase();
  const layer = String(p.tilequery?.layer || '');
  const hay = `${maki} ${cls} ${typ}`;

  if (layer === 'transit_label' || hay.includes('bus_stop') || maki === 'bus' || cls === 'bus_stop') {
    return 'bus_stop';
  }
  if (maki === 'grocery' || hay.includes('grocery') || typ.includes('supermarket') || cls.includes('supermarket')) {
    return 'grocery';
  }
  if (maki === 'cafe' || maki === 'coffee' || cls.includes('cafe') || typ.includes('cafe')) {
    return 'cafe';
  }
  if (
    maki === 'restaurant' ||
    maki === 'fast-food' ||
    cls.includes('restaurant') ||
    typ.includes('restaurant') ||
    cls === 'fast_food'
  ) {
    return 'restaurant';
  }
  return null;
}

function getPriceTier(p) {
  if (!p) return null;
  if (p < 15000) return { label: 'Budget',  color: 'text-[#4ade80]', bg: 'bg-green-500/10',  border: 'border-green-500/20' };
  if (p < 30000) return { label: 'Mid',     color: 'text-[#fbbf24]', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
  return               { label: 'Premium', color: 'text-[#f87171]', bg: 'bg-red-500/10',    border: 'border-red-500/20' };
}

const BEST_VALUE_MAX_PRICE_LKR = 15000;
const BEST_VALUE_MAX_DISTANCE_KM = 1.5;

/** Distance from annex to selected university (km): API `distance` in m, else haversine from coords. */
function annexDistanceToUniversityKm(annex, selectedUni) {
  if (annex?.distance != null && Number(annex.distance) >= 0) {
    return Number(annex.distance) / 1000;
  }
  if (annex?.location?.coordinates?.length >= 2 && selectedUni?.lat != null && selectedUni?.lng != null) {
    const [lng, lat] = annex.location.coordinates;
    return haversineKm(selectedUni.lat, selectedUni.lng, lat, lng);
  }
  return null;
}

/** Price strictly under 15k LKR and closer than 1.5 km to the selected campus. */
function isBestValueAnnex(annex, selectedUni) {
  const price = Number(annex?.price);
  if (Number.isNaN(price) || price >= BEST_VALUE_MAX_PRICE_LKR) return false;
  const dKm = annexDistanceToUniversityKm(annex, selectedUni);
  if (dKm == null || Number.isNaN(dKm)) return false;
  return dKm < BEST_VALUE_MAX_DISTANCE_KM;
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

/** Driving (Mapbox when available) + walking (distance km × 12 min) — icons dimmed, labels bright */
function CommuteDrivingWalking({ drivingMins, walkingMins, compact }) {
  const iconSize = compact ? 12 : 14;
  const textCls = compact ? 'text-[10px]' : 'text-[11px]';
  const gap = compact ? 'gap-0.5' : 'gap-1';
  const iconStyle = { opacity: 0.7 };
  return (
    <div className={`flex min-w-0 flex-col ${gap}`}>
      <div className="flex min-w-0 items-center gap-1.5">
        <FaCar className="shrink-0 text-slate-300" size={iconSize} style={iconStyle} aria-hidden />
        <span className={`sa-font-display ${textCls} font-semibold tabular-nums text-[#e8eeff]`}>
          {Math.round(drivingMins)} min
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-1.5">
        <FaWalking className="shrink-0 text-slate-300" size={iconSize} style={iconStyle} aria-hidden />
        <span className={`sa-font-display ${textCls} font-semibold tabular-nums text-[#e8eeff]`}>
          {Math.round(walkingMins)} min
        </span>
      </div>
    </div>
  );
}

/* ════ Main ════ */
function SearchAnnex() {
  const navigate   = useNavigate();
  const wrapperRef = useRef(null);
  const mapRef       = useRef(null);

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
  const [selectedUni,   setSelectedUni]   = useState(() => UNIVERSITIES.find((u) => u.name === 'SLIIT Malabe') ?? UNIVERSITIES[0]);
  const [viewState, setViewState] = useState(() => {
    const u = UNIVERSITIES.find((x) => x.name === 'SLIIT Malabe') ?? UNIVERSITIES[0];
    return { longitude: u.lng, latitude: u.lat, zoom: 13 };
  });
  const [routeData, setRouteData] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [hoveredPoiId, setHoveredPoiId] = useState(null);
  const [showEssentials, setShowEssentials] = useState(false);
  const [essentialsPlaces, setEssentialsPlaces] = useState([]);
  const [hoveredEssentialId, setHoveredEssentialId] = useState(null);
  const essentialsDebounceRef = useRef(null);
  const showEssentialsRef = useRef(false);
  useEffect(() => {
    showEssentialsRef.current = showEssentials;
  }, [showEssentials]);

  const [storedAnnexView, setStoredAnnexView] = useState(null);
  const [aiRecommendationDismissed, setAiRecommendationDismissed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AI_VIEW_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed?.viewedAt || Date.now() - parsed.viewedAt > AI_VIEW_MAX_AGE_MS) {
        localStorage.removeItem(AI_VIEW_STORAGE_KEY);
        return;
      }
      setStoredAnnexView(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  const aiRecommendations = useMemo(
    () => pickAiRecommendations(annexes, storedAnnexView),
    [annexes, storedAnnexView]
  );

  const showAiRecommendationCard =
    storedAnnexView &&
    isSliitUniversityContext(storedAnnexView.universityName) &&
    !aiRecommendationDismissed &&
    aiRecommendations.length > 0;

  const aiRecommendationBlurb =
    aiRecommendations.length === 3
      ? '✨ AI Recommendation: You recently viewed an annex near SLIIT. Here are 3 similar places with a shorter commute.'
      : aiRecommendations.length === 1
        ? '✨ AI Recommendation: You recently viewed an annex near SLIIT. Here is 1 similar place with a shorter commute.'
        : `✨ AI Recommendation: You recently viewed an annex near SLIIT. Here are ${aiRecommendations.length} similar places with a shorter commute.`;

  const fetchAnnexes = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/annexes/search?lat=${selectedUni.lat}&lng=${selectedUni.lng}&maxDistance=${maxDistance}`;
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
    const d = calcKm(selectedUni.lat, selectedUni.lng, lat, lng);
    const walkingMins = Math.max(1, Math.round(d * 12));
    const drivingEst = Math.max(1, Math.round((d / 25) * 60));
    setCommuteInfo({
      distance_km: d.toFixed(2),
      walking_mins: walkingMins,
      driving_mins: drivingEst,
    });
  };

  const getRoute = async (annexCoords) => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || !annexCoords || annexCoords.length < 2) {
      setRouteData(null);
      return;
    }
    const [endLng, endLat] = annexCoords;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${selectedUni.lng},${selectedUni.lat};${endLng},${endLat}?geometries=geojson&overview=full&access_token=${encodeURIComponent(token)}`;
    try {
      const res = await axios.get(url);
      const route = res.data?.routes?.[0];
      if (!route) {
        setRouteData(null);
        return;
      }
      if (typeof route.duration === 'number') {
        const drivingMins = Math.max(1, Math.round(route.duration / 60));
        setCommuteInfo((prev) => (prev ? { ...prev, driving_mins: drivingMins } : null));
      }
      if (!route.geometry) {
        setRouteData(null);
        return;
      }
      const feature = {
        type: 'Feature',
        properties: {},
        geometry: route.geometry,
      };
      setRouteData(feature);

      if (mapRef.current && Array.isArray(route.geometry.coordinates) && route.geometry.coordinates.length > 0) {
        let minLng = selectedUni.lng;
        let maxLng = selectedUni.lng;
        let minLat = selectedUni.lat;
        let maxLat = selectedUni.lat;
        for (const pair of route.geometry.coordinates) {
          const [lng, lat] = pair;
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
        mapRef.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          {
            padding: { top: 72, bottom: 100, left: 360, right: 48 },
            duration: 900,
            maxZoom: 15,
          }
        );
      }
    } catch (err) {
      console.error('Mapbox Directions error:', err);
      setRouteData(null);
    }
  };

  const fetchNearbyPlaces = async (annexCoords) => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || !annexCoords || annexCoords.length < 2) {
      setNearbyPlaces([]);
      return;
    }
    const [lng, lat] = annexCoords;
    setNearbyPlaces([]);
    const params = new URLSearchParams({
      radius: '1000',
      limit: '50',
      layers: 'poi_label,transit_label',
      dedupe: 'true',
      access_token: token,
    });
    const url = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json?${params.toString()}`;
    try {
      const { data } = await axios.get(url);
      const features = Array.isArray(data?.features) ? data.features : [];
      const out = [];
      const seen = new Set();
      for (const f of features) {
        const kind = categorizeTilequeryFeature(f);
        if (!kind || !['grocery', 'restaurant', 'cafe', 'bus_stop'].includes(kind)) continue;
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length < 2) continue;
        const [flng, flat] = coords;
        const name = poiNameFromProps(f.properties);
        const dedupeKey = `${kind}:${flng.toFixed(4)}:${flat.toFixed(4)}:${name}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        out.push({
          id: `poi-${f.id != null ? String(f.id) : dedupeKey}`,
          lng: flng,
          lat: flat,
          name,
          kind,
        });
      }
      setNearbyPlaces(out);
    } catch (err) {
      console.error('Mapbox Tilequery error:', err);
      setNearbyPlaces([]);
    }
  };

  const selectAnnexOnMap = (annex) => {
    if (!annex?.location?.coordinates || annex.location.coordinates.length < 2) return;
    setSelectedAnnex(annex);
    setActiveCard(annex._id);
    getCommute(annex);
    getRoute(annex.location.coordinates);
    fetchNearbyPlaces(annex.location.coordinates);

    const [lng, lat] = annex.location.coordinates;
    const viewedCommuteKm = calcKm(selectedUni.lat, selectedUni.lng, lat, lng);
    if (isSliitUniversityContext(selectedUni.name)) {
      const payload = {
        annexId: annex._id,
        universityName: selectedUni.name,
        universityLat: selectedUni.lat,
        universityLng: selectedUni.lng,
        viewedCommuteKm,
        price: annex.price,
        priceTier: priceTierKey(annex.price),
        viewedAt: Date.now(),
      };
      try {
        localStorage.setItem(AI_VIEW_STORAGE_KEY, JSON.stringify(payload));
        setStoredAnnexView(payload);
        setAiRecommendationDismissed(false);
      } catch {
        /* ignore quota */
      }
    }
  };

  const fetchEssentialsPlaces = useCallback(async () => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      setEssentialsPlaces([]);
      return;
    }
    let lng;
    let lat;
    if (selectedAnnex?.location?.coordinates?.length >= 2) {
      [lng, lat] = selectedAnnex.location.coordinates;
    } else if (mapRef.current) {
      const c = mapRef.current.getCenter();
      lng = c.lng;
      lat = c.lat;
    } else {
      lng = selectedUni.lng;
      lat = selectedUni.lat;
    }

    const params = new URLSearchParams({
      radius: '1000',
      limit: '50',
      layers: 'poi_label,transit_label',
      dedupe: 'true',
      access_token: token,
    });
    const url = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json?${params.toString()}`;
    try {
      const { data } = await axios.get(url);
      const features = Array.isArray(data?.features) ? data.features : [];
      const out = [];
      const seen = new Set();
      for (const f of features) {
        const kind = categorizeEssentialFeature(f);
        if (!kind || !['grocery', 'bus_stop', 'atm', 'pharmacy'].includes(kind)) continue;
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length < 2) continue;
        const [flng, flat] = coords;
        const name = poiNameFromProps(f.properties);
        const dedupeKey = `${kind}:${flng.toFixed(4)}:${flat.toFixed(4)}:${name}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        out.push({
          id: `ess-${f.id != null ? String(f.id) : dedupeKey}`,
          lng: flng,
          lat: flat,
          name,
          kind,
        });
      }
      if (!showEssentialsRef.current) return;
      setEssentialsPlaces(out);
    } catch (err) {
      console.error('Essentials Tilequery error:', err);
      if (showEssentialsRef.current) setEssentialsPlaces([]);
    }
  }, [selectedAnnex, selectedUni.lng, selectedUni.lat]);

  useEffect(() => {
    if (!showEssentials) {
      setEssentialsPlaces([]);
      setHoveredEssentialId(null);
      if (essentialsDebounceRef.current) {
        clearTimeout(essentialsDebounceRef.current);
        essentialsDebounceRef.current = null;
      }
      return;
    }
    fetchEssentialsPlaces();
  }, [showEssentials, selectedAnnex?._id, selectedUni.name, fetchEssentialsPlaces]);

  const scheduleEssentialsFromMapCenter = useCallback(() => {
    if (!showEssentials || selectedAnnex) return;
    if (essentialsDebounceRef.current) clearTimeout(essentialsDebounceRef.current);
    essentialsDebounceRef.current = setTimeout(() => {
      fetchEssentialsPlaces();
    }, 450);
  }, [showEssentials, selectedAnnex, fetchEssentialsPlaces]);

  useEffect(() => { fetchAnnexes(); }, [selectedUni]);

  const handleUniversityChange = (e) => {
    const uni = UNIVERSITIES.find((u) => u.name === e.target.value);
    if (!uni) return;
    setRouteData(null);
    setNearbyPlaces([]);
    setHoveredPoiId(null);
    setSelectedUni(uni);
    mapRef.current?.flyTo({
      center: [uni.lng, uni.lat],
      zoom: 13,
      duration: 1600,
    });
  };

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
                <p className="text-[11px] text-gray-500 mt-0.5">Student housing near {selectedUni.name}</p>
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
              <span className="rounded-full border border-[#232E45] bg-[#0B1628] px-2 py-0.5 text-[9px] text-gray-500">📍 Near {selectedUni.name}</span>
            </div>

            <Field label="University">
              <select
                value={selectedUni.name}
                onChange={handleUniversityChange}
                className={`${inputCls} appearance-none cursor-pointer text-xs py-2`}
              >
                {UNIVERSITIES.map((u) => (
                  <option key={u.name} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>

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
                const bestValue = isBestValueAnnex(annex, selectedUni);
                return (
                  <div key={annex._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectAnnexOnMap(annex)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAnnexOnMap(annex); } }}
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
                        <div className="mb-1 flex min-w-0 items-center gap-1.5">
                          <span className="sa-font-display min-w-0 flex-1 truncate text-xs font-semibold text-white" title={annex.title}>
                            {annex.title}
                          </span>
                          {bestValue && (
                            <span
                              className="sa-font-display shrink-0 rounded-md px-1 py-px text-[8px] font-bold uppercase leading-tight tracking-wide"
                              style={{
                                background: 'rgba(16, 185, 129, 0.2)',
                                color: '#10b981',
                                border: '1px solid rgba(16, 185, 129, 0.5)',
                              }}
                              title="Under Rs. 15,000/mo and within 1.5 km of campus"
                            >
                              ✨ Best Value
                            </span>
                          )}
                        </div>
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
                      <div className="mt-2.5 flex gap-2 border-t border-[#232E45] pt-2.5">
                        <div className="min-w-0 flex-1 rounded-lg border border-green-500/20 bg-green-500/10 px-2 py-1.5">
                          <p className="sa-font-display mb-1 text-[9px] font-bold tabular-nums text-[#4ade80]">
                            {commuteInfo.distance_km} km
                          </p>
                          <CommuteDrivingWalking
                            drivingMins={commuteInfo.driving_mins}
                            walkingMins={commuteInfo.walking_mins}
                            compact
                          />
                        </div>
                        <span className="ml-auto shrink-0 self-start text-[9px] text-gray-600">to {selectedUni.name}</span>
                      </div>
                    )}
                    <div className="mt-2.5 flex justify-end border-t border-[#232E45] pt-2.5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); goToDetails(annex); }}
                        className="sa-font-display rounded-lg border border-[#3b4f86]/50 bg-[#3b4f86]/15 px-2.5 py-1 text-[10px] font-semibold text-[#6b84c9] hover:bg-[#3b4f86]/25 transition-colors"
                      >
                        View details →
                      </button>
                    </div>
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
            ref={mapRef}
            mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
            {...viewState}
            onMove={(e) => setViewState(e.viewState)}
            onMoveEnd={scheduleEssentialsFromMapCenter}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            style={{ width: '100%', height: '100%' }}
          >
            {routeData && (
              <Source id="annex-route" type="geojson" data={routeData}>
                <Layer
                  id="annex-route-line"
                  type="line"
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{
                    'line-color': '#2d7ef7',
                    'line-width': 5,
                  }}
                />
              </Source>
            )}

            <Marker longitude={selectedUni.lng} latitude={selectedUni.lat}>
              <div className="relative flex items-center justify-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-red-600 text-base shadow-lg shadow-red-500/40">🎓</div>
                <div className="absolute max-w-[160px] truncate rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ bottom: -20 }} title={selectedUni.name}>{selectedUni.name}</div>
              </div>
            </Marker>

            {annexes.map(annex => (
              <Marker key={annex._id}
                longitude={annex.location.coordinates[0]}
                latitude={annex.location.coordinates[1]}
                onClick={e => { e.originalEvent.stopPropagation(); selectAnnexOnMap(annex); }}>
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

            {showEssentials && essentialsPlaces.map((poi) => {
              const bg = ESSENTIAL_COLORS[poi.kind] || '#6b84c9';
              return (
                <Marker key={poi.id} longitude={poi.lng} latitude={poi.lat} anchor="center">
                  <div
                    className="pointer-events-auto relative flex flex-col items-center"
                    style={{ zIndex: 7 }}
                    onMouseEnter={() => setHoveredEssentialId(poi.id)}
                    onMouseLeave={() => setHoveredEssentialId(null)}
                  >
                    {hoveredEssentialId === poi.id && (
                      <div
                        className="absolute bottom-full mb-1.5 max-w-[200px] truncate rounded-md border border-[#232E45] bg-[#0B1628]/95 px-2 py-1 text-[10px] font-semibold text-[#e8eeff] shadow-lg backdrop-blur-sm"
                        title={poi.name}
                      >
                        {poi.name}
                      </div>
                    )}
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/90 shadow-md"
                      style={{ backgroundColor: bg }}
                      title={poi.name}
                    />
                  </div>
                </Marker>
              );
            })}

            {selectedAnnex && nearbyPlaces.map((poi) => {
              const bg = POI_COLORS[poi.kind] || '#6b84c9';
              const shape =
                poi.kind === 'grocery'
                  ? { borderRadius: 4, width: 11, height: 11 }
                  : poi.kind === 'bus_stop'
                    ? { borderRadius: 2, width: 12, height: 8 }
                    : poi.kind === 'cafe'
                      ? { borderRadius: 2, width: 9, height: 9, transform: 'rotate(45deg)' }
                      : { borderRadius: 999, width: 11, height: 11 };
              return (
                <Marker key={poi.id} longitude={poi.lng} latitude={poi.lat} anchor="center">
                  <div
                    className="pointer-events-auto relative flex flex-col items-center"
                    style={{ zIndex: 6 }}
                    onMouseEnter={() => setHoveredPoiId(poi.id)}
                    onMouseLeave={() => setHoveredPoiId(null)}
                  >
                    {hoveredPoiId === poi.id && (
                      <div
                        className="absolute bottom-full mb-1.5 whitespace-nowrap rounded-md border border-[#232E45] bg-[#0B1628]/95 px-2 py-1 text-[10px] font-semibold text-[#e8eeff] shadow-lg backdrop-blur-sm"
                        style={{ maxWidth: 200 }}
                      >
                        {poi.name}
                      </div>
                    )}
                    <div
                      className="border border-white/90 shadow-md"
                      style={{
                        backgroundColor: bg,
                        ...shape,
                      }}
                      title={poi.name}
                    />
                  </div>
                </Marker>
              );
            })}

            {selectedAnnex && (
              <Popup
                longitude={selectedAnnex.location.coordinates[0]}
                latitude={selectedAnnex.location.coordinates[1]}
                anchor="bottom" offset={20}
                onClose={() => { setSelectedAnnex(null); setCommuteInfo(null); setActiveCard(null); setRouteData(null); setNearbyPlaces([]); setHoveredPoiId(null); }}
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
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <p
                        className="sa-font-display min-w-0 flex-1 truncate text-sm font-semibold text-white leading-tight"
                        title={selectedAnnex.title}
                      >
                        {selectedAnnex.title}
                      </p>
                      {isBestValueAnnex(selectedAnnex, selectedUni) && (
                        <span
                          className="sa-font-display shrink-0 rounded-md font-bold uppercase leading-none tracking-wide"
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.5)',
                          }}
                          title="Under Rs. 15,000/mo and within 1.5 km of campus"
                        >
                          ✨ Best Value
                        </span>
                      )}
                    </div>
                    {selectedAnnex.selectedAddress && (
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">📍 {selectedAnnex.selectedAddress}</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-[#232E45] bg-[#060F1E] p-3">
                    {commuteInfo
                      ? <>
                          <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600 mb-1">Commute to {selectedUni.name}</p>
                          <p className="sa-font-display mb-2 text-sm font-bold tabular-nums text-[#4ade80]">{commuteInfo.distance_km} km</p>
                          <CommuteDrivingWalking
                            drivingMins={commuteInfo.driving_mins}
                            walkingMins={commuteInfo.walking_mins}
                          />
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
                    <button onClick={() => { setSelectedAnnex(null); setCommuteInfo(null); setActiveCard(null); setRouteData(null); setNearbyPlaces([]); setHoveredPoiId(null); }}
                      className="rounded-xl border border-[#232E45] bg-[#060F1E] px-3 py-2 text-xs text-gray-500 hover:border-[#3b4f86] hover:text-gray-300 transition-colors">
                      ✕
                    </button>
                  </div>
                </div>
              </Popup>
            )}
          </Map>

          {/* Student Essentials — FAB toggle (top-right) */}
          <button
            type="button"
            onClick={() => setShowEssentials((v) => !v)}
            className={`absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border px-3.5 py-2.5 shadow-lg backdrop-blur-md transition-all duration-200 sm:px-4
              ${showEssentials
                ? 'border-[#3b4f86] bg-[#3b4f86]/30 text-white shadow-[0_0_24px_rgba(59,79,134,0.45)] ring-1 ring-[#3b4f86]/50'
                : 'border-[#232E45] bg-[#060F1E]/95 text-gray-300 hover:border-[#3b4f86]/60 hover:bg-[#0B1628] hover:text-[#e8eeff]'}`}
            aria-pressed={showEssentials}
            aria-label="Toggle Student Essentials POIs"
          >
            <span className="text-sm leading-none" aria-hidden>✨</span>
            <span className="sa-font-display hidden text-[11px] font-semibold tracking-tight sm:inline">Student Essentials</span>
            <span className="sa-font-display text-[11px] font-semibold tracking-tight sm:hidden">Essentials</span>
          </button>

          {/* Map overlays */}
          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 flex items-center gap-3 rounded-full border border-[#232E45] bg-[#060F1E]/90 px-4 py-2 backdrop-blur-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[11px] font-semibold text-gray-500">Live Map · {selectedUni.name}</span>
            <span className="sa-font-display rounded-full border border-[#3b4f86]/30 bg-[#3b4f86]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#6b84c9]">{annexes.length} listings</span>
          </div>

          <div className="absolute bottom-6 left-4 flex items-center gap-4 rounded-2xl border border-[#232E45] bg-[#060F1E]/90 px-4 py-2.5 backdrop-blur-sm text-[10px] text-gray-600">
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-600" /><span>{selectedUni.name} campus</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-[#3b4f86]" /><span>Annex Listing</span></div>
            <div className="text-gray-700">|</div>
            <span>{annexes.length} listings shown</span>
          </div>
        </div>
      </div>

      {/* AI Recommendation — Advanced Decision Support */}
      {showAiRecommendationCard && (
        <div
          className="pointer-events-auto fixed bottom-6 right-6 z-[200] max-w-[min(100vw-1.5rem,22rem)] rounded-2xl p-4 shadow-2xl backdrop-blur-md"
          style={{
            background: 'rgba(10, 25, 47, 0.9)',
            border: '1px solid #2d7ef7',
            boxShadow: '0 0 28px rgba(45, 126, 247, 0.4), 0 16px 48px rgba(0, 0, 0, 0.5)',
          }}
          role="region"
          aria-label="AI recommendation"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="pr-1">
              <p className="sa-font-display mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5a7ab8]">
                Advanced Decision Support
              </p>
              <p className="sa-font-display text-[12px] font-semibold leading-snug text-[#e8eeff]">
                {aiRecommendationBlurb}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAiRecommendationDismissed(true)}
              className="shrink-0 rounded-lg border border-[#232E45] bg-[#060F1E]/80 px-2 py-1 text-[10px] font-semibold text-[#6b84c9] transition-colors hover:border-[#2d7ef7] hover:text-[#93c3fd]"
              aria-label="Close recommendation"
            >
              Close
            </button>
          </div>
          <div className="flex gap-2">
            {aiRecommendations.map(({ annex: rec, commuteKm, commuteMins }) => {
              const src = annexThumbSrc(rec);
              return (
                <button
                  key={rec._id}
                  type="button"
                  onClick={() => selectAnnexOnMap(rec)}
                  className="group flex flex-1 flex-col items-center gap-1 rounded-xl border border-[#232E45] bg-[#060F1E]/90 p-1.5 transition-all hover:border-[#3b4f86] hover:ring-1 hover:ring-[#2d7ef7]/40"
                >
                  <div className="relative h-12 w-full overflow-hidden rounded-lg bg-[#232E45]">
                    {src ? (
                      <img
                        src={src}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-600">—</div>
                    )}
                  </div>
                  <span className="sa-font-display text-[9px] font-bold text-[#4ade80]">
                    {commuteKm.toFixed(1)} km · {commuteMins} min
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchAnnex;