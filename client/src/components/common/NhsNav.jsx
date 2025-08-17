import React from 'react';
import { NavLink } from 'react-router-dom';

// NHS primary navigation bar
// Lists top-level sections. Currently includes Triage with sub-pages.
export default function NhsNav() {
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
        </ul>
      </div>
    </nav>
  );
}
