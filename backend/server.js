require('dotenv').config(); 

const express       = require('express');
const cors          = require('cors');
const path          = require('path');
const connectDB     = require('./config/db');
const annexRoutes   = require('./routes/annexRoutes');
const supportRoutes = require('./routes/supportRoutes');
const authRoutes    = require('./routes/authRoutes');
const setServers = require('dns').setServers;
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const qualityRoutes = require('./routes/qualityRoutes');

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

// ── 2. Body parser ──────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── 3. Routes — each registered ONCE ───────────────────
app.use('/api/support', supportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/annexes', annexRoutes);

// Your Review System Routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quality', qualityRoutes);

// ── 4. Health check ─────────────────────────────────────
app.get('/', (req, res) => {
  res.send('Student Annex Backend API is running!');
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});