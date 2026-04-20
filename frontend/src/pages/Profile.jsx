import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('view');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [ownerAnnexes, setOwnerAnnexes] = useState([]);
  const [annexLoading, setAnnexLoading] = useState(false);
  const [editingAnnexId, setEditingAnnexId] = useState(null);
  const [annexEditData, setAnnexEditData] = useState({
    title: '',
    price: '',
    description: '',
    preferredGender: 'Any',
  });
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [ownerStats, setOwnerStats] = useState({
    totalAnnexes: 0,
    totalBookings: 0,
    upcomingBookings: 0,
  });
  const [ownerBookingsLoading, setOwnerBookingsLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(false);
  const [studentBookingRequests, setStudentBookingRequests] = useState([]);
  const [studentBookingRequestsLoading, setStudentBookingRequestsLoading] = useState(false);
  const [studentInquiries, setStudentInquiries] = useState([]);
  const [studentInquiriesLoading, setStudentInquiriesLoading] = useState(false);
  const [ownerInquiries, setOwnerInquiries] = useState([]);
  const [ownerInquiriesLoading, setOwnerInquiriesLoading] = useState(false);
  const [replyTextByInquiry, setReplyTextByInquiry] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('messages');
  const [mounted, setMounted] = useState(false);

  // ── Support ticket state (view only — no form) ────────────────
  const [myTickets, setMyTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const isLandlord = user?.role === 'landlord';

  // ── Fetch my support tickets ──────────────────────────────────
  const fetchMyTickets = async () => {
    if (!token) return;
    setTicketsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/support/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMyTickets(data.data || []);
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchOwnerAnnexes = async () => {
    if (!isLandlord || !user?.id) return;
    setAnnexLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/annexes/owner/${user.id}`);
      const data = await res.json();
      if (res.ok && data.success) setOwnerAnnexes(data.data || []);
    } catch (fetchError) {
      console.error('Error fetching owner annexes:', fetchError);
    } finally {
      setAnnexLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !token) return;
    fetchMyTickets();
    if (isLandlord && user?.id) {
      fetchOwnerAnnexes();
      fetchOwnerBookings();
      fetchPendingRequests();
      fetchOwnerInquiries();
    } else {
      fetchStudentBookingRequests();
      fetchStudentInquiries();
    }
  }, [isLandlord, user?.id, token]);

  const fetchOwnerBookings = async () => {
    if (!isLandlord || !token) return;
    setOwnerBookingsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/bookings/owner/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOwnerBookings(data.bookings || []);
        setOwnerStats(data.stats || { totalAnnexes: 0, totalBookings: 0, upcomingBookings: 0 });
      }
    } catch (fetchError) {
      console.error('Error fetching owner bookings:', fetchError);
    } finally {
      setOwnerBookingsLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    if (!isLandlord || !token) return;
    setPendingRequestsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/bookings/owner/pending-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setPendingRequests(data.pendingRequests || []);
    } catch (fetchError) {
      console.error('Error fetching pending requests:', fetchError);
    } finally {
      setPendingRequestsLoading(false);
    }
  };

  const fetchStudentBookingRequests = async () => {
    if (isLandlord || !token) return;
    setStudentBookingRequestsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setStudentBookingRequests(data.bookings || []);
    } catch (fetchError) {
      console.error('Error fetching student booking requests:', fetchError);
    } finally {
      setStudentBookingRequestsLoading(false);
    }
  };

  const handleRespondToRequest = async (bookingId, response) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:5000/api/bookings/respond-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId, response }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to update booking request.');
        return;
      }
      fetchPendingRequests();
      fetchOwnerBookings();
    } catch (fetchError) {
      console.error('Error updating booking request:', fetchError);
      setError('Server error while updating booking request.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentInquiries = async () => {
    setStudentInquiriesLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/inquiries/student', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setStudentInquiries(data.inquiries || []);
    } catch (err) {
      console.error('Error fetching student inquiries:', err);
    } finally {
      setStudentInquiriesLoading(false);
    }
  };

  const fetchOwnerInquiries = async () => {
    setOwnerInquiriesLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/inquiries/owner', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setOwnerInquiries(data.inquiries || []);
    } catch (err) {
      console.error('Error fetching owner inquiries:', err);
    } finally {
      setOwnerInquiriesLoading(false);
    }
  };

  const startEdit = () => {
    setEditData({ firstName: user.firstName, lastName: user.lastName, gender: user.gender, phone: user.phone });
    setError(''); setSuccess(''); setMode('edit');
  };
  const cancelEdit = () => { setMode('view'); setError(''); };

  const handleSave = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`http://localhost:5000/api/auth/update/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Update failed.');
      } else {
        login(data.user, token);
        setSuccess('Profile updated successfully.');
        setMode('view');
      }
    } catch { setError('Server error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/auth/delete/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { logout(); navigate('/'); }
      else {
        const data = await res.json();
        setError(data.message || 'Delete failed.');
        setShowDeleteConfirm(false);
      }
    } catch { setError('Server error. Please try again.'); setShowDeleteConfirm(false); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const startAnnexEdit = (annex) => {
    setEditingAnnexId(annex._id);
    setAnnexEditData({ title: annex.title || '', price: annex.price || '', description: annex.description || '', preferredGender: annex.preferredGender || 'Any' });
    setError(''); setSuccess('');
  };
  const cancelAnnexEdit = () => { setEditingAnnexId(null); };

  const saveAnnexEdit = async (annexId) => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`http://localhost:5000/api/annexes/${annexId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: user.id, ...annexEditData, price: Number(annexEditData.price) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to update annex.'); }
      else { setSuccess('Annex updated successfully.'); setEditingAnnexId(null); fetchOwnerAnnexes(); }
    } catch { setError('Server error while updating annex.'); }
    finally { setLoading(false); }
  };

  const deleteAnnex = async (annexId) => {
    const ok = window.confirm('Are you sure you want to delete this annex?');
    if (!ok) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`http://localhost:5000/api/annexes/${annexId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to delete annex.'); }
      else { setSuccess('Annex deleted successfully.'); fetchOwnerAnnexes(); }
    } catch { setError('Server error while deleting annex.'); }
    finally { setLoading(false); }
  };

  const handleSendReply = async (inquiryId) => {
    const text = replyTextByInquiry[inquiryId]?.trim();
    if (!text) return;
    try {
      const res = await fetch(`http://localhost:5000/api/inquiries/${inquiryId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReplyTextByInquiry((prev) => ({ ...prev, [inquiryId]: '' }));
        if (isLandlord) fetchOwnerInquiries(); else fetchStudentInquiries();
      }
    } catch (err) { console.error('Error sending inquiry reply:', err); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const latestBooking = ownerBookings && ownerBookings.length > 0 ? ownerBookings[0] : null;
  const inquiries = isLandlord ? ownerInquiries : studentInquiries;
  const inquiriesLoading = isLandlord ? ownerInquiriesLoading : studentInquiriesLoading;

  // Ticket status helpers
  const ticketStatusConfig = {
    pending:    { label: 'Submitted',    color: '#60a5fa', bg: 'rgba(45,126,247,0.1)',   border: 'rgba(45,126,247,0.3)',   icon: '⏳' },
    processing: { label: 'AI Thinking…', color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',   icon: '🤖' },
    sent:       { label: 'Answered',     color: '#4ade80', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.3)',    icon: '✅' },
    failed:     { label: 'Failed',       color: '#f87171', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.3)',    icon: '❌' },
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0f1e]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes slideInLeft { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInUp   { from { opacity:0; transform:translateY(20px);  } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn      { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse-dot   { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.85); } }
        @keyframes shimmer     { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        @keyframes float       { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-4px); } }
        @keyframes glow-pulse  { 0%,100% { box-shadow:0 0 20px rgba(45,126,247,0.2); } 50% { box-shadow:0 0 40px rgba(45,126,247,0.5); } }
        @keyframes msg-pop     { from { opacity:0; transform:scale(0.92) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes badge-slide { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
        @keyframes typing      { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-4px); } }
        @keyframes ai-appear   { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

        .sidebar-animate { animation:slideInLeft 0.5s ease forwards; }
        .main-animate    { animation:slideInUp 0.6s ease forwards; }
        .card-animate    { animation:slideInUp 0.5s ease forwards; }
        .fade-in         { animation:fadeIn 0.4s ease forwards; }
        .ai-appear       { animation:ai-appear 0.5s ease forwards; }

        .online-dot   { animation:pulse-dot 2s ease-in-out infinite; }
        .float-avatar { animation:float 3s ease-in-out infinite; }

        .shimmer-text {
          background: linear-gradient(90deg, #2d7ef7 0%, #60a5fa 40%, #2d7ef7 60%, #1d4ed8 100%);
          background-size:200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          animation:shimmer 3s linear infinite;
        }

        .profile-glow { animation:glow-pulse 3s ease-in-out infinite; }
        .msg-bubble   { animation:msg-pop 0.3s ease forwards; }
        .badge-anim   { animation:badge-slide 0.4s ease forwards; }

        .chat-thread::-webkit-scrollbar       { width:4px; }
        .chat-thread::-webkit-scrollbar-track { background:transparent; }
        .chat-thread::-webkit-scrollbar-thumb { background:#1f2a3c; border-radius:99px; }

        .typing-dot:nth-child(1) { animation:typing 1.2s ease-in-out 0s infinite; }
        .typing-dot:nth-child(2) { animation:typing 1.2s ease-in-out 0.2s infinite; }
        .typing-dot:nth-child(3) { animation:typing 1.2s ease-in-out 0.4s infinite; }

        .stat-card:hover   { transform:translateY(-2px); box-shadow:0 8px 32px rgba(45,126,247,0.15); transition:all 0.3s ease; }
        .annex-card:hover  { border-color:rgba(45,126,247,0.4) !important; transition:all 0.3s ease; }
        .btn-primary       { transition:all 0.2s ease; }
        .btn-primary:hover { transform:translateY(-1px); box-shadow:0 4px 20px rgba(45,126,247,0.3); }
        .home-btn:hover    { transform:translateX(-2px); transition:all 0.2s ease; }
        .ticket-card:hover { border-color:rgba(45,126,247,0.3) !important; background:#0d1526 !important; transition:all 0.2s ease; }

        .sidebar-tab.active {
          background:rgba(45,126,247,0.15);
          border-color:rgba(45,126,247,0.4);
          color:#60a5fa;
        }
        .request-card:hover { background:#0f1d35 !important; }
      `}</style>

      <div className="flex">

        {/* ══════════════════════════════════════════
            SIDEBAR
        ══════════════════════════════════════════ */}
        <aside className="sidebar-animate fixed inset-y-0 left-0 h-screen w-[300px] bg-[#111827] border-r border-[#1f2a3c] flex flex-col overflow-hidden" style={{ boxShadow: '4px 0 40px rgba(0,0,0,0.4)' }}>

          {/* Sidebar Header */}
          <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-[#1f2a3c]">
            <button onClick={() => navigate('/')} className="home-btn flex items-center gap-2 mb-4 text-[#5a6478] hover:text-blue-400 text-xs font-medium group">
              <span className="w-7 h-7 rounded-lg bg-[#0d1526] border border-[#1f2a3c] flex items-center justify-center group-hover:border-blue-500/40 group-hover:bg-blue-500/10 transition-all duration-200">←</span>
              Back to Home
            </button>
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-bold select-none" style={{ boxShadow: '0 0 0 2px #1f2a3c, 0 0 0 4px rgba(45,126,247,0.3)' }}>
                  {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                </div>
                <span className="online-dot absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#111827]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
                <p className="text-[#5a6478] text-[10px]">{isLandlord ? '🏠 Annex Owner' : '🎓 Student'} · Online</p>
              </div>
            </div>
          </div>

          {/* Sidebar Tabs */}
          <div className="flex-shrink-0 px-3 py-3 border-b border-[#1f2a3c]">
            <div className="flex gap-1">
              {/* Messages tab */}
              <button
                onClick={() => setSidebarTab('messages')}
                className={`sidebar-tab flex-1 px-2 py-2 rounded-lg text-[10px] font-semibold border transition-all duration-200 ${sidebarTab === 'messages' ? 'active' : 'border-transparent text-[#5a6478] hover:text-gray-300 hover:bg-white/5'}`}
              >
                💬 Messages
                {inquiries.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold">{inquiries.length}</span>
                )}
              </button>

              {/* Requests/Bookings tab */}
              <button
                onClick={() => setSidebarTab('requests')}
                className={`sidebar-tab flex-1 px-2 py-2 rounded-lg text-[10px] font-semibold border transition-all duration-200 ${sidebarTab === 'requests' ? 'active' : 'border-transparent text-[#5a6478] hover:text-gray-300 hover:bg-white/5'}`}
              >
                {isLandlord ? '📋 Requests' : '🏠 Bookings'}
                {(isLandlord ? pendingRequests : studentBookingRequests).length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                    {(isLandlord ? pendingRequests : studentBookingRequests).length}
                  </span>
                )}
              </button>

              {/* Support tab */}
              <button
                onClick={() => setSidebarTab('support')}
                className={`sidebar-tab flex-1 px-2 py-2 rounded-lg text-[10px] font-semibold border transition-all duration-200 ${sidebarTab === 'support' ? 'active' : 'border-transparent text-[#5a6478] hover:text-gray-300 hover:bg-white/5'}`}
              >
                🎧 Support
                {myTickets.filter(t => t.aiStatus === 'sent').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-green-600 text-white text-[9px] font-bold">
                    {myTickets.filter(t => t.aiStatus === 'sent').length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Scrollable Sidebar Content */}
          <div className="flex-1 overflow-y-auto chat-thread">

            {/* ── MESSAGES TAB ── */}
            {sidebarTab === 'messages' && (
              <div className="p-3">
                <p className="text-[10px] text-[#3a4a5c] uppercase tracking-[0.1em] font-semibold px-2 mb-3">
                  {isLandlord ? 'Student Inquiries' : 'Your Conversations'}
                </p>
                {inquiriesLoading && (
                  <div className="flex flex-col gap-2 px-2">
                    {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-[#0d1526] animate-pulse" />)}
                  </div>
                )}
                {!inquiriesLoading && inquiries.length === 0 && (
                  <div className="text-center py-10 px-4">
                    <div className="text-3xl mb-3">💬</div>
                    <p className="text-gray-400 text-xs font-medium">No conversations yet</p>
                    <p className="text-[#3a4a5c] text-[10px] mt-1 leading-relaxed">
                      {isLandlord ? 'Students will reach out about your annexes here.' : 'Start by inquiring about an annex you like.'}
                    </p>
                  </div>
                )}
                {!inquiriesLoading && inquiries.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {inquiries.map((inq) => {
                      const lastMessage = inq.messages[inq.messages.length - 1];
                      const isYou = isLandlord ? lastMessage?.senderRole === 'landlord' : lastMessage?.senderRole === 'student';
                      const isActive = activeChat === inq._id;
                      const otherName = isLandlord ? `${inq.student?.firstName} ${inq.student?.lastName}` : 'Owner';
                      const initials = isLandlord ? `${inq.student?.firstName?.[0] || ''}${inq.student?.lastName?.[0] || ''}` : 'OW';
                      return (
                        <div key={inq._id}>
                          <button
                            onClick={() => setActiveChat(isActive ? null : inq._id)}
                            className="w-full text-left px-3 py-3 rounded-xl hover:bg-[#0d1526] transition-all duration-200 group"
                            style={isActive ? { background: 'rgba(45,126,247,0.08)', border: '1px solid rgba(45,126,247,0.2)' } : { border: '1px solid transparent' }}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-[10px] font-bold">{initials}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <p className="text-white text-[11px] font-semibold truncate">{otherName}</p>
                                  <p className="text-[#3a4a5c] text-[9px] flex-shrink-0 ml-2">{formatTime(lastMessage?.createdAt)}</p>
                                </div>
                                <p className="text-[#3a4a5c] text-[10px] truncate">{inq.annex?.title || 'Annex'}</p>
                                <p className="text-[#5a6478] text-[10px] truncate mt-0.5">
                                  {isYou ? <span className="text-blue-400">You: </span> : ''}
                                  {lastMessage?.text}
                                </p>
                              </div>
                            </div>
                          </button>
                          {isActive && (
                            <div className="mx-2 mb-2 rounded-xl bg-[#0d1526] border border-[#1a2540] overflow-hidden msg-bubble">
                              <div className="px-3 py-2.5 border-b border-[#1f2a3c] bg-[#0a1020]">
                                <p className="text-white text-[11px] font-semibold">{inq.annex?.title || 'Annex'}</p>
                                <p className="text-[#3a4a5c] text-[9px] mt-0.5">Conversation thread</p>
                              </div>
                              <div className="p-3 max-h-48 overflow-y-auto chat-thread flex flex-col gap-2">
                                {inq.messages.map((msg, idx) => {
                                  const isMine = isLandlord ? msg.senderRole === 'landlord' : msg.senderRole === 'student';
                                  return (
                                    <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-[10px] leading-relaxed ${isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-[#111827] border border-[#1f2a3c] text-gray-300 rounded-bl-sm'}`}>
                                        {msg.text}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="px-3 pb-3">
                                <div className="flex gap-2 mt-1">
                                  <input
                                    type="text"
                                    value={replyTextByInquiry[inq._id] || ''}
                                    onChange={(e) => setReplyTextByInquiry((prev) => ({ ...prev, [inq._id]: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(inq._id); }}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-[#111827] border border-[#1f2a3c] text-white rounded-lg px-3 py-2 text-[10px] focus:outline-none focus:border-blue-500/60 transition-colors placeholder:text-[#3a4a5c]"
                                  />
                                  <button type="button" onClick={() => handleSendReply(inq._id)} className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white text-xs transition-colors flex-shrink-0">↑</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── REQUESTS / BOOKINGS TAB ── */}
            {sidebarTab === 'requests' && (
              <div className="p-3">
                {isLandlord ? (
                  <>
                    <p className="text-[10px] text-[#3a4a5c] uppercase tracking-[0.1em] font-semibold px-2 mb-3">Pending Approvals</p>
                    {pendingRequestsLoading && (
                      <div className="flex flex-col gap-2 px-2">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-[#0d1526] animate-pulse" />)}</div>
                    )}
                    {!pendingRequestsLoading && pendingRequests.length === 0 && (
                      <div className="text-center py-10 px-4">
                        <div className="text-3xl mb-3">✅</div>
                        <p className="text-gray-400 text-xs font-medium">All clear!</p>
                        <p className="text-[#3a4a5c] text-[10px] mt-1">No pending booking requests right now.</p>
                      </div>
                    )}
                    {!pendingRequestsLoading && pendingRequests.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {pendingRequests.map((request) => (
                          <div key={request._id} className="request-card bg-[#0d1526] border border-[#1f2a3c] rounded-xl p-3 transition-colors duration-200">
                            <div className="flex items-start gap-2 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                {request.student?.firstName?.[0]}{request.student?.lastName?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-[11px] font-semibold truncate">{request.student?.firstName} {request.student?.lastName}</p>
                                <p className="text-[#5a6478] text-[9px] truncate">{request.annex?.title || 'Annex'}</p>
                              </div>
                              <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-semibold">Pending</span>
                            </div>
                            <div className="flex items-center gap-1.5 mb-2.5 px-2 py-1.5 rounded-lg bg-[#0a1020] border border-[#1f2a3c]">
                              <span className="text-[10px]">📅</span>
                              <p className="text-[#8a96b0] text-[9px]">{formatDate(request.checkInDate)} → {formatDate(request.checkOutDate)}</p>
                            </div>
                            <div className="flex gap-1.5">
                              <button type="button" disabled={loading} onClick={() => handleRespondToRequest(request._id, 'accepted')} className="flex-1 py-1.5 rounded-lg bg-green-600/20 border border-green-500/40 text-green-400 text-[10px] font-semibold hover:bg-green-600 hover:text-white transition-all duration-200 disabled:opacity-50">✓ Accept</button>
                              <button type="button" disabled={loading} onClick={() => handleRespondToRequest(request._id, 'rejected')} className="flex-1 py-1.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 text-[10px] font-semibold hover:bg-red-600 hover:text-white transition-all duration-200 disabled:opacity-50">✕ Reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-[10px] text-[#3a4a5c] uppercase tracking-[0.1em] font-semibold px-2 mb-3">Your Booking Status</p>
                    {studentBookingRequestsLoading && (
                      <div className="flex flex-col gap-2 px-2">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-[#0d1526] animate-pulse" />)}</div>
                    )}
                    {!studentBookingRequestsLoading && studentBookingRequests.length === 0 && (
                      <div className="text-center py-10 px-4">
                        <div className="text-3xl mb-3">🏠</div>
                        <p className="text-gray-400 text-xs font-medium">No bookings yet</p>
                        <p className="text-[#3a4a5c] text-[10px] mt-1 leading-relaxed">Browse annexes and submit a booking request to get started.</p>
                        <button onClick={() => navigate('/searchAnnex')} className="mt-3 px-4 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200">Browse Annexes →</button>
                      </div>
                    )}
                    {!studentBookingRequestsLoading && studentBookingRequests.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {studentBookingRequests.map((request) => {
                          const statusConfig = {
                            confirmed: { label: 'Accepted', cls: 'text-green-400 bg-green-500/15 border-green-500/30', icon: '✓', msg: 'Owner accepted your request.' },
                            cancelled: { label: 'Rejected', cls: 'text-red-400 bg-red-500/15 border-red-500/30',   icon: '✕', msg: 'Owner declined your request.' },
                            pending:   { label: 'Pending',  cls: 'text-amber-400 bg-amber-500/15 border-amber-500/30', icon: '⏳', msg: 'Awaiting owner approval.' },
                          };
                          const s = statusConfig[request.status] || statusConfig.pending;
                          return (
                            <div key={request._id} className="bg-[#0d1526] border border-[#1f2a3c] rounded-xl p-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-[11px] font-semibold truncate">{request.annex?.title || 'Annex'}</p>
                                  <p className="text-[#5a6478] text-[9px] mt-0.5">{formatDate(request.checkInDate)} → {formatDate(request.checkOutDate)}</p>
                                </div>
                                <span className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${s.cls}`}>{s.icon} {s.label}</span>
                              </div>
                              <div className="px-2.5 py-1.5 rounded-lg bg-[#0a1020] border border-[#1f2a3c]">
                                <p className="text-[#8a96b0] text-[9px]">{s.msg}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── SUPPORT TAB (sidebar — ticket preview) ── */}
            {sidebarTab === 'support' && (
              <div className="p-3">
                <p className="text-[10px] text-[#3a4a5c] uppercase tracking-[0.1em] font-semibold px-2 mb-3">Support Tickets</p>

                {ticketsLoading && (
                  <div className="flex flex-col gap-2 px-2">
                    {[1,2].map(i => <div key={i} className="h-14 rounded-xl bg-[#0d1526] animate-pulse" />)}
                  </div>
                )}

                {!ticketsLoading && myTickets.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <div className="text-3xl mb-3">🎧</div>
                    <p className="text-gray-400 text-xs font-medium">No tickets yet</p>
                    <p className="text-[#3a4a5c] text-[10px] mt-1 leading-relaxed">Visit our homepage to submit a support request.</p>
                  </div>
                )}

                {!ticketsLoading && myTickets.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {myTickets.slice(0, 5).map((ticket) => {
                      const s = ticketStatusConfig[ticket.aiStatus] || ticketStatusConfig.pending;
                      return (
                        <div key={ticket._id} className="ticket-card bg-[#0d1526] border border-[#1f2a3c] rounded-xl p-3">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-white text-[11px] font-semibold truncate flex-1">{ticket.description.slice(0, 40)}{ticket.description.length > 40 ? '…' : ''}</p>
                            <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                              {s.icon} {s.label}
                            </span>
                          </div>
                          <p className="text-[#3a4a5c] text-[9px]">{formatDate(ticket.createdAt)}</p>
                        </div>
                      );
                    })}
                    {myTickets.length > 5 && (
                      <p className="text-center text-[#3a4a5c] text-[10px] pt-1">+{myTickets.length - 5} more — scroll your profile</p>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sidebar Footer */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-[#1f2a3c]">
            <div className="flex items-center gap-2 text-[10px] text-[#3a4a5c]">
              <span className="online-dot w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              <span>All systems operational</span>
            </div>
          </div>
        </aside>

        {/* ══════════════════════════════════════════
            MAIN CONTENT
        ══════════════════════════════════════════ */}
        <main className="flex-1 ml-[300px] px-6 py-10">
          <div className="max-w-2xl mx-auto">

            {/* ── Page Header ── */}
            <div className="main-animate mb-7" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-[#f0f4ff] text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>My Profile</h1>
                <span className="badge-anim px-2.5 py-1 rounded-full text-[10px] font-bold border"
                  style={isLandlord
                    ? { background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)', color: '#fbbf24' }
                    : { background: 'rgba(45,126,247,0.12)', borderColor: 'rgba(45,126,247,0.3)', color: '#60a5fa' }}>
                  {isLandlord ? '🏠 Annex Owner' : '🎓 Student'}
                </span>
              </div>
              <p className="text-[#5a6478] text-sm">
                {isLandlord
                  ? 'Manage your listings, bookings, and account settings from one place.'
                  : 'View and update your student profile, track bookings, and connect with owners.'}
              </p>
            </div>

            {/* ── Profile Card ── */}
            <div className="card-animate bg-[#111827] border border-[#1f2a3c] rounded-2xl p-7 shadow-2xl mb-5" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-start justify-between mb-7">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="float-avatar w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold select-none profile-glow" style={{ fontFamily: "'Syne', sans-serif" }}>
                      {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                    </div>
                    <span className="online-dot absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-[#111827]" />
                  </div>
                  <div>
                    <h2 className="text-white text-xl font-bold mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{user.firstName} {user.lastName}</h2>
                    <p className="text-[#5a6478] text-xs mb-2">{user.email}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold border"
                        style={isLandlord
                          ? { background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)', color: '#fbbf24' }
                          : { background: 'rgba(45,126,247,0.1)', borderColor: 'rgba(45,126,247,0.25)', color: '#60a5fa' }}>
                        {isLandlord ? '🏠 Property Owner' : '🎓 Student'}
                      </span>
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-green-500/10 border border-green-500/25 text-green-400">
                        <span className="online-dot w-1.5 h-1.5 rounded-full bg-green-400" />Active
                      </span>
                    </div>
                  </div>
                </div>
                {mode === 'view' && (
                  <div className="flex flex-col gap-2">
                    <button onClick={startEdit} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border" style={{ background: 'rgba(45,126,247,0.12)', borderColor: 'rgba(45,126,247,0.3)', color: '#60a5fa' }}>✏️ Edit Profile</button>
                    <button onClick={() => setShowDeleteConfirm(true)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}>🗑️ Delete</button>
                  </div>
                )}
              </div>

              {mode === 'view' && (
                <div className="mb-6 px-4 py-3 rounded-xl border border-[#1f2a3c] bg-[#0d1526]">
                  <p className="text-[#3a4a5c] text-[10px] uppercase tracking-wider font-semibold mb-1">About This Account</p>
                  <p className="text-[#8a96b0] text-xs leading-relaxed">
                    {isLandlord
                      ? 'You are registered as an Annex Owner on UniNEST. You can list and manage your properties, review student booking requests, and communicate directly with tenants through the messaging panel.'
                      : 'You are registered as a Student on UniNEST. You can browse verified annexes near your campus, send inquiries to owners, and manage your accommodation bookings all in one place.'}
                  </p>
                </div>
              )}

              {error   && <div className="fade-in rounded-xl px-4 py-3 mb-5 text-sm border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#f87171' }}>⚠️ {error}</div>}
              {success && <div className="fade-in rounded-xl px-4 py-3 mb-5 text-sm border" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)', color: '#4ade80' }}>✅ {success}</div>}

              {mode === 'view' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ProfileField label="First Name"   value={user.firstName} icon="👤" />
                  <ProfileField label="Last Name"    value={user.lastName}  icon="👤" />
                  <ProfileField label="Gender"       value={user.gender}    icon="⚧" />
                  <ProfileField label="Email"        value={user.email}     icon="✉️" />
                  <ProfileField label="Phone"        value={user.phone}     icon="📞" />
                  <ProfileField label="Account Type" value={isLandlord ? 'Annex Owner' : 'Student'} icon="🎭" />
                </div>
              )}

              {mode === 'edit' && (
                <div className="fade-in space-y-4">
                  <div className="px-4 py-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
                    <p className="text-blue-300 text-xs leading-relaxed">ℹ️ You can update your name, gender, and phone number. Your email address and account type are permanent.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5 block">First Name</label>
                      <input type="text" value={editData.firstName} onChange={e => setEditData({ ...editData, firstName: e.target.value })} className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 transition-colors" />
                    </div>
                    <div>
                      <label className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5 block">Last Name</label>
                      <input type="text" value={editData.lastName} onChange={e => setEditData({ ...editData, lastName: e.target.value })} className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5 block">Gender</label>
                    <select value={editData.gender} onChange={e => setEditData({ ...editData, gender: e.target.value })} className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 transition-colors appearance-none">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5 block">Phone Number</label>
                    <input type="tel" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 transition-colors" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 opacity-40">
                    <div>
                      <label className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5 block">Email (locked)</label>
                      <input type="email" value={user.email} disabled className="w-full bg-[#0d1526] border border-[#1f2a3c] text-gray-500 rounded-xl px-4 py-3 text-sm cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5 block">Account Type (locked)</label>
                      <input type="text" value={isLandlord ? 'Annex Owner' : 'Student'} disabled className="w-full bg-[#0d1526] border border-[#1f2a3c] text-gray-500 rounded-xl px-4 py-3 text-sm cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={cancelEdit} className="flex-1 bg-transparent border border-[#1f2a3c] text-gray-300 hover:text-white hover:border-gray-500 rounded-xl py-3 text-sm font-medium transition-all">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50">{loading ? 'Saving...' : '💾 Save Changes'}</button>
                  </div>
                </div>
              )}
            </div>

            {/* ══ LANDLORD DASHBOARD ══ */}
            {isLandlord && (
              <div className="space-y-5 mb-5">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Annexes', value: ownerStats.totalAnnexes, icon: '🏠', color: 'blue' },
                    { label: 'All-time Bookings', value: ownerStats.totalBookings, icon: '📋', color: 'green' },
                    { label: 'Active Tenants', value: ownerStats.upcomingBookings, icon: '👥', color: 'amber' },
                  ].map((stat, i) => (
                    <div key={stat.label} className="stat-card card-animate bg-[#111827] border border-[#1f2a3c] rounded-2xl p-4 cursor-default" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-lg">{stat.icon}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={stat.color === 'blue' ? { background: 'rgba(45,126,247,0.1)', color: '#60a5fa' } : stat.color === 'green' ? { background: 'rgba(34,197,94,0.1)', color: '#4ade80' } : { background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
                          Live
                        </span>
                      </div>
                      <p className="text-white text-2xl font-bold mb-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>{stat.value}</p>
                      <p className="text-[#5a6478] text-[10px]">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="card-animate bg-[#111827] border border-[#1f2a3c] rounded-2xl p-6" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-white text-base font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Latest Confirmed Booking</h2>
                      <p className="text-[#5a6478] text-xs mt-0.5">Most recent confirmed tenant across your properties.</p>
                    </div>
                    {ownerBookings.length > 1 && <span className="text-[10px] text-[#5a6478]">+{ownerBookings.length - 1} more</span>}
                  </div>
                  {ownerBookingsLoading && <div className="space-y-3"><div className="h-4 bg-[#0d1526] rounded animate-pulse w-2/3" /><div className="h-4 bg-[#0d1526] rounded animate-pulse w-1/2" /></div>}
                  {!ownerBookingsLoading && latestBooking && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="px-4 py-3 rounded-xl bg-[#0d1526] border border-[#1f2a3c]">
                        <p className="text-[#3a4a5c] text-[9px] uppercase tracking-wider font-semibold mb-1.5">👤 Student</p>
                        <p className="text-white text-sm font-semibold">{latestBooking.student?.firstName} {latestBooking.student?.lastName}</p>
                        <p className="text-[#5a6478] text-[10px] mt-0.5 truncate">{latestBooking.student?.email}</p>
                        {latestBooking.student?.phone && <p className="text-[#5a6478] text-[10px]">{latestBooking.student.phone}</p>}
                      </div>
                      <div className="px-4 py-3 rounded-xl bg-[#0d1526] border border-[#1f2a3c]">
                        <p className="text-[#3a4a5c] text-[9px] uppercase tracking-wider font-semibold mb-1.5">🏠 Annex</p>
                        <p className="text-white text-sm font-semibold">{latestBooking.annex?.title || 'Annex'}</p>
                        {latestBooking.annex?.selectedAddress && <p className="text-[#5a6478] text-[10px] mt-0.5 leading-relaxed">{latestBooking.annex.selectedAddress}</p>}
                      </div>
                      <div className="px-4 py-3 rounded-xl bg-[#0d1526] border border-[#1f2a3c]">
                        <p className="text-[#3a4a5c] text-[9px] uppercase tracking-wider font-semibold mb-1.5">📅 Period</p>
                        <p className="text-white text-xs font-medium">{formatDate(latestBooking.checkInDate)}</p>
                        <p className="text-[#3a4a5c] text-[9px] my-0.5">to</p>
                        <p className="text-white text-xs font-medium">{formatDate(latestBooking.checkOutDate)}</p>
                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#4ade80', border: '1px solid' }}>
                          <span className="online-dot w-1.5 h-1.5 rounded-full bg-green-400" />{latestBooking.status?.charAt(0).toUpperCase() + latestBooking.status?.slice(1) || 'Confirmed'}
                        </span>
                      </div>
                    </div>
                  )}
                  {!ownerBookingsLoading && !latestBooking && (
                    <div className="text-center py-8 border border-dashed border-[#1f2a3c] rounded-xl">
                      <div className="text-3xl mb-2">📭</div>
                      <p className="text-gray-400 text-sm font-medium">No confirmed bookings yet</p>
                      <p className="text-[#3a4a5c] text-xs mt-1 max-w-xs mx-auto leading-relaxed">Once students book and you confirm, their details will appear here.</p>
                    </div>
                  )}
                </div>

                <div className="card-animate bg-[#111827] border border-[#1f2a3c] rounded-2xl p-6" style={{ animationDelay: '0.5s' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                    <div>
                      <h2 className="text-white text-base font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Your Annex Portfolio</h2>
                      <p className="text-[#5a6478] text-xs mt-0.5">Edit details, update pricing, or remove listings.</p>
                    </div>
                    <Link to="/addAnnex" className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>➕ Add New Annex</Link>
                  </div>
                  {annexLoading && <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-[#0d1526] rounded-xl animate-pulse" />)}</div>}
                  {!annexLoading && ownerAnnexes.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-[#1f2a3c] rounded-xl">
                      <div className="text-3xl mb-2">🏗️</div>
                      <p className="text-gray-400 text-sm font-medium">No annexes listed yet</p>
                      <p className="text-[#3a4a5c] text-xs mt-1">Click "Add New Annex" to get started.</p>
                    </div>
                  )}
                  {!annexLoading && ownerAnnexes.length > 0 && (
                    <div className="space-y-3">
                      {ownerAnnexes.map((annex) => (
                        <div key={annex._id} className="annex-card bg-[#0d1526] border border-[#1f2a3c] rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          {editingAnnexId === annex._id ? (
                            <div className="flex-1 space-y-3 fade-in">
                              <input type="text" value={annexEditData.title} onChange={(e) => setAnnexEditData({ ...annexEditData, title: e.target.value })} className="w-full bg-[#111827] border border-[#1f2a3c] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/60 transition-colors" />
                              <input type="number" value={annexEditData.price} onChange={(e) => setAnnexEditData({ ...annexEditData, price: e.target.value })} className="w-full bg-[#111827] border border-[#1f2a3c] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/60 transition-colors" />
                              <select value={annexEditData.preferredGender} onChange={(e) => setAnnexEditData({ ...annexEditData, preferredGender: e.target.value })} className="w-full bg-[#111827] border border-[#1f2a3c] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/60 transition-colors">
                                <option value="Any">Any</option><option value="Male">Male</option><option value="Female">Female</option>
                              </select>
                              <textarea value={annexEditData.description} onChange={(e) => setAnnexEditData({ ...annexEditData, description: e.target.value })} rows={3} placeholder="Description..." className="w-full bg-[#111827] border border-[#1f2a3c] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/60 transition-colors resize-none" />
                              <div className="flex gap-2">
                                <button onClick={() => saveAnnexEdit(annex._id)} disabled={loading} className="btn-primary px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-50">{loading ? 'Saving...' : '💾 Save'}</button>
                                <button onClick={cancelAnnexEdit} className="px-4 py-2 rounded-lg border border-[#334155] text-gray-300 text-xs font-semibold hover:text-white transition-colors">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <p className="text-white font-semibold text-sm">{annex.title}</p>
                                <p className="text-blue-400 text-xs mt-1 font-medium">Rs. {annex.price?.toLocaleString()} / month</p>
                                {annex.selectedAddress && <p className="text-[#5a6478] text-xs mt-1 flex items-center gap-1">📍 {annex.selectedAddress}</p>}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => startAnnexEdit(annex)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200" style={{ background: 'rgba(45,126,247,0.12)', border: '1px solid rgba(45,126,247,0.3)', color: '#60a5fa' }}>✏️ Edit</button>
                                <button onClick={() => deleteAnnex(annex._id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>🗑️</button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ STUDENT SECTION ══ */}
            {!isLandlord && (
              <div className="card-animate mb-5 bg-[#111827] border border-[#1f2a3c] rounded-2xl p-6" style={{ animationDelay: '0.3s' }}>
                <h2 className="text-white text-base font-bold mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>🏠 Your Housing Journey</h2>
                <p className="text-[#8a96b0] text-sm leading-relaxed mb-4">Finding the right place to stay during your studies is important. UniNEST connects you with verified annex owners near your campus, so you can focus on what matters most — your education.</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { icon: '🔍', label: 'Browse', desc: 'Search annexes' },
                    { icon: '💬', label: 'Inquire', desc: 'Message owners' },
                    { icon: '✅', label: 'Book', desc: 'Confirm your stay' },
                  ].map((step) => (
                    <div key={step.label} className="text-center px-3 py-3 rounded-xl bg-[#0d1526] border border-[#1f2a3c]">
                      <div className="text-2xl mb-1">{step.icon}</div>
                      <p className="text-white text-xs font-semibold">{step.label}</p>
                      <p className="text-[#5a6478] text-[9px]">{step.desc}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/searchAnnex')} className="btn-primary w-full py-3 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>🔍 Browse Available Annexes</button>
              </div>
            )}

            {/* ══════════════════════════════════════════
                MY SUPPORT TICKETS — view only (no form)
                Submit via the homepage Support section
            ══════════════════════════════════════════ */}
            <div className="card-animate mb-5" style={{ animationDelay: '0.4s' }}>

              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>🎧</div>
                <div className="flex-1">
                  <h2 className="text-white text-base font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>My Support Tickets</h2>
                  <p className="text-[#5a6478] text-xs">Your AI support replies appear here · submit new requests from the homepage</p>
                </div>
                <button
                  onClick={fetchMyTickets}
                  className="text-[#5a6478] hover:text-blue-400 text-[10px] font-medium transition-colors px-3 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20"
                >
                  ↻ Refresh
                </button>
              </div>

              <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-6">
                {ticketsLoading && (
                  <div className="space-y-3">
                    {[1,2].map(i => <div key={i} className="h-20 bg-[#0d1526] rounded-xl animate-pulse" />)}
                  </div>
                )}

                {!ticketsLoading && myTickets.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-[#1f2a3c] rounded-xl">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-gray-400 text-sm font-medium">No support tickets yet</p>
                    <p className="text-[#3a4a5c] text-xs mt-1 mb-4">Head to our homepage to submit your first support request and get an instant AI response.</p>
                    <button
                      onClick={() => navigate('/')}
                      className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all inline-flex items-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)' }}
                    >
                      🤖 Go to Support Centre
                    </button>
                  </div>
                )}

                {!ticketsLoading && myTickets.length > 0 && (
                  <div className="space-y-3">
                    {myTickets.map((ticket) => {
                      const s = ticketStatusConfig[ticket.aiStatus] || ticketStatusConfig.pending;
                      const isExpanded = expandedTicket === ticket._id;

                      return (
                        <div
                          key={ticket._id}
                          className="ticket-card bg-[#0d1526] border border-[#1f2a3c] rounded-xl overflow-hidden transition-all duration-200"
                        >
                          {/* Ticket header — always visible */}
                          <button
                            className="w-full text-left px-4 py-3.5 flex items-start gap-3"
                            onClick={() => setExpandedTicket(isExpanded ? null : ticket._id)}
                          >
                            {/* Status icon */}
                            <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-base" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                              <span className="text-sm">{s.icon}</span>
                            </div>

                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-white text-xs font-semibold leading-relaxed line-clamp-2">{ticket.description}</p>
                                <span className="flex-shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                                  {s.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <p className="text-[#3a4a5c] text-[9px]">📅 {formatDate(ticket.createdAt)}</p>
                                {ticket.resolvedAt && <p className="text-[#3a4a5c] text-[9px]">✅ Answered {formatDate(ticket.resolvedAt)}</p>}
                                <p className="text-[#3a4a5c] text-[9px] ml-auto">{isExpanded ? '▲ hide' : '▼ view reply'}</p>
                              </div>
                            </div>
                          </button>

                          {/* Expanded: show AI reply */}
                          {isExpanded && (
                            <div className="px-4 pb-4 fade-in">
                              <div className="border-t border-[#1f2a3c] pt-3">

                                {/* Original issue */}
                                <div className="mb-3 px-3 py-2.5 rounded-xl bg-[#0a1020] border border-[#1f2a3c]">
                                  <p className="text-[#3a4a5c] text-[9px] uppercase tracking-wider font-semibold mb-1.5">📋 Your Request</p>
                                  <p className="text-[#8a96b0] text-xs leading-relaxed">{ticket.description}</p>
                                </div>

                                {/* AI response */}
                                {ticket.aiStatus === 'pending' || ticket.aiStatus === 'processing' ? (
                                  <div className="px-3 py-4 rounded-xl border border-[#1f2a3c] flex items-center gap-3" style={{ background: 'rgba(245,158,11,0.05)' }}>
                                    <div className="flex gap-1">
                                      <span className="typing-dot w-2 h-2 rounded-full bg-amber-400 inline-block" />
                                      <span className="typing-dot w-2 h-2 rounded-full bg-amber-400 inline-block" />
                                      <span className="typing-dot w-2 h-2 rounded-full bg-amber-400 inline-block" />
                                    </div>
                                    <p className="text-amber-400 text-xs font-medium">AI is preparing your response…</p>
                                  </div>
                                ) : ticket.aiStatus === 'failed' ? (
                                  <div className="px-3 py-3 rounded-xl border" style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }}>
                                    <p className="text-red-400 text-xs">❌ AI response failed. Our team has been notified and will retry shortly.</p>
                                  </div>
                                ) : ticket.aiResponse ? (
                                  <div className="ai-appear px-4 py-4 rounded-xl" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderLeft: '4px solid #22c55e' }}>
                                    <div className="flex items-center gap-2 mb-2.5">
                                      <span className="text-sm">🤖</span>
                                      <p className="text-green-400 text-[10px] font-bold uppercase tracking-wider">AI Support Response</p>
                                    </div>
                                    <p className="text-[#c8d6e8] text-xs leading-relaxed whitespace-pre-wrap">{ticket.aiResponse}</p>
                                    <div className="mt-3 pt-3 border-t border-[#1f2a3c] flex items-center gap-2">
                                      <span className="text-[10px]">📞</span>
                                      <p className="text-[#3a4a5c] text-[10px]">Need more help? Contact us at <span className="text-blue-400">support@uninest.lk</span> or call <span className="text-blue-400">+94 11 234 5678</span></p>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {/* ══ END SUPPORT TICKETS SECTION ══ */}

            {/* ══ LOG OUT ══ */}
            <button onClick={handleLogout} className="w-full border border-red-500/25 text-red-400 hover:bg-red-500/10 rounded-xl py-3 text-sm font-medium transition-all duration-200 hover:border-red-500/40">
              🚪 Logout From UniNest
            </button>

          </div>
        </main>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 px-4 fade-in">
          <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-8 max-w-sm w-full" style={{ boxShadow: '0 0 0 1px rgba(239,68,68,0.1), 0 40px 80px rgba(0,0,0,0.6)' }}>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-white text-xl font-bold mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Delete Account?</h3>
              <p className="text-[#8a96b0] text-sm leading-relaxed">This action is <span className="text-red-400 font-semibold">permanent and irreversible</span>. All your data, listings, and booking history will be erased immediately.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 border border-[#1f2a3c] text-gray-300 hover:text-white rounded-xl py-3 text-sm font-medium transition-all">Keep Account</button>
              <button onClick={handleDelete} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50">{loading ? 'Deleting...' : 'Yes, Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileField({ label, value, icon }) {
  return (
    <div className="bg-[#0d1526] border border-[#1f2a3c] rounded-xl px-4 py-3 hover:border-[#2a3a50] transition-colors duration-200">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xs">{icon}</span>
        <p className="text-[#3a4a5c] text-[9px] uppercase tracking-[0.1em] font-semibold">{label}</p>
      </div>
      <p className="text-white text-sm font-medium">{value || '—'}</p>
    </div>
  );
}