require('dotenv').config();

const express       = require('express');
const cors          = require('cors');
const connectDB     = require('./config/db');
const annexRoutes   = require('./routes/annexRoutes');
const supportRoutes = require('./routes/supportRoutes');
const authRoutes    = require('./routes/authRoutes');

connectDB();

const app = express();

// ── 1. CORS first — before everything else ──────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── 2. Body parser ──────────────────────────────────────
app.use(express.json());

// ── 3. Routes — each registered ONCE ───────────────────
app.use('/api/support', supportRoutes);
app.use('/api/auth',    authRoutes);
app.use('/api/annexes', annexRoutes);

// ── 4. Health check ─────────────────────────────────────
app.get('/', (req, res) => {
  res.send('Student Annex Backend API is running!');
});

// ── 5. Start server ─────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});