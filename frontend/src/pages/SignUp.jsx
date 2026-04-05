import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClear = () => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: '',
      email: '',
      phone: '',
      role: '',
      password: '',
      confirmPassword: '',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!formData.role) {
      setError('Please select a user type.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Registration failed.');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-[#111827] border border-[#1f2a3c] rounded-2xl p-8 shadow-2xl">
        {/* Logo / Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">U</div>
          <span className="text-white text-2xl font-bold tracking-tight">UniNEST</span>
        </div>

        <h2 className="text-white text-2xl font-semibold mb-1">Create your account</h2>
        <p className="text-gray-400 text-sm mb-8">Join thousands of students and landlords on UniNEST</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="John"
                className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Doe"
                className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled className="text-gray-500">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="john@example.com"
              className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+94 77 000 0000"
              className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Role / User Type */}
          <div>
            <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">I am a</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled className="text-gray-500">Select user type</option>
              <option value="student">Student</option>
              <option value="landlord">Annex Owner / Landlord</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1.5 block">Re-enter Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full bg-[#0d1526] border border-[#1f2a3c] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 bg-transparent border border-[#1f2a3c] text-gray-300 hover:text-white hover:border-gray-500 rounded-xl py-3 text-sm font-medium transition-all"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <p className="text-gray-500 text-sm text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}