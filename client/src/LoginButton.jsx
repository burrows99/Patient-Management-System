import React from 'react';
import { useAuth } from 'react-oidc-context';

const LoginButton = () => {
  const auth = useAuth();

  if (auth.isAuthenticated) {
    return (
      <button 
        className="nhsuk-button nhsuk-button--secondary" 
        onClick={() => auth.signoutRedirect({ post_logout_redirect_uri: 'http://localhost:3000/' })} 
        aria-label="Sign out"
      >
        Sign out
      </button>
    );
  }

  return (
    <button
      className="nhsuk-button"
      onClick={async () => {
        try {
          await auth.signinRedirect();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('signinRedirect failed', e);
          alert(`Sign-in failed: ${e?.message || e}`);
        }
      }}
      aria-label="Sign in"
    >
      Sign in with NHS
    </button>
  );
};

export default LoginButton;


