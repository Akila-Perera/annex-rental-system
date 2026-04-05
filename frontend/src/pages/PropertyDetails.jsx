import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [quality, setQuality] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPropertyData();
  }, [id]);

  const fetchPropertyData = async () => {
    try {
      console.log('Fetching for property ID:', id);
      
      // Fetch quality score
      const qualityRes = await api.get(`/quality/property/${id}`);
      console.log('Quality response:', qualityRes.data);
      
      if (qualityRes.data.qualityScore) {
        const qualityData = qualityRes.data.qualityScore;
        setQuality(qualityData);
        
        // The property is inside qualityScore
        if (qualityData.property) {
          setProperty(qualityData.property);
        }
      }
      
      // Fetch reviews
      const reviewsRes = await api.get(`/reviews/property/${id}`);
      setReviews(reviewsRes.data.reviews || []);
      
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading property details...</div>;
  }

  if (!property) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Property not found</p>
        <Link to="/properties" style={{ color: '#667eea' }}>← Back to Properties</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      {/* Property Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#333', marginBottom: '0.5rem' }}>{property.title}</h1>
        <p style={{ color: '#666' }}>📍 {property.location?.city || 'Location N/A'}</p>
        <p style={{ fontSize: '1.5rem', color: '#27ae60', marginTop: '1rem' }}>
          ${property.price}<span style={{ fontSize: '1rem', color: '#666' }}>/month</span>
        </p>
      </div>

      {/* Quality Score Section */}
      {quality && (
        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Quality Score</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>
              {quality.overallScore || 0}
            </span>
            <div style={{ color: '#f39c12', fontSize: '1.2rem' }}>
              {renderStars(Math.round(quality.overallScore || 0))}
            </div>
            <span style={{ color: '#666' }}>({quality.totalReviews || 0} reviews)</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {quality.categoryScores && Object.entries(quality.categoryScores).map(([key, value]) => (
              <div key={key}>
                <span style={{ color: '#555', fontSize: '0.9rem' }}>{key}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ flex: 1, height: '8px', background: '#e0e0e0', borderRadius: '4px' }}>
                    <div style={{ width: `${(value || 0) * 20}%`, height: '100%', background: '#f39c12', borderRadius: '4px' }}></div>
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#f39c12' }}>{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write Review Button */}
      <div style={{ marginBottom: '2rem', textAlign: 'right' }}>
        <Link to={`/write-review/${id}`} style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          textDecoration: 'none',
          display: 'inline-block'
        }}>
          ✍️ Write a Review
        </Link>
      </div>

      {/* Reviews Section */}
      <h2 style={{ marginBottom: '1.5rem' }}>Reviews</h2>
      
      {reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#f8f9fa', borderRadius: '12px' }}>
          <p>No reviews yet. Be the first to review this property!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reviews.map(review => (
            <div key={review._id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div>
                  <strong style={{ fontSize: '1rem' }}>{review.student?.name || 'Anonymous'}</strong>
                  <span style={{ color: '#999', fontSize: '0.85rem', marginLeft: '0.5rem' }}>• {formatDate(review.createdAt)}</span>
                </div>
                <div style={{ color: '#f39c12' }}>{renderStars(review.ratings?.overall || 0)}</div>
              </div>
              <h4 style={{ margin: '0.5rem 0', color: '#333' }}>{review.title}</h4>
              <p style={{ color: '#555', lineHeight: '1.6' }}>{review.comment}</p>
              
              {review.pros?.length > 0 && (
                <div style={{ marginTop: '0.5rem', color: '#27ae60', fontSize: '0.9rem' }}>
                  <strong>✓ Pros:</strong> {review.pros.join(', ')}
                </div>
              )}
              {review.cons?.length > 0 && (
                <div style={{ marginTop: '0.25rem', color: '#e74c3c', fontSize: '0.9rem' }}>
                  <strong>✗ Cons:</strong> {review.cons.join(', ')}
                </div>
              )}
              
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer' }}>
                  👍 Helpful ({review.helpfulCount || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;