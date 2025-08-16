import React from 'react';
import { useAuth } from 'react-oidc-context';

const LoginButton = () => {
  const auth = useAuth();

  // If already authenticated, do not render a sign-out here.
  if (auth.isAuthenticated) return null;

  return (
    <button
      className="nhsuk-button"
      onClick={async () => {
        try {
          await auth.signinRedirect({ state: { returnTo: '/triage-simulator' } });
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


