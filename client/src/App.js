import React from 'react';
import { AuthProvider } from 'react-oidc-context';
import oidcConfig from './oidcConfig';
import LoginButton from './LoginButton';
import Callback from './Callback';
import AuthStatus from './AuthStatus';
import Layout from './components/Layout';
import TriageSimulator from './components/TriageSimulator';

function App() {
  return (
    <AuthProvider {...oidcConfig}>
      <Layout>
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-three-quarters">
            <h1 className="nhsuk-heading-xl">Welcome to NHS MOA Triage</h1>
            <p className="nhsuk-body-l">
              Use the sign-in button below to access the triage system.
            </p>

            <div className="nhsuk-action-link">
              <LoginButton />
            </div>

            <AuthStatus />

            {/* Route-less minimal approach: show callback UI if URL contains /callback */}
            {window.location.pathname === '/callback' ? (
              <Callback />
            ) : (
              <div className="nhsuk-inset-text">
                <span className="nhsuk-u-visually-hidden">Information: </span>
                <p>This system helps healthcare professionals manage patient triage efficiently and securely.</p>
              </div>
            )}

            {/* Triage Simulator UI */}
            <TriageSimulator />
          </div>
        </div>
      </Layout>
    </AuthProvider>
  );
}

export default App;
