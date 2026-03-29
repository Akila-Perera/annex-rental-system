import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AboutUs from './pages/AboutUs';
import Home from './pages/Home';
import SupportDetails from './components/SupportDetails';
import SupportForm from './components/SupportForm';
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/support" element={<SupportForm />} />
        <Route path="/details" element={<SupportDetails />} />
      </Routes>
    </Router>
  )
}

export default App
