require('dotenv').config(); 

const express       = require('express');
const cors          = require('cors');
const path          = require('path');
const connectDB     = require('./config/db');
const mongoose      = require('mongoose');
const annexRoutes   = require('./routes/annexRoutes');
const supportRoutes = require('./routes/supportRoutes');
const authRoutes    = require('./routes/authRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const bookingRoutesModule = require('./routes/bookingRoutes');
const setServers = require('dns').setServers;

const reviewRoutesModule  = require('./routes/reviewRoutes');
const adminRoutesModule   = require('./routes/adminRoutes');
const qualityRoutesModule = require('./routes/qualityRoutes');
const aiRoutesModule      = require('./routes/aiRoutes'); // ✅ ADDED

// ── NEW: Watch Me Timer ──────────────────────────────────
const watchmeRoutes = require('./routes/watchme');

const reviewRoutes   = reviewRoutesModule.default   || reviewRoutesModule;
const adminRoutes    = adminRoutesModule.default    || adminRoutesModule;
const qualityRoutes  = qualityRoutesModule.default  || qualityRoutesModule;
const bookingRoutes  = bookingRoutesModule.default  || bookingRoutesModule;
const aiRoutes       = aiRoutesModule.default       || aiRoutesModule; // ✅ ADDED

setServers(["1.1.1.1", "8.8.8.8"]);

connectDB();

const app = express();

app.use(express.json());

// ── CORS ──────────────────────────────────────────────
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parser ──────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ───────────────────────────────────────────
app.use('/api/support', supportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/annexes', annexRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/inquiries', inquiryRoutes);

// Review System Routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/ai', aiRoutes); // ✅ ADDED

// ── NEW: Watch Me Timer route ────────────────────────
app.use('/api/watchme', watchmeRoutes);

// ── Health check ─────────────────────────────────────
app.get('/', (req, res) => {
  res.send('Student Annex Backend API is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});