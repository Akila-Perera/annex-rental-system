import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

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

const WriteReview = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
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

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!propertyId) {
      newErrors.propertyId = 'Property ID is required';
    }

    if (formData.ratings.overall === 0) {
      newErrors.overall = 'Please rate your overall experience';
    }
    if (formData.ratings.cleanliness === 0) {
      newErrors.cleanliness = 'Please rate cleanliness';
    }
    if (formData.ratings.communication === 0) {
      newErrors.communication = 'Please rate communication';
    }
    if (formData.ratings.valueForMoney === 0) {
      newErrors.valueForMoney = 'Please rate value for money';
    }
    if (formData.ratings.location === 0) {
      newErrors.location = 'Please rate location';
    }
    if (formData.ratings.amenities === 0) {
      newErrors.amenities = 'Please rate amenities';
    }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setLoading(true);
    
    try {
      const pros = formData.pros.filter(p => p.trim() !== '');
      const cons = formData.cons.filter(c => c.trim() !== '');
      
      const reviewData = {
        propertyId: propertyId,  // Send propertyId from URL
        ratings: formData.ratings,
        title: formData.title,
        comment: formData.comment,
        pros: pros,
        cons: cons
      };
      
      console.log('Submitting review:', reviewData);
      
      const response = await api.post('/reviews', reviewData);
      
      if (response.data.success) {
        alert('✅ Review submitted successfully! It will be reviewed by admin.');
        navigate(`/property/${propertyId}`);
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
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <h1 style={{ color: '#333', marginBottom: '2rem' }}>
        Write a Review
      </h1>
      
      <form onSubmit={handleSubmit}>
        {/* Ratings Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#555' }}>Rate Your Stay</h3>
          
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {['overall', 'cleanliness', 'communication', 'valueForMoney', 'location', 'amenities'].map(category => (
              <div key={category}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', textTransform: 'capitalize' }}>
                  {category.replace(/([A-Z])/g, ' $1').trim()} *
                </label>
                <StarRating 
                  rating={formData.ratings[category]} 
                  setRating={(value) => handleRatingChange(category, value)} 
                />
                {errors[category] && (
                  <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    {errors[category]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Review Title */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Review Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Summarize your experience"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `2px solid ${errors.title ? '#ff6b6b' : '#e0e0e0'}`,
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          {errors.title && (
            <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {errors.title}
            </p>
          )}
        </div>

        {/* Review Comment */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Your Review *
          </label>
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            placeholder="Tell us about your experience..."
            rows="6"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `2px solid ${errors.comment ? '#ff6b6b' : '#e0e0e0'}`,
              borderRadius: '8px',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
          {errors.comment && (
            <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {errors.comment}
            </p>
          )}
          <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {formData.comment.length}/1000 characters (minimum 20)
          </p>
        </div>

        {/* Pros Section */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            What did you like? (Optional)
          </label>
          {formData.pros.map((pro, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={pro}
                onChange={(e) => handleProsConsChange('pros', index, e.target.value)}
                placeholder="e.g., Clean room, Great location"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              {formData.pros.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProsConsField('pros', index)}
                  style={{
                    padding: '0.75rem',
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addProsConsField('pros')}
            style={{
              padding: '0.5rem 1rem',
              background: 'none',
              border: '2px dashed #667eea',
              color: '#667eea',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            + Add another pro
          </button>
        </div>

        {/* Cons Section */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            What could be improved? (Optional)
          </label>
          {formData.cons.map((con, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={con}
                onChange={(e) => handleProsConsChange('cons', index, e.target.value)}
                placeholder="e.g., Noisy at night, Small kitchen"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              {formData.cons.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProsConsField('cons', index)}
                  style={{
                    padding: '0.75rem',
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addProsConsField('cons')}
            style={{
              padding: '0.5rem 1rem',
              background: 'none',
              border: '2px dashed #667eea',
              color: '#667eea',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            + Add another con
          </button>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '0.75rem 2rem',
              background: '#e0e0e0',
              color: '#666',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WriteReview;