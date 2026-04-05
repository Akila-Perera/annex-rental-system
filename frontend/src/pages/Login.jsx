import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate   = useNavigate();
  const { login }  = useAuth();

  /* ── User login ── */
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  /* ── Admin login ── */
  const [adminForm,    setAdminForm]    = useState({ username: '', password: '' });
  const [adminError,   setAdminError]   = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  /* ── Hardcoded admin credentials ── */
  const ADMIN_USERNAME = 'Admin';
  const ADMIN_PASSWORD = 'Admin123';

  const handleChange      = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleAdminChange = (e) => setAdminForm({ ...adminForm, [e.target.name]: e.target.value });

  /* ── User submit ── */
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

  /* ── Admin submit — hardcoded check ── */
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

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        {/* ══════════════════════════════
            USER LOGIN CARD
        ══════════════════════════════ */}
        <div className="bg-[#111827] border border-[#1f2a3c] rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">U</div>
            <span className="text-white text-2xl font-bold tracking-tight">UniNEST</span>
          </div>

          <h2 className="text-white text-2xl font-semibold mb-1">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-8">Log in to your account to continue</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required
                placeholder="john@example.com"
                className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required
                placeholder="••••••••"
                className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-semibold transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="text-gray-500 text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 transition-colors">Sign Up</Link>
          </p>
        </div>

        {/* ══════════════════════════════
            DIVIDER
        ══════════════════════════════ */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-amber-500/20" />
          <span className="text-amber-500/60 text-xs font-medium tracking-widest uppercase">Admin Access</span>
          <div className="flex-1 h-px bg-amber-500/20" />
        </div>

        {/* ══════════════════════════════
            ADMIN LOGIN CARD
        ══════════════════════════════ */}
        <div className="bg-[#111827] border border-amber-500/25 rounded-2xl p-8 shadow-2xl">
          {/* Admin header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/35 rounded-xl flex items-center justify-center text-amber-400 text-xl">
              🛡️
            </div>
            <div>
              <p className="text-amber-400 text-sm font-semibold">Administrator Portal</p>
              <p className="text-gray-500 text-xs mt-0.5">Restricted — Authorised Personnel Only</p>
            </div>
          </div>

          {adminError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">{adminError}</div>
          )}

          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1.5 block">Admin Username</label>
              <input type="text" name="username" value={adminForm.username} onChange={handleAdminChange} required
                placeholder="Enter admin username"
                className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/60 transition-colors" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1.5 block">Admin Password</label>
              <input type="password" name="password" value={adminForm.password} onChange={handleAdminChange} required
                placeholder="••••••••"
                className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/60 transition-colors" />
            </div>
            <button type="submit" disabled={adminLoading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#0a0f1e] rounded-xl py-3 text-sm font-bold tracking-wide transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {adminLoading ? 'Verifying...' : '🛡️ Login as Admin'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}