import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import triageRouter from './routes/triage.js';
import syntheaRouter from './routes/synthea.js';
import ENV, { getPort, getClientOrigin, getPublicApiBase, getNhsApiKey } from './utils/environment.js';

const app = express();
const PORT = getPort();

app.use(cors({ origin: [getClientOrigin()], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Graceful JSON parse error handler
// Ensures malformed JSON does not crash the process and returns 400 with a helpful message
app.use((err, req, res, next) => {
  if (err && err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body: ' + err.message });
  }
  return next(err);
});

// Swagger from JSDoc comments in route files
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.1',
    info: { title: 'NHS MOA API', version: '0.1.0', description: 'HRDC proxy and triage simulator APIs' },
    servers: [{ url: getPublicApiBase() }],
  },
  apis: ['./routes/triage.js', './routes/synthea.js'],
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));
// Aliases for convenience
app.get('/swagger', (req, res) => res.redirect('/docs'));
app.get('/swagger.json', (req, res) => res.json(swaggerSpec));

// Mount routers
app.use('/triage', triageRouter);
app.use('/synthea', syntheaRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on ${getPublicApiBase()} (internal port ${PORT})`);
  const key = getNhsApiKey();
  if (!key) {
    // eslint-disable-next-line no-console
    console.warn('[WARN] NHS_API_KEY is not set; HRDC endpoints will return empty list or 403.');
  } else {
    const masked = key.length > 8 ? `${key.slice(0, 4)}…${key.slice(-4)}` : '***';
    // eslint-disable-next-line no-console
    console.log(`[INFO] NHS_API_KEY detected (${masked}).`);
  }
});
