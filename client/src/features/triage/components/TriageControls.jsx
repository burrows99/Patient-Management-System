import React from 'react';

export default function TriageControls({
  dept,
  onDeptChange,
  datasetId,
  onDatasetChange,
  datasets,
  count,
  onCountChange,
  action,
  pending,
}) {
  return (
    <form action={action}>
      <div className="nhsuk-form-group">
        <label className="nhsuk-label" htmlFor="dept">Department</label>
        <select id="dept" name="dept" className="nhsuk-select" value={dept} onChange={(e) => onDeptChange(e.target.value)}>
          <option value="ED">ED</option>
          <option value="Imaging">Imaging</option>
          <option value="Outpatients">Outpatients</option>
        </select>
      </div>

      <div className="nhsuk-form-group">
        <label className="nhsuk-label" htmlFor="datasetId">Dataset</label>
        <select id="datasetId" name="datasetId" className="nhsuk-select" value={datasetId} onChange={(e) => onDatasetChange(e.target.value)}>
          {datasets.map((d, idx) => (
            <option key={`${d.persistentId || d.id}-${idx}`} value={d.persistentId || d.id}>
              {d.name || d.title || d.persistentId || d.id}
            </option>
          ))}
          {datasets.length === 0 && <option value={datasetId}>Default dataset</option>}
        </select>
      </div>

      <div className="nhsuk-form-group">
        <label className="nhsuk-label" htmlFor="count">Count</label>
        <input
          id="count"
          name="count"
          className="nhsuk-input"
          type="number"
          min={1}
          max={200}
          value={count}
          onChange={(e) => onCountChange(Number(e.target.value || 0))}
        />
      </div>

      <button className="nhsuk-button" type="submit" disabled={pending}>
        {pending ? 'Generating…' : 'Generate'}
      </button>
    </form>
  );
}
