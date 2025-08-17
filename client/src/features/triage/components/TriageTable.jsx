import React, { useMemo } from 'react';
import NhsTable from '../../../components/common/NhsTable';

export default function TriageTable({ dept, columns, data, loading }) {
  const caption = useMemo(() => `${dept} queue (${formatCount(data?.length || 0)} shown)`, [dept, data]);
  const mappedColumns = useMemo(
    () =>
      columns.map((c) => {
        if (c.key === 'priorityScore') {
          return { label: c.label, key: c.key, render: (v) => <strong>{Number(v).toFixed(2)}</strong> };
        }
        if (c.key === 'arrivalTime') {
          return { label: c.label, key: c.key, render: (v) => new Date(v).toLocaleString() };
        }
        return { label: c.label, key: c.key };
      }),
    [columns]
  );
  return (
    <div className="nhsuk-u-margin-top-4">
      <NhsTable caption={caption} columns={mappedColumns} data={data} loading={loading} keyField={(row) => row.id} />
    </div>
  );
}

function formatCount(n) {
  try {
    return new Intl.NumberFormat('en-GB').format(n);
  } catch {
    return String(n);
  }
}
