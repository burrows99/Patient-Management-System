import React from 'react';

// Generic NHS-styled page layout with title, optional lead, optional actions row, and body content
export default function PageLayout({ title, lead, actions, children }) {
  return (
    <section className="nhsuk-u-margin-bottom-6">
      {title && <h1 className="nhsuk-heading-l">{title}</h1>}
      {lead && <p className="nhsuk-body-l">{lead}</p>}
      {actions && (
        <div className="nhsuk-u-margin-bottom-4" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
}
