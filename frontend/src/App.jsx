import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AboutUs from './pages/AboutUs';
import Home from './pages/Home';
import SupportDetails from './components/SupportDetails';
import SupportForm from './components/SupportForm';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import './App.css';
import SearchAnnex from './pages/SearchAnnex';
import AddAnnexPage from './pages/AddAnnexPage';
import AnnexDetailsPage from './pages/AnnexDetailsPage';
import BookingPage from './pages/BookingPage';
import AnnexBookingPage from './pages/AnnexBookingPage';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import WriteReview from './pages/WriteReview';
import AdminDashboard from './pages/AdminDashboard';

// ─────────────────────────────────────────────
// ProtectedRoute — redirects guests to /login
// ─────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, token } = useAuth();
  if (!user || !token) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/"            element={<Home />} />
          <Route path="/about"       element={<AboutUs />} />
          <Route path="/signup"      element={<SignUp />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/details"     element={<SupportDetails />} />

          {/* 🔒 Support — logged-in users only (student or landlord) */}
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <SupportForm />
              </ProtectedRoute>
            }
          />

          {/* 🔒 Profile — logged-in users only */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Other protected routes */}
          <Route path="/searchAnnex"      element={<SearchAnnex />} />
          <Route path="/addAnnex"         element={<AddAnnexPage />} />
          <Route path="/annex/:id"        element={<AnnexDetailsPage />} />
          <Route path="/booking"          element={<BookingPage />} />
          <Route path="/annex-bookings"   element={<AnnexBookingPage />} />
          <Route path="/properties"       element={<Properties />} />
          <Route path="/property/:id"     element={<PropertyDetails />} />
          <Route path="/write-review/:propertyId?" element={<WriteReview />} />
          <Route path="/admin"            element={<AdminDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;