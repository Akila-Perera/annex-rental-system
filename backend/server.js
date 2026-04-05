
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); 
const annexRoutes = require('./routes/annexRoutes'); 
const supportRoutes = require('./routes/supportRoutes')


connectDB();

const supportRoutes = require('./routes/supportRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();


app.use(express.json());

// ── Routes ──────────────────────────────────────────────
app.use('/api/support', supportRoutes);
app.use('/api/auth', authRoutes);

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.get('/', (req, res) => {
    res.send('Student Annex Backend API is running securely!');
});

app.use('/api/support', supportRoutes);
app.use('/api/annexes', annexRoutes); 

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});