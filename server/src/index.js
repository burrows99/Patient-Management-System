// server.js
import express from 'express';
import doctorRoutes from './routers/doctor.js';
import patientRoutes from './routers/patient.js';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/db.js';
import './models/User.js'; // Import models to register them with Sequelize

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, '..', 'public');

const app = express();
app.use(express.json());
app.use(express.static(publicPath));

// API Routes
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);

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
