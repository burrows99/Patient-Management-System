import Koa from 'koa';
import cors from '@koa/cors';
import Provider from 'oidc-provider';

const PORT = 3001;
const ISSUER = `http://localhost:${PORT}`;

const configuration = {
  clients: [
    {
      client_id: '9c7c344a-51e3-41c0-a655-a3467f2aca57',
      grant_types: ['authorization_code', 'refresh_token'],
      redirect_uris: ['http://localhost:3000/callback'],
      post_logout_redirect_uris: ['http://localhost:3000/'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none'
    }
  ],
  pkce: {
    methods: ['S256'],
    required: () => true
  },
  features: {
    devInteractions: { enabled: true },
    revocation: { enabled: true },
    jwtUserinfo: { enabled: false },
    userinfo: { enabled: true }
  },
  cookies: {
    short: { signed: false },
    long: { signed: false },
    keys: ['not-used']
  }
};

const provider = new Provider(ISSUER, configuration);

// CORS middleware
provider.app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Error handling middleware
provider.app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
    ctx.app.emit('error', err, ctx);
  }
});

provider.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`OIDC provider listening at ${ISSUER}`);
});


