import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/quality/properties');
      setProperties(response.data.properties || []);
    } catch (err) {
      setError('Failed to load properties');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} style={{color: '#FFD700'}}>★</span>);
      } else {
        stars.push(<span key={i} style={{color: '#E0E0E0'}}>★</span>);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div style={{textAlign: 'center', padding: '3rem'}}>
        <p>Loading properties...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{textAlign: 'center', padding: '3rem', color: '#e74c3c'}}>
        <p>{error}</p>
        <button 
          onClick={fetchProperties}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{padding: '2rem', maxWidth: '1200px', margin: '0 auto'}}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem' 
      }}>
        <h1 style={{ color: '#333' }}>Student Accommodations</h1>
        
        <Link 
          to="/write-review"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          ✍️ Write a Review
        </Link>
      </div>
      
      {properties.length === 0 ? (
        <div style={{textAlign: 'center', padding: '3rem', color: '#666'}}>
          No properties found
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '2rem'
        }}>
          {properties.map((item) => {
            const property = item.property || {};
            return (
              <div
                key={item._id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  padding: '1.5rem'
                }}
              >
                <div style={{
                  height: '150px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '3rem'
                }}>
                  🏠
                </div>
                
                <h3 style={{margin: '0 0 0.5rem 0', color: '#333'}}>{property.title || 'Unknown'}</h3>
                <p style={{color: '#666', marginBottom: '1rem'}}>📍 {property.location?.city || 'Location N/A'}</p>
                
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
                  <span style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#333'}}>
                    {item.overallScore || 0}
                  </span>
                  <div style={{display: 'flex', gap: '0.2rem'}}>
                    {renderStars(item.overallScore)}
                  </div>
                  <span style={{color: '#666', fontSize: '0.9rem'}}>
                    ({item.totalReviews || 0} reviews)
                  </span>
                </div>

                {/* Category Scores */}
                <div style={{marginBottom: '1rem'}}>
                  {item.categoryScores && Object.entries(item.categoryScores).map(([key, value]) => (
                    <div key={key} style={{
                      display: 'grid',
                      gridTemplateColumns: '100px 1fr 30px',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem'
                    }}>
                      <span style={{color: '#555'}}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                      <div style={{
                        height: '6px',
                        background: '#f0f0f0',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(value || 0) * 20}%`,
                          background: '#667eea',
                          borderRadius: '3px'
                        }}></div>
                      </div>
                      <span style={{color: '#667eea', fontWeight: 'bold'}}>{value || 0}</span>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '2px solid #f0f0f0'
                }}>
                  <span style={{fontSize: '1.3rem', fontWeight: 'bold', color: '#27ae60'}}>
                    ${property.price || 0}<span style={{fontSize: '0.9rem', fontWeight: 'normal', color: '#666'}}>/month</span>
                  </span>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link 
                      to={`/write-review/${item.property?._id}`}
                      style={{
                        background: '#27ae60',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        display: 'inline-block'
                      }}
                    >
                      ✍️ Review
                    </Link>
                    
                    <Link 
                      to={`/property/${item.property?._id}`}
                      style={{
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        display: 'inline-block'
                      }}
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Properties;