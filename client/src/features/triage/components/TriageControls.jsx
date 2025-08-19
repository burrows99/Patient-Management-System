import React from 'react';

export default function TriageControls({ controls, action, pending }) {
  // Backward compatibility: if controls object isn't provided, build a minimal shim
  const c = controls || {};
  return (
    <form action={action}>
      <div className="nhsuk-form-group">
        <label className="nhsuk-label" htmlFor="pace">Pace (seconds per event)</label>
        <input
          id="pace"
          name={c.pace?.name || 'pace'}
          type="number"
          min="0.05"
          step="0.05"
          className="nhsuk-input"
          value={c.pace?.value ?? ''}
          onChange={c.pace?.onChange}
          disabled={pending}
          placeholder="2"
        />
      </div>

      <button type="submit" className="nhsuk-button" disabled={pending}>
        {pending ? 'Applying…' : 'Apply'}
      </button>
    </form>
  );
}
