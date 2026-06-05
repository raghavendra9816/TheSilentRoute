const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const rateLimit  = require('express-rate-limit');

// Load environment variables FIRST before anything else
dotenv.config();

const app = express();

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors({
  origin: '*',
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
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.'
  }
});
app.use('/api/', limiter);

// =============================================
// DATABASE CONNECTION
// =============================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas Connected Successfully!');
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    process.exit(1);
  });

// =============================================
// HEALTH CHECK ROUTE
// =============================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 The Silent Route API is Running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// =============================================
// API ROUTES
// =============================================
app.use('/api/auth',    require('./routes/authRoutes'));
app.use('/api/media',   require('./routes/mediaRoutes'));
app.use('/api/admin',   require('./routes/adminRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// =============================================
// 404 HANDLER
// FIX: Remove app.use('*') - not supported
// Use this format instead
// =============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// =============================================
// GLOBAL ERROR HANDLER
// Must have 4 parameters (err, req, res, next)
// =============================================
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// =============================================
// START SERVER
// =============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on PORT ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}`);
  console.log(`🔑 Admin Key set: ${process.env.ADMIN_SECRET_KEY ? 'YES ✅' : 'NO ❌'}`);
  console.log(`🗄️  MongoDB URI set: ${process.env.MONGODB_URI ? 'YES ✅' : 'NO ❌'}`);
  console.log(`☁️  Cloudinary set: ${process.env.CLOUDINARY_CLOUD_NAME ? 'YES ✅' : 'NO ❌'}`);
});