import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&q=80';

const styles = `
  .annex-wrap {
    min-height: 100vh;
    background: #050c1a;
    position: relative;
    overflow: hidden;
  }
  .hero-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(45,126,247,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .hero-glow-orb {
    position: absolute; top: -120px; left: -80px;
    width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(45,126,247,0.15) 0%, transparent 70%);
    pointer-events: none;
  }
  .cta-glow-orb {
    position: absolute; bottom: -160px; right: -100px;
    width: 600px; height: 600px;
    background: radial-gradient(ellipse, rgba(45,126,247,0.2) 0%, transparent 70%);
    pointer-events: none;
  }
  .annex-card {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(0,0,0,0.4);
    transition: transform 0.25s, box-shadow 0.25s;
  }
  .annex-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 50px rgba(0,0,0,0.5), 0 0 30px rgba(45,126,247,0.18);
  }
  .card-img-overlay::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 40%, rgba(5,12,26,0.7) 100%);
  }
  .badge-glass {
    background: rgba(45,126,247,0.25);
    border: 1px solid rgba(45,126,247,0.45);
    color: #7ab8fc;
    backdrop-filter: blur(8px);
  }
  .btn-glass-outline {
    background: transparent;
    border: 1px solid rgba(45,126,247,0.35);
    color: #5ba4fa;
    transition: all 0.18s;
  }
  .btn-glass-outline:hover {
    background: rgba(45,126,247,0.12);
    border-color: rgba(45,126,247,0.6);
    color: #93c3fd;
  }
  .btn-glow {
    background: #2d7ef7;
    box-shadow: 0 0 20px rgba(45,126,247,0.35);
    transition: all 0.18s;
  }
  .btn-glow:hover {
    background: #4a96ff;
    box-shadow: 0 0 28px rgba(45,126,247,0.55);
  }
  .back-glass {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(10px);
    color: rgba(255,255,255,0.75);
    transition: all 0.2s;
  }
  .back-glass:hover {
    background: rgba(45,126,247,0.15);
    border-color: rgba(45,126,247,0.4);
    color: #fff;
  }
`;

function AnnexBookingPage() {
  const navigate = useNavigate();
  const [annexes, setAnnexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, []);

  useEffect(() => {
    const fetchAnnexes = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_BASE}/api/annexes/search`);
        setAnnexes(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error('Error fetching annexes:', err);
        setError('Failed to load annexes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnexes();
  }, []);

  const getImageUrl = (annex) => {
    if (annex?.imageUrl) {
      return annex.imageUrl.startsWith('http') ? annex.imageUrl : `${API_BASE}${annex.imageUrl}`;
    }
    if (Array.isArray(annex?.imageUrls) && annex.imageUrls.length > 0) {
      const firstImage = annex.imageUrls[0];
      return firstImage.startsWith('http') ? firstImage : `${API_BASE}${firstImage}`;
    }
    return FALLBACK_IMAGE;
  };

  const handleViewDetails = (annex) => navigate(`/annex/${annex._id}`, { state: { annex } });

  const handleBookNow = (annex) => {
    navigate('/booking', {
      state: {
        room: {
          annexId: annex._id,
          title: annex.title,
          imageUrl: getImageUrl(annex),
          location: annex.selectedAddress || 'Near SLIIT Malabe Campus',
        },
      },
    });
  };

  return (
    <div className="annex-wrap">
      {/* Background glows */}
      <div className="hero-bg" />
      <div className="hero-glow-orb" />
      <div className="cta-glow-orb" />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1240, margin: '0 auto', padding: '2.5rem 1.5rem 3rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <p style={{ fontSize: 12, color: 'rgba(45,126,247,0.85)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Bookings
            </p>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', textShadow: '0 0 40px rgba(45,126,247,0.5)' }}>
              Annex Booking Gallery
            </h1>
          </div>
          <Link to="/" className="back-glass" style={{ padding: '0.5rem 1.1rem', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>

        {/* States */}
        {loading && (
          <div style={{ padding: '5rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
            Loading annexes...
          </div>
        )}
        {!loading && error && (
          <div style={{ padding: '5rem 0', textAlign: 'center', color: 'rgba(255,100,100,0.7)', fontSize: 14 }}>
            {error}
          </div>
        )}
        {!loading && !error && annexes.length === 0 && (
          <div style={{ padding: '5rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
            No annexes available.
          </div>
        )}

        {/* Grid */}
        {!loading && !error && annexes.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {annexes.map((annex) => (
              <article key={annex._id} className="annex-card">
                {/* Image */}
                <div className="card-img-overlay" style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                  <img
                    src={getImageUrl(annex)}
                    alt={annex.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {annex.preferredGender && (
                    <span className="badge-glass" style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                      {annex.preferredGender}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '1rem 1.1rem 1.1rem' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e8eeff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {annex.title}
                  </h2>
                  <p style={{ color: '#2d7ef7', fontWeight: 700, fontSize: '0.85rem', margin: '0.3rem 0 0.2rem' }}>
                    Rs. {Number(annex.price || 0).toLocaleString()} /mo
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {annex.selectedAddress || 'Near SLIIT Malabe Campus'}
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
                    <button
                      type="button"
                      onClick={() => handleViewDetails(annex)}
                      className="btn-glass-outline"
                      style={{ flex: 1, padding: '0.5rem', borderRadius: 9, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBookNow(annex)}
                      className="btn-glow"
                      style={{ flex: 1, padding: '0.5rem', borderRadius: 9, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: '#fff', border: 'none' }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnnexBookingPage;