// server.js
import express from 'express';
import cors from 'cors';
import doctorRoutes from './routers/doctor.js';
import patientRoutes from './routers/patient.js';
import authRoutes from './routers/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/db.js';
import './models/User.js'; // Import models to register them with Sequelize

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, '..', 'public');

const app = express();

// Configure CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:80',
  'http://localhost',
  'http://client:80',
  'http://client:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id']
}));

app.use(express.json());
app.use(express.static(publicPath));

// API Routes
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/auth', authRoutes);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database and start server
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Create the 'nhs' schema if it doesn't exist
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS nhs;');
    
    // Sync all models with the database
    await sequelize.sync({ force: true });
    console.log('Database synchronized with nhs schema');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
