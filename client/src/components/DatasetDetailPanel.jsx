import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4001';

function processDataset(detail) {
  try {
    if (!detail || typeof detail !== 'object') return { summary: 'No detail to process' };
    const keys = Object.keys(detail).slice(0, 50);
    return {
      summary: `Detected ${keys.length} top-level keys`,
      keys,
    };
  } catch (e) {
    return { error: e.message };
  }
}

export default function DatasetDetailPanel({ datasetId, datasetSelf }) {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBoth, setShowBoth] = useState(true);
  const [view, setView] = useState('raw');

  const processed = useMemo(() => processDataset(raw), [raw]);

  useEffect(() => {
    if (!datasetId) return;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        let res;
        if (datasetSelf) {
          // Try direct self URL with timeout, fallback to server by-self proxy
          const ctrl = new AbortController();
          const to = setTimeout(() => ctrl.abort(), 3500);
          try {
            res = await fetch(datasetSelf, { signal: ctrl.signal });
          } catch (e) {
            // will fallback
          } finally {
            clearTimeout(to);
          }
          if (!res || !res.ok) {
            res = await fetch(`${API_BASE}/api/hrdc/datasets/by-self/url?self=${encodeURIComponent(datasetSelf)}`);
          }
        } else {
          res = await fetch(`${API_BASE}/api/hrdc/datasets/${encodeURIComponent(datasetId)}`);
        }
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Dataset not found (404). It may no longer be available.');
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        setRaw(json);
      } catch (e) {
        setError(e.message || 'Failed to load dataset');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [datasetId, datasetSelf]);

  if (!datasetId) return null;

  return (
    <div className="nhsuk-card nhsuk-u-margin-top-4">
      <div className="nhsuk-card__content">
        <h2 className="nhsuk-heading-m">Selected dataset</h2>
        <p className="nhsuk-hint nhsuk-u-margin-bottom-2">ID: {datasetId}</p>

        <div className="nhsuk-form-group">
          <div className="nhsuk-checkboxes nhsuk-checkboxes--small">
            <div className="nhsuk-checkboxes__item">
              <input className="nhsuk-checkboxes__input" id="both-toggle" type="checkbox" checked={showBoth} onChange={(e) => setShowBoth(e.target.checked)} />
              <label className="nhsuk-label nhsuk-checkboxes__label" htmlFor="both-toggle">Show both sides</label>
            </div>
          </div>
        </div>

        {!showBoth && (
          <div className="nhsuk-button-group">
            <button type="button" className={`nhsuk-button ${view === 'raw' ? '' : 'nhsuk-button--secondary'}`} onClick={() => setView('raw')}>View raw</button>
            <button type="button" className={`nhsuk-button ${view === 'processed' ? '' : 'nhsuk-button--secondary'}`} onClick={() => setView('processed')}>View processed</button>
          </div>
        )}

        {loading && <p>Loading…</p>}
        {error && (
          <div className="nhsuk-error-summary" role="alert" aria-labelledby="dsd-panel-error" tabIndex={-1}>
            <h3 id="dsd-panel-error" className="nhsuk-error-summary__title">There is a problem</h3>
            <div className="nhsuk-error-summary__body"><p>{error}</p></div>
          </div>
        )}

        {!loading && !error && (
          showBoth ? (
            <div className="nhsuk-grid-row nhsuk-u-margin-top-3">
              <div className="nhsuk-grid-column-one-half">
                <h3 className="nhsuk-heading-s">Raw</h3>
                <div className="nhsuk-inset-text" style={{ maxHeight: 400, overflow: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(raw, null, 2)}</pre>
                </div>
              </div>
              <div className="nhsuk-grid-column-one-half">
                <h3 className="nhsuk-heading-s">Processed</h3>
                <div className="nhsuk-inset-text" style={{ maxHeight: 400, overflow: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(processed, null, 2)}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="nhsuk-u-margin-top-3">
              {view === 'raw' ? (
                <>
                  <h3 className="nhsuk-heading-s">Raw</h3>
                  <div className="nhsuk-inset-text" style={{ maxHeight: 500, overflow: 'auto' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(raw, null, 2)}</pre>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="nhsuk-heading-s">Processed</h3>
                  <div className="nhsuk-inset-text" style={{ maxHeight: 500, overflow: 'auto' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(processed, null, 2)}</pre>
                  </div>
                </>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
