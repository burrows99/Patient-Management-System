import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  schema: 'nhs', // default schema
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    schema: 'nhs',
    timestamps: true,
    underscored: true,
  },
});

sequelize.authenticate()
  .then(() => console.log('✅ DB connected via full DATABASE_URL'))
  .catch(err => console.error('❌ Error connecting to DB:', err));

export default sequelize;
