import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import NhsNav from './common/NhsNav';

// NHS.UK Header component
// Single Responsibility: renders the site header and NHS logo.
const Header = () => {
  const auth = useAuth();
  const profile = auth?.user?.profile || {};
  const displayName = profile.email || profile.preferred_username || profile.name || profile.upn || profile.sub || '';
  const isEmail = typeof displayName === 'string' && displayName.includes('@');
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            {displayName ? (
              isEmail ? (
                <a
                  href={`mailto:${displayName}`}
                  className="nhsuk-header__link nhsuk-header__link--service"
                  aria-label={`Email ${displayName}`}
                >
                  <span className="nhsuk-header__service-name">{displayName}</span>
                </a>
              ) : (
                <span className="nhsuk-header__service-name">{displayName}</span>
              )
            ) : (
              <span className="nhsuk-header__service-name">Signed in</span>
            )}
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
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
          </span>
        )}
      </div>
      {/* Primary navigation inside header to inherit NHS dark styling */}
      <NhsNav />
    </header>
  );
};

export default Header;
