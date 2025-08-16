import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import hrdcRouter from './routes/hrdc.js';
import triageRouter from './routes/triage.js';

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
app.use(express.json());

// Swagger from JSDoc comments in route files
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.1',
    info: { title: 'NHS MOA API', version: '0.1.0', description: 'HRDC proxy and triage simulator APIs' },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./routes/*.js'],
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));
// Aliases for convenience
app.get('/swagger', (req, res) => res.redirect('/docs'));
app.get('/swagger.json', (req, res) => res.json(swaggerSpec));

// Mount routers
app.use('/api/hrdc/datasets', hrdcRouter);
app.use('/triage', triageRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://localhost:${PORT}`);
});
