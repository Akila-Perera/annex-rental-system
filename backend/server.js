require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); 
const annexRoutes = require('./routes/annexRoutes'); 
const supportRoutes = require('./routes/supportRoutes');
const authRoutes = require('./routes/authRoutes');

// Import your review system routes
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const qualityRoutes = require('./routes/qualityRoutes');

connectDB();

const app = express();

app.use(express.json());

// ── CORS ──────────────────────────────────────────────
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Routes ──────────────────────────────────────────────
app.use('/api/support', supportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/annexes', annexRoutes);

// Your Review System Routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quality', qualityRoutes);

app.get('/', (req, res) => {
    res.send('Student Annex Backend API is running securely!');
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});