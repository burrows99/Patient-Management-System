import React from 'react';

// NHS.UK Header component
// Single Responsibility: renders the site header and NHS logo.
const Header = () => {
  return (
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
            <span className="nhsuk-header__service-name">MOA Triage System</span>
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
