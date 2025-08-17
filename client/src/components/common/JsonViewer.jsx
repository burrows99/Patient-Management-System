import React, { useMemo, useState } from 'react';

/**
 * JsonViewer
 * - NHS-styled collapsible viewer for JSON payloads
 * - Uses NHS.UK details pattern and code block semantics
 */
export default function JsonViewer({ title = 'JSON', data, initiallyOpen = false, compact = false }) {
  const [open, setOpen] = useState(!!initiallyOpen);
  const pretty = useMemo(() => {
    try {
      return JSON.stringify(data ?? {}, null, compact ? 0 : 2);
    } catch {
      return String(data);
    }
  }, [data, compact]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(pretty);
    } catch {
      // ignore copy errors silently
    }
  };

  return (
    <details className="nhsuk-details" open={open} onToggle={(e) => setOpen(e.target.open)}>
      <summary className="nhsuk-details__summary">
        <span className="nhsuk-details__summary-text">{title}</span>
      </summary>
      <div className="nhsuk-details__text">
        <div className="nhsuk-u-margin-bottom-2">
          <button type="button" className="nhsuk-button nhsuk-button--secondary" onClick={onCopy}>
            Copy JSON
          </button>
        </div>
        <pre className="nhsuk-u-font-size-16" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
          <code>{pretty}</code>
        </pre>
      </div>
    </details>
  );
}
