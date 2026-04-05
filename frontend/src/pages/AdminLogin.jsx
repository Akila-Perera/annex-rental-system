import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_EMAIL    = 'admin@uninest.com';   // change to your credentials
const ADMIN_PASSWORD = 'admin123';            // change to your credentials

function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (form.email === ADMIN_EMAIL && form.password === ADMIN_PASSWORD) {
        localStorage.setItem('uninest_admin', 'true');
        navigate('/details');
      } else {
        setError('Invalid admin credentials. Please try again.');
      }
      setLoading(false);
    }, 600);
  };

  const inputCls = (name) =>
    `w-full px-3.5 py-2.5 bg-white/4 rounded-lg text-[#f0f4ff] text-[0.95rem] outline-none transition-all duration-300 ${
      focused === name
        ? 'border-[1.5px] border-blue-500/60 shadow-[0_0_0_3px_rgba(45,126,247,0.15)]'
        : 'border-[1.5px] border-white/7'
    }`;

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f4ff] flex items-center justify-center px-4 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes pulseGlow { 0%,100%{opacity:.4;transform:scale(1);} 50%{opacity:.7;transform:scale(1.08);} }
        .animate-pulse-glow { animation: pulseGlow 5s ease-in-out infinite; }
        .glow-orb { background: radial-gradient(circle, rgba(45,126,247,0.12) 0%, transparent 70%); }
      `}</style>

      {/* Background glow */}
      <div className="fixed -top-[200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full glow-orb animate-pulse-glow pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-blue-500 rounded-[10px] flex items-center justify-center text-lg">🏠</div>
          <span className="font-display text-[1.3rem] font-extrabold text-[#f0f4ff]">
            Uni<span className="text-blue-400">NEST</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#1a2030] border border-white/7 rounded-[24px] px-8 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-8">
            <div className="inline-block mb-3 px-3.5 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-300 text-[0.78rem] font-medium tracking-[0.03em]">
              🔐 Admin Access Only
            </div>
            <h1 className="font-display text-[1.6rem] font-extrabold text-[#f0f4ff] mb-1.5">Admin Login</h1>
            <p className="text-[#8a96b0] text-sm">Sign in to manage support submissions</p>
          </div>

          {error && (
            <div className="bg-red-500/12 border border-red-500/30 text-red-400 px-3.5 py-2.5 rounded-lg mb-5 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[0.7rem] font-semibold text-[#5a6478] tracking-[0.08em] mb-1.5">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                placeholder="admin@uninest.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                required
                className={inputCls('email')}
              />
            </div>

            <div>
              <label className="block text-[0.7rem] font-semibold text-[#5a6478] tracking-[0.08em] mb-1.5">
                PASSWORD
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                required
                className={inputCls('password')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mt-2 w-full py-3.5 rounded-[14px] text-[0.95rem] font-semibold transition-all duration-300 ${
                loading
                  ? 'bg-blue-500/35 text-white/50 cursor-not-allowed'
                  : 'bg-blue-500 text-white cursor-pointer hover:bg-blue-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/35'
              }`}
            >
              {loading ? 'Verifying...' : '🔐 Login as Admin'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6">
          <a href="/" className="text-[#5a6478] text-sm hover:text-blue-300 transition-colors duration-200">
            ← Back to Home
          </a>
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;