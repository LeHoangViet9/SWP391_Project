/**
 * SkeletonTable — Shimmer loading placeholder for data tables.
 * Props:
 *   - columns: number of columns (default 6)
 *   - rows: number of skeleton rows (default 5)
 */
export default function SkeletonTable({ columns = 6, rows = 5 }) {
  return (
    <div className="overflow-x-auto">
      <table className="hms-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <div className="skeleton-text" style={{ width: `${50 + Math.random() * 40}%` }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3">
                  <div
                    className="skeleton-text"
                    style={{
                      width: `${40 + Math.random() * 50}%`,
                      animationDelay: `${rowIdx * 80 + colIdx * 30}ms`,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
