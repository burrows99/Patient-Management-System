import React, { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

const Callback = () => {
  const auth = useAuth();

  useEffect(() => {
    // react-oidc-context handles the redirect automatically when the route loads
    // Nothing needed here unless we want to show loading or errors
  }, []);

  if (auth.isLoading) {
    return (
      <div className="nhsuk-alert nhsuk-alert--info" role="status" aria-live="polite">
        <h2 className="nhsuk-u-visually-hidden">Information:</h2>
        <p>Signing you in to NHS MOA Triage…</p>
      </div>
    );
  }

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

  return (
    <div className="nhsuk-alert nhsuk-alert--info">
      <h2 className="nhsuk-u-visually-hidden">Information:</h2>
      <p>Processing NHS login…</p>
    </div>
  );
};

export default Callback;


