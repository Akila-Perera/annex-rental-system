import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('view'); // 'view' | 'edit'
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

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const isLandlord = user?.role === 'landlord';

  const fetchOwnerAnnexes = async () => {
    if (!isLandlord || !user?.id) return;
    setAnnexLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/annexes/owner/${user.id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOwnerAnnexes(data.data || []);
      }
    } catch (fetchError) {
      console.error('Error fetching owner annexes:', fetchError);
    } finally {
      setAnnexLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !token) return;
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOwnerBookings(data.bookings || []);
        setOwnerStats(data.stats || {
          totalAnnexes: 0,
          totalBookings: 0,
          upcomingBookings: 0,
        });
      } else {
        console.error('Error fetching owner bookings:', data.message || 'Unknown error');
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPendingRequests(data.pendingRequests || []);
      }
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStudentBookingRequests(data.bookings || []);
      }
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStudentInquiries(data.inquiries || []);
      }
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOwnerInquiries(data.inquiries || []);
      }
    } catch (err) {
      console.error('Error fetching owner inquiries:', err);
    } finally {
      setOwnerInquiriesLoading(false);
    }
  };

  const startEdit = () => {
    setEditData({
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      phone: user.phone,
    });
    setError('');
    setSuccess('');
    setMode('edit');
  };

  const cancelEdit = () => {
    setMode('view');
    setError('');
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`http://localhost:5000/api/auth/update/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/auth/delete/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        logout();
        navigate('/');
      } else {
        const data = await res.json();
        setError(data.message || 'Delete failed.');
        setShowDeleteConfirm(false);
      }
    } catch {
      setError('Server error. Please try again.');
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const startAnnexEdit = (annex) => {
    setEditingAnnexId(annex._id);
    setAnnexEditData({
      title: annex.title || '',
      price: annex.price || '',
      description: annex.description || '',
      preferredGender: annex.preferredGender || 'Any',
    });
    setError('');
    setSuccess('');
  };

  const cancelAnnexEdit = () => {
    setEditingAnnexId(null);
  };

  const saveAnnexEdit = async (annexId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`http://localhost:5000/api/annexes/${annexId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerId: user.id,
          ...annexEditData,
          price: Number(annexEditData.price),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to update annex.');
      } else {
        setSuccess('Annex updated successfully.');
        setEditingAnnexId(null);
        fetchOwnerAnnexes();
      }
    } catch {
      setError('Server error while updating annex.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnex = async (annexId) => {
    const ok = window.confirm('Are you sure you want to delete this annex?');
    if (!ok) return;

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`http://localhost:5000/api/annexes/${annexId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ownerId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to delete annex.');
      } else {
        setSuccess('Annex deleted successfully.');
        fetchOwnerAnnexes();
      }
    } catch {
      setError('Server error while deleting annex.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (inquiryId) => {
    const text = replyTextByInquiry[inquiryId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`http://localhost:5000/api/inquiries/${inquiryId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReplyTextByInquiry((prev) => ({ ...prev, [inquiryId]: '' }));
        if (isLandlord) {
          fetchOwnerInquiries();
        } else {
          fetchStudentInquiries();
        }
      }
    } catch (err) {
      console.error('Error sending inquiry reply:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
  };

  const latestBooking = ownerBookings && ownerBookings.length > 0 ? ownerBookings[0] : null;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <div className="flex">

        {/* Chat Sidebar */}
        <aside className="fixed inset-y-0 left-0 h-screen w-[300px] bg-[#111827] border-r border-[#1f2a3c] shadow-2xl flex flex-col p-6 overflow-hidden">
          <h2 className="text-white text-lg font-semibold mb-1">Chat</h2>
          <p className="text-gray-400 text-xs mb-3">
            {isLandlord
              ? 'Messages from students about your annexes.'
              : 'Messages between you and annex owners.'}
          </p>

          {isLandlord ? (
            <>
              <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-2">Messages</p>
              {ownerInquiriesLoading && (
                <p className="text-gray-400 text-sm">Loading messages...</p>
              )}
              {!ownerInquiriesLoading && ownerInquiries.length === 0 && (
                <p className="text-gray-500 text-sm">No inquiries yet.</p>
              )}
              {!ownerInquiriesLoading && ownerInquiries.length > 0 && (
                <div className="mt-1 max-h-[42%] overflow-y-auto space-y-3 pr-1 flex flex-col">
                  {ownerInquiries.map((inq) => {
                    const lastMessage = inq.messages[inq.messages.length - 1];
                    const senderLabel = lastMessage?.senderRole === 'landlord' ? 'You' : 'Student';
                    return (
                      <div
                        key={inq._id}
                        className="bg-[#0d1526] border border-[#1f2a3c] rounded-xl p-3 text-xs text-gray-200"
                      >
                        <p className="text-white font-semibold text-[11px] mb-1 truncate">
                          {inq.annex?.title || 'Annex'}
                        </p>
                        <p className="text-gray-400 mb-0.5">
                          From{' '}
                          <span className="font-semibold">
                            {inq.student?.firstName} {inq.student?.lastName}
                          </span>
                        </p>
                        <p className="text-gray-400 mb-1">
                          Latest from <span className="font-semibold">{senderLabel}</span>: {lastMessage?.text}
                        </p>
                        <div className="mt-1 flex gap-2">
                          <input
                            type="text"
                            value={replyTextByInquiry[inq._id] || ''}
                            onChange={(e) =>
                              setReplyTextByInquiry((prev) => ({ ...prev, [inq._id]: e.target.value }))
                            }
                            placeholder="Reply to this inquiry..."
                            className="flex-1 bg-[#111827] border border-[#1f2a3c] text-white rounded-lg px-2 py-1 text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendReply(inq._id)}
                            className="px-3 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-semibold"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-[#1f2a3c] flex-1 min-h-0 flex flex-col">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-2">
                  Pending Booking Requests
                </p>
                {pendingRequestsLoading && (
                  <p className="text-gray-400 text-sm">Loading requests...</p>
                )}
                {!pendingRequestsLoading && pendingRequests.length === 0 && (
                  <p className="text-gray-500 text-sm">No pending requests.</p>
                )}
                {!pendingRequestsLoading && pendingRequests.length > 0 && (
                  <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                    {pendingRequests.map((request) => (
                      <div
                        key={request._id}
                        className="bg-[#0d1526] border border-[#1f2a3c] rounded-xl p-2 text-xs text-gray-200"
                      >
                        <p className="text-white font-semibold text-[11px] truncate">
                          {request.student?.firstName} {request.student?.lastName}
                        </p>
                        <p className="text-gray-400 text-[10px] truncate">{request.annex?.title || 'Annex'}</p>
                        <p className="text-gray-500 text-[10px] mb-1">
                          {formatDate(request.checkInDate)} to {formatDate(request.checkOutDate)}
                        </p>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleRespondToRequest(request._id, 'accepted')}
                            className="flex-1 px-2 py-1 rounded bg-green-600 text-white text-[10px] font-semibold disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleRespondToRequest(request._id, 'rejected')}
                            className="flex-1 px-2 py-1 rounded bg-red-600 text-white text-[10px] font-semibold disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {studentInquiriesLoading && (
                <p className="text-gray-400 text-sm">Loading your messages...</p>
              )}
              {!studentInquiriesLoading && studentInquiries.length === 0 && (
                <p className="text-gray-500 text-sm">You haven&apos;t sent any inquiries yet.</p>
              )}
              {!studentInquiriesLoading && studentInquiries.length > 0 && (
                <div className="mt-1 max-h-[40%] overflow-y-auto space-y-3 pr-1 flex flex-col">
                  {studentInquiries.map((inq) => {
                    const lastMessage = inq.messages[inq.messages.length - 1];
                    const senderLabel = lastMessage?.senderRole === 'landlord' ? 'Owner' : 'You';
                    return (
                      <div
                        key={inq._id}
                        className="bg-[#0d1526] border border-[#1f2a3c] rounded-xl p-3 text-xs text-gray-200"
                      >
                        <p className="text-white font-semibold text-[11px] mb-1 truncate">
                          {inq.annex?.title || 'Annex'}
                        </p>
                        <p className="text-gray-400 mb-1">
                          Latest from <span className="font-semibold">{senderLabel}</span>: {lastMessage?.text}
                        </p>
                        <div className="mt-1 flex gap-2">
                          <input
                            type="text"
                            value={replyTextByInquiry[inq._id] || ''}
                            onChange={(e) =>
                              setReplyTextByInquiry((prev) => ({ ...prev, [inq._id]: e.target.value }))
                            }
                            placeholder="Reply to this thread..."
                            className="flex-1 bg-[#111827] border border-[#1f2a3c] text-white rounded-lg px-2 py-1 text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendReply(inq._id)}
                            className="px-3 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-semibold"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-[#1f2a3c] flex-1 min-h-0 flex flex-col">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-2">Your Booking Requests</p>
                {studentBookingRequestsLoading && (
                  <p className="text-gray-400 text-sm">Loading booking requests...</p>
                )}
                {!studentBookingRequestsLoading && studentBookingRequests.length === 0 && (
                  <p className="text-gray-500 text-sm">No booking requests yet.</p>
                )}
                {!studentBookingRequestsLoading && studentBookingRequests.length > 0 && (
                  <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                    {studentBookingRequests.map((request) => {
                      const statusLabel =
                        request.status === 'confirmed'
                          ? 'Accepted'
                          : request.status === 'cancelled'
                            ? 'Rejected'
                            : 'Pending';
                      const statusClass =
                        request.status === 'confirmed'
                          ? 'text-green-400'
                          : request.status === 'cancelled'
                            ? 'text-red-400'
                            : 'text-yellow-400';
                      const ownerMessage =
                        request.status === 'confirmed'
                          ? 'Owner accepted your booking request.'
                          : request.status === 'cancelled'
                            ? 'Owner rejected your booking request.'
                            : 'Request sent. Waiting for owner approval.';

                      return (
                        <div
                          key={request._id}
                          className="bg-[#0d1526] border border-[#1f2a3c] rounded-xl p-2 text-xs text-gray-200"
                        >
                          <p className="text-white font-semibold text-[11px] truncate">
                            {request.annex?.title || 'Annex'}
                          </p>
                          <p className="text-gray-500 text-[10px]">
                            {formatDate(request.checkInDate)} to {formatDate(request.checkOutDate)}
                          </p>
                          <p className={`text-[10px] font-semibold ${statusClass}`}>Status: {statusLabel}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{ownerMessage}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* Main content shifted right of sidebar */}
        <main className="flex-1 ml-[300px] px-4 py-12">
          <div className="max-w-2xl mx-auto">

        {/* Profile Card */}
        <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-8 shadow-2xl mb-6">

          {/* Avatar + Name + Edit/Delete buttons */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-bold select-none">
                {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-white text-2xl font-bold">{user.firstName} {user.lastName}</h1>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full mt-1 inline-block ${
                  isLandlord
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {isLandlord ? '🏠 Annex Owner' : '🎓 Student'}
                </span>
              </div>
            </div>

            {mode === 'view' && (
              <div className="flex gap-2">
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 hover:bg-blue-600/25 hover:text-blue-300 text-sm font-medium transition-all"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-sm font-medium transition-all"
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>

          {/* Feedback */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-5">{success}</div>
          )}

          {/* VIEW mode */}
          {mode === 'view' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileField label="First Name"   value={user.firstName} />
              <ProfileField label="Last Name"    value={user.lastName} />
              <ProfileField label="Gender"       value={user.gender} />
              <ProfileField label="Email"        value={user.email} />
              <ProfileField label="Phone"        value={user.phone} />
              <ProfileField label="Account Type" value={isLandlord ? 'Annex Owner' : 'Student'} />
            </div>
          )}

          {/* EDIT mode */}
          {mode === 'edit' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm mb-2">Update your name, gender, and phone. Email and account type cannot be changed.</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">First Name</label>
                  <input type="text" value={editData.firstName}
                    onChange={e => setEditData({ ...editData, firstName: e.target.value })}
                    className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">Last Name</label>
                  <input type="text" value={editData.lastName}
                    onChange={e => setEditData({ ...editData, lastName: e.target.value })}
                    className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">Gender</label>
                <select value={editData.gender} onChange={e => setEditData({ ...editData, gender: e.target.value })}
                  className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">Phone Number</label>
                <input type="tel" value={editData.phone}
                  onChange={e => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>

              {/* Locked fields */}
              <div className="grid grid-cols-2 gap-4 opacity-50">
                <div>
                  <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">Email (locked)</label>
                  <input type="email" value={user.email} disabled
                    className="w-full bg-[#0d1526] border border-[#1f2a3c] text-gray-500 rounded-xl px-4 py-3 text-sm cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">Account Type (locked)</label>
                  <input type="text" value={isLandlord ? 'Annex Owner' : 'Student'} disabled
                    className="w-full bg-[#0d1526] border border-[#1f2a3c] text-gray-500 rounded-xl px-4 py-3 text-sm cursor-not-allowed" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={cancelEdit}
                  className="flex-1 bg-transparent border border-[#1f2a3c] text-gray-300 hover:text-white hover:border-gray-500 rounded-xl py-3 text-sm font-medium transition-all">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Landlord Dashboard */}
        {isLandlord && (
          <div className="space-y-6 mb-6">
            {/* Top row: Highlight booking + stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Highlight latest booking */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#111827] via-[#111827] to-[#1e293b] border border-[#1f2a3c] rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-white text-lg font-semibold">Confirmed Booking</h2>
                    <p className="text-gray-400 text-xs mt-1">Latest student booking across your annexes.</p>
                  </div>
                </div>

                {ownerBookingsLoading && (
                  <p className="text-gray-400 text-sm">Loading bookings...</p>
                )}

                {!ownerBookingsLoading && latestBooking && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Student</p>
                      <p className="text-white font-medium text-sm">
                        {latestBooking.student?.firstName} {latestBooking.student?.lastName}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">{latestBooking.student?.email}</p>
                      {latestBooking.student?.phone && (
                        <p className="text-gray-400 text-xs">{latestBooking.student.phone}</p>
                      )}
                    </div>

                    <div className="hidden sm:block h-12 w-px bg-[#1f2a3c]" />

                    <div className="flex-1 flex flex-col sm:items-center">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Annex</p>
                      <p className="text-white text-sm font-medium text-center">
                        {latestBooking.annex?.title || 'Annex'}
                      </p>
                      {latestBooking.annex?.selectedAddress && (
                        <p className="text-gray-400 text-xs text-center mt-0.5">
                          {latestBooking.annex.selectedAddress}
                        </p>
                      )}
                    </div>

                    <div className="hidden sm:block h-12 w-px bg-[#1f2a3c]" />

                    <div className="text-right space-y-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Period</p>
                      <p className="text-white text-sm font-medium">
                        {formatDate(latestBooking.checkInDate)}
                        <span className="text-gray-400 mx-1 text-xs">to</span>
                        {formatDate(latestBooking.checkOutDate)}
                      </p>
                      <p className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/40 text-green-300 text-xs font-semibold mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        {latestBooking.status?.charAt(0).toUpperCase() + latestBooking.status?.slice(1) || 'Confirmed'}
                      </p>
                    </div>
                  </div>
                )}

                {!ownerBookingsLoading && !latestBooking && (
                  <div className="border border-dashed border-[#1f2a3c] rounded-xl p-4 text-center">
                    <p className="text-gray-300 text-sm font-medium mb-1">No bookings yet</p>
                    <p className="text-gray-500 text-xs">
                      Once students start booking your annexes, you&apos;ll see the latest one highlighted here.
                    </p>
                  </div>
                )}
              </div>

              {/* Stats column */}
              <div className="space-y-4">
                <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-4">
                  <p className="text-gray-400 text-xs mb-1">Total Annexes</p>
                  <p className="text-white text-2xl font-bold">{ownerStats.totalAnnexes}</p>
                </div>
                <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-4">
                  <p className="text-gray-400 text-xs mb-1">All-time Bookings</p>
                  <p className="text-white text-2xl font-bold">{ownerStats.totalBookings}</p>
                </div>
                <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-4">
                  <p className="text-gray-400 text-xs mb-1">Upcoming / Active</p>
                  <p className="text-white text-2xl font-bold">{ownerStats.upcomingBookings}</p>
                </div>
              </div>
            </div>

            {/* Manage Listings */}
            <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-white text-lg font-semibold">Your Annex Portfolio</h2>
                  <p className="text-gray-400 text-xs mt-1">Edit details, update pricing, or remove listings.</p>
                </div>
                <Link
                  to="/addAnnex"
                  className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-medium transition-all"
                >
                  ➕ Add New Annex
                </Link>
              </div>

              {annexLoading && (
                <p className="text-gray-400 text-sm">Loading your annexes...</p>
              )}

              {!annexLoading && ownerAnnexes.length === 0 && (
                <p className="text-gray-500 text-sm">You have not added any annexes yet.</p>
              )}

              {!annexLoading && ownerAnnexes.length > 0 && (
                <div className="space-y-3">
                  {ownerAnnexes.map((annex) => (
                    <div
                      key={annex._id}
                      className="bg-[#0d1526] border border-[#1f2a3c] rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                    >
                      {editingAnnexId === annex._id ? (
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={annexEditData.title}
                            onChange={(e) => setAnnexEditData({ ...annexEditData, title: e.target.value })}
                            className="w-full bg-[#111827] border border-[#1f2a3c] text-white rounded-lg px-3 py-2 text-sm"
                          />
                          <input
                            type="number"
                            value={annexEditData.price}
                            onChange={(e) => setAnnexEditData({ ...annexEditData, price: e.target.value })}
                            className="w-full bg-[#111827] border border-[#1f2a3c] text-white rounded-lg px-3 py-2 text-sm"
                          />
                          <select
                            value={annexEditData.preferredGender}
                            onChange={(e) => setAnnexEditData({ ...annexEditData, preferredGender: e.target.value })}
                            className="w-full bg-[#111827] border border-[#1f2a3c] text-white rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="Any">Any</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                          <textarea
                            value={annexEditData.description}
                            onChange={(e) => setAnnexEditData({ ...annexEditData, description: e.target.value })}
                            rows={3}
                            className="w-full bg-[#111827] border border-[#1f2a3c] text-white rounded-lg px-3 py-2 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveAnnexEdit(annex._id)}
                              disabled={loading}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelAnnexEdit}
                              className="px-3 py-1.5 rounded-lg border border-[#334155] text-gray-300 text-xs font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="text-white font-semibold">{annex.title}</p>
                            <p className="text-blue-400 text-sm mt-1">Rs. {annex.price} / month</p>
                            {annex.selectedAddress && (
                              <p className="text-gray-400 text-xs mt-1">{annex.selectedAddress}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startAnnexEdit(annex)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteAnnex(annex._id)}
                              className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-semibold"
                            >
                              Delete
                            </button>
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

        {/* Student: Quick Info + Messages */}
        {!isLandlord && (
          <>
            <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-6 shadow-2xl mb-6">
              <h2 className="text-white text-lg font-semibold mb-2">Your Housing Search</h2>
              <p className="text-gray-400 text-sm">
                Browse verified annexes near your university from the{' '}
                <span onClick={() => navigate('/')} className="text-blue-400 cursor-pointer hover:underline">Home page</span>.
              </p>
            </div>

          </>
        )}

        {/* Log Out */}
        <button onClick={handleLogout}
          className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl py-3 text-sm font-medium transition-all">
          Log Out
        </button>
      </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="text-4xl text-center mb-4">⚠️</div>
            <h3 className="text-white text-xl font-bold text-center mb-2">Delete Account?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              This will permanently delete your account and all your data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-[#1f2a3c] text-gray-300 hover:text-white rounded-xl py-3 text-sm font-medium transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50">
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div className="bg-[#0d1526] border border-[#1f2a3c] rounded-xl px-4 py-3">
      <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-white text-sm font-medium">{value || '—'}</p>
    </div>
  );
}