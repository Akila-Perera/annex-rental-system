import { useState, useEffect } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';

function SearchAnnex() {
  // Filter States
  const [maxDistance, setMaxDistance] = useState(5000);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [gender, setGender] = useState('');
  
  // Data States
  const [annexes, setAnnexes] = useState([]);
  const [selectedAnnex, setSelectedAnnex] = useState(null);
  const [commuteInfo, setCommuteInfo] = useState(null);

  // Default Center (SLIIT Malabe)
  const sliitLocation = { lat: 6.9147, lng: 79.9723 };

  // Fetch Annexes from Backend based on Filters
  const fetchAnnexes = async () => {
    try {
      let url = `http://localhost:5000/api/annexes/search?lat=${sliitLocation.lat}&lng=${sliitLocation.lng}&maxDistance=${maxDistance}`;
      if (minPrice) url += `&minPrice=${minPrice}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;
      if (gender) url += `&gender=${gender}`;

      const response = await axios.get(url);
      setAnnexes(response.data.data);
    } catch (error) {
      console.error("Error fetching annexes:", error);
    }
  };

  // Fetch Commute Distance & Time
  const getCommute = async (annexId) => {
    try {
      setCommuteInfo(null); // Reset while loading
      const response = await axios.get(`http://localhost:5000/api/annexes/${annexId}/distance`);
      setCommuteInfo(response.data.commute);
    } catch (error) {
      console.error("Error fetching commute:", error);
    }
  };

  // Load annexes when page first loads
  useEffect(() => {
    fetchAnnexes();
  }, []);

  return (
    <div className="flex h-screen font-sans text-gray-800">
      
      {/* LEFT SIDEBAR: Filters & Results */}
      <div className="w-[400px] bg-gray-50 flex flex-col shadow-xl z-10 border-r border-gray-200">
        
        {/* Fixed Header & Filters Section */}
        <div className="p-6 pb-4 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Find an Annex</h2>
          
          <div className="flex flex-col gap-4">
            {/* Distance Filter */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-semibold text-gray-700">Max Distance</label>
                <span className="text-sm font-bold text-blue-600">{maxDistance / 1000} km</span>
              </div>
              <input 
                type="range" min="1000" max="15000" step="1000" 
                value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} 
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Price Filters */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-700">Min Price</label>
                <input 
                  type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} 
                  placeholder="Rs. 0"
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" 
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-700">Max Price</label>
                <input 
                  type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} 
                  placeholder="Rs. 50000"
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" 
                />
              </div>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="text-sm font-semibold text-gray-700">Preferred Gender</label>
              <select 
                value={gender} onChange={(e) => setGender(e.target.value)} 
                className="w-full p-2 mt-1 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white text-sm"
              >
                <option value="">Any (Show All)</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Apply Button */}
            <button 
              onClick={fetchAnnexes} 
              className="w-full p-2.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer text-sm font-bold transition-colors shadow-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Scrollable Results List */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Found {annexes.length} Annexes
          </h4>
          
          <div className="flex flex-col gap-3">
            {annexes.map((annex) => (
              <div 
                key={annex._id} 
                className="p-4 bg-white border-l-4 border-blue-500 rounded-r-md shadow-sm hover:shadow-md hover:bg-blue-50 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedAnnex(annex);
                  getCommute(annex._id);
                }}
              >
                <strong className="block text-gray-900 text-lg mb-1">{annex.title}</strong>
                <p className="text-blue-600 font-bold mb-1">Rs. {annex.price} <span className="text-sm text-gray-500 font-normal">/ month</span></p>
                <div className="flex gap-2 text-xs">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{annex.preferredGender}</span>
                  {annex.distance && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {(annex.distance / 1000).toFixed(1)} km away
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {annexes.length === 0 && (
              <p className="text-center text-gray-500 mt-10">No annexes found matching your criteria.</p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Mapbox Map */}
      <div className="flex-1 relative">
        <Map
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          initialViewState={{
            longitude: sliitLocation.lng,
            latitude: sliitLocation.lat,
            zoom: 13
          }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
        >
          {/* SLIIT Marker (Campus) */}
          <Marker longitude={sliitLocation.lng} latitude={sliitLocation.lat} color="#ef4444" /> {/* Red marker for SLIIT */}

          {/* Annex Markers */}
          {annexes.map((annex) => (
            <Marker 
              key={annex._id} 
              longitude={annex.location.coordinates[0]} 
              latitude={annex.location.coordinates[1]} 
              color="#3b82f6" // Blue markers for annexes
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedAnnex(annex);
                getCommute(annex._id);
              }}
            />
          ))}

          {/* Popup when clicking a marker */}
          {selectedAnnex && (
            <Popup 
              longitude={selectedAnnex.location.coordinates[0]} 
              latitude={selectedAnnex.location.coordinates[1]} 
              anchor="bottom"
              onClose={() => {
                setSelectedAnnex(null);
                setCommuteInfo(null);
              }}
              className="rounded-lg shadow-lg"
            >
              <div className="p-2 text-gray-800 w-[200px]">
                <h4 className="font-bold text-md mb-1">{selectedAnnex.title}</h4>
                <p className="text-blue-600 font-bold text-sm mb-2">Rs. {selectedAnnex.price}</p>
                
                {commuteInfo ? (
                  <div className="mt-3 bg-gray-100 p-2 rounded-md text-xs border border-gray-200">
                    <strong className="block text-gray-700 mb-1">🚗 Commute to SLIIT:</strong>
                    <span className="font-bold text-green-600">{commuteInfo.distance_km} km</span> 
                    <span className="text-gray-600"> (approx. {commuteInfo.duration_mins} mins)</span>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-gray-500 italic">
                    Calculating driving distance...
                  </div>
                )}
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}

export default SearchAnnex;