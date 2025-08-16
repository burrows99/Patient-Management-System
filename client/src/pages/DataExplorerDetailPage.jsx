import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4001';

function processDataset(detail) {
  // Placeholder processing algorithm - user can replace with real logic later
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

export default function DataExplorerDetailPage() {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBoth, setShowBoth] = useState(true);
  const [view, setView] = useState('raw'); // 'raw' | 'processed'

  const processed = useMemo(() => processDataset(raw), [raw]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/api/hrdc/datasets/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setRaw(json);
      } catch (e) {
        setError(e.message || 'Failed to load dataset');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  return (
    <div className="nhsuk-grid-row">
      <div className="nhsuk-grid-column-full">
        <h1 className="nhsuk-heading-l">Dataset detail</h1>
        <p className="nhsuk-hint nhsuk-u-margin-bottom-2">ID: {id}</p>

        <div className="nhsuk-form-group">
          <div className="nhsuk-checkboxes nhsuk-checkboxes--small">
            <div className="nhsuk-checkboxes__item">
              <input className="nhsuk-checkboxes__input" id="both" type="checkbox" checked={showBoth} onChange={(e) => setShowBoth(e.target.checked)} />
              <label className="nhsuk-label nhsuk-checkboxes__label" htmlFor="both">Show both sides</label>
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
          <div className="nhsuk-error-summary" role="alert" aria-labelledby="dsd-error-title" tabIndex={-1}>
            <h3 id="dsd-error-title" className="nhsuk-error-summary__title">There is a problem</h3>
            <div className="nhsuk-error-summary__body"><p>{error}</p></div>
          </div>
        )}

        {!loading && !error && (
          showBoth ? (
            <div className="nhsuk-grid-row nhsuk-u-margin-top-3">
              <div className="nhsuk-grid-column-one-half">
                <h2 className="nhsuk-heading-m">Raw</h2>
                <div className="nhsuk-inset-text" style={{ maxHeight: 500, overflow: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(raw, null, 2)}</pre>
                </div>
              </div>
              <div className="nhsuk-grid-column-one-half">
                <h2 className="nhsuk-heading-m">Processed</h2>
                <div className="nhsuk-inset-text" style={{ maxHeight: 500, overflow: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(processed, null, 2)}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="nhsuk-u-margin-top-3">
              {view === 'raw' ? (
                <>
                  <h2 className="nhsuk-heading-m">Raw</h2>
                  <div className="nhsuk-inset-text" style={{ maxHeight: 600, overflow: 'auto' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(raw, null, 2)}</pre>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="nhsuk-heading-m">Processed</h2>
                  <div className="nhsuk-inset-text" style={{ maxHeight: 600, overflow: 'auto' }}>
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
