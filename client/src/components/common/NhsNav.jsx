import React from 'react';
import { NavLink } from 'react-router-dom';
import { getApiBase } from '../../utils/environment';

// NHS primary navigation bar
// Lists top-level sections. Currently includes Triage with sub-pages.
export default function NhsNav() {
  const apiDocsUrl = `${getApiBase()}/docs`;
  return (
    <nav className="nhsuk-header__navigation" aria-label="Primary navigation">
      <div className="nhsuk-width-container">
        <ul className="nhsuk-header__navigation-list" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <li className="nhsuk-header__navigation-item">
            <NavLink
              to="/triage-simulator-description"
              className={({ isActive }) =>
                `nhsuk-header__navigation-link${isActive ? ' nhsuk-header__navigation-link--active' : ''}`
              }
            >
              Triage: Description
            </NavLink>
          </li>
          <li className="nhsuk-header__navigation-item">
            <NavLink
              to="/triage-simulator"
              className={({ isActive }) =>
                `nhsuk-header__navigation-link${isActive ? ' nhsuk-header__navigation-link--active' : ''}`
              }
            >
              Triage: Simulator
            </NavLink>
          </li>
          <li className="nhsuk-header__navigation-item">
            <NavLink
              to="/synthea"
              className={({ isActive }) =>
                `nhsuk-header__navigation-link${isActive ? ' nhsuk-header__navigation-link--active' : ''}`
              }
            >
              Synthea
            </NavLink>
          </li>
          <li className="nhsuk-header__navigation-item">
            <a
              href={apiDocsUrl}
              className="nhsuk-header__navigation-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              API Docs
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
