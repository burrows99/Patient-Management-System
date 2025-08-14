const authority = process.env.REACT_APP_OAUTH_BASE;
const clientId = process.env.REACT_APP_CLIENT_ID;
const redirectUri = process.env.REACT_APP_REDIRECT_URI;
const scope = process.env.REACT_APP_SCOPE;

if (!authority || !clientId || !redirectUri || !scope) {
  // eslint-disable-next-line no-console
  console.error('Missing required OIDC env vars', { authority, clientId, redirectUri, scope });
}

const oidcConfig = {
  authority,
  client_id: clientId,
  redirect_uri: redirectUri,
  scope,
  response_type: 'code',
  automaticSilentRenew: false,
  loadUserInfo: true,
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

export default oidcConfig;


