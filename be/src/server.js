require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/database');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

// Trust proxy - Required for Render and other reverse proxies
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CORS_ORIGIN, `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`].filter(Boolean)
    : (process.env.CORS_ORIGIN || '*'),
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body Parser & Data Sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
const API_VERSION = process.env.API_VERSION || 'v1';
app.use(`/api/${API_VERSION}/auth`, require('./routes/auth.routes'));
app.use(`/api/${API_VERSION}/users`, require('./routes/user.routes'));
app.use(`/api/${API_VERSION}/roles`, require('./routes/role.routes'));
app.use(`/api/${API_VERSION}/permissions`, require('./routes/permission.routes'));
app.use(`/api/${API_VERSION}/staff`, require('./routes/staff.routes'));
app.use(`/api/${API_VERSION}/members`, require('./routes/member.routes'));
app.use(`/api/${API_VERSION}/subscription-plans`, require('./routes/subscriptionPlan.routes'));
app.use(`/api/${API_VERSION}/trainers`, require('./routes/trainer.routes'));
app.use(`/api/${API_VERSION}/bookings`, require('./routes/booking.routes'));
app.use(`/api/${API_VERSION}/gym-info`, require('./routes/gymInfo.routes'));

// Root Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the API',
    version: API_VERSION,
    documentation: '/api-docs'
  });
});

// Error Handler (must be last)
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
    ╔═══════════════════════════════════════════════════════════════
    ║   Server running in ${process.env.NODE_ENV} mode               
    ║   Port: ${PORT}                                                
    ║   API Docs: http://localhost:${PORT}/api-docs                  
    ╚═══════════════════════════════════════════════════════════════
  `);
});