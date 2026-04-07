

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AboutUs from './pages/AboutUs';
import Home from './pages/Home';
import SupportDetails from './components/SupportDetails';
import SupportForm from './components/SupportForm';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin'; 
import './App.css'
import SearchAnnex from './pages/SearchAnnex';
import AddAnnexPage from './pages/AddAnnexPage';
import AnnexDetailsPage from './pages/AnnexDetailsPage';




function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/support" element={<SupportForm />} />
          <Route path="/details" element={<SupportDetails />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/searchAnnex" element={<SearchAnnex/>} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/addAnnex" element={<AddAnnexPage />} />
          <Route path="/annex/:id" element={<AnnexDetailsPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
 
export default App;