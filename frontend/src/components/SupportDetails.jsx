import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SupportDetails() {
  const navigate = useNavigate();
  const [supports, setSupports]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [editItem, setEditItem]         = useState(null);
  const [editForm, setEditForm]         = useState({});
  const [editLoading, setEditLoading]   = useState(false);
  const [editError, setEditError]       = useState('');
  const [focusedField, setFocusedField] = useState('');

  // ── Admin guard ──
  useEffect(() => {
    if (localStorage.getItem('uninest_admin') !== 'true') {
      navigate('/admin-login');
    }
  }, []);

  // ── Logout ──
  const handleLogout = () => {
    localStorage.removeItem('uninest_admin');
    navigate('/');          // goes to Home after logout
  };

  const fetchSupports = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/support')
      .then(res => { setSupports(res.data.data); setLoading(false); })
      .catch(()  => setLoading(false));
  };

  useEffect(() => { fetchSupports(); }, []);

  const formatDate = (d) =>
    new Date(d).toLocaleString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/support/${id}`);
      setSupports(prev => prev.filter(s => s._id !== id));
    } catch { alert('Failed to delete. Please try again.'); }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({ firstName:item.firstName, lastName:item.lastName, email:item.email, phoneNumber:item.phoneNumber, description:item.description });
    setEditError('');
  };
  const closeEdit = () => { setEditItem(null); setEditError(''); };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true); setEditError('');
    try {
      const res = await axios.put(`http://localhost:5000/api/support/${editItem._id}`, editForm);
      setSupports(prev => prev.map(s => s._id === editItem._id ? res.data.data : s));
      closeEdit();
    } catch { setEditError('Failed to update. Please try again.'); }
    finally   { setEditLoading(false); }
  };

  const inputCls = (name) =>
    `w-full px-3.5 py-2.5 bg-white/4 rounded-lg text-[#f0f4ff] text-[0.95rem] outline-none transition-all duration-300 ${
      focusedField === name
        ? 'border-[1.5px] border-blue-500/60 shadow-[0_0_0_3px_rgba(45,126,247,0.15)]'
        : 'border-[1.5px] border-white/7'
    }`;

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f4ff] px-4 py-10 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes spin      { to{transform:rotate(360deg);} }
        @keyframes pulseGlow { 0%,100%{opacity:.4;transform:scale(1);} 50%{opacity:.7;transform:scale(1.08);} }
        .animate-spin-slow   { animation: spin 0.8s linear infinite; }
        .animate-pulse-glow  { animation: pulseGlow 5s ease-in-out infinite; }
        .glow-orb { background: radial-gradient(circle, rgba(45,126,247,0.12) 0%, transparent 70%); }
      `}</style>

      <div className="fixed -top-[200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full glow-orb animate-pulse-glow pointer-events-none z-0" />

      <div className="max-w-[1100px] mx-auto relative z-10">

        {/* ── Header with Logout ── */}
        <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
          <div>
            <div className="inline-block mb-3 px-3.5 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-300 text-[0.78rem] font-medium tracking-[0.03em]">📋 Admin Panel</div>
            <h2 className="font-display text-[2rem] font-extrabold text-[#f0f4ff] mb-1.5 leading-[1.15]">Support Submissions</h2>
            <p className="text-[#8a96b0] text-[0.92rem]">All submitted student support requests</p>
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <button onClick={() => navigate('/support')}
              className="px-6 py-2.5 bg-blue-500 text-white border-none rounded-[14px] font-semibold cursor-pointer text-[0.92rem] whitespace-nowrap hover:bg-blue-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/35 transition-all duration-300">
              + New Request
            </button>
            
            {/* ── MANAGE REVIEWS BUTTON ── */}
            <button onClick={() => navigate('/admin')}
              className="px-6 py-2.5 bg-purple-500 text-white border-none rounded-[14px] font-semibold cursor-pointer text-[0.92rem] whitespace-nowrap hover:bg-purple-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/35 transition-all duration-300">
              📝 Manage Reviews
            </button>
            
            {/* ── LOGOUT BUTTON ── */}
            <button onClick={handleLogout}
              className="px-6 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-[14px] font-semibold cursor-pointer text-[0.92rem] whitespace-nowrap hover:bg-red-600/85 hover:text-white hover:border-red-600/85 hover:-translate-y-0.5 transition-all duration-300">
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && supports.length > 0 && (
          <div className="bg-[#161b25] border border-white/7 rounded-[14px] flex mb-9 overflow-hidden">
            {[
              { num: supports.length, label:'Total Submissions' },
              { num: supports.filter(s=>{ const d=new Date(s.createdAt),n=new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); }).length, label:'This Month' },
              { num: new Set(supports.map(s=>s.email)).size, label:'Unique Students' },
            ].map((s,i)=>(
              <div key={s.label} className={`flex-1 text-center py-5 px-5 ${i>0?'border-l border-white/7':''}`}>
                <div className="font-display text-[1.6rem] font-extrabold text-blue-400 mb-1">{s.num}</div>
                <div className="text-[#8a96b0] text-[0.82rem]">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* States */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-9 h-9 border-[3px] border-blue-500/20 border-t-blue-500 rounded-full mx-auto mb-4 animate-spin-slow" />
            <p className="text-[#8a96b0]">Loading submissions...</p>
          </div>
        ) : supports.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">📭</p>
            <p className="text-[#8a96b0] mb-5">No submissions yet.</p>
            <button onClick={() => navigate('/support')} className="px-6 py-2.5 bg-blue-500 text-white rounded-[14px] font-semibold cursor-pointer hover:bg-blue-400 hover:-translate-y-0.5 transition-all duration-300">
              Submit First Request
            </button>
          </div>
        ) : (
          <div className="grid gap-6" style={{gridTemplateColumns:'repeat(auto-fill, minmax(380px, 1fr))'}}>
            {supports.map(item => (
              <div key={item._id}
                className="bg-[#1a2030] border border-white/7 rounded-[20px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-default hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(45,126,247,0.15)] hover:bg-[#1e2638] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-[46px] h-[46px] rounded-[14px] bg-blue-500 text-white flex items-center justify-center font-display font-bold text-base flex-shrink-0 shadow-[0_4px_12px_rgba(45,126,247,0.3)]">
                    {item.firstName[0]}{item.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-[#f0f4ff] text-base mb-0.5">{item.firstName} {item.lastName}</p>
                    <p className="text-[#5a6478] text-[0.75rem]">🕐 {formatDate(item.createdAt)}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[0.68rem] font-bold tracking-[0.05em] bg-green-500/20 text-green-400 border border-green-500/30 flex-shrink-0">Open</span>
                </div>
                <div className="h-px bg-white/7 mb-4" />
                {[['📧 EMAIL', item.email], ['📞 PHONE', item.phoneNumber]].map(([label,val])=>(
                  <div key={label} className="flex justify-between items-center mb-2.5 gap-3">
                    <span className="text-[#5a6478] font-semibold text-[0.68rem] tracking-[0.07em] flex-shrink-0">{label}</span>
                    <span className="text-[#f0f4ff] font-medium text-sm text-right break-all">{val}</span>
                  </div>
                ))}
                <div className="bg-white/3 border border-white/7 rounded-lg p-3.5 mt-3.5">
                  <p className="text-[#5a6478] font-semibold text-[0.68rem] tracking-[0.07em] mb-2">📝 DESCRIPTION</p>
                  <p className="text-[#8a96b0] text-sm leading-[1.6]">{item.description}</p>
                </div>
                <div className="flex gap-2.5 mt-4">
                  <button onClick={() => openEdit(item)}
                    className="flex-1 py-2.5 px-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-300">
                    ✏️ Update
                  </button>
                  <button onClick={() => handleDelete(item._id)}
                    className="flex-1 py-2.5 px-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium cursor-pointer hover:bg-red-600/85 hover:text-white hover:border-red-600/85 transition-all duration-300">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center mt-10">
          <a href="/" className="text-[#5a6478] text-sm hover:text-blue-300 transition-colors duration-200">← Back to Home</a>
        </p>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-center justify-center p-5" onClick={closeEdit}>
          <div className="bg-[#1a2030] border border-white/7 rounded-[20px] px-9 py-10 w-full max-w-[580px] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(45,126,247,0.1)] relative max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-7 gap-4">
              <div>
                <div className="inline-block mb-2 px-3.5 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-300 text-[0.78rem] font-medium">✏️ Edit Submission</div>
                <h3 className="font-display text-[1.4rem] font-extrabold text-[#f0f4ff] mt-1.5">Update Support Request</h3>
              </div>
              <button onClick={closeEdit}
                className="w-[34px] h-[34px] bg-white/6 border border-white/10 text-[#8a96b0] rounded-lg cursor-pointer text-sm flex items-center justify-center flex-shrink-0 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200">✕</button>
            </div>
            {editError && (
              <div className="bg-red-500/12 border border-red-500/30 text-red-400 px-3.5 py-2.5 rounded-lg mb-5 text-sm">{editError}</div>
            )}
            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[['firstName','FIRST NAME'],['lastName','LAST NAME']].map(([name,label])=>(
                  <div key={name}>
                    <label className="block text-[0.7rem] font-semibold text-[#5a6478] tracking-[0.08em] mb-1.5">{label}</label>
                    <input type="text" value={editForm[name]} onChange={e=>setEditForm({...editForm,[name]:e.target.value})}
                      onFocus={()=>setFocusedField(name)} onBlur={()=>setFocusedField('')}
                      required className={inputCls(name)} />
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <label className="block text-[0.7rem] font-semibold text-[#5a6478] tracking-[0.08em] mb-1.5">EMAIL ADDRESS</label>
                <input type="email" value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})}
                  onFocus={()=>setFocusedField('email')} onBlur={()=>setFocusedField('')}
                  required className={inputCls('email')} />
              </div>
              <div className="mb-4">
                <label className="block text-[0.7rem] font-semibold text-[#5a6478] tracking-[0.08em] mb-1.5">PHONE NUMBER</label>
                <input type="tel" value={editForm.phoneNumber} onChange={e=>setEditForm({...editForm,phoneNumber:e.target.value})}
                  onFocus={()=>setFocusedField('phoneNumber')} onBlur={()=>setFocusedField('')}
                  required className={inputCls('phoneNumber')} />
              </div>
              <div className="mb-4">
                <label className="block text-[0.7rem] font-semibold text-[#5a6478] tracking-[0.08em] mb-1.5">DESCRIPTION</label>
                <textarea value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})}
                  onFocus={()=>setFocusedField('description')} onBlur={()=>setFocusedField('')}
                  required rows={4} className={`${inputCls('description')} resize-y leading-[1.6]`} />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={closeEdit}
                  className="flex-1 py-3.5 bg-transparent border border-white/7 text-[#8a96b0] rounded-[14px] text-[0.95rem] font-medium cursor-pointer hover:border-blue-500/40 hover:text-[#f0f4ff] transition-all duration-300">
                  Cancel
                </button>
                <button type="submit" disabled={editLoading}
                  className={`flex-1 py-3.5 rounded-[14px] text-[0.95rem] font-semibold transition-all duration-300 ${
                    editLoading
                      ? 'bg-blue-500/35 text-white/50 cursor-not-allowed'
                      : 'bg-blue-500 text-white cursor-pointer hover:bg-blue-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/35'
                  }`}>
                  {editLoading ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportDetails;