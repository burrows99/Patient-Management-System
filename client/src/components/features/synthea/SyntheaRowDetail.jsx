import React, { useCallback } from 'react';

export default function SyntheaRowDetail({ row }) {
  const openInNewTab = useCallback(() => {
    try {
      const key = `synthea-row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, JSON.stringify(row));
      const target = `/synthea/json?key=${encodeURIComponent(key)}`;
      window.open(target, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Failed to open JSON in new tab', e);
    }
  }, [row]);

  return (
    <div className="nhsuk-u-padding-2">
      <button type="button" className="nhsuk-button nhsuk-button--secondary" onClick={openInNewTab}>
        Open JSON in new tab
      </button>
    </div>
  );
}
