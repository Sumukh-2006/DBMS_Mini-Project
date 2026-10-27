// components/DataTable.js
import React from 'react';

export default function DataTable({
  columns = [],
  data = [],
  renderRow = null,
  emptyMessage = 'No records found',
  style = {},
}) {
  return (
    <div className="data-table-container" style={style}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  textAlign: col.align || 'left',
                  width: col.width || 'auto',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            renderRow ? (
              data.map((item, idx) => renderRow(item, idx))
            ) : (
              data.map((row, rIdx) => (
                <tr key={rIdx}>
                  {columns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      style={{
                        textAlign: col.align || 'left',
                      }}
                    >
                      {col.render ? col.render(row, rIdx) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--ink-muted)',
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
