import React from 'react';

function numberFormat(n) {
  try {
    return new Intl.NumberFormat('en-GB').format(n);
  } catch {
    return String(n);
  }
}

export default function TriageTable({ dept, columns, data, loading }) {
  return (
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
  );
}
