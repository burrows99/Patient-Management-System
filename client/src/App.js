import React from 'react';
import { AuthProvider } from 'react-oidc-context';
import oidcConfig from './oidcConfig';
import LoginButton from './LoginButton';
import Callback from './Callback';
import AuthStatus from './AuthStatus';

function App() {
  return (
    <AuthProvider {...oidcConfig}>
      <>
        <header className="nhsuk-header" role="banner">
          <div className="nhsuk-header__container nhsuk-width-container">
            <div className="nhsuk-header__logo nhsuk-header__logo--only">
              <a className="nhsuk-header__link nhsuk-header__link--service" href="/" aria-label="NHS homepage">
                <img
                  src="https://assets.nhs.uk/images/nhs-logo.png"
                  alt="NHS"
                  width="100"
                  height="40"
                  className="nhsuk-logo"
                  loading="eager"
                  decoding="async"
                />
                <span className="nhsuk-header__service-name">
                  MOA Triage System
                </span>
              </a>
            </div>
          </div>
        </header>

        <main className="nhsuk-main-wrapper nhsuk-main-wrapper--auto-spacing" id="maincontent" role="main">
          <div className="nhsuk-width-container">
            <div className="nhsuk-main-content">
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
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    </AuthProvider>
  );
}

export default App;
