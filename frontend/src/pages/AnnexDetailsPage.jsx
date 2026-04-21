import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const API_BASE = 'http://localhost:5000';

// ─── Placeholder images ───────────────
const PLACEHOLDER = 'https://placehold.co/800x500/0a1429/1e3a6e?text=No+Photo';

// ========== STARRATING COMPONENT ==========
const StarRating = ({ rating, setRating, readonly = false }) => {
  const [hover, setHover] = useState(null);

  return (
    <div style={{ display: 'flex', gap: '0.2rem' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && setRating(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(null)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: readonly ? 'default' : 'pointer',
            color: (hover || rating) >= star ? '#FFD700' : '#E0E0E0',
            transition: 'color 0.2s'
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
};

// ========== DETAILED RATINGS WITH VIEW MORE ==========
const DetailsRatings = ({ ratings }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const ratingCategories = [
    { key: 'cleanliness', label: 'Cleanliness', icon: '🧹' },
    { key: 'communication', label: 'Communication', icon: '💬' },
    { key: 'valueForMoney', label: 'Value for Money', icon: '💰' },
    { key: 'location', label: 'Location', icon: '📍' },
    { key: 'amenities', label: 'Amenities', icon: '🏊' }
  ];
  
  if (!ratings) return null;
  
  return (
    <div className="mt-3 pt-2 border-t border-gray-700/50">
      <button 
        onClick={() => setShowDetails(!showDetails)}
        className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
      >
        {showDetails ? '▼ View Less' : '▶ View More'}
      </button>
      
      {showDetails && (
        <div className="mt-2 grid grid-cols-1 gap-1">
          {ratingCategories.map(cat => (
            <div key={cat.key} className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{cat.icon} {cat.label}</span>
              <div className="flex items-center gap-1">
                <div className="text-yellow-400 text-xs">
                  {'★'.repeat(ratings[cat.key] || 0)}{'☆'.repeat(5 - (ratings[cat.key] || 0))}
                </div>
                <span className="text-xs text-gray-500">({ratings[cat.key] || 0})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ========== WRITE REVIEW COMPONENT ==========
const WriteReviewModal = ({ propertyId, propertyTitle, onClose, onSuccess }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    bookingId: '',
    propertyId: propertyId || '',
    ratings: {
      overall: 0,
      cleanliness: 0,
      communication: 0,
      valueForMoney: 0,
      location: 0,
      amenities: 0
    },
    title: '',
    comment: '',
    pros: [''],
    cons: ['']
  });

  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [aiEnhancing, setAiEnhancing] = useState(false); // ✅ ADDED

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get('/bookings/completed');
        const bookings = response.data.bookings || [];
        
        const filtered = bookings.filter(
          booking => booking.property?._id === propertyId
        );
        setFilteredBookings(filtered);
        
        if (filtered.length === 1) {
          setFormData(prev => ({
            ...prev,
            bookingId: filtered[0]._id,
            propertyId: propertyId
          }));
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };
    if (propertyId) {
      fetchBookings();
    }
  }, [propertyId]);

  const validate = () => {
    const newErrors = {};

    if (formData.ratings.overall === 0) newErrors.overall = 'Please rate your overall experience';
    if (formData.ratings.cleanliness === 0) newErrors.cleanliness = 'Please rate cleanliness';
    if (formData.ratings.communication === 0) newErrors.communication = 'Please rate communication';
    if (formData.ratings.valueForMoney === 0) newErrors.valueForMoney = 'Please rate value for money';
    if (formData.ratings.location === 0) newErrors.location = 'Please rate location';
    if (formData.ratings.amenities === 0) newErrors.amenities = 'Please rate amenities';

    if (!formData.title) {
      newErrors.title = 'Review title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.comment) {
      newErrors.comment = 'Review comment is required';
    } else if (formData.comment.length < 20) {
      newErrors.comment = 'Comment must be at least 20 characters';
    }

    return newErrors;
  };

  const handleRatingChange = (category, value) => {
    setFormData({
      ...formData,
      ratings: {
        ...formData.ratings,
        [category]: value
      }
    });
    if (errors[category]) {
      setErrors({ ...errors, [category]: '' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleBookingSelect = (e) => {
    const bookingId = e.target.value;
    const selectedBooking = filteredBookings.find(b => b._id === bookingId);
    setFormData({
      ...formData,
      bookingId,
      propertyId: selectedBooking?.property?._id || propertyId
    });
    if (errors.bookingId) {
      setErrors({ ...errors, bookingId: '' });
    }
  };

  const handleProsConsChange = (type, index, value) => {
    const newArray = [...formData[type]];
    newArray[index] = value;
    setFormData({
      ...formData,
      [type]: newArray
    });
  };

  const addProsConsField = (type) => {
    setFormData({
      ...formData,
      [type]: [...formData[type], '']
    });
  };

  const removeProsConsField = (type, index) => {
    if (formData[type].length > 1) {
      const newArray = formData[type].filter((_, i) => i !== index);
      setFormData({
        ...formData,
        [type]: newArray
      });
    }
  };

  // ✅ AI ENHANCEMENT FUNCTION
  const handleAIEnhance = async () => {
    if (!formData.comment.trim()) {
      alert('Please write something before enhancing.');
      return;
    }

    setAiEnhancing(true);
    
    try {
      const response = await api.post('/ai/enhance-review', {
        reviewText: formData.comment
      });
      
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          comment: response.data.enhancedText
        }));
        alert('✨ Review enhanced successfully!');
      } else {
        alert('Failed to enhance review. Please try again.');
      }
    } catch (error) {
      console.error('AI Enhancement error:', error);
      alert('AI service temporarily unavailable. Please try again later.');
    } finally {
      setAiEnhancing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      const pros = formData.pros.filter(p => p.trim() !== '');
      const cons = formData.cons.filter(c => c.trim() !== '');
      
      const reviewData = {
        bookingId: formData.bookingId || null,
        propertyId: propertyId,
        ratings: formData.ratings,
        title: formData.title,
        comment: formData.comment,
        pros: pros,
        cons: cons
      };
      
      console.log('Submitting review:', reviewData);
      
      const response = await api.post('/reviews', reviewData);
      
      if (response.data.success) {
        alert('✅ Review submitted successfully! It will appear immediately.');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert('❌ Failed to submit review: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('❌ Failed to submit review: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
      <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-semibold">
            Write a Review for {propertyTitle}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {filteredBookings.length > 0 && (
            <div className="mb-4 p-4 rounded-lg bg-[#0d1526]">
              <h3 className="text-gray-300 text-sm mb-2">Select Your Completed Booking (Optional)</h3>
              
              {filteredBookings.length === 1 ? (
                <div className="p-2 bg-green-900/30 rounded-lg text-green-400 text-sm">
                  ✓ Booking automatically selected for <strong>{filteredBookings[0]?.property?.title}</strong>
                </div>
              ) : (
                <select
                  value={formData.bookingId}
                  onChange={handleBookingSelect}
                  className="w-full p-2 rounded-lg bg-[#0a0f1a] border border-gray-700 text-white text-sm"
                >
                  <option value="">-- Choose a booking (optional) --</option>
                  {filteredBookings.map(booking => (
                    <option key={booking._id} value={booking._id}>
                      {booking.property?.title} - {new Date(booking.checkInDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="mb-4">
            <h3 className="text-gray-300 text-sm mb-2">Rate Your Stay</h3>
            <div className="space-y-3">
              {['overall', 'cleanliness', 'communication', 'valueForMoney', 'location', 'amenities'].map(category => (
                <div key={category}>
                  <label className="text-gray-400 text-xs capitalize mb-1 block">
                    {category.replace(/([A-Z])/g, ' $1').trim()} *
                  </label>
                  <StarRating 
                    rating={formData.ratings[category]} 
                    setRating={(value) => handleRatingChange(category, value)} 
                  />
                  {errors[category] && <p className="text-red-400 text-xs mt-1">{errors[category]}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-gray-400 text-xs block mb-1">Review Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Summarize your experience"
              className="w-full p-2 rounded-lg bg-[#0a0f1a] border border-gray-700 text-white text-sm"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* ✅ UPDATED COMMENT SECTION WITH AI BUTTON */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-gray-400 text-xs block">Your Review *</label>
              <button
                type="button"
                onClick={handleAIEnhance}
                disabled={aiEnhancing || !formData.comment.trim()}
                className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-1 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiEnhancing ? '⏳ Enhancing...' : '✨ Enhance with AI'}
              </button>
            </div>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              placeholder="Tell us about your experience..."
              rows="4"
              className="w-full p-2 rounded-lg bg-[#0a0f1a] border border-gray-700 text-white text-sm resize-vertical"
            />
            {errors.comment && <p className="text-red-400 text-xs mt-1">{errors.comment}</p>}
          </div>

          <div className="mb-4">
            <label className="text-gray-400 text-xs block mb-1">What did you like? (Optional)</label>
            {formData.pros.map((pro, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={pro}
                  onChange={(e) => handleProsConsChange('pros', index, e.target.value)}
                  placeholder="e.g., Clean room, Great location"
                  className="flex-1 p-2 rounded-lg bg-[#0a0f1a] border border-gray-700 text-white text-sm"
                />
                {formData.pros.length > 1 && (
                  <button type="button" onClick={() => removeProsConsField('pros', index)} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addProsConsField('pros')} className="text-blue-400 text-sm hover:text-blue-300">+ Add another pro</button>
          </div>

          <div className="mb-4">
            <label className="text-gray-400 text-xs block mb-1">What could be improved? (Optional)</label>
            {formData.cons.map((con, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={con}
                  onChange={(e) => handleProsConsChange('cons', index, e.target.value)}
                  placeholder="e.g., Noisy at night, Small kitchen"
                  className="flex-1 p-2 rounded-lg bg-[#0a0f1a] border border-gray-700 text-white text-sm"
                />
                {formData.cons.length > 1 && (
                  <button type="button" onClick={() => removeProsConsField('cons', index)} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addProsConsField('cons')} className="text-blue-400 text-sm hover:text-blue-300">+ Add another con</button>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-600">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AnnexDetailsPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const { user } = useAuth();

  const [annex, setAnnex] = useState(state?.annex || null);
  const [loading, setLoading] = useState(!state?.annex);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [roomType, setRoomType] = useState('Single Room');
  const [leasePeriod, setLeasePeriod] = useState('Full Semester (5 Months)');
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySending, setInquirySending] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState('');
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [quality, setQuality] = useState(null);
  const [reviews, setReviews] = useState([]);

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString();
  };

  const fetchPropertyData = async () => {
    if (!annex?._id) return;
    
    try {
      const reviewsRes = await api.get(`/reviews/property/${annex._id}`);
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
    
    try {
      const qualityRes = await api.get(`/quality/property/${annex._id}`);
      if (qualityRes.data.qualityScore) {
        setQuality(qualityRes.data.qualityScore);
      }
    } catch (qualityError) {
      console.log('Quality API not available');
    }
  };

  // DELETE REVIEW FUNCTION
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      if (response.data.success) {
        alert('✅ Review deleted successfully!');
        fetchPropertyData(); // Refresh the reviews list
      } else {
        alert('❌ Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('❌ Failed to delete review');
    }
  };

  // Calculate rating percentages from actual reviews - FIXED
  const getRatingPercentages = () => {
    if (reviews.length === 0) {
      return [
        { label: '5 Star', pct: 0, count: 0 },
        { label: '4 Star', pct: 0, count: 0 },
        { label: '3 Star', pct: 0, count: 0 },
        { label: '2 Star', pct: 0, count: 0 },
        { label: '1 Star', pct: 0, count: 0 }
      ];
    }
    
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const rating = review.ratings?.overall || 0;
      if (rating >= 1 && rating <= 5) counts[Math.floor(rating)]++;
    });
    
    return [5, 4, 3, 2, 1].map(star => ({
      label: `${star} Star`,
      pct: (counts[star] / reviews.length) * 100,
      count: counts[star]
    }));
  };

  // Calculate average rating from reviews - FIXED
  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + (review.ratings?.overall || 0), 0);
    return (sum / reviews.length).toFixed(1);
  };

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

  useEffect(() => {
    if (annex?._id) {
      fetchPropertyData();
    }
  }, [annex?._id]);

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

  const handleOpenInquiry = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setInquiryError('');
    setInquirySuccess('');
    setShowInquiryModal(true);
  };

  const handleSendInquiry = async () => {
    if (!inquiryMessage.trim()) {
      setInquiryError('Please enter a message to send to the owner.');
      return;
    }
    setInquirySending(true);
    setInquiryError('');
    setInquirySuccess('');
    try {
      const res = await api.post('/inquiries', {
        annexId: annex._id,
        message: inquiryMessage,
      });
      if (res.data?.success) {
        setInquirySuccess('Inquiry sent to the annex owner. They will reply to you soon.');
        setInquiryMessage('');
      } else {
        setInquiryError(res.data?.message || 'Failed to send inquiry.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Server error while sending inquiry.';
      setInquiryError(msg);
    } finally {
      setInquirySending(false);
    }
  };

  const handleOpenReviewModal = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowReviewModal(true);
  };

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

  const ratingPercentages = getRatingPercentages();
  const averageRating = getAverageRating();

  return (
    <div className="min-h-screen bg-[#060f1e] text-gray-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {showReviewModal && (
        <WriteReviewModal 
          propertyId={annex._id}
          propertyTitle={annex.title}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            fetchPropertyData();
            setShowReviewModal(false);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-1 text-xs text-gray-500 flex items-center gap-1.5">
        <a href="#" className="hover:text-gray-300 transition">Home</a>
        <span>›</span>
        <Link to="/searchAnnex" className="hover:text-gray-300 transition">Annexes</Link>
        <span>›</span>
        <span className="text-gray-300">{annex.title}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">

        <div className="relative rounded-2xl overflow-hidden grid grid-cols-4 grid-rows-2 gap-2 h-[420px]">
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
            ★ {averageRating}
            <span className="text-gray-400 font-normal">({reviews.length} reviews)</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="w-9 h-9 rounded-full border border-[#1f2f4f] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#3a5a9f] transition text-sm">↗</button>
            <button className="w-9 h-9 rounded-full border border-[#1f2f4f] flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/40 transition text-sm">♡</button>
          </div>
        </div>

        <h1 style={{ fontFamily: "'Syne', sans-serif" }} className="text-3xl md:text-4xl font-bold text-white leading-tight">
          {annex.title}
        </h1>
        <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
          <span>📍</span> {annex.selectedAddress || 'Address not provided'}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

          <div className="lg:col-span-2 space-y-6">

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '🎓', label: 'LISTING TYPE', value: listingType },
                { icon: '🚻', label: 'OCCUPANCY', value: annex.preferredGender || 'Any Gender' },
                { icon: '🏠', label: 'NUMBER OF ROOMS', value: annex.roomCount || '1' },
                { icon: '👥', label: 'CAPACITY', value: `${annex.studentsPerRoom || '1'} Student(s) per room` },
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

            <Section title="About this Annex">
              <p className="text-gray-300 leading-7 text-sm">
                {annex.description || 'No description provided.'}
              </p>
            </Section>

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

            <Section title="Student Reviews">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="text-center shrink-0">
                  <p className="text-6xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {averageRating}
                  </p>
                  <div className="flex justify-center gap-0.5 text-yellow-400 text-lg mt-1">
                    {renderStars(Math.round(averageRating))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Based on {reviews.length} reviews</p>
                </div>
                <div className="flex-1 space-y-2 w-full">
                  {ratingPercentages.map(({ label, pct, count }) => (
                    <div key={label} className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="w-12 shrink-0">{label}</span>
                      <div className="flex-1 bg-[#0f1e38] rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right">{Math.round(pct)}%</span>
                      <span className="w-8 text-right text-gray-600">({count})</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleOpenReviewModal}
                  className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition shrink-0"
                >
                  ✍️ Write a review
                </button>
              </div>

              <div className="mt-5 space-y-5 divide-y divide-[#111e35]">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No reviews yet. Be the first to write one!
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review._id} className="pt-5 first:pt-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-sm font-bold">
                            {review.student?.firstName?.[0] || review.student?.name?.[0] || 'A'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-100">
                              {review.student?.firstName && review.student?.lastName 
                                ? `${review.student.firstName} ${review.student.lastName}`
                                : review.student?.email?.split('@')[0] || 'Student'}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-yellow-400 text-sm">
                            {renderStars(review.ratings?.overall || 0)}
                          </div>
                          {user && review.student?._id === user.id && (
                            <button
                              onClick={() => handleDeleteReview(review._id)}
                              className="text-red-400 hover:text-red-300 transition text-sm ml-2"
                              title="Delete your review"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-2">{review.title}</h4>
                      <p className="text-sm text-gray-400 leading-6 mt-1">"{review.comment}"</p>
                      
                      <DetailsRatings ratings={review.ratings} />
                      
                      {review.pros?.length > 0 && review.pros[0] !== '' && (
                        <div className="mt-2 text-xs text-green-400">
                          <strong>✓ Pros:</strong> {review.pros.filter(p => p.trim()).join(', ')}
                        </div>
                      )}
                      {review.cons?.length > 0 && review.cons[0] !== '' && (
                        <div className="mt-1 text-xs text-red-400">
                          <strong>✗ Cons:</strong> {review.cons.filter(c => c.trim()).join(', ')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Section>
          </div>

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
                <button
                  type="button"
                  onClick={handleOpenInquiry}
                  className="w-full bg-transparent border border-[#1f3058] hover:border-blue-500 text-gray-300 hover:text-white font-semibold py-3 rounded-xl transition text-sm"
                >
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

              <div className="bg-[#0b1628] border border-[#1a2e50] rounded-2xl overflow-hidden">
                <div className="h-36 bg-[#0a1429] relative flex items-center justify-center">
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

              <div className="bg-[#0b1628] border border-[#1a2e50] rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-lg font-bold shrink-0">{ownerInitial}</div>
                <div>
                  {showInquiryModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                      <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-white text-lg font-semibold mb-2">Send Inquiry to Owner</h3>
                        <p className="text-gray-400 text-xs mb-3">
                          Ask a question about this annex, availability, rules, or anything else before you book.
                        </p>
                        <textarea
                          rows={4}
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 mb-3"
                          placeholder="Type your message here..."
                        />
                        {inquiryError && (
                          <p className="text-xs text-red-400 mb-2">{inquiryError}</p>
                        )}
                        {inquirySuccess && (
                          <p className="text-xs text-green-400 mb-2">{inquirySuccess}</p>
                        )}
                        <div className="flex gap-2 justify-end mt-2">
                          <button
                            type="button"
                            onClick={() => setShowInquiryModal(false)}
                            className="px-4 py-2 rounded-xl border border-[#1f2a3c] text-gray-300 hover:text-white text-sm"
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={handleSendInquiry}
                            disabled={inquirySending}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-60"
                          >
                            {inquirySending ? 'Sending...' : 'Send Message'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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