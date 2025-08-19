import React, { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

// Safely get nested value via dot path
function get(obj, path, fallback = undefined) {
  if (!obj || !path) return fallback;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return fallback;
    // numeric index for arrays when path like "foo.0.bar"
    const key = Number.isFinite(Number(p)) && String(Number(p)) === p ? Number(p) : p;
    cur = cur[key];
  }
  return cur == null ? fallback : cur;
}

// Flatten nested object to dot-path keys (up to depth, limit arrays)
function flatten(obj, prefix = '', out = {}, depth = 0, maxDepth = 3, maxArray = 2) {
  if (depth > maxDepth || obj == null) return out;
  if (Array.isArray(obj)) {
    const lim = Math.min(obj.length, maxArray);
    for (let i = 0; i < lim; i++) {
      flatten(obj[i], prefix ? `${prefix}.${i}` : String(i), out, depth + 1, maxDepth, maxArray);
    }
    return out;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v != null && typeof v === 'object' && depth < maxDepth) {
        flatten(v, key, out, depth + 1, maxDepth, maxArray);
      } else {
        out[key] = v;
      }
    }
    return out;
  }
  out[prefix || 'value'] = obj;
  return out;
}

export default function TriageTable({
  dept,
  columns,
  data,
  loading,
  // optional advanced props
  fieldPaths, // explicit list of dot-paths to display
  maxAutoColumns = 80,
  maxDepth = 4,
}) {
  const caption = useMemo(
    () => `Incoming queue (${formatCount(data?.length || 0)} shown)`,
    [data]
  );

  // Determine effective column definitions
  const effectiveCols = useMemo(() => {
    // 1) If explicit fieldPaths are provided, use them
    if (Array.isArray(fieldPaths) && fieldPaths.length > 0) {
      return fieldPaths.map((path) => ({ key: path, label: path.split('.').slice(-1)[0] || path }));
    }
    // 2) If consumer passed columns, respect them
    if (Array.isArray(columns) && columns.length > 0) return columns;
    // 3) Auto-infer from data by flattening first few rows
    const sample = (data || []).slice(0, 25);
    const keySet = new Set();
    for (const row of sample) {
      const flat = flatten(row, '', {}, 0, maxDepth, 3);
      Object.keys(flat).forEach((k) => keySet.add(k));
    }
    const allKeys = Array.from(keySet);
    // Group by top-level segment (e.g., 'patient', 'resources', etc.)
    const groups = new Map();
    for (const k of allKeys) {
      const seg = (k.includes('.') ? k.split('.')[0] : k) || '';
      if (!groups.has(seg)) groups.set(seg, []);
      groups.get(seg).push(k);
    }
    // Sort keys within each group for stability
    for (const [g, arr] of groups) {
      arr.sort();
      groups.set(g, arr);
    }
    // Determine group order: prioritize 'resources' then 'patient', then others alphabetically
    const groupNames = Array.from(groups.keys());
    groupNames.sort((a, b) => {
      const rank = (x) => (x === 'resources' ? 0 : x === 'patient' ? 1 : 2);
      const ra = rank(a), rb = rank(b);
      return ra !== rb ? ra - rb : a.localeCompare(b);
    });
    // Round-robin across groups to interleave columns
    const chosen = [];
    let i = 0;
    while (chosen.length < maxAutoColumns) {
      let progressed = false;
      for (const g of groupNames) {
        const arr = groups.get(g);
        if (i < arr.length) {
          chosen.push(arr[i]);
          if (chosen.length >= maxAutoColumns) break;
          progressed = true;
        }
      }
      if (!progressed) break; // exhausted all groups
      i += 1;
    }
    return chosen.map((k) => ({ key: k, label: k }));
  }, [columns, data, fieldPaths, maxAutoColumns, maxDepth]);

  // Build TanStack columns; use accessorFn to support dot-paths
  const tanColumns = useMemo(
    () =>
      (effectiveCols || []).map((c) => ({
        id: c.key,
        header: c.label,
        accessorFn: (row) => get(row, c.key),
        cell: (info) => {
          const v = info.getValue();
          // Common field niceties
          if (c.key === 'priorityScore') return <strong>{Number(v).toFixed(2)}</strong>;
          if (c.key === 'arrivalTime' || c.key === 'simulationTimestamp') return v ? new Date(v).toLocaleString() : '';
          if (c.key === 'birthDate' || /date$/i.test(c.key)) return v ? new Date(v).toLocaleDateString() : '';
          if (Array.isArray(v)) return v.map((x) => (x && typeof x === 'object' ? JSON.stringify(x) : String(x))).join(', ');
          if (v && typeof v === 'object') return JSON.stringify(v);
          return v ?? '';
        },
      })),
    [effectiveCols]
  );

  const table = useReactTable({
    data: data || [],
    columns: tanColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row, index) =>
      (row?.patient && row.patient.id) ||
      row?.id ||
      (row?.encounterId || row?.arrivalTime ? `${row.encounterId || ''}:${row.arrivalTime || ''}` : String(index)),
    debugTable: false,
  });

  return (
    <div className="nhsuk-u-margin-top-4">
      <div style={{ overflowX: 'auto' }} className="nhsuk-table-responsive">
        <table className="nhsuk-table">
          <caption className="nhsuk-table__caption">{caption}</caption>
          <thead className="nhsuk-table__head">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="nhsuk-table__row">
                {hg.headers.map((header) => (
                  <th key={header.id} scope="col" className="nhsuk-table__header">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="nhsuk-table__body">
            {loading && (data?.length || 0) === 0 ? (
              <tr className="nhsuk-table__row">
                <td className="nhsuk-table__cell" colSpan={tanColumns.length}>Loading…</td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="nhsuk-table__row">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="nhsuk-table__cell">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
