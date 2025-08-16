import React, { useEffect, useMemo, useState } from 'react';

function numberFormat(n) {
  try {
    return new Intl.NumberFormat('en-GB').format(n);
  } catch {
    return String(n);
  }
}

export default function TriageSimulator() {
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4001';
  const [dept, setDept] = useState('ED');
  const [count, setCount] = useState(30);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [datasets, setDatasets] = useState([]);
  const [datasetId, setDatasetId] = useState('dd5f0174-575f-4f4c-a4fc-b406aab953d9');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const url = `${API_BASE}/triage/simulate?dept=${encodeURIComponent(dept)}&n=${encodeURIComponent(count)}&datasetId=${encodeURIComponent(datasetId)}`;
      const res = await fetch(url, { credentials: 'include' });
      const warn = res.headers.get('X-TriageSimulator-Warning');
      if (warn) setNotice(warn);
      if (!res.ok) {
        // try to extract server error
        let message = `HTTP ${res.status}`;
        try {
          const txt = await res.text();
          try {
            const json = JSON.parse(txt);
            message = json.error || message;
          } catch {
            message = txt || message;
          }
        } catch {}
        throw new Error(message);
      }
      const json = await res.json();
      setData(json.items || []);
    } catch (e) {
      setError(e.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load dataset options via proxy (does not expose API key)
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hrdc/datasets`, { credentials: 'include' });
        const noticeHdr = res.headers.get('X-HRDC-Notice');
        if (noticeHdr) setNotice(noticeHdr);
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json.items) ? json.items : [];
          setDatasets(items);
          // Default to the first item if present
          if (items[0]?.persistentId) {
            setDatasetId(items[0].persistentId);
          }
        } else {
          // non-ok: surface minimal info to user but keep simulator usable
          try {
            const body = await res.json();
            setNotice(body.error || 'Unable to load datasets; using default dataset');
          } catch {
            setNotice('Unable to load datasets; using default dataset');
          }
        }
      } catch (_) {
        // ignore; user can still simulate with default datasetId
      }
    })();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(
    () => [
      { key: 'priorityScore', label: 'Priority' },
      { key: 'triageCategory', label: 'Triage' },
      { key: 'waitMins', label: 'Wait (min)' },
      { key: 'age', label: 'Age' },
      { key: 'arrivalTime', label: 'Arrived' },
    ],
    []
  );

  return (
    <div className="nhsuk-card nhsuk-u-margin-top-5">
      <div className="nhsuk-card__content">
        <h2 className="nhsuk-heading-l">Triage Simulator</h2>

        {notice && (
          <div className="nhsuk-inset-text nhsuk-u-margin-bottom-3">
            <span className="nhsuk-u-visually-hidden">Information: </span>
            <p>{notice}</p>
          </div>
        )}

        <div className="nhsuk-form-group">
          <label className="nhsuk-label" htmlFor="dept">Department</label>
          <select id="dept" className="nhsuk-select" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="ED">ED</option>
            <option value="Imaging">Imaging</option>
            <option value="Outpatients">Outpatients</option>
          </select>
        </div>

        <div className="nhsuk-form-group">
          <label className="nhsuk-label" htmlFor="dataset">Dataset</label>
          <select id="dataset" className="nhsuk-select" value={datasetId} onChange={(e) => setDatasetId(e.target.value)}>
            {datasets.map(d => (
              <option key={d.persistentId} value={d.persistentId}>{d.name}</option>
            ))}
            {datasets.length === 0 && (
              <option value={datasetId}>Default dataset</option>
            )}
          </select>
        </div>

        <div className="nhsuk-form-group">
          <label className="nhsuk-label" htmlFor="count">Count</label>
          <input id="count" className="nhsuk-input" type="number" min={1} max={200} value={count}
                 onChange={(e) => setCount(Number(e.target.value || 0))} />
        </div>

        <button className="nhsuk-button" type="button" onClick={fetchData} disabled={loading}>
          {loading ? 'Generating…' : 'Generate'}
        </button>

        {error && (
          <div className="nhsuk-error-summary nhsuk-u-margin-top-3" role="alert" aria-labelledby="error-summary-title" tabIndex={-1}>
            <h2 className="nhsuk-error-summary__title" id="error-summary-title">Error</h2>
            <div className="nhsuk-error-summary__body">
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="nhsuk-table-responsive nhsuk-u-margin-top-4">
          <table className="nhsuk-table">
            <caption className="nhsuk-table__caption">{dept} queue (top {numberFormat(data.length)})</caption>
            <thead className="nhsuk-table__head">
              <tr className="nhsuk-table__row">
                {columns.map((c) => (
                  <th key={c.key} className="nhsuk-table__header">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="nhsuk-table__body">
              {data.map((row) => (
                <tr key={row.id} className="nhsuk-table__row">
                  <td className="nhsuk-table__cell">
                    <strong>{row.priorityScore.toFixed(2)}</strong>
                  </td>
                  <td className="nhsuk-table__cell">{row.triageCategory}</td>
                  <td className="nhsuk-table__cell">{row.waitMins}</td>
                  <td className="nhsuk-table__cell">{row.age}</td>
                  <td className="nhsuk-table__cell">{new Date(row.arrivalTime).toLocaleString()}</td>
                </tr>
              ))}
              {!loading && data.length === 0 && (
                <tr className="nhsuk-table__row"><td className="nhsuk-table__cell" colSpan={columns.length}>No items</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
