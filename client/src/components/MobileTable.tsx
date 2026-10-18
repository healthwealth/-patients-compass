import { useIsMobile } from "@/lib/responsive";

interface MobileTableProps {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  compact?: boolean;
}

/**
 * Mobile-optimized table component
 * Automatically switches between table and card layout on mobile
 */
export function MobileTable({ headers, rows, compact = false }: MobileTableProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="bg-card border border-border rounded-lg p-3 space-y-2"
          >
            {headers.map((header, colIdx) => (
              <div key={colIdx} className="flex justify-between items-start gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  {header}
                </span>
                <span className="text-sm font-medium text-right flex-1">
                  {row[colIdx]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className={`text-left font-semibold text-sm ${compact ? "px-3 py-2" : "px-4 py-3"}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-border hover:bg-muted/50 transition-colors"
            >
              {row.map((cell, colIdx) => (
                <td
                  key={colIdx}
                  className={`text-sm ${compact ? "px-3 py-2" : "px-4 py-3"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
