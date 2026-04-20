import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function useGoogleFonts() {
  useEffect(() => {
    const id = 'uninest-google-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap';
    document.head.appendChild(link);
  }, []);
}

const FONT_DISPLAY = { fontFamily: "'Syne', sans-serif" };
const FONT_BODY    = { fontFamily: "'DM Sans', sans-serif" };

export default function Login() {
  useGoogleFonts();

  const navigate  = useNavigate();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState('user');

  const [formData,  setFormData]  = useState({ email: '', password: '' });
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showPass,  setShowPass]  = useState(false);

  const [adminForm,     setAdminForm]     = useState({ username: '', password: '' });
  const [adminError,    setAdminError]    = useState('');
  const [adminLoading,  setAdminLoading]  = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  const ADMIN_USERNAME = 'Admin';
  const ADMIN_PASSWORD = 'Admin123';

  const handleChange      = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleAdminChange = (e) => setAdminForm({ ...adminForm, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res  = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Login failed.'); }
      else { login(data.user, data.token); navigate('/'); }
    } catch { setError('Server error. Please try again.'); }
    finally   { setLoading(false); }
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    setAdminError(''); setAdminLoading(true);
    setTimeout(() => {
      if (adminForm.username === ADMIN_USERNAME && adminForm.password === ADMIN_PASSWORD) {
        localStorage.setItem('uninest_admin', 'true');
        navigate('/details');
      } else {
        setAdminError('Invalid admin credentials. Please try again.');
      }
      setAdminLoading(false);
    }, 600);
  };

  const EyeIcon = ({ show }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {show ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </>
      )}
    </svg>
  );

  return (
    <div
      className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={FONT_BODY}
    >
      {/* ── Animated background orbs ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #2563eb, transparent)', top: '-4rem', left: '-4rem', animation: 'float1 8s ease-in-out infinite' }} />
        <div className="absolute w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #f59e0b, transparent)', bottom: '-6rem', right: '-6rem', animation: 'float2 10s ease-in-out infinite' }} />
        <div className="absolute w-48 h-48 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', top: '50%', left: '60%', animation: 'float1 12s ease-in-out infinite reverse' }} />
      </div>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(20px, 20px) scale(1.05); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-20px, -15px) scale(1.08); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .pulse-ring::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 0.75rem;
          border: 2px solid #2563eb;
          animation: pulse-ring 2.5s ease-out infinite;
        }
        .tab-slide { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .input-glow:focus       { box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }
        .input-glow-amber:focus { box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); }
      `}</style>

      <div className="w-full max-w-md relative z-10">

        {/* ── Logo Header ── */}
        <div className="flex flex-col items-center mb-8">
          {/* ✅ UPDATED: UniNEST logo replaces the blue U box */}
          <div className="relative pulse-ring w-14 h-14 mb-3">
            <img
              src="/ITPM Images/ITPM.png"
              alt="UniNEST Logo"
              style={{ width: '56px', height: '56px' }}
              className="rounded-xl object-contain"
            />
          </div>
          <h1 className="text-white text-3xl font-bold tracking-tight" style={FONT_DISPLAY}>UNINEST</h1>
          <p className="text-gray-500 text-xs mt-1 tracking-widest uppercase" style={FONT_BODY}>Student Housing Platform</p>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-1.5 flex gap-1.5 mb-4">
          <button
            onClick={() => { setActiveTab('user'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2
              ${activeTab === 'user' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-gray-500 hover:text-gray-300'}`}
            style={FONT_BODY}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            User Login
          </button>
          <button
            onClick={() => { setActiveTab('admin'); setAdminError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2
              ${activeTab === 'admin' ? 'bg-amber-500 text-[#0a0f1e] shadow-lg shadow-amber-500/30' : 'text-gray-500 hover:text-gray-300'}`}
            style={FONT_BODY}
          >
            🛡️ Admin Portal
          </button>
        </div>

        {/* ══════════════════════════════
            USER LOGIN PANEL
        ══════════════════════════════ */}
        <div className={`tab-slide ${activeTab === 'user' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none absolute w-full max-w-md'}`}>
          <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-8 shadow-2xl">
            <h2 className="text-white text-2xl font-semibold mb-1" style={FONT_DISPLAY}>Welcome back 👋</h2>
            <p className="text-gray-400 text-sm mb-8" style={FONT_BODY}>Log in to your student account to continue</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6 flex items-center gap-2" style={FONT_BODY}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block" style={FONT_BODY}>Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange} required
                    placeholder="john@example.com"
                    className="input-glow w-full bg-[#0d1526] border border-[#1f2a3c] text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    style={FONT_BODY}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-gray-300 text-xs font-medium uppercase tracking-wider" style={FONT_BODY}>Password</label>
                  <button type="button" className="text-blue-400 hover:text-blue-300 text-xs transition-colors" style={FONT_BODY}></button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required
                    placeholder="••••••••"
                    className="input-glow w-full bg-[#0d1526] border border-[#1f2a3c] text-white placeholder-gray-600 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    style={FONT_BODY}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    <EyeIcon show={showPass} />
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-semibold transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                style={FONT_DISPLAY}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Logging in...
                  </>
                ) : 'Log In →'}
              </button>
            </form>

            <p className="text-gray-500 text-sm text-center mt-6" style={FONT_BODY}>
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">Sign Up</Link>
            </p>
          </div>
        </div>

        {/* ══════════════════════════════
            ADMIN LOGIN PANEL
        ══════════════════════════════ */}
        <div className={`tab-slide ${activeTab === 'admin' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none absolute w-full max-w-md'}`}>
          <div className="bg-[#111827] border border-amber-500/25 rounded-2xl p-8 shadow-2xl">

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/35 rounded-xl flex items-center justify-center text-amber-400 text-xl">
                🛡️
              </div>
              <div>
                <p className="text-amber-400 text-sm font-semibold" style={FONT_DISPLAY}>Administrator Portal</p>
                <p className="text-gray-500 text-xs mt-0.5" style={FONT_BODY}>Restricted — Authorised Personnel Only</p>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 mt-4 flex items-start gap-2">
              <span className="text-amber-500 mt-0.5 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <p className="text-amber-500/70 text-xs leading-relaxed" style={FONT_BODY}>
                All admin sessions are logged and monitored. Unauthorised access attempts are recorded.
              </p>
            </div>

            {adminError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-5 flex items-center gap-2" style={FONT_BODY}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                {adminError}
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1.5 block" style={FONT_BODY}>Admin Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <input
                    type="text" name="username" value={adminForm.username} onChange={handleAdminChange} required
                    placeholder="Enter admin username"
                    className="input-glow-amber w-full bg-[#0d1526] border border-[#1f2a3c] text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                    style={FONT_BODY}
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1.5 block" style={FONT_BODY}>Admin Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showAdminPass ? 'text' : 'password'} name="password" value={adminForm.password} onChange={handleAdminChange} required
                    placeholder="••••••••"
                    className="input-glow-amber w-full bg-[#0d1526] border border-[#1f2a3c] text-white placeholder-gray-600 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                    style={FONT_BODY}
                  />
                  <button type="button" onClick={() => setShowAdminPass(!showAdminPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    <EyeIcon show={showAdminPass} />
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={adminLoading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-[#0a0f1e] rounded-xl py-3 text-sm font-bold tracking-wide transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                style={FONT_DISPLAY}
              >
                {adminLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Verifying...
                  </>
                ) : '🛡️ Login as Admin'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}