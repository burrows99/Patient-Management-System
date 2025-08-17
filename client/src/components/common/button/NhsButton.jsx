import React from 'react';
import { Link } from 'react-router-dom';

// Reusable NHS button component
// Usage:
// - <NhsButton onClick={...}>Action</NhsButton>
// - <NhsButton to="/route">Go</NhsButton>
// - <NhsButton href="https://..." external>External</NhsButton>
// - Variants: "primary" (default), "secondary", "reverse"
export default function NhsButton({
  children,
  onClick,
  to,
  href,
  external = false,
  type = 'button',
  variant = 'primary',
  className = '',
  ...rest
}) {
  const base = 'nhsuk-button';
  const variantClass =
    variant === 'secondary' ? ' nhsuk-button--secondary' : variant === 'reverse' ? ' nhsuk-button--reverse' : '';
  const classes = `${base}${variantClass}${className ? ` ${className}` : ''}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
