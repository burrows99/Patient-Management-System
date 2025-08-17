import React from 'react';
import { useAuth } from 'react-oidc-context';
import { Navigate } from 'react-router-dom';

// PublicRoute: shows children when NOT authenticated, otherwise redirects to target
const PublicRoute = ({ children, to = '/triage-simulator-description' }) => {
  const auth = useAuth();

  if (auth.isLoading || auth.activeNavigator) {
    return (
      <div className="nhsuk-alert nhsuk-alert--info" role="status" aria-live="polite">
        <h2 className="nhsuk-u-visually-hidden">Information:</h2>
        <p>Checking your sign-in status…</p>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
