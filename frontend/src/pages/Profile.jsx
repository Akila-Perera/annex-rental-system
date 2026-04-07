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
    fetchOwnerAnnexes();
  }, [isLandlord, user?.id]);

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0f1e] px-4 py-12">
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

        {/* Landlord: Add Annex */}
        {isLandlord && (
          <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-6 shadow-2xl mb-6">
            <h2 className="text-white text-lg font-semibold mb-2">Manage Your Listings</h2>
            <p className="text-gray-400 text-sm mb-5">Add your annex or boarding house so students can find and book it.</p>
            <Link to="/addAnnex"
              className="inline-block px-5 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-medium transition-all">
              ➕ Add New Annex
            </Link>

            <div className="mt-6">
              <h3 className="text-white text-sm font-semibold mb-3">Your Added Annexes</h3>
              {annexLoading && (
                <p className="text-gray-400 text-sm">Loading your annexes...</p>
              )}

              {!annexLoading && ownerAnnexes.length === 0 && (
                <p className="text-gray-500 text-sm">You have not added any annexes yet.</p>
              )}

              {!annexLoading && ownerAnnexes.length > 0 && (
                <div className="space-y-3">
                  {ownerAnnexes.map((annex) => (
                    <div key={annex._id} className="bg-[#0d1526] border border-[#1f2a3c] rounded-xl p-4">
                      {editingAnnexId === annex._id ? (
                        <div className="space-y-3">
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
                          <p className="text-white font-semibold">{annex.title}</p>
                          <p className="text-blue-400 text-sm mt-1">Rs. {annex.price} / month</p>
                          {annex.selectedAddress && (
                            <p className="text-gray-400 text-xs mt-1">{annex.selectedAddress}</p>
                          )}
                          <div className="flex gap-2 mt-3">
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

        {/* Student: Quick Info */}
        {!isLandlord && (
          <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-6 shadow-2xl mb-6">
            <h2 className="text-white text-lg font-semibold mb-2">Your Housing Search</h2>
            <p className="text-gray-400 text-sm">
              Browse verified annexes near your university from the{' '}
              <span onClick={() => navigate('/')} className="text-blue-400 cursor-pointer hover:underline">Home page</span>.
            </p>
          </div>
        )}

        {/* Log Out */}
        <button onClick={handleLogout}
          className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl py-3 text-sm font-medium transition-all">
          Log Out
        </button>
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