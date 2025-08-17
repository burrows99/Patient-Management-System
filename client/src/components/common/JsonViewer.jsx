import React, { useMemo, useState } from 'react';

/**
 * JsonViewer
 * - NHS-styled collapsible viewer for JSON payloads
 * - Uses NHS.UK details pattern and code block semantics
 */
export default function JsonViewer({ title = 'JSON', data, initiallyOpen = false, compact = false }) {
  const [open, setOpen] = useState(!!initiallyOpen);
  const [copied, setCopied] = useState(false);
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
      setCopied(true);
      // Reset copied state after short delay for UX
      setTimeout(() => setCopied(false), 1500);
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
        <div
          className="nhsuk-u-margin-bottom-2"
          style={{
            position: 'relative',
            backgroundColor: '#f3f2f1',
            padding: '16px',
            borderRadius: '4px',
            border: '1px solid #d8dde0',
          }}
        >
          <button
            type="button"
            className="nhsuk-button nhsuk-button--secondary"
            onClick={onCopy}
            aria-label={`Copy ${title} JSON to clipboard`}
            style={{ position: 'absolute', top: '8px', right: '8px', margin: 0 }}
          >
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
          <span aria-live="polite" className="nhsuk-u-visually-hidden">
            {copied ? `${title} JSON copied to clipboard` : ''}
          </span>
          <pre
            className="nhsuk-u-font-size-16"
            style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', margin: 0 }}
            aria-label={`${title} JSON code`}
            tabIndex={0}
          >
            <code>{pretty}</code>
          </pre>
        </div>
      </div>
    </details>
  );
}
