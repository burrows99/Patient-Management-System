import React, { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useLocation } from 'react-router-dom';

// Protects routes: if unauthenticated, triggers OIDC login
// Renders children when authenticated
const ProtectedRoute = ({ children }) => {
  const auth = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator) {
      // Trigger redirect login flow
      auth
        .signinRedirect({
          state: { returnTo: location.pathname + location.search },
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error('signinRedirect failed', e);
          alert(`Sign-in failed: ${e?.message || e}`);
        });
    }
  }, [auth, location.pathname, location.search]);

  if (auth.isLoading || auth.activeNavigator) {
    return (
      <div className="nhsuk-alert nhsuk-alert--info" role="status" aria-live="polite">
        <h2 className="nhsuk-u-visually-hidden">Information:</h2>
        <p>Checking your sign-in status…</p>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    // While redirecting, render nothing (or a placeholder)
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
