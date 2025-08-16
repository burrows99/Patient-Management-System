import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

// NHS.UK Header component
// Single Responsibility: renders the site header and NHS logo.
const Header = () => {
  const auth = useAuth();
  const email = auth?.user?.profile?.email || auth?.user?.profile?.preferred_username || '';
  return (
    <header className="nhsuk-header" role="banner">
      <div className="nhsuk-header__container nhsuk-width-container">
        <div className="nhsuk-header__logo nhsuk-header__logo--only">
          <Link className="nhsuk-header__link nhsuk-header__link--service" to="/" aria-label="NHS homepage">
            <img
              src="https://assets.nhs.uk/images/nhs-logo.png"
              alt="NHS"
              width="100"
              height="40"
              className="nhsuk-logo"
              loading="eager"
              decoding="async"
            />
            <span className="nhsuk-header__service-name">MOA Triage System</span>
          </Link>
        </div>
        {auth?.isAuthenticated && (
          <a
            href="#"
            className="nhsuk-header__link nhsuk-header__link--service"
            aria-label="Sign out"
            onClick={(e) => {
              e.preventDefault();
              auth.signoutRedirect({ post_logout_redirect_uri: window.location.origin + '/' });
            }}
          >
            <span className="nhsuk-header__service-name">Sign out</span>
          </a>
        )}
      </div>
    </header>
  );
};

export default Header;
