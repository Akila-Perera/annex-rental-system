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
  
  // Status message state (for success or error messages)
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
    e.preventDefault(); // Prevent page refresh

    if (!user?.id) {
      setMessage('❌ Please log in as an annex owner before adding a listing.');
      return;
    }

    const features = featuresInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const rulesAndConditions = rulesInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    
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
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await axios.post('http://localhost:5000/api/annexes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setMessage('✅ Annex successfully added to the system!');
        // Clear the form
        setTitle('');
        setPrice('');
        setDescription('');
        setPreferredGender('Any');
        setFeaturesInput('');
        setRulesInput('');
        setImageFiles([]);
        setImagePreviews([]);
        setSelectedAddress('');
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
            <label className="block text-sm font-semibold text-gray-700">Features</label>
            <textarea
              rows="3"
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              className="w-full p-2.5 mt-1 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="High-speed WiFi, Full air conditioning, Attached bathroom"
            />
            <p className="text-xs text-gray-500 mt-1">Enter features separated by commas.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Rules & Conditions</label>
            <textarea
              rows="3"
              value={rulesInput}
              onChange={(e) => setRulesInput(e.target.value)}
              className="w-full p-2.5 mt-1 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="No smoking, No loud music after 10 PM, Advance payment required"
            />
            <p className="text-xs text-gray-500 mt-1">Enter rules separated by commas.</p>
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

          <div>
            <label className="block text-sm font-semibold text-gray-700">Annex Photos (up to 5)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []).slice(0, 5);
                setImageFiles(files);
                setImagePreviews(files.map((file) => URL.createObjectURL(file)));
              }}
              className="w-full p-2.5 mt-1 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">You can select 1 to 5 images.</p>
            {imagePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {imagePreviews.map((preview, index) => (
                  <img
                    key={preview}
                    src={preview}
                    alt={`Selected annex preview ${index + 1}`}
                    className="w-full h-28 object-cover rounded-md border border-gray-300"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-200 p-3 rounded-md text-sm text-gray-700 border border-gray-300">
            <strong className="block mb-1 text-gray-900">Selected Coordinates:</strong>
            Lat: {pinLocation.lat.toFixed(4)} <br />
            Lng: {pinLocation.lng.toFixed(4)}
            {selectedAddress && (
              <>
                <br />
                <strong className="block mt-2 mb-1 text-gray-900">Selected Location:</strong>
                {selectedAddress}
              </>
            )}
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