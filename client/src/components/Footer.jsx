import React from 'react';

// NHS.UK Footer component
// Single Responsibility: renders the site footer
const Footer = () => {
  return (
    <footer role="contentinfo">
        <div className="nhsuk-footer-container">
            <div className="nhsuk-width-container">
            <h2 className="nhsuk-u-visually-hidden">Support links</h2>
            <div className="nhsuk-footer">
                <ul className="nhsuk-footer__list">
                <li className="nhsuk-footer__list-item nhsuk-footer-default__list-item">
                    <a className="nhsuk-footer__list-item-link" href="#">Accessibility statement</a>
                </li>
                <li className="nhsuk-footer__list-item nhsuk-footer-default__list-item">
                    <a className="nhsuk-footer__list-item-link" href="#">Contact us</a>
                </li>
                <li className="nhsuk-footer__list-item nhsuk-footer-default__list-item">
                    <a className="nhsuk-footer__list-item-link" href="#">Cookies</a>
                </li>
                <li className="nhsuk-footer__list-item nhsuk-footer-default__list-item">
                    <a className="nhsuk-footer__list-item-link" href="#">Privacy policy</a>
                </li>
                <li className="nhsuk-footer__list-item nhsuk-footer-default__list-item">
                    <a className="nhsuk-footer__list-item-link" href="#">Terms and conditions</a>
                </li>
                </ul>
                <div>
                <p className="nhsuk-footer__copyright">© NHS England</p>
                </div>
            </div>
            </div>
        </div>
    </footer>
  );
};

export default Footer;
