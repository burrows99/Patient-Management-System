import React from 'react';

export default function SyntheaControls({ params, setParam, loading, onGenerate, onFetch }) {
  return (
    <div>
      <div className="nhsuk-form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <label className="nhsuk-label" htmlFor="p">Generate count (p)</label>
          <input
            id="p"
            className="nhsuk-input nhsuk-input--width-5"
            type="number"
            min={1}
            max={5}
            value={params.p}
            onChange={(e) => setParam('p', Math.max(1, Math.min(5, Number(e.target.value) || 0)))}
          />
        </div>
        <div>
          <label className="nhsuk-label" htmlFor="n">Fetch count (n)</label>
          <input
            id="n"
            className="nhsuk-input nhsuk-input--width-5"
            type="number"
            min={1}
            max={100}
            value={params.n}
            onChange={(e) => setParam('n', Math.max(1, Math.min(100, Number(e.target.value) || 0)))}
          />
        </div>
        <div>
          <label className="nhsuk-label" htmlFor="elementsPreset">Elements preset</label>
          <select
            id="elementsPreset"
            className="nhsuk-select"
            value={params.elementsPreset || 'rich'}
            onChange={(e) => setParam('elementsPreset', e.target.value)}
          >
            <option value="rich">Rich (with narrative)</option>
            <option value="lean">Lean (minimal)</option>
          </select>
          <span className="nhsuk-hint">Controls which FHIR _elements are requested from $everything</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" className="nhsuk-button" onClick={onGenerate} disabled={loading}>
          {loading ? 'Working…' : 'Generate'}
        </button>
        <button type="button" className="nhsuk-button nhsuk-button--secondary" onClick={onFetch} disabled={loading}>
          {loading ? 'Working…' : 'Fetch Patients'}
        </button>
      </div>
    </div>
  );
}
