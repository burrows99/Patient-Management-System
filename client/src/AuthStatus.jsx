import React from 'react';
import { useAuth } from 'react-oidc-context';

const AuthStatus = () => {
  const auth = useAuth();

  if (auth.error) {
    return (
      <div className="nhsuk-error-summary" role="alert" tabIndex="-1">
        <h2 className="nhsuk-error-summary__title" id="error-summary-title">
          Authentication error
        </h2>
        <div className="nhsuk-error-summary__body">
          <p>{String(auth.error)}</p>
        </div>
      </div>
    );
  }

  if (auth.isLoading) {
    return (
      <div className="nhsuk-alert nhsuk-alert--info" role="status" aria-live="polite">
        <h2 className="nhsuk-u-visually-hidden">Information:</h2>
        <p>Contacting NHS identity provider…</p>
      </div>
    );
  }

  return null;
};

export default AuthStatus;


