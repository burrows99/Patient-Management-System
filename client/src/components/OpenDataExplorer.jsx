import React, { useMemo, useState } from 'react';

export default function OpenDataExplorer() {
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4001';

  const sources = useMemo(
    () => [
      { key: 'bnf_search', label: 'OpenPrescribing: BNF code search', params: [{ name: 'q', label: 'Query (q)', required: true }] },
      {
        key: 'spending_by_ccg',
        label: 'OpenPrescribing: Spending by CCG',
        params: [
          { name: 'code', label: 'BNF code (code)', required: true },
          { name: 'ccg', label: 'CCG code (optional)', required: false },
        ],
      },
    ],
    []
  );

  const [source, setSource] = useState(sources[0].key);
  const [form, setForm] = useState({ q: '', code: '', ccg: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const active = sources.find((s) => s.key === source);

  const onChange = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const onFetch = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      let url = '';
      if (source === 'bnf_search') {
        if (!form.q) throw new Error('Please enter query (q)');
        url = `${API_BASE}/api/open/bnf/search?q=${encodeURIComponent(form.q)}`;
      } else if (source === 'spending_by_ccg') {
        if (!form.code) throw new Error('Please enter BNF code (code)');
        const params = new URLSearchParams({ code: form.code });
        if (form.ccg) params.set('ccg', form.ccg);
        url = `${API_BASE}/api/open/spending_by_ccg?${params.toString()}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          msg = j.error || msg;
        } catch {}
        throw new Error(msg);
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nhsuk-card nhsuk-u-margin-top-5">
      <div className="nhsuk-card__content">
        <h2 className="nhsuk-heading-l">NHS Open Data Explorer</h2>
        <p className="nhsuk-body">Explore NHS-approved open datasets proxied by the API server. Results are shown as raw JSON.</p>

        <div className="nhsuk-form-group">
          <label className="nhsuk-label" htmlFor="source">Data source</label>
          <select id="source" className="nhsuk-select" value={source} onChange={(e) => setSource(e.target.value)}>
            {sources.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        {active && (
          <div className="nhsuk-form-group">
            {active.params.map((p) => (
              <div className="nhsuk-form-group" key={p.name}>
                <label className="nhsuk-label" htmlFor={p.name}>
                  {p.label} {p.required && <span className="nhsuk-required">*</span>}
                </label>
                <input id={p.name} className="nhsuk-input" value={form[p.name] || ''} onChange={onChange(p.name)} />
              </div>
            ))}
          </div>
        )}

        <button className="nhsuk-button" type="button" onClick={onFetch} disabled={loading}>
          {loading ? 'Loading…' : 'Fetch'}
        </button>

        {error && (
          <div className="nhsuk-error-summary" role="alert" aria-labelledby="error-summary-title" tabIndex={-1}>
            <h3 className="nhsuk-error-summary__title" id="error-summary-title">There is a problem</h3>
            <div className="nhsuk-error-summary__body"><p>{error}</p></div>
          </div>
        )}

        {data && (
          <div className="nhsuk-inset-text nhsuk-u-margin-top-3">
            <span className="nhsuk-u-visually-hidden">Data: </span>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
