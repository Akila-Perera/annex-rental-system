import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('approved');
  const [reviews, setReviews] = useState({
    approved: [],
    flagged: []
  });
  const [stats, setStats] = useState({
    totalReviews: 0,
    approvedReviews: 0,
    flaggedReviews: 0,
    deletedReviews: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Admin guard ──
  useEffect(() => {
    const isAdmin = localStorage.getItem('uninest_admin');
    if (!isAdmin || isAdmin !== 'true') {
      navigate('/login');
    }
  }, [navigate]);

  // ── Logout ──
  const handleLogout = () => {
    localStorage.removeItem('uninest_admin');
    navigate('/');
  };

  const fetchModerationQueue = useCallback(async () => {
    try {
      const response = await api.get(`/admin/reviews?status=${activeTab}`);
      setReviews(prev => ({
        ...prev,
        [activeTab]: response.data.reviews || []
      }));
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  }, [activeTab]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/stats');
      const statsData = response.data.stats || {};
      setStats({
        totalReviews: (statsData.totalReviews || 0) - 2,
        approvedReviews: statsData.approvedReviews || 0,
        flaggedReviews: statsData.flaggedReviews || 0,
        deletedReviews: statsData.deletedReviews || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

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

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (!loading) {
      fetchModerationQueue();
    }
  }, [activeTab, loading, fetchModerationQueue]);

  // DELETE review function
  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to permanently delete this review? This cannot be undone.')) {
      return;
    }
    try {
      const response = await api.delete(`/admin/reviews/${reviewId}`);
      if (response.data.success) {
        alert('✅ Review deleted successfully!');
        fetchAllData();
      } else {
        alert('❌ Failed to delete review');
      }
    } catch (err) {
      alert('❌ Failed to delete review');
      console.error('Error:', err);
    }
  };

  // FLAG review function
  const handleFlag = async (reviewId) => {
    const reason = prompt('Please enter reason for flagging this review:');
    if (!reason) return;
    try {
      const response = await api.put(`/admin/reviews/${reviewId}/flag`, {
        moderationNotes: reason
      });
      if (response.data.success) {
        alert('🚩 Review flagged successfully!');
        fetchAllData();
      } else {
        alert('❌ Failed to flag review');
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
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-9 h-9 border-[3px] border-blue-500/20 border-t-blue-500 rounded-full animate-spin-slow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f4ff] px-4 py-10 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes spin { to{transform:rotate(360deg);} }
        .animate-spin-slow { animation: spin 0.8s linear infinite; }
      `}</style>

      <div className="max-w-[1100px] mx-auto relative z-10">

        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="inline-block mb-3 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-bold">
              UNINEST COMMAND CENTER
            </div>
            <h2 className="font-display text-4xl font-extrabold">
              Review Moderation
            </h2>
            <p className="text-gray-400 text-sm mt-1">Monitor and moderate user reviews</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all"
          >
            Logout
          </button>
        </div>

        {/* ── Tabs Navigation ── */}
        <div className="flex gap-2 border-b border-white/10 mb-8">
          <button 
            onClick={() => navigate('/details')}
            className="px-6 py-3 text-[0.95rem] font-medium rounded-t-xl transition-all duration-300 text-[#8a96b0] hover:text-white hover:bg-white/5 border-b-2 border-transparent">
            🎧 Support
          </button>
          <button 
            className="px-6 py-3 text-[0.95rem] font-semibold rounded-t-xl transition-all duration-300 bg-blue-500/10 text-blue-400 border-b-2 border-blue-500">
            ⭐ Reviews
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-[14px] mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="bg-[#161b25] border border-white/7 rounded-[14px] flex mb-9 overflow-hidden flex-wrap">
          {[
            { num: stats.totalReviews, label: 'Total Reviews', color: 'text-blue-400' },
            { num: stats.approvedReviews, label: 'Published', color: 'text-green-400' },
            { num: stats.flaggedReviews, label: 'Flagged', color: 'text-orange-400' },
            { num: stats.deletedReviews, label: 'Deleted', color: 'text-red-400' },
          ].map((s, i) => (
            <div key={s.label} className={`flex-1 min-w-[120px] text-center py-5 px-4 ${i > 0 ? 'border-l border-white/7' : ''}`}>
              <div className={`font-display text-[1.6rem] font-extrabold mb-1 ${s.color}`}>{s.num || 0}</div>
              <div className="text-[#8a96b0] text-[0.82rem] uppercase tracking-wider font-semibold">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Review Sub-Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {['approved', 'flagged'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold capitalize transition-all duration-300 border ${
                activeTab === tab 
                ? 'bg-blue-500 border-blue-500 text-white shadow-[0_4px_12px_rgba(45,126,247,0.3)]' 
                : 'bg-white/5 border-white/10 text-[#8a96b0] hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab === 'approved' ? 'Published' : 'Flagged'} ({stats[`${tab}Reviews`] || 0})
            </button>
          ))}
        </div>

        {/* Reviews List */}
        <div className="flex flex-col gap-5">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-9 h-9 border-[3px] border-blue-500/20 border-t-blue-500 rounded-full mx-auto mb-4 animate-spin-slow" />
              <p className="text-[#8a96b0]">Loading reviews...</p>
            </div>
          ) : reviews[activeTab]?.length === 0 ? (
            <div className="text-center py-20 bg-[#1a2030] border border-white/7 rounded-[20px]">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-[#8a96b0]">No {activeTab === 'approved' ? 'published' : 'flagged'} reviews found.</p>
            </div>
          ) : (
            reviews[activeTab].map(review => (
              <div key={review._id} className="bg-[#1a2030] border border-white/7 rounded-[20px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all hover:border-blue-500/30">
                
                <div className="flex justify-between items-start mb-4 gap-4 flex-wrap">
                  <div>
                    <h3 className="font-display font-bold text-[#f0f4ff] text-[1.1rem] m-0">{review.property?.title || 'Unknown Property'}</h3>
                    <p className="text-[#5a6478] text-[0.85rem] mt-1">
                      By <span className="text-[#8a96b0] font-medium">
                        {review.student?.firstName && review.student?.lastName 
                          ? `${review.student.firstName} ${review.student.lastName}`
                          : review.student?.name || 'Unknown'}
                      </span> • {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-md text-[0.7rem] font-bold tracking-[0.05em] uppercase border flex-shrink-0 ${
                    activeTab === 'approved' 
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                  }`}>
                    {activeTab === 'approved' ? 'Published' : 'Flagged'}
                  </div>
                </div>

                <div className="h-px bg-white/7 mb-4" />

                <div className="mb-2">
                  <div className="text-yellow-400 text-lg mb-2 tracking-widest">{renderStars(review.ratings?.overall || 0)}</div>
                  <h4 className="text-[#f0f4ff] font-semibold mb-2">{review.title}</h4>
                  <p className="text-[#8a96b0] text-[0.95rem] leading-[1.6] bg-white/3 p-4 rounded-lg border border-white/5">
                    "{review.comment}"
                  </p>
                  
                  <div className="flex gap-6 mt-4 flex-wrap">
                    {review.pros?.length > 0 && review.pros[0] !== '' && (
                      <div className="text-[#8a96b0] text-[0.85rem]">
                        <span className="text-green-400 font-bold tracking-wider text-[0.7rem] uppercase mb-1 block">Pros</span> 
                        {review.pros.filter(p => p.trim()).join(', ')}
                      </div>
                    )}
                    {review.cons?.length > 0 && review.cons[0] !== '' && (
                      <div className="text-[#8a96b0] text-[0.85rem]">
                        <span className="text-red-400 font-bold tracking-wider text-[0.7rem] uppercase mb-1 block">Cons</span> 
                        {review.cons.filter(c => c.trim()).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {review.moderationNotes && (
                  <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg text-[0.85rem] text-[#8a96b0]">
                    <strong className="text-blue-400 mr-2">Moderation Note:</strong> {review.moderationNotes}
                  </div>
                )}

                {/* Action Buttons - Delete always, Flag only in Published tab */}
                <div className="flex gap-3 mt-6">
                  <button onClick={() => handleDelete(review._id)}
                    className="px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/85 hover:text-white transition-all">
                    🗑️ Delete Review
                  </button>
                  {activeTab === 'approved' && (
                    <button onClick={() => handleFlag(review._id)}
                      className="px-4 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-500 hover:text-white transition-all">
                      🚩 Flag as Inappropriate
                    </button>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

        <p className="text-center mt-10">
          <a href="/" className="text-[#5a6478] text-sm hover:text-blue-300 transition-colors duration-200">← Back to Home</a>
        </p>

      </div>
    </div>
  );
};

export default AdminDashboard;