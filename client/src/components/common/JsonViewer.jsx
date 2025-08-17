import React, { useMemo, useState } from 'react';

/**
 * JsonViewer
 * - Collapsible JSON viewer with optional inline editing and copy
 */
export default function JsonViewer({
  title = 'Details',
  data,
  defaultOpen = false,
  editable = false,
  onChange,
}) {
  const pretty = useMemo(() => safeStringify(data), [data]);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(pretty);
  const [error, setError] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(isEditing ? text : pretty);
    } catch {
      // noop
    }
  };

  const handleToggleEdit = () => {
    if (!isEditing) {
      setText(pretty);
      setError('');
      setIsEditing(true);
    } else {
      setIsEditing(false);
      setError('');
    }
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(text || 'null');
      setError('');
      setIsEditing(false);
      if (onChange) onChange(parsed);
    } catch (e) {
      setError(e.message || 'Invalid JSON');
    }
  };

  return (
    <details className="nhsuk-details" open={defaultOpen}>
      <summary className="nhsuk-details__summary">
        <span className="nhsuk-details__summary-text">{title}</span>
      </summary>
      <div className="nhsuk-details__text">
        <div className="nhsuk-u-margin-bottom-2" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="nhsuk-button nhsuk-button--secondary" onClick={handleCopy}>Copy</button>
          {editable && (
            <>
              <button type="button" className="nhsuk-button nhsuk-button--secondary" onClick={handleToggleEdit}>
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              {isEditing && (
                <button type="button" className="nhsuk-button" onClick={handleApply}>Apply</button>
              )}
            </>
          )}
        </div>

        {error && (
          <div className="nhsuk-error-summary nhsuk-u-margin-bottom-3" role="alert">
            <h2 className="nhsuk-error-summary__title">Invalid JSON</h2>
            <div className="nhsuk-error-summary__body"><p>{error}</p></div>
          </div>
        )}

        {isEditing ? (
          <textarea
            className="nhsuk-textarea"
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: '100%', fontFamily: 'monospace' }}
          />
        ) : (
          <pre className="nhsuk-u-font-size-16" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{pretty}</pre>
        )}
      </div>
    </details>
  );
}

function safeStringify(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    try { return String(obj); } catch { return ''; }
  }
}
