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
            <div className="nhsuk-header__logo nhsuk-header__logo--nhs">
              <a className="nhsuk-header__link nhsuk-header__link--service" href="/" aria-label="NHS homepage">
                <svg className="nhsuk-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 16" height="40" width="100">
                  <path className="nhsuk-logo__background" d="M0 0h40v16H0z"></path>
                  <path className="nhsuk-logo__text" d="M3.9 6.443c0-.276.224-.5.5-.5h7.555c.276 0 .5.224.5.5v7.555c0 .276-.224.5-.5.5H4.4c-.276 0-.5-.224-.5-.5V6.443z"></path>
                  <path className="nhsuk-logo__text" d="M6.177 7.5v3.823c0 .276.224.5.5.5h3.823c.276 0 .5-.224.5-.5V7.5c0-.276-.224-.5-.5-.5H6.677c-.276 0-.5.224-.5.5z"></path>
                </svg>
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
