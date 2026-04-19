import { useState } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// ── Step indicator ──────────────────────────────────────────────────
function StepBadge({ number, label, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors
          ${done ? 'bg-[#22c55e] text-white' : active ? 'bg-[#3b4f86] text-white' : 'bg-[#232E45] text-gray-400'}`}
      >
        {done ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : number}
      </div>
      <span className={`text-xs font-medium hidden sm:block ${active ? 'text-white' : done ? 'text-[#22c55e]' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}

// ── Section card wrapper ────────────────────────────────────────────
function SectionCard({ icon, title, subtitle, children, accent }) {
  return (
    <div className={`rounded-2xl border bg-[#0B1628] p-6 space-y-5 ${accent ? 'border-[#3b4f86]' : 'border-[#232E45]'}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#232E45] text-[#6b84c9]">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-sm font-semibold text-white leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Labelled field ──────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-300">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}

// ── Check item for summary ──────────────────────────────────────────
function CheckItem({ done, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${done ? 'border-[#22c55e] bg-[#22c55e]' : 'border-[#232E45] bg-transparent'}`}>
        {done && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <span className={`text-xs ${done ? 'text-gray-300' : 'text-gray-500'}`}>{label}</span>
    </div>
  );
}

// ── Summary row ─────────────────────────────────────────────────────
function SummaryRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-xs font-medium truncate max-w-[160px] text-right ${highlight ? 'text-white' : 'text-gray-600'}`}>
        {value || '—'}
      </span>
    </div>
  );
}

const inputCls =
  'mt-0.5 w-full rounded-xl border border-[#232E45] bg-[#060F1E] px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 shadow-sm transition-colors focus:border-[#3b4f86] focus:outline-none focus:ring-1 focus:ring-[#3b4f86] hover:border-[#2e3c5e]';

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

// ── Main component ──────────────────────────────────────────────────
function AddAnnexPage() {
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [preferredGender, setPreferredGender] = useState('Any');
  const [featuresInput, setFeaturesInput] = useState('');
  const [rulesInput, setRulesInput] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');

  const [targetUniversity, setTargetUniversity] = useState(DEFAULT_CAMPUS.Name);
  const [pinLocation, setPinLocation] = useState({
    lat: DEFAULT_CAMPUS.Lat,
    lng: DEFAULT_CAMPUS.Lng,
  });
  const [viewState, setViewState] = useState({
    longitude: DEFAULT_CAMPUS.Lng,
    latitude: DEFAULT_CAMPUS.Lat,
    zoom: 14,
  });

  // Status message state
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reverseGeocode = async (lng, lat) => {
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      if (!token) {
        setSelectedAddress('');
        return;
      }
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`;
      const response = await axios.get(url);
      const placeName = response.data?.features?.[0]?.place_name || '';
      setSelectedAddress(placeName);
    } catch (error) {
      console.error('Error resolving address:', error);
      setSelectedAddress('');
    }
  };

  const handleTargetUniversityChange = (e) => {
    const name = e.target.value;
    setTargetUniversity(name);
    const uni = UNIVERSITIES.find((u) => u.Name === name);
    if (!uni) return;
    setPinLocation({ lat: uni.Lat, lng: uni.Lng });
    setViewState((vs) => ({ ...vs, longitude: uni.Lng, latitude: uni.Lat }));
    reverseGeocode(uni.Lng, uni.Lat);
  };

  const handleMapClick = async (e) => {
    const { lng, lat } = e.lngLat;
    setPinLocation({ lng, lat });
    setViewState((vs) => ({ ...vs, longitude: lng, latitude: lat }));
    await reverseGeocode(lng, lat);
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!user?.id) {
      setMessage('error:Please log in as an annex owner before adding a listing.');
      return;
    }

    const features = featuresInput.split(',').map((item) => item.trim()).filter(Boolean);
    const rulesAndConditions = rulesInput.split(',').map((item) => item.trim()).filter(Boolean);

    const newAnnexData = {
      ownerId: user?.id,
      title,
      price: Number(price),
      description,
      preferredGender,
      features,
      rulesAndConditions,
      selectedAddress,
      tags: ['New'],
      location: { type: 'Point', coordinates: [pinLocation.lng, pinLocation.lat] },
    };

    const formData = new FormData();
    formData.append('title', newAnnexData.title);
    formData.append('ownerId', newAnnexData.ownerId || '');
    formData.append('price', String(newAnnexData.price));
    formData.append('description', newAnnexData.description);
    formData.append('preferredGender', newAnnexData.preferredGender);
    formData.append('features', JSON.stringify(newAnnexData.features));
    formData.append('rulesAndConditions', JSON.stringify(newAnnexData.rulesAndConditions));
    formData.append('selectedAddress', newAnnexData.selectedAddress);
    formData.append('tags', JSON.stringify(newAnnexData.tags));
    formData.append('location', JSON.stringify(newAnnexData.location));
    imageFiles.forEach((file) => formData.append('images', file));

    try {
      setSubmitting(true);
      const response = await axios.post('http://localhost:5000/api/annexes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setMessage('success:Annex successfully added to the system!');
        setSubmitted(true);
        setTitle(''); setPrice(''); setDescription(''); setPreferredGender('Any');
        setFeaturesInput(''); setRulesInput(''); setImageFiles([]);
        setImagePreviews([]); setSelectedAddress('');
        setTargetUniversity(DEFAULT_CAMPUS.Name);
        setPinLocation({ lat: DEFAULT_CAMPUS.Lat, lng: DEFAULT_CAMPUS.Lng });
        setViewState({ longitude: DEFAULT_CAMPUS.Lng, latitude: DEFAULT_CAMPUS.Lat, zoom: 14 });
      }
    } catch (error) {
      console.error('Error adding annex:', error);
      setMessage('error:Failed to add annex. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step completion checks
  const step1Done = !!(title.trim() && price);
  const step2Done = !!(description.trim() && preferredGender);
  const step3Done = !!(selectedAddress || imageFiles.length > 0);

  return (
    <div className="min-h-screen bg-[#060F1E] px-4 py-8 md:py-12 flex items-start justify-center text-gray-100">
      <div className="w-full max-w-7xl space-y-6">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#6b84c9] mb-1">AnnexRent</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">List Your Annex</h1>
            <p className="text-sm text-gray-400 mt-1">Fill in the details and pin the location to attract students.</p>
          </div>
          {/* Progress steps */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <StepBadge number="1" label="Basic info" active={!step1Done} done={step1Done} />
            <div className="h-px w-6 bg-[#232E45]" />
            <StepBadge number="2" label="Details" active={step1Done && !step2Done} done={step2Done} />
            <div className="h-px w-6 bg-[#232E45]" />
            <StepBadge number="3" label="Location & Photos" active={step1Done && step2Done && !step3Done} done={step3Done} />
            <div className="h-px w-6 bg-[#232E45]" />
            <StepBadge number="4" label="Publish" active={step1Done && step2Done && step3Done} done={submitted} />
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ── LEFT column ── */}
          <div className="space-y-5">

            <SectionCard
              title="Target University"
              subtitle="Pick a campus to center the map and drop the pin there. You can still click the map to fine-tune."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              }
            >
              <Field
                label="Target University"
                hint="Helps students see listings relative to where they study."
              >
                <select
                  value={targetUniversity}
                  onChange={handleTargetUniversityChange}
                  className={`${inputCls} appearance-none cursor-pointer`}
                >
                  {UNIVERSITIES.map((u) => (
                    <option key={u.Name} value={u.Name}>
                      {u.Name}
                    </option>
                  ))}
                </select>
              </Field>
            </SectionCard>

            {/* Basic Info */}
            <SectionCard
              accent
              title="Basic Information"
              subtitle="The headline details students see first on your listing."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              }
            >
              <div className="space-y-4">
                <Field label="Title / Name of Annex" required>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Luxury AC Room in Malabe"
                  />
                </Field>
                <Field label="Monthly Price (LKR)" required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">Rs.</span>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className={`${inputCls} pl-10`}
                      placeholder="20,000"
                    />
                  </div>
                </Field>
              </div>
            </SectionCard>

            {/* Details */}
            <SectionCard
              title="Listing Details"
              subtitle="Help students understand what makes your annex great."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              }
            >
              <div className="space-y-4">
                <Field label="Description" required>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`${inputCls} resize-none`}
                    placeholder="Describe the facilities, nearby landmarks, transport links, etc."
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Features" hint="Comma-separated — e.g. WiFi, AC, Attached Bath">
                    <textarea
                      rows={3}
                      value={featuresInput}
                      onChange={(e) => setFeaturesInput(e.target.value)}
                      className={`${inputCls} resize-none`}
                      placeholder="WiFi, AC, Attached Bath"
                    />
                  </Field>
                  <Field label="Rules & Conditions" hint="Comma-separated — e.g. No smoking, 10PM curfew">
                    <textarea
                      rows={3}
                      value={rulesInput}
                      onChange={(e) => setRulesInput(e.target.value)}
                      className={`${inputCls} resize-none`}
                      placeholder="No smoking, 10PM curfew"
                    />
                  </Field>
                </div>

                <Field label="Allowed Gender">
                  <select
                    value={preferredGender}
                    onChange={(e) => setPreferredGender(e.target.value)}
                    className={`${inputCls} appearance-none cursor-pointer`}
                  >
                    <option value="Any">Any (Boys & Girls)</option>
                    <option value="Male">Male Only</option>
                    <option value="Female">Female Only</option>
                  </select>
                </Field>
              </div>
            </SectionCard>

            {/* Photos */}
            <SectionCard
              title="Annex Photos"
              subtitle="Upload up to 5 photos. Clear, bright images attract more students."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              }
            >
              <div className="space-y-4">
                {/* Upload area */}
                <div className="relative group w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-[#232E45] rounded-xl bg-[#060F1E] hover:bg-[#0d1a2e] hover:border-[#3b4f86] transition-all duration-300 cursor-pointer overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).slice(0, 5);
                      setImageFiles(files);
                      setImagePreviews(files.map((file) => URL.createObjectURL(file)));
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <svg className="w-7 h-7 text-gray-600 group-hover:text-[#6b84c9] transition-colors mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors font-medium">
                    Click or drag images here
                  </span>
                  <span className="text-[11px] text-gray-600 mt-0.5">Max 5 images</span>
                </div>

                {/* Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview} className="relative group overflow-hidden rounded-xl aspect-square border border-[#232E45]">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors rounded-xl" />
                        <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white rounded px-1">{index + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Map */}
            <SectionCard
              title="Pin Location on Map"
              subtitle="Click anywhere on the map to set your annex's exact location."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              }
            >
              <div className="space-y-4">
                {/* Coordinates pill */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a2540] border border-[#3b4f86] px-3 py-1 text-xs font-medium text-[#a5b8e8]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {pinLocation.lat.toFixed(4)}, {pinLocation.lng.toFixed(4)}
                  </span>
                  {selectedAddress && (
                    <span className="text-[11px] text-gray-400 truncate max-w-xs">{selectedAddress}</span>
                  )}
                </div>

                {/* Map container */}
                <div className="relative rounded-xl overflow-hidden border border-[#232E45]" style={{ height: 320 }}>
                  <Map
                    mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                    {...viewState}
                    onMove={(e) => setViewState(e.viewState)}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    onClick={handleMapClick}
                    cursor="crosshair"
                    style={{ width: '100%', height: '100%' }}
                  >
                    <Marker longitude={pinLocation.lng} latitude={pinLocation.lat}>
                      <div className="relative flex items-center justify-center w-8 h-8 cursor-pointer">
                        <div className="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-60" />
                        <div className="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(59,130,246,1)]" />
                      </div>
                    </Marker>
                  </Map>
                  <div className="absolute bottom-3 left-3 rounded-lg bg-[#060F1E]/80 backdrop-blur-sm border border-[#232E45] px-3 py-1.5 text-[11px] text-gray-400 pointer-events-none">
                    Click to reposition the pin
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Status message */}
            {message && (
              <div
                className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm ${
                  message.startsWith('success')
                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  {message.startsWith('success') ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  )}
                </svg>
                {message.split(':')[1]}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center rounded-xl border border-[#232E45] bg-transparent px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-[#232E45]/40 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3b4f86] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#4c62a3] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Publishing…
                  </>
                ) : (
                  <>
                    Post Annex Listing
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── RIGHT column — listing summary ── */}
          <aside className="space-y-4 sticky top-6">

            {/* Preview card */}
            <div className="overflow-hidden rounded-2xl border border-[#232E45] bg-[#0B1628]">
              {imagePreviews.length > 0 ? (
                <div className="aspect-[16/9] w-full overflow-hidden">
                  <img
                    src={imagePreviews[0]}
                    alt="Listing preview"
                    className="h-full w-full object-cover transition-transform hover:scale-105 duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] w-full bg-[#0d1a2e] flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#232E45]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className="p-5 space-y-1">
                <h2 className="text-sm font-semibold text-white leading-tight">
                  {title || <span className="text-gray-600">Listing title will appear here</span>}
                </h2>
                <p className="flex items-center gap-1.5 text-xs text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#6b84c9]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {selectedAddress || 'AnnexRent · Location not yet set'}
                </p>
                {price && (
                  <p className="text-sm font-semibold text-[#6b84c9] pt-1">
                    Rs. {Number(price).toLocaleString()} <span className="text-xs font-normal text-gray-500">/ month</span>
                  </p>
                )}
              </div>
            </div>

            {/* Listing summary */}
            <div className="rounded-2xl border border-[#232E45] bg-[#0B1628] p-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Listing Summary</h3>

              <div className="space-y-2.5">
                <SummaryRow label="Price" value={price ? `Rs. ${Number(price).toLocaleString()} / mo` : null} highlight={!!price} />
                <SummaryRow label="Gender" value={preferredGender} highlight={!!preferredGender} />
                <SummaryRow label="Features" value={featuresInput ? `${featuresInput.split(',').filter(Boolean).length} listed` : null} highlight={!!featuresInput} />
                <SummaryRow label="Photos" value={imageFiles.length > 0 ? `${imageFiles.length} uploaded` : null} highlight={imageFiles.length > 0} />
                <SummaryRow label="Location" value={selectedAddress ? 'Pinned ✓' : null} highlight={!!selectedAddress} />
              </div>

              {/* Checklist */}
              <div className="space-y-2 border-t border-[#232E45] pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Requirements</p>
                <CheckItem done={!!title.trim()} label="Listing title entered" />
                <CheckItem done={!!price} label="Price set" />
                <CheckItem done={!!description.trim()} label="Description added" />
                <CheckItem done={imageFiles.length > 0} label="At least one photo uploaded" />
                <CheckItem done={!!selectedAddress} label="Location pinned on map" />
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed border-t border-[#232E45] pt-4">
                Your listing will be <span className="text-gray-300 font-medium">reviewed</span> and made visible to students searching near your area.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default AddAnnexPage;