import React, { useMemo } from 'react';
import PageLayout from '../components/common/PageLayout';
import JsonViewer from '../components/common/JsonViewer';

function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export default function SyntheaJsonViewPage() {
  const key = getParam('key');
  const data = useMemo(() => {
    if (!key) return null;
    try {
      let raw = localStorage.getItem(key);
      if (!raw) raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Failed to load JSON from storage', e);
      return null;
    }
  }, [key]);

  return (
    <PageLayout title="Synthea JSON Viewer" lead="Exact row object as returned by the API.">
      {!key && (
        <div className="nhsuk-warning-callout"><h3 className="nhsuk-warning-callout__label">Missing key</h3><p>No data key provided.</p></div>
      )}
      {key && !data && (
        <div className="nhsuk-warning-callout"><h3 className="nhsuk-warning-callout__label">No data</h3><p>No JSON found for the provided key. The tab may have been opened directly, or the session expired.</p></div>
      )}
      {data && (
        <div className="nhsuk-u-padding-2">
          <JsonViewer title="Row (as returned by API)" data={data} />
        </div>
      )}
    </PageLayout>
  );
}
