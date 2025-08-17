import React from 'react';
import { Link } from 'react-router-dom';

// RouterLink applies NHS link styling to internal links
export default function RouterLink({ to, children, className = '', ...rest }) {
  const classes = `nhsuk-link${className ? ` ${className}` : ''}`;
  return (
    <Link to={to} className={classes} {...rest}>
      {children}
    </Link>
  );
}
