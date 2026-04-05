import { useState } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';

function AddAnnexPage() {
  // Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [preferredGender, setPreferredGender] = useState('Any');
  
  // Location State (Default to SLIIT Malabe area)
  const [pinLocation, setPinLocation] = useState({ lat: 6.9147, lng: 79.9723 });
  
  // Status message state (for success or error messages)
  const [message, setMessage] = useState('');

  // Handle Map Click to move the pin
  const handleMapClick = (e) => {
    setPinLocation({
      lng: e.lngLat.lng,
      lat: e.lngLat.lat
    });
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh
    
    // Format the data exactly how your MongoDB schema expects it!
    const newAnnexData = {
      title: title,
      price: Number(price),
      description: description,
      preferredGender: preferredGender,
      tags: ["New"], 
      location: {
        type: "Point",
        coordinates: [pinLocation.lng, pinLocation.lat]
      }
    };

    try {
      const response = await axios.post('http://localhost:5000/api/annexes', newAnnexData);
      
      if (response.data.success) {
        setMessage('✅ Annex successfully added to the system!');
        // Clear the form
        setTitle('');
        setPrice('');
        setDescription('');
      }
    } catch (error) {
      console.error("Error adding annex:", error);
      setMessage('❌ Failed to add annex. Please try again.');
    }
  };

  return (
    <div className="flex h-screen font-sans text-gray-800">
      
      {/* LEFT SIDE: Form */}
      <div className="w-[400px] p-8 bg-gray-50 overflow-y-auto shadow-lg z-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add a New Annex</h2>
        <p className="text-sm text-gray-600 mb-6">Fill in the details and click on the map to set your location.</p>

        {message && (
          <div className={`p-3 mb-6 rounded-md text-sm ${message.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700">Title / Name of Annex</label>
            <input 
              type="text" required value={title} onChange={(e) => setTitle(e.target.value)} 
              className="w-full p-2.5 mt-1 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., Luxury AC Room in Malabe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Monthly Price (LKR)</label>
            <input 
              type="number" required value={price} onChange={(e) => setPrice(e.target.value)} 
              className="w-full p-2.5 mt-1 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., 20000"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Description</label>
            <textarea 
              rows="4" required value={description} onChange={(e) => setDescription(e.target.value)} 
              className="w-full p-2.5 mt-1 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Describe the facilities, rules, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Allowed Gender</label>
            <select 
              value={preferredGender} onChange={(e) => setPreferredGender(e.target.value)} 
              className="w-full p-2.5 mt-1 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            >
              <option value="Any">Any (Boys & Girls)</option>
              <option value="Male">Male Only</option>
              <option value="Female">Female Only</option>
            </select>
          </div>

          <div className="bg-gray-200 p-3 rounded-md text-sm text-gray-700 border border-gray-300">
            <strong className="block mb-1 text-gray-900">Selected Coordinates:</strong>
            Lat: {pinLocation.lat.toFixed(4)} <br />
            Lng: {pinLocation.lng.toFixed(4)}
          </div>

          <button 
            type="submit" 
            className="w-full p-3 mt-2 bg-green-600 hover:bg-green-700 text-white rounded-md cursor-pointer text-base font-bold transition-colors duration-200 shadow-sm"
          >
            Submit Property
          </button>
        </form>
      </div>

      {/* RIGHT SIDE: Interactive Map */}
      <div className="flex-1 relative">
        <Map
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          initialViewState={{
            longitude: pinLocation.lng,
            latitude: pinLocation.lat,
            zoom: 14
          }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onClick={handleMapClick} 
          cursor="crosshair"
        >
          <Marker 
            longitude={pinLocation.lng} 
            latitude={pinLocation.lat} 
            color="#ef4444" // Tailwind red-500
          />
        </Map>
      </div>
    </div>
  );
}

export default AddAnnexPage;