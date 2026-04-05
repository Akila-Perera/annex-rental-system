import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-transparent absolute top-0 left-0 right-0 z-50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-base">U</div>
        <span className="text-white text-xl font-bold tracking-tight">UniNEST</span>
      </Link>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        <Link to="#bookings" className="hover:text-white transition-colors">Bookings</Link>
        <Link to="#listings" className="hover:text-white transition-colors">Top Listings</Link>
        <Link to="/support" className="hover:text-white transition-colors">Student Support</Link>
        <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
      </div>

      {/* Auth Buttons */}
      <div className="flex items-center gap-3">
        {user ? (
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 bg-[#111827] border border-[#1f2a3c] hover:border-blue-500/50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold select-none">
              {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
            </div>
            {user.firstName}
          </button>
        ) : (
          <>
            <Link
              to="/signup"
              className="text-gray-300 hover:text-white text-sm font-medium transition-colors px-2"
            >
              Sign Up
            </Link>
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              Log In
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}