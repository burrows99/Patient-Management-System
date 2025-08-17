import React from 'react';

// ExternalLink enforces NHS link styling and safe target behaviour
export default function ExternalLink({ href, children, className = '', newTab = true, ...rest }) {
  const attrs = newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const classes = `nhsuk-link${className ? ` ${className}` : ''}`;
  return (
    <a href={href} className={classes} {...attrs} {...rest}>
      {children}
    </a>
  );
}
