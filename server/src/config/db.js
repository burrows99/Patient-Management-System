// /config/db.js
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'postgres',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres_password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    schema: 'nhs',  // Set default schema to 'nhs'
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      schema: 'nhs',  // Ensure all models use the 'nhs' schema
      timestamps: true,
      underscored: true
    }
  }
);

sequelize.authenticate()
  .then(() => console.log('✅ DB connected via DATABASE_URL'))
  .catch(err => console.error('❌ DB connection error:', err));

export default sequelize;
