import React, { useMemo, useState } from 'react';

/**
 * NhsTable
 * - Reusable NHS-styled table with optional expandable row details
 * - Columns support key (dot-path), accessor(row) and render(value, row)
 */
export default function NhsTable({
  caption,
  columns,
  data,
  keyField = 'id',
  loading = false,
  emptyMessage = 'No items',
  rowDetail, // function (row) => ReactNode, enables expandable details column
  showIndex = false,
}) {
  const [expanded, setExpanded] = useState({});

  const getKey = (row, idx) => {
    if (typeof keyField === 'function') return keyField(row, idx);
    return row?.[keyField] ?? idx;
  };

  const hasDetails = typeof rowDetail === 'function';

  const safeGet = (row, path) => {
    if (!path) return undefined;
    const parts = String(path).split('.');
    let cur = row;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  };

  const rows = useMemo(() => Array.isArray(data) ? data : [], [data]);

  return (
    <div className="nhsuk-table-responsive">
      <table className="nhsuk-table">
        {caption && <caption className="nhsuk-table__caption">{caption}</caption>}
        <thead className="nhsuk-table__head">
          <tr className="nhsuk-table__row">
            {showIndex && <th className="nhsuk-table__header" scope="col">#</th>}
            {columns.map((c) => (
              <th key={c.key || c.label} className="nhsuk-table__header" scope="col">{c.label}</th>
            ))}
            {hasDetails && <th className="nhsuk-table__header" scope="col">Details</th>}
          </tr>
        </thead>
        <tbody className="nhsuk-table__body">
          {loading && rows.length === 0 && (
            <tr className="nhsuk-table__row"><td className="nhsuk-table__cell" colSpan={columns.length + (hasDetails?1:0) + (showIndex?1:0)}>Loading…</td></tr>
          )}
          {!loading && rows.length === 0 && (
            <tr className="nhsuk-table__row"><td className="nhsuk-table__cell" colSpan={columns.length + (hasDetails?1:0) + (showIndex?1:0)}>{emptyMessage}</td></tr>
          )}

          {rows.map((row, idx) => {
            const key = getKey(row, idx);
            const isOpen = !!expanded[key];
            return (
              <React.Fragment key={key}>
                <tr className="nhsuk-table__row">
                  {showIndex && <td className="nhsuk-table__cell">{idx + 1}</td>}
                  {columns.map((c) => {
                    const value = c.accessor ? c.accessor(row) : (c.key ? safeGet(row, c.key) : undefined);
                    const content = c.render ? c.render(value, row) : renderValue(value);
                    return <td key={(c.key || c.label) + '-cell'} className="nhsuk-table__cell">{content}</td>;
                  })}
                  {hasDetails && (
                    <td className="nhsuk-table__cell">
                      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                      <button type="button" className="nhsuk-button nhsuk-button--secondary" onClick={() => setExpanded((s) => ({ ...s, [key]: !s[key] }))}>
                        {isOpen ? 'Hide' : 'View'}
                      </button>
                    </td>
                  )}
                </tr>
                {hasDetails && isOpen && (
                  <tr className="nhsuk-table__row">
                    <td className="nhsuk-table__cell" colSpan={columns.length + (hasDetails?1:0) + (showIndex?1:0)}>
                      {rowDetail(row)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function renderValue(v) {
  if (v == null) return '—';
  if (React.isValidElement(v)) return v;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    const str = JSON.stringify(v);
    if (str.length > 120) return str.slice(0, 117) + '…';
    return str;
  } catch {
    return String(v);
  }
}
