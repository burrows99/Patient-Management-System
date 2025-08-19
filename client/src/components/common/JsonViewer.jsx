import React, { useMemo, useState, useCallback, createContext, useContext, useEffect } from 'react';

const ExpandContext = createContext({ actionKey: 0, shouldExpand: false });

/**
 * JsonViewer
 * - NHS-styled collapsible viewer for JSON payloads
 * - Uses NHS.UK details pattern and code block semantics
 */
export default function JsonViewer({ title = 'JSON', data, initiallyOpen = false, compact = false }) {
  const [open, setOpen] = useState(!!initiallyOpen);
  const [actionKey, setActionKey] = useState(0);
  const [shouldExpand, setShouldExpand] = useState(false);
  const contextValue = useMemo(() => ({ actionKey, shouldExpand }), [actionKey, shouldExpand]);

  const pretty = useMemo(() => {
    try {
      return JSON.stringify(data ?? {}, null, compact ? 0 : 2);
    } catch {
      return String(data);
    }
  }, [data, compact]);

  const setAllDetails = useCallback((expand) => {
    // Keep controlled root <details> in sync
    setOpen(!!expand);
    setShouldExpand(!!expand);
    setActionKey((k) => k + 1);
  }, []);

  const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const isArray = (v) => Array.isArray(v);

  const JsonNode = ({ label, value, level = 0 }) => {
    if (isObject(value)) {
      return <JsonObjectNode label={label} value={value} level={level} />;
    }
    if (isArray(value)) {
      return <JsonArrayNode label={label} value={value} level={level} />;
    }
    return <JsonPrimitiveNode label={label} value={value} />;
  };

  const JsonObjectNode = ({ label, value, level = 0 }) => {
    const { actionKey, shouldExpand } = useContext(ExpandContext);
    const [isOpen, setIsOpen] = useState(level === 0 ? true : false);
    useEffect(() => {
      setIsOpen(shouldExpand);
    }, [actionKey, shouldExpand]);

    const keys = Object.keys(value);
    const labelEl = (
      <span>
        <span style={{ color: '#0b0c0c' }}>{label}</span>
        {label ? ': ' : ''}
      </span>
    );

    // At root, render children directly without an enclosing details
    if (level === 0) {
      return (
        <div style={{ marginLeft: 0 }}>
          {keys.map((k) => (
            <JsonNode key={k} label={k} value={value[k]} level={level + 1} />
          ))}
        </div>
      );
    }
    return (
      <details
        className="nhsuk-details nhsuk-u-margin-bottom-1"
        style={{ marginTop: 4 }}
        open={isOpen}
        onToggle={(e) => {
          e.stopPropagation();
          setIsOpen(e.currentTarget.open);
        }}
      >
        <summary className="nhsuk-details__summary">
          <span className="nhsuk-details__summary-text" style={{ fontFamily: 'monospace' }}>
            {labelEl}
          </span>
        </summary>
        {isOpen && (
          <div className="nhsuk-details__text" style={{ paddingTop: 0, paddingBottom: 0 }}>
            <div style={{ marginLeft: 12 }}>
              {keys.map((k) => (
                <JsonNode key={k} label={k} value={value[k]} level={level + 1} />
              ))}
            </div>
          </div>
        )}
      </details>
    );
  };

  const JsonArrayNode = ({ label, value, level = 0 }) => {
    const { actionKey, shouldExpand } = useContext(ExpandContext);
    const [isOpen, setIsOpen] = useState(level === 0 ? true : false);
    useEffect(() => {
      setIsOpen(shouldExpand);
    }, [actionKey, shouldExpand]);

    const labelEl = (
      <span>
        <span style={{ color: '#0b0c0c' }}>{label}</span>
        {label ? ': ' : ''}
      </span>
    );

    // At root, render children directly
    if (level === 0) {
      return (
        <div style={{ marginLeft: 0 }}>
          {value.map((v, idx) => (
            <JsonNode key={idx} label={`${idx}`} value={v} level={level + 1} />
          ))}
        </div>
      );
    }
    return (
      <details
        className="nhsuk-details nhsuk-u-margin-bottom-1"
        style={{ marginTop: 4 }}
        open={isOpen}
        onToggle={(e) => {
          e.stopPropagation();
          setIsOpen(e.currentTarget.open);
        }}
      >
        <summary className="nhsuk-details__summary">
          <span className="nhsuk-details__summary-text" style={{ fontFamily: 'monospace' }}>
            {labelEl}
          </span>
        </summary>
        {isOpen && (
          <div className="nhsuk-details__text" style={{ paddingTop: 0, paddingBottom: 0 }}>
            <div style={{ marginLeft: 12 }}>
              {value.map((v, idx) => (
                <JsonNode key={idx} label={`${idx}`} value={v} level={level + 1} />
              ))}
            </div>
          </div>
        )}
      </details>
    );
  };

  const JsonPrimitiveNode = ({ label, value }) => {
    const labelEl = (
      <span>
        <span style={{ color: '#0b0c0c' }}>{label}</span>
        {label ? ': ' : ''}
      </span>
    );
    // Primitive
    return (
      <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
        {labelEl}
        <span style={{ color: '#005eb8' }}>{formatPrimitive(value)}</span>
      </div>
    );
  };

  function formatPrimitive(v) {
    if (typeof v === 'string') return JSON.stringify(v);
    if (v === null) return 'null';
    return String(v);
  }

  const Controls = ({ title, pretty, setAllDetails }) => {
    const [copied, setCopied] = useState(false);

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
      <>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginBottom: 8,
            columnGap: 8,
            rowGap: 8,
          }}
          aria-label={`${title} controls`}
        >
          <button
            type="button"
            className="nhsuk-button nhsuk-button--secondary"
            onClick={onCopy}
            aria-label={`Copy ${title} JSON to clipboard`}
            style={{ margin: 0, verticalAlign: 'middle' }}
          >
            Copy JSON
          </button>
          <button
            type="button"
            className="nhsuk-button nhsuk-button--secondary"
            onClick={() => setAllDetails(true)}
            style={{ margin: 0, verticalAlign: 'middle' }}
          >
            Expand all
          </button>
          <button
            type="button"
            className="nhsuk-button nhsuk-button--secondary"
            onClick={() => setAllDetails(false)}
            style={{ margin: 0, verticalAlign: 'middle' }}
          >
            Collapse all
          </button>
        </div>
        <span aria-live="polite" className="nhsuk-u-visually-hidden">
          {copied ? `${title} JSON copied to clipboard` : ''}
        </span>
      </>
    );
  };

  return (
    <div>
      <div className="nhsuk-u-margin-bottom-2" style={{ position: 'relative' }}>
        <Controls title={title} pretty={pretty} setAllDetails={setAllDetails} />
        <ExpandContext.Provider value={contextValue}>
          <div className="nhsuk-u-font-size-16" style={{ marginTop: 8 }} aria-label={`${title} JSON tree`}>
            <details className="nhsuk-details" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
              <summary className="nhsuk-details__summary">
                <span className="nhsuk-details__summary-text">{title}</span>
              </summary>
              {open && (
                <div className="nhsuk-details__text" style={{ paddingTop: 0 }}>
                  <JsonNode label="" value={data} level={0} />
                </div>
              )}
            </details>
          </div>
        </ExpandContext.Provider>
      </div>
    </div>
  );
}