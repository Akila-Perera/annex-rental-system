import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('approved');
  const [reviews, setReviews] = useState({
    approved: []
  });
  const [stats, setStats] = useState({
    totalReviews: 0,
    approvedReviews: 0,
    deletedReviews: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFlaggedReviews, setShowFlaggedReviews] = useState(false); // CHANGED: false = collapsed by default

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
      const response = await api.get(`/admin/reviews?status=approved`);
      setReviews({
        approved: response.data.reviews || []
      });
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/stats');
      const statsData = response.data.stats || {};
      setStats({
        totalReviews: (statsData.approvedReviews || 0) + (statsData.deletedReviews || 0),
        approvedReviews: statsData.approvedReviews || 0,
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

  // ========== AI SENTIMENT ANALYSIS ==========
  const getSentiment = (rating) => {
    if (rating >= 4) return 'positive';
    if (rating >= 3) return 'neutral';
    return 'negative';
  };

  const getSentimentIcon = (sentiment) => {
    if (sentiment === 'positive') return '😊';
    if (sentiment === 'neutral') return '😐';
    return '😞';
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positive') return 'text-green-400';
    if (sentiment === 'neutral') return 'text-yellow-400';
    return 'text-red-400';
  };

  // Calculate sentiment stats from approved reviews
  const approvedReviews = reviews.approved || [];
  const sentimentStats = {
    positive: approvedReviews.filter(r => getSentiment(r.ratings?.overall) === 'positive').length,
    neutral: approvedReviews.filter(r => getSentiment(r.ratings?.overall) === 'neutral').length,
    negative: approvedReviews.filter(r => getSentiment(r.ratings?.overall) === 'negative').length
  };
  
  const totalApproved = sentimentStats.positive + sentimentStats.neutral + sentimentStats.negative;
  const positivePercentage = totalApproved > 0 ? Math.round((sentimentStats.positive / totalApproved) * 100) : 0;
  
  // Generate AI insight message
  const getAIInsight = () => {
    if (totalApproved === 0) return "No reviews yet. Once reviews come in, AI will analyze sentiment.";
    if (positivePercentage >= 70) return "Guests are generally very satisfied with these properties. Keep up the good work! 👍";
    if (positivePercentage >= 50) return "Mixed reviews. Some areas need improvement. Focus on addressing common complaints. 📊";
    if (positivePercentage >= 30) return "Many guests reported issues. Immediate action recommended to improve satisfaction. ⚠️";
    return "Critical issues detected. Urgent attention needed to address guest concerns. 🚨";
  };

  // ========== AI SPAM DETECTION (Links + Rating Mismatch) ==========
  const detectSpamAndFake = () => {
    const approved = reviews.approved || [];
    const flaggedReviews = [];
    const alerts = [];
    
    // 1. Detect spam links (URLs)
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|lk|info|xyz))/gi;
    
    // 2. Words for mismatch detection
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'waste', 'poor', 'worst', 'dirty', 'noisy', 'small', 'rude'];
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'perfect', 'wonderful', 'clean', 'spacious', 'friendly', 'helpful'];
    
    approved.forEach(review => {
      const comment = review.comment || '';
      const title = review.title || '';
      const text = (comment + ' ' + title).toLowerCase();
      const rating = review.ratings?.overall;
      
      // Check for spam links
      if (urlPattern.test(text)) {
        if (!flaggedReviews.includes(review._id)) flaggedReviews.push(review._id);
      }
      
      // Check for rating mismatch
      const hasNegative = negativeWords.some(word => text.includes(word));
      const hasPositive = positiveWords.some(word => text.includes(word));
      
      // 5 stars but has negative words (and no positive)
      if (rating === 5 && hasNegative && !hasPositive) {
        if (!flaggedReviews.includes(review._id)) flaggedReviews.push(review._id);
      }
      
      // 1 star but has positive words (and no negative)
      if (rating === 1 && hasPositive && !hasNegative) {
        if (!flaggedReviews.includes(review._id)) flaggedReviews.push(review._id);
      }
    });
    
    const uniqueFlagged = [...new Set(flaggedReviews)];
    
    if (uniqueFlagged.length > 0) {
      alerts.push(`🔍 ${uniqueFlagged.length} suspicious ${uniqueFlagged.length === 1 ? 'review' : 'reviews'} detected (spam links or rating mismatch)`);
    }
    
    return { alerts, flaggedReviews: uniqueFlagged };
  };

  const spamDetection = detectSpamAndFake();

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

  // Bulk delete flagged reviews
  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${spamDetection.flaggedReviews.length} suspicious ${spamDetection.flaggedReviews.length === 1 ? 'review' : 'reviews'}? This cannot be undone.`)) {
      for (const reviewId of spamDetection.flaggedReviews) {
        await api.delete(`/admin/reviews/${reviewId}`);
      }
      alert(`✅ Deleted ${spamDetection.flaggedReviews.length} suspicious ${spamDetection.flaggedReviews.length === 1 ? 'review' : 'reviews'}`);
      fetchAllData();
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
            { num: stats.deletedReviews, label: 'Deleted', color: 'text-red-400' },
          ].map((s, i) => (
            <div key={s.label} className={`flex-1 min-w-[120px] text-center py-5 px-4 ${i > 0 ? 'border-l border-white/7' : ''}`}>
              <div className={`font-display text-[1.6rem] font-extrabold mb-1 ${s.color}`}>{s.num || 0}</div>
              <div className="text-[#8a96b0] text-[0.82rem] uppercase tracking-wider font-semibold">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ========== AI SENTIMENT ANALYSIS CARD ========== */}
        <div className="bg-gradient-to-r from-[#1a2030] to-[#0f1e38] rounded-2xl p-5 mb-6 border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <h3 className="text-white font-semibold">AI Sentiment Analysis</h3>
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Powered by AI</span>
            </div>
            <div className="text-xs text-gray-400">Real-time analysis</div>
          </div>
          
          {/* Sentiment Distribution */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="text-2xl mb-1">😊</div>
              <div className="text-green-400 text-xl font-bold">{sentimentStats.positive}</div>
              <div className="text-gray-400 text-xs">Positive</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="text-2xl mb-1">😐</div>
              <div className="text-yellow-400 text-xl font-bold">{sentimentStats.neutral}</div>
              <div className="text-gray-400 text-xs">Neutral</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="text-2xl mb-1">😞</div>
              <div className="text-red-400 text-xl font-bold">{sentimentStats.negative}</div>
              <div className="text-gray-400 text-xs">Negative</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          {totalApproved > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Overall Satisfaction</span>
                <span className="text-green-400 font-bold">{positivePercentage}% Positive</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${positivePercentage}%` }} />
              </div>
            </div>
          )}
          
          {/* AI Insight */}
          <div className="mt-4 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <div className="flex items-start gap-2">
              <span className="text-purple-400 text-sm">💡</span>
              <div>
                <p className="text-purple-400 text-xs font-semibold mb-1">AI INSIGHT</p>
                <p className="text-gray-300 text-sm">
                  {getAIInsight()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== AI SPAM DETECTION CARD ========== */}
        {reviews.approved?.length > 0 && spamDetection.flaggedReviews.length > 0 && (
          <div className="bg-gradient-to-r from-[#1a2030] to-[#0f1e38] rounded-2xl p-5 mb-8 border border-red-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛡️</span>
                <h3 className="text-white font-semibold">AI Spam Detection</h3>
                <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">Auto-detected</span>
              </div>
              <div className="text-red-400 text-sm font-bold">
                {spamDetection.flaggedReviews.length} flagged
              </div>
            </div>
            
            {/* Alerts */}
            <div className="space-y-2 mb-4">
              {spamDetection.alerts.map((alert, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                  <span className="text-red-400">⚠️</span>
                  <span className="text-gray-300 text-sm">{alert}</span>
                </div>
              ))}
            </div>
            
            {/* Collapsible Flagged Reviews list - COLLAPSED BY DEFAULT */}
            <div className="mb-4">
              <button
                onClick={() => setShowFlaggedReviews(!showFlaggedReviews)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-3"
              >
                <span className="text-sm">📋 Flagged Reviews</span>
                <svg className={`w-4 h-4 transition-transform ${showFlaggedReviews ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="text-xs text-gray-500">({spamDetection.flaggedReviews.length})</span>
              </button>
              
              {showFlaggedReviews && (
                <div className="space-y-2">
                  {reviews.approved.filter(r => spamDetection.flaggedReviews.includes(r._id)).map(review => (
                    <div key={review._id} className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold">{review.property?.title}</p>
                          <p className="text-gray-400 text-xs">By: {review.student?.firstName || review.student?.name || 'Unknown'}</p>
                          <p className="text-red-300 text-xs mt-1">"{review.comment?.substring(0, 100)}"</p>
                        </div>
                        <div className="text-yellow-400 text-sm ml-2">
                          {renderStars(review.ratings?.overall || 0)}
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleDelete(review._id)}
                          className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500 hover:text-white transition"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Bulk Delete Button */}
            <button
              onClick={handleBulkDelete}
              className="w-full py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
            >
              🗑️ Delete All {spamDetection.flaggedReviews.length} Flagged Reviews
            </button>
          </div>
        )}

        {/* ========== PUBLISHED REVIEWS SECTION ========== */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-green-500 rounded-full"></div>
            <h3 className="text-white font-semibold text-lg">Published Reviews</h3>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              {reviews.approved?.length || 0} reviews
            </span>
          </div>
          
          <div className="flex flex-col gap-5">
            {loading ? (
              <div className="text-center py-20">
                <div className="w-9 h-9 border-[3px] border-blue-500/20 border-t-blue-500 rounded-full mx-auto mb-4 animate-spin-slow" />
                <p className="text-[#8a96b0]">Loading reviews...</p>
              </div>
            ) : reviews.approved?.length === 0 ? (
              <div className="text-center py-20 bg-[#1a2030] border border-white/7 rounded-[20px]">
                <p className="text-5xl mb-3">📭</p>
                <p className="text-[#8a96b0]">No published reviews found.</p>
              </div>
            ) : (
              reviews.approved.map(review => (
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
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 rounded-md text-[0.7rem] font-bold tracking-[0.05em] uppercase border bg-green-500/10 text-green-400 border-green-500/30">
                        Published
                      </div>
                      {/* Sentiment Badge */}
                      {review.ratings?.overall && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(getSentiment(review.ratings.overall))} bg-white/5`}>
                          {getSentimentIcon(getSentiment(review.ratings.overall))} {getSentiment(review.ratings.overall).toUpperCase()}
                        </span>
                      )}
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

                  {/* Action Buttons - Delete only */}
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => handleDelete(review._id)}
                      className="px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/85 hover:text-white transition-all">
                      🗑️ Delete Review
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-center mt-10">
          <a href="/" className="text-[#5a6478] text-sm hover:text-blue-300 transition-colors duration-200">← Back to Home</a>
        </p>

      </div>
    </div>
  );
};

export default AdminDashboard;