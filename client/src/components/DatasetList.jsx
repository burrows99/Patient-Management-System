import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4001';

function guessColumnsFromDetail(detail) {
  // Try common locations; fallback to top-level keys
  if (!detail || typeof detail !== 'object') return [];
  if (Array.isArray(detail.columns)) return detail.columns;
  if (Array.isArray(detail.fields)) return detail.fields;
  if (detail?.schema?.fields) return detail.schema.fields.map((f) => f.name || f.title || 'column');
  if (Array.isArray(detail.variables)) return detail.variables;
  // Fallback: keys of nested example
  return Object.keys(detail).slice(0, 15);
}

export default function DatasetList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [details, setDetails] = useState({});

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/api/hrdc/datasets`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setItems(Array.isArray(json.items) ? json.items : []);
        // Notice header when key missing
        const notice = res.headers.get('X-HRDC-Notice');
        if (notice) setError(notice);
      } catch (e) {
        setError(e.message || 'Failed to load datasets');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const toggle = async (uniqueKey, realId, selfUrl) => {
    setExpanded((e) => ({ ...e, [uniqueKey]: !e[uniqueKey] }));
    if (!details[uniqueKey]) {
      try {
        const url = selfUrl
          ? `${API_BASE}/api/hrdc/datasets/by-self/url?self=${encodeURIComponent(selfUrl)}`
          : `${API_BASE}/api/hrdc/datasets/${encodeURIComponent(realId)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setDetails((d) => ({ ...d, [uniqueKey]: json }));
      } catch (e) {
        setDetails((d) => ({ ...d, [uniqueKey]: { __error: e.message } }));
      }
    }
  };

  return (
    <div className="nhsuk-card nhsuk-u-margin-top-4">
      <div className="nhsuk-card__content">
        <h2 className="nhsuk-heading-l">Available datasets</h2>
        {loading && <p>Loading datasets…</p>}
        {error && (
          <div className="nhsuk-error-summary" role="alert" aria-labelledby="ds-error-title" tabIndex={-1}>
            <h3 id="ds-error-title" className="nhsuk-error-summary__title">Notice</h3>
            <div className="nhsuk-error-summary__body"><p>{error}</p></div>
          </div>
        )}
        {!loading && items.length === 0 && <p>No datasets available.</p>}
        <ul className="nhsuk-list nhsuk-list--border">
          {items.map((it, idx) => {
            const realId = it.persistentId || it.id || it.identifier || '';
            const selfUrl = it.self || '';
            const uniqueKey = `${realId}::${idx}`; // ensure uniqueness even if IDs repeat
            const title = it.title || it.name || realId;
            const isOpen = !!expanded[uniqueKey];
            const detail = details[uniqueKey];
            const cols = detail && !detail.__error ? guessColumnsFromDetail(detail) : [];
            return (
              <li key={uniqueKey} className="nhsuk-u-padding-2 nhsuk-u-margin-bottom-2" style={{ borderBottom: '1px solid #d8dde0' }}>
                <div className="nhsuk-grid-row nhsuk-u-margin-bottom-2">
                  <div className="nhsuk-grid-column-two-thirds">
                    <h3 className="nhsuk-heading-m nhsuk-u-margin-bottom-1">{title}</h3>
                    <p className="nhsuk-hint nhsuk-u-margin-bottom-0">{realId}</p>
                  </div>
                  <div className="nhsuk-grid-column-one-third">
                    <div className="nhsuk-button-group" style={{ justifyContent: 'flex-end' }}>
                      <button type="button" className="nhsuk-button nhsuk-button--secondary" onClick={() => toggle(uniqueKey, realId, selfUrl)}>
                        {isOpen ? 'Hide details' : 'Show details'}
                      </button>
                      <Link to={`/triage-simulator?datasetId=${encodeURIComponent(realId)}`} className="nhsuk-button">View in Triage</Link>
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div className="nhsuk-inset-text">
                    {!detail && <p>Loading details…</p>}
                    {detail?.__error && <p className="nhsuk-error-message">Error loading details: {detail.__error}</p>}
                    {!!cols?.length && (
                      <>
                        <p className="nhsuk-body-s nhsuk-u-margin-bottom-1">Columns (sample):</p>
                        <ul className="nhsuk-list nhsuk-list--bullet">
                          {cols.slice(0, 12).map((c, idx) => (
                            <li key={idx}>{typeof c === 'string' ? c : c?.name || JSON.stringify(c)}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {!detail?.__error && cols.length === 0 && detail && (
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(detail, null, 2)}</pre>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
