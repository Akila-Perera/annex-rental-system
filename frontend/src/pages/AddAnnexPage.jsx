import { useState } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
  
  // Location State (Default to SLIIT Malabe area)
  const [pinLocation, setPinLocation] = useState({ lat: 6.9147, lng: 79.9723 });
  
  // Status message state
  const [message, setMessage] = useState('');

  // Handle Map Click to move the pin
  const handleMapClick = async (e) => {
    setPinLocation({
      lng: e.lngLat.lng,
      lat: e.lngLat.lat
    });

    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      if (!token) {
        setSelectedAddress('');
        return;
      }

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${e.lngLat.lng},${e.lngLat.lat}.json?access_token=${token}&limit=1`;
      const response = await axios.get(url);
      const placeName = response.data?.features?.[0]?.place_name || '';
      setSelectedAddress(placeName);
    } catch (error) {
      console.error('Error resolving address:', error);
      setSelectedAddress('');
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

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
      location: {
        type: 'Point',
        coordinates: [pinLocation.lng, pinLocation.lat]
      }
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
      const response = await axios.post('http://localhost:5000/api/annexes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setMessage('success:Annex successfully added to the system!');
        // Clear the form
        setTitle(''); setPrice(''); setDescription(''); setPreferredGender('Any');
        setFeaturesInput(''); setRulesInput(''); setImageFiles([]);
        setImagePreviews([]); setSelectedAddress('');
      }
    } catch (error) {
      console.error("Error adding annex:", error);
      setMessage('error:Failed to add annex. Please try again.');
    }
  };

  return (
    <>
      {/* Custom Scrollbar Styles for Professional Look */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
      `}</style>

      <div className="flex h-screen font-sans bg-[#0B1120] text-gray-200 overflow-hidden relative">
        
        {/* Background glow effects to match homepage */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        {/* LEFT SIDE: Form Panel */}
        <div className="w-[480px] p-8 bg-[#0B1120]/95 backdrop-blur-xl border-r border-gray-800/60 overflow-y-auto shadow-[10px_0_30px_rgba(0,0,0,0.8)] z-10 custom-scrollbar flex flex-col relative">
          
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              List Your <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">Annex</span>
            </h2>
            <p className="text-sm text-gray-400">Fill in the details and pinpoint the location on the map to attract students.</p>
          </div>

          {message && (
            <div className={`p-4 mb-6 rounded-lg text-sm font-medium flex items-center gap-3 backdrop-blur-md animate-pulse border ${
              message.startsWith('success') 
                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              <span className="text-lg">{message.startsWith('success') ? '✅' : '❌'}</span>
              {message.split(':')[1]}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Input Group */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1.5">Title / Name of Annex</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)} 
                  className="w-full p-3.5 bg-gray-900/50 border border-gray-700 rounded-xl outline-none text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 placeholder-gray-600 shadow-inner"
                  placeholder="e.g., Luxury AC Room in Malabe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1.5">Monthly Price (LKR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rs.</span>
                  <input 
                    type="number" required value={price} onChange={(e) => setPrice(e.target.value)} 
                    className="w-full p-3.5 pl-12 bg-gray-900/50 border border-gray-700 rounded-xl outline-none text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 placeholder-gray-600 shadow-inner"
                    placeholder="20,000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1.5">Description</label>
                <textarea 
                  rows="4" required value={description} onChange={(e) => setDescription(e.target.value)} 
                  className="w-full p-3.5 bg-gray-900/50 border border-gray-700 rounded-xl outline-none text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 placeholder-gray-600 shadow-inner custom-scrollbar"
                  placeholder="Describe the facilities, nearby landmarks, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1.5">Features</label>
                  <textarea
                    rows="2" value={featuresInput} onChange={(e) => setFeaturesInput(e.target.value)}
                    className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-xl outline-none text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 placeholder-gray-600 custom-scrollbar text-sm"
                    placeholder="WiFi, AC, Attached Bath (comma separated)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1.5">Rules</label>
                  <textarea
                    rows="2" value={rulesInput} onChange={(e) => setRulesInput(e.target.value)}
                    className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-xl outline-none text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 placeholder-gray-600 custom-scrollbar text-sm"
                    placeholder="No smoking, 10PM curfew (comma separated)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1.5">Allowed Gender</label>
                <select 
                  value={preferredGender} onChange={(e) => setPreferredGender(e.target.value)} 
                  className="w-full p-3.5 bg-gray-900/50 border border-gray-700 rounded-xl outline-none text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 appearance-none cursor-pointer"
                >
                  <option value="Any" className="bg-gray-800 text-white">Any (Boys & Girls)</option>
                  <option value="Male" className="bg-gray-800 text-white">Male Only</option>
                  <option value="Female" className="bg-gray-800 text-white">Female Only</option>
                </select>
              </div>

              {/* Advanced File Upload Area */}
              <div>
                <label className="block text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1.5">Annex Photos (Max 5)</label>
                <div className="relative group w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl bg-gray-900/30 hover:bg-gray-800/50 hover:border-blue-500 transition-all duration-300 cursor-pointer overflow-hidden">
                  <input
                    type="file" accept="image/*" multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).slice(0, 5);
                      setImageFiles(files);
                      setImagePreviews(files.map((file) => URL.createObjectURL(file)));
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <svg className="w-8 h-8 text-gray-500 group-hover:text-blue-400 transition-colors mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  <span className="text-sm text-gray-500 group-hover:text-blue-300 transition-colors font-medium">Click or drag images here</span>
                </div>
                
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview} className="relative group overflow-hidden rounded-lg aspect-square border border-gray-700">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Location Card */}
              <div className="bg-[#121b2b] p-4 rounded-xl border border-blue-900/50 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                <strong className="block text-xs uppercase tracking-wider text-blue-400 mb-2">Location Coordinates</strong>
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Latitude: <span className="text-white font-mono">{pinLocation.lat.toFixed(4)}</span></span>
                  <span>Longitude: <span className="text-white font-mono">{pinLocation.lng.toFixed(4)}</span></span>
                </div>
                {selectedAddress && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <span className="block text-xs text-gray-500 mb-1">Resolved Address</span>
                    <p className="text-sm text-gray-200 truncate" title={selectedAddress}>{selectedAddress}</p>
                  </div>
                )}
              </div>

            </div>

            <button 
              type="submit" 
              className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg tracking-wide shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Post Annex Listing
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          </form>
        </div>

        {/* RIGHT SIDE: Interactive Dark Map */}
        <div className="flex-1 relative bg-black">
          <Map
            mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
            initialViewState={{
              longitude: pinLocation.lng,
              latitude: pinLocation.lat,
              zoom: 14
            }}
            // Changed map style to dark-v11 to match the aesthetic perfectly!
            mapStyle="mapbox://styles/mapbox/dark-v11"
            onClick={handleMapClick} 
            cursor="crosshair"
          >
            <Marker 
              longitude={pinLocation.lng} 
              latitude={pinLocation.lat} 
            >
              {/* Custom Neon Marker */}
              <div className="relative flex items-center justify-center w-8 h-8 cursor-pointer">
                <div className="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-60"></div>
                <div className="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(59,130,246,1)]"></div>
              </div>
            </Marker>
          </Map>
        </div>
      </div>
    </>
  );
}

export default AddAnnexPage;