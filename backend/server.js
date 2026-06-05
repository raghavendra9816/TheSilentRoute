const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables FIRST
dotenv.config();

const app = express();

// ===== MIDDLEWARE =====
app.use(cors({
  origin: '*', // Allow all for now, restrict later
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// ===== DATABASE =====
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

connectDB();

// ===== ROUTES =====
app.use('/api/auth',    require('./routes/authRoutes'));
app.use('/api/media',   require('./routes/mediaRoutes'));
app.use('/api/admin',   require('./routes/adminRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// Health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 The Silent Route API is Running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ===== 404 HANDLER =====
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ===== GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on PORT ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}`);
});