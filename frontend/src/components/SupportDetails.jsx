import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BASE = 'http://localhost:5000/api';

function SupportDetails() {
  const navigate = useNavigate();

  // ── Tab Management ──
  const [activeTab, setActiveTab] = useState('support');
  const [reviewSubTab, setReviewSubTab] = useState('pending');

  // ── Support State ──
  const [supports, setSupports] = useState([]);
  const [supportLoading, setSupportLoading] = useState(true);

  // ── Read state (persisted in localStorage) ──
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('uninest_read_ids') || '[]'));
    } catch {
      return new Set();
    }
  });

  // ── Expanded AI response cards ──
  const [expandedAI, setExpandedAI] = useState(new Set());

  // ── Review State ──
  const [reviews, setReviews] = useState({ pending: [], approved: [], rejected: [], flagged: [] });
  const [stats, setStats] = useState({ totalReviews: 0, pendingReviews: 0, approvedReviews: 0, rejectedReviews: 0, flaggedReviews: 0 });
  const [reviewLoading, setReviewLoading] = useState(false);

  // ── Edit Modal State ──
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Delete Confirm Modal State ──
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Retry loading state ──
  const [retryingIds, setRetryingIds] = useState(new Set());

  // ── Admin guard ──
  useEffect(() => {
    if (localStorage.getItem('uninest_admin') !== 'true') {
      navigate('/admin-login');
    }
  }, [navigate]);

  // ── Persist readIds to localStorage ──
  useEffect(() => {
    localStorage.setItem('uninest_read_ids', JSON.stringify([...readIds]));
  }, [readIds]);

  // ── Helper: get admin token (try multiple common keys) ──
  const getAdminToken = () =>
    localStorage.getItem('uninest_admin_token') ||
    localStorage.getItem('adminToken') ||
    localStorage.getItem('token') ||
    '';

  // ── Support Fetch ──
  // Uses /api/support/all — no auth middleware on this route
  const fetchSupports = useCallback(async () => {
    setSupportLoading(true);
    try {
      // ✅ KEY FIX: use /all endpoint that has no protect middleware
      const res = await axios.get(`${BASE}/support/all`);
      setSupports(res.data.data || []);
    } catch (err) {
      console.error('Support Fetch Error:', err.response?.data || err.message);
      setSupports([]);
    } finally {
      setSupportLoading(false);
    }
  }, []);

  // ── Review Fetch ──
  const fetchReviews = useCallback(async () => {
    setReviewLoading(true);
    try {
      const token = getAdminToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [revRes, statsRes] = await Promise.all([
        axios.get(`${BASE}/admin/reviews?status=${reviewSubTab}`, { headers }),
        axios.get(`${BASE}/admin/stats`, { headers }),
      ]);
      setReviews((prev) => ({ ...prev, [reviewSubTab]: revRes.data.reviews || [] }));
      setStats(statsRes.data.stats || {});
    } catch (err) {
      console.error('Review Fetch Error:', err.response?.data || err.message);
    } finally {
      setReviewLoading(false);
    }
  }, [reviewSubTab]);

  useEffect(() => {
    if (activeTab === 'support') fetchSupports();
    else fetchReviews();
  }, [activeTab, reviewSubTab, fetchSupports, fetchReviews]);

  // ── Toggle AI response expanded ──
  const toggleAI = (id) => {
    setExpandedAI((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Mark as Read / Unread toggle ──
  const toggleRead = (id) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Mark all as read ──
  const markAllRead = () => {
    setReadIds(new Set(supports.map((s) => s._id)));
  };

  // ── Computed read/unread counts ──
  const readCount   = supports.filter((s) =>  readIds.has(s._id)).length;
  const unreadCount = supports.filter((s) => !readIds.has(s._id)).length;

  // ── Computed AI stats ──
  const aiSentCount    = supports.filter((s) => s.aiStatus === 'sent').length;
  const aiFailedCount  = supports.filter((s) => s.aiStatus === 'failed').length;
  const aiPendingCount = supports.filter((s) => s.aiStatus === 'pending').length;

  // ── DELETE — open confirm modal ──
  const handleDeleteClick = (item) => setDeleteTarget(item);

  // ── DELETE — confirmed ──
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      // No auth needed — route has no protect middleware
      await axios.delete(`${BASE}/support/${deleteTarget._id}`);
      setSupports((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      setReadIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget._id);
        return next;
      });
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed:', err.response?.data || err.message);
      alert('Failed to delete support request.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => setDeleteTarget(null);

  // ── OPEN edit modal ──
  const handleOpenEdit = (item) => {
    setEditItem(item);
    setEditForm({
      firstName:   item.firstName   || '',
      lastName:    item.lastName    || '',
      email:       item.email       || '',
      phoneNumber: item.phoneNumber || '',
      description: item.description || '',
    });
    setError('');
  };

  // ── UPDATE support ──
  const handleUpdate = async () => {
    setEditLoading(true);
    setError('');
    try {
      // No auth needed — route has no protect middleware
      await axios.put(`${BASE}/support/${editItem._id}`, editForm);
      setEditItem(null);
      fetchSupports();
    } catch (err) {
      console.error('Update failed:', err.response?.data || err.message);
      setError('Failed to update. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  // ── RETRY AI ──
  const handleRetryAI = async (id) => {
    setRetryingIds((prev) => new Set(prev).add(id));
    try {
      // No auth needed — route has no protect middleware
      await axios.post(`${BASE}/support/${id}/retry-ai`, {});
      await fetchSupports();
    } catch (err) {
      console.error('Retry failed:', err.response?.data || err.message);
      alert('Retry failed. Please try again.');
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ── Review Actions ──
  const handleReviewAction = async (id, action) => {
    let note = 'Actioned by admin';
    if (action !== 'approve') {
      note = prompt(`Enter reason for ${action}:`) || '';
      if (!note) return;
    }
    try {
      const token = getAdminToken();
      await axios.put(
        `${BASE}/admin/reviews/${id}/${action}`,
        { moderationNotes: note },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      fetchReviews();
    } catch (err) {
      alert(`Failed to ${action} review`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('uninest_admin');
    navigate('/');
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

  const formatDateTime = (d) =>
    d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f4ff] px-4 py-10 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        body { font-family: 'DM Sans', sans-serif; }
        .glow-blue   { background: radial-gradient(circle, rgba(45,126,247,0.12) 0%, transparent 70%); }
        .glow-purple { background: radial-gradient(circle, rgba(147,51,234,0.12) 0%, transparent 70%); }

        @keyframes badgePop {
          0%   { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        .badge-pop { animation: badgePop 0.2s ease-out forwards; }

        .card-unread { border-left: 3px solid #3b82f6 !important; }
        .card-read   { border-left: 3px solid #22c55e !important; opacity: 0.75; }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ai-expand { animation: slideDown 0.25s ease forwards; }
      `}</style>

      {/* Background glow */}
      <div className={`fixed -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] blur-3xl pointer-events-none z-0 transition-all duration-1000 ${activeTab === 'support' ? 'glow-blue' : 'glow-purple'}`} />

      <div className="max-w-[1100px] mx-auto relative z-10">

        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="inline-block mb-3 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-bold">
              UNINEST COMMAND CENTER
            </div>
            <h2 className="font-display text-4xl font-extrabold">
              {activeTab === 'support' ? 'Support Inbox' : 'Review Moderation'}
            </h2>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all"
          >
            Logout
          </button>
        </div>

        {/* ── Top Tabs ── */}
        <div className="flex gap-2 bg-[#161b25]/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 w-fit mb-10">
          <button
            onClick={() => setActiveTab('support')}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'support' ? 'bg-blue-600 shadow-lg shadow-blue-600/30' : 'text-[#8a96b0] hover:bg-white/5'}`}
          >
            🎧 Support
            {unreadCount > 0 && activeTab !== 'support' && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          {/* UPDATED: Reviews tab now navigates to your admin dashboard */}
          <button
            onClick={() => navigate('/admin')}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'reviews' ? 'bg-purple-600 shadow-lg shadow-purple-600/30' : 'text-[#8a96b0] hover:bg-white/5'}`}
          >
            ⭐ Reviews
          </button>
        </div>

        {/* ══════════════════════════════════════
            SUPPORT TAB
        ══════════════════════════════════════ */}
        {activeTab === 'support' && (
          <div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-1 bg-[#161b25] border border-white/5 rounded-2xl mb-8 overflow-hidden">
              <div className="p-5 text-center">
                <div className="text-2xl font-display font-bold text-blue-400">{supports.length}</div>
                <div className="text-[10px] text-[#5a6478] uppercase font-bold mt-1">Total</div>
              </div>
              <div className="p-5 text-center border-l border-white/5">
                <div className="text-2xl font-display font-bold text-blue-400">{new Set(supports.map((s) => s.email)).size}</div>
                <div className="text-[10px] text-[#5a6478] uppercase font-bold mt-1">Unique Users</div>
              </div>
              <div className="p-5 text-center border-l border-white/5">
                <div className="text-2xl font-display font-bold text-red-400 flex items-center justify-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  {unreadCount}
                </div>
                <div className="text-[10px] text-[#5a6478] uppercase font-bold mt-1">Unread</div>
              </div>
              <div className="p-5 text-center border-l border-white/5">
                <div className="text-2xl font-display font-bold text-green-400">{readCount}</div>
                <div className="text-[10px] text-[#5a6478] uppercase font-bold mt-1">Read</div>
              </div>
              <div className="p-5 text-center border-l border-white/5">
                <div className="text-2xl font-display font-bold text-emerald-400 flex items-center justify-center gap-1">
                  🤖 {aiSentCount}
                </div>
                <div className="text-[10px] text-[#5a6478] uppercase font-bold mt-1">AI Replied</div>
              </div>
              <div className="p-5 text-center border-l border-white/5">
                <div className="text-2xl font-display font-bold text-orange-400">{aiFailedCount}</div>
                <div className="text-[10px] text-[#5a6478] uppercase font-bold mt-1">AI Failed</div>
              </div>
            </div>

            {/* Action bar */}
            {!supportLoading && supports.length > 0 && (
              <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-[#5a6478]">
                  {unreadCount > 0
                    ? `${unreadCount} unread request${unreadCount > 1 ? 's' : ''}`
                    : 'All requests marked as read'}
                  {aiFailedCount > 0 && (
                    <span className="ml-3 text-orange-400">· {aiFailedCount} AI response{aiFailedCount > 1 ? 's' : ''} failed</span>
                  )}
                </p>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="px-4 py-1.5 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>
            )}

            {supportLoading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : supports.length === 0 ? (
              <div className="text-center py-20 bg-white/2 rounded-3xl border border-dashed border-white/10">
                <p className="text-[#8a96b0]">No support requests found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {supports.map((item) => {
                  const isRead       = readIds.has(item._id);
                  const isAIExpanded = expandedAI.has(item._id);
                  const isRetrying   = retryingIds.has(item._id);

                  return (
                    <div
                      key={item._id}
                      className={`bg-[#1a2030] border border-white/5 p-6 rounded-[24px] transition-all group ${isRead ? 'card-read' : 'card-unread'}`}
                    >
                      {/* Avatar + name + badges */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 transition-colors ${isRead ? 'bg-green-600/80' : 'bg-blue-600'}`}>
                          {item?.firstName?.[0] || '?'}{item?.lastName?.[0] || ''}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-[#f0f4ff]">{item?.firstName} {item?.lastName}</h4>

                            {/* Read / Unread badge */}
                            {isRead ? (
                              <span className="badge-pop inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/25 text-green-400 text-[10px] font-bold uppercase">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Read
                              </span>
                            ) : (
                              <span className="badge-pop inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400 text-[10px] font-bold uppercase">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                Unread
                              </span>
                            )}

                            {/* AI Status badge */}
                            {item.aiStatus === 'sent' && (
                              <span className="badge-pop inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold uppercase">
                                🤖 AI Replied
                              </span>
                            )}
                            {item.aiStatus === 'failed' && (
                              <span className="badge-pop inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-bold uppercase">
                                ⚠ AI Failed
                              </span>
                            )}
                            {item.aiStatus === 'pending' && (
                              <span className="badge-pop inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 text-[10px] font-bold uppercase">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                Pending
                              </span>
                            )}
                            {item.aiStatus === 'processing' && (
                              <span className="badge-pop inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400 text-[10px] font-bold uppercase">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                Processing
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#5a6478] uppercase font-bold mt-0.5">{formatDate(item?.createdAt)}</p>
                        </div>
                      </div>

                      {/* Contact info */}
                      <div className="text-sm text-[#8a96b0] mb-4 space-y-1">
                        <p>📧 {item?.email}</p>
                        <p>📞 {item?.phoneNumber}</p>
                        {item?.userId && typeof item.userId === 'object' && (
                          <p className="text-[10px] text-[#5a6478]">👤 User: {item.userId.firstName} {item.userId.lastName} · {item.userId.role}</p>
                        )}
                      </div>

                      {/* User issue */}
                      <div className="mb-4">
                        <p className="text-[10px] text-[#5a6478] uppercase font-bold mb-2">User Issue</p>
                        <div className="bg-white/5 p-4 rounded-xl text-sm text-[#f0f4ff]/80 leading-relaxed">
                          {item?.description}
                        </div>
                      </div>

                      {/* ── AI Response section ── */}
                      {(item.aiStatus === 'sent' || item.aiStatus === 'processing' || item.aiStatus === 'pending') && (
                        <div className="mb-4">
                          {item.aiStatus === 'sent' && item.aiResponse ? (
                            <>
                              <button
                                onClick={() => toggleAI(item._id)}
                                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/15 transition-all"
                                style={{ background: 'rgba(16,185,129,0.06)' }}
                              >
                                <span className="flex items-center gap-2">
                                  🤖 AI Response
                                  {item.resolvedAt && (
                                    <span className="text-emerald-400/60 font-normal">
                                      · sent {formatDateTime(item.resolvedAt)}
                                    </span>
                                  )}
                                </span>
                                <span className="text-emerald-400/70">{isAIExpanded ? '▲ Hide' : '▼ Show'}</span>
                              </button>

                              {isAIExpanded && (
                                <div className="ai-expand mt-2 bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
                                  <pre className="text-sm text-[#c8d0e0] leading-relaxed whitespace-pre-wrap font-sans">
                                    {item.aiResponse}
                                  </pre>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="px-4 py-3 rounded-xl border border-yellow-500/20 flex items-center gap-3" style={{ background: 'rgba(245,158,11,0.05)' }}>
                              <div className="flex gap-1">
                                {[0,1,2].map(i => (
                                  <span key={i} className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                                ))}
                              </div>
                              <p className="text-yellow-400 text-xs font-medium">AI is preparing a response…</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Failed AI notice */}
                      {item.aiStatus === 'failed' && (
                        <div className="mb-4 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400">
                          ⚠ AI response failed to send. Use "Retry AI" to attempt again.
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => toggleRead(item._id)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                            isRead
                              ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-600 hover:text-white hover:border-transparent'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white hover:border-transparent'
                          }`}
                        >
                          {isRead ? '↩ Mark Unread' : '✓ Mark as Read'}
                        </button>

                        {item.aiStatus === 'failed' && (
                          <button
                            onClick={() => handleRetryAI(item._id)}
                            disabled={isRetrying}
                            className="flex-1 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg text-xs font-bold hover:bg-yellow-500 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            {isRetrying ? (
                              <>
                                <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                Retrying…
                              </>
                            ) : '🔄 Retry AI'}
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="flex-1 py-2 bg-white/5 rounded-lg text-xs font-bold hover:bg-blue-600 transition-all border border-transparent"
                        >
                          Update
                        </button>

                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="flex-1 py-2 bg-white/5 rounded-lg text-xs font-bold hover:bg-red-600 transition-all border border-transparent"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            REVIEWS TAB CONTENT - REMOVED (redirects to /admin)
        ══════════════════════════════════════ */}
        {activeTab === 'reviews' && (
          <div>
            <div className="grid grid-cols-4 gap-1 bg-[#161b25] border border-white/5 rounded-2xl mb-8 overflow-hidden">
              <div className="p-4 text-center">
                <div className="text-xl font-display font-bold text-purple-400">{stats.pendingReviews || 0}</div>
                <div className="text-[10px] text-[#5a6478] uppercase font-bold">Pending</div>
              </div>
              <div className="p-4 text-center border-l border-white/5">
                <div className="text-xl font-display font-bold text-green-400">{stats.approvedReviews || 0}</div>
                <div className="text-[10px] text-[#5a6478] uppercase font-bold">Approved</div>
              </div>
              <div className="p-4 text-center border-l border-white/5">
                <div className="text-xl font-display font-bold text-red-400">{stats.rejectedReviews || 0}</div>
                <div className="text-[10px] text-[#5a6478] uppercase font-bold">Rejected</div>
              </div>
              <div className="p-4 text-center border-l border-white/5">
                <div className="text-xl font-display font-bold text-orange-400">{stats.flaggedReviews || 0}</div>
                <div className="text-[10px] text-[#5a6478] uppercase font-bold">Flagged</div>
              </div>
            </div>

            <div className="flex gap-2 mb-8">
              {['pending', 'approved', 'rejected', 'flagged'].map((s) => (
                <button
                  key={s}
                  onClick={() => setReviewSubTab(s)}
                  className={`px-5 py-2 rounded-full text-xs font-bold capitalize transition-all border ${
                    reviewSubTab === s ? 'bg-purple-600 border-purple-600' : 'bg-white/5 border-white/10 text-[#8a96b0]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {reviewLoading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : reviews[reviewSubTab]?.length === 0 ? (
              <div className="text-center py-20 bg-white/2 rounded-3xl border border-dashed border-white/10">
                <p className="text-[#8a96b0]">No {reviewSubTab} reviews to show.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews[reviewSubTab].map((rev) => (
                  <div
                    key={rev._id}
                    className="bg-[#1a2030] border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row justify-between gap-6"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex text-yellow-400 text-xs">{'★'.repeat(rev.ratings?.overall || 5)}</div>
                        <span className="text-[10px] font-bold text-[#5a6478] uppercase tracking-widest">{formatDate(rev.createdAt)}</span>
                      </div>
                      <h4 className="font-bold text-lg mb-1">{rev.property?.title || 'Review Title'}</h4>
                      <p className="text-[#8a96b0] text-sm italic mb-4">"{rev.comment}"</p>
                      <div className="flex gap-4">
                        {rev.pros?.length > 0 && (
                          <p className="text-[11px] text-green-400"><span className="font-bold">PROS:</span> {rev.pros.join(', ')}</p>
                        )}
                        {rev.cons?.length > 0 && (
                          <p className="text-[11px] text-red-400"><span className="font-bold">CONS:</span> {rev.cons.join(', ')}</p>
                        )}
                      </div>
                    </div>

                    {reviewSubTab === 'pending' && (
                      <div className="flex md:flex-col gap-2 justify-center">
                        <button onClick={() => handleReviewAction(rev._id, 'approve')} className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-xs font-bold hover:bg-green-500 hover:text-white transition-all">Approve</button>
                        <button onClick={() => handleReviewAction(rev._id, 'reject')}  className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-all">Reject</button>
                        <button onClick={() => handleReviewAction(rev._id, 'flag')}    className="px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg text-xs font-bold hover:bg-orange-500 hover:text-white transition-all">Flag</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ══════════════════════════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#1a2030] border border-red-500/20 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <div className="text-center mb-6">
              <h3 className="font-display text-xl font-bold text-white mb-2">Delete Support Request?</h3>
              <p className="text-sm text-[#8a96b0] leading-relaxed">
                You are about to permanently delete the request from{' '}
                <span className="text-white font-bold">{deleteTarget.firstName} {deleteTarget.lastName}</span>.
                This action <span className="text-red-400 font-semibold">cannot be undone</span>.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl border border-white/10 bg-transparent text-sm font-bold text-[#8a96b0] hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
              >
                No, Keep It
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16" />
                    </svg>
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════ */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-[#1a2030] border border-white/10 rounded-3xl p-8 shadow-2xl relative">
            <button
              onClick={() => { setEditItem(null); setError(''); }}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-[#8a96b0] hover:text-white transition-all text-lg"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
                {editItem?.firstName?.[0] || '?'}{editItem?.lastName?.[0] || ''}
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-white">Edit Support Request</h3>
                <p className="text-xs text-[#5a6478]">ID: {editItem._id}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#5a6478] uppercase font-bold mb-1">First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a6478] focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#5a6478] uppercase font-bold mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a6478] focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#5a6478] uppercase font-bold mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a6478] focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5a6478] uppercase font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm((p) => ({ ...p, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a6478] focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5a6478] uppercase font-bold mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a6478] focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                  <span>⚠</span> {error}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setEditItem(null); setError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 bg-transparent text-sm font-bold text-[#8a96b0] hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={editLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {editLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportDetails;