import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';  // ← ADD THIS
import api from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();  // ← ADD THIS
  const [activeTab, setActiveTab] = useState('pending');
  const [reviews, setReviews] = useState({
    pending: [],
    approved: [],
    rejected: [],
    flagged: []
  });
  const [stats, setStats] = useState({
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    rejectedReviews: 0,
    flaggedReviews: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ✅ ADD THIS ADMIN AUTHENTICATION CHECK
  useEffect(() => {
    const isAdmin = localStorage.getItem('uninest_admin');
    if (!isAdmin || isAdmin !== 'true') {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch moderation queue
  const fetchModerationQueue = useCallback(async () => {
    try {
      console.log(`Fetching ${activeTab} reviews...`);
      const response = await api.get(`/admin/reviews?status=${activeTab}`);
      console.log(`${activeTab} reviews:`, response.data);
      
      setReviews(prev => ({
        ...prev,
        [activeTab]: response.data.reviews || []
      }));
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  }, [activeTab]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      console.log('Fetching stats...');
      const response = await api.get('/admin/stats');
      console.log('Stats:', response.data);
      
      setStats(response.data.stats || {});
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await fetchStats();
      await fetchModerationQueue();
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchModerationQueue]);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Refetch when tab changes
  useEffect(() => {
    if (!loading) {
      fetchModerationQueue();
    }
  }, [activeTab, loading, fetchModerationQueue]);

  // Approve review
  const handleApprove = async (reviewId) => {
    try {
      const response = await api.put(`/admin/reviews/${reviewId}/approve`, {
        moderationNotes: 'Approved by admin'
      });
      
      if (response.data.success) {
        alert('✅ Review approved successfully!');
        fetchAllData();
      }
    } catch (err) {
      alert('❌ Failed to approve review');
      console.error('Error:', err);
    }
  };

  // Reject review
  const handleReject = async (reviewId) => {
    const reason = prompt('Please enter reason for rejection:');
    if (!reason) return;
    
    try {
      const response = await api.put(`/admin/reviews/${reviewId}/reject`, {
        moderationNotes: reason
      });
      
      if (response.data.success) {
        alert('✅ Review rejected successfully!');
        fetchAllData();
      }
    } catch (err) {
      alert('❌ Failed to reject review');
      console.error('Error:', err);
    }
  };

  // Flag review
  const handleFlag = async (reviewId) => {
    const reason = prompt('Please enter reason for flagging:');
    if (!reason) return;
    
    try {
      const response = await api.put(`/admin/reviews/${reviewId}/flag`, {
        moderationNotes: reason
      });
      
      if (response.data.success) {
        alert('🚩 Review flagged successfully!');
        fetchAllData();
      }
    } catch (err) {
      alert('❌ Failed to flag review');
      console.error('Error:', err);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#e74c3c' }}>
        <p>{error}</p>
        <button 
          onClick={fetchAllData}
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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#333', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
        <p style={{ color: '#666' }}>Moderate reviews and monitor quality scores</p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>{stats.totalReviews || 0}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Total Reviews</div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>{stats.pendingReviews || 0}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Pending</div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>{stats.approvedReviews || 0}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Approved</div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>{stats.rejectedReviews || 0}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Rejected</div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e67e22' }}>{stats.flaggedReviews || 0}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Flagged</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        borderBottom: '2px solid #e0e0e0',
        marginBottom: '2rem',
        overflowX: 'auto'
      }}>
        {['pending', 'approved', 'rejected', 'flagged'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '3px solid #667eea' : 'none',
              color: activeTab === tab ? '#667eea' : '#666',
              fontWeight: activeTab === tab ? '600' : '400',
              cursor: 'pointer',
              fontSize: '1rem',
              textTransform: 'capitalize'
            }}
          >
            {tab} ({stats[`${tab}Reviews`] || 0})
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {reviews[activeTab].length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'white',
            borderRadius: '12px',
            color: '#666'
          }}>
            No {activeTab} reviews found
          </div>
        ) : (
          reviews[activeTab].map(review => (
            <div
              key={review._id}
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#333' }}>{review.property?.title || 'Unknown Property'}</h3>
                  <p style={{ margin: '0.5rem 0 0', color: '#666' }}>
                    By: {review.student?.firstName && review.student?.lastName 
  ? `${review.student.firstName} ${review.student.lastName}`
  : review.student?.name || 'Unknown'} • {formatDate(review.createdAt)}
                  </p>
                </div>
                <div style={{ 
                  background: activeTab === 'pending' ? '#fff3cd' : 
                             activeTab === 'approved' ? '#d4edda' : 
                             activeTab === 'rejected' ? '#f8d7da' : '#ffe5cc',
                  color: activeTab === 'pending' ? '#856404' : 
                         activeTab === 'approved' ? '#155724' : 
                         activeTab === 'rejected' ? '#721c24' : '#e67e22',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}>
                  {activeTab}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ color: '#f39c12', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  {renderStars(review.ratings?.overall || 0)}
                </div>
                <h4 style={{ color: '#333', marginBottom: '0.5rem' }}>{review.title}</h4>
                <p style={{ color: '#555', lineHeight: '1.6', margin: 0 }}>
                  "{review.comment}"
                </p>
                {review.pros?.length > 0 && (
                  <div style={{ marginTop: '0.5rem', color: '#27ae60' }}>
                    <strong>Pros:</strong> {review.pros.join(', ')}
                  </div>
                )}
                {review.cons?.length > 0 && (
                  <div style={{ marginTop: '0.25rem', color: '#e74c3c' }}>
                    <strong>Cons:</strong> {review.cons.join(', ')}
                  </div>
                )}
              </div>

              {review.moderationNotes && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  color: '#666'
                }}>
                  <strong>Moderation Note:</strong> {review.moderationNotes}
                </div>
              )}

              {/* Action Buttons */}
              {activeTab === 'pending' && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    onClick={() => handleApprove(review._id)}
                    style={{
                      padding: '0.5rem 1.5rem',
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(review._id)}
                    style={{
                      padding: '0.5rem 1.5rem',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    ✗ Reject
                  </button>
                  <button
                    onClick={() => handleFlag(review._id)}
                    style={{
                      padding: '0.5rem 1.5rem',
                      background: '#e67e22',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    🚩 Flag
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;