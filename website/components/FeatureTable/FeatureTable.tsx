import type { FeatureStatus } from "@/data/comparisons/types";
import "./FeatureTable.css";

export type FeatureTableRow = {
  feature: string;
  note?: string;
  status: FeatureStatus;
};

interface FeatureTableProps {
  rows: FeatureTableRow[];
  columnLabel?: string;
}

function StatusIcon({ status }: { status: FeatureStatus }): React.ReactElement {
  if (status === "yes") {
    return (
      <span className="ft-status ft-status--yes" aria-label="Yes">
        ✓
      </span>
    );
  }
  if (status === "no") {
    return (
      <span className="ft-status ft-status--no" aria-label="No">
        ✗
      </span>
    );
  }
  return (
    <span className="ft-status ft-status--partial" aria-label="Partial">
      ◐
    </span>
  );
}

export function FeatureTable({
  rows,
  columnLabel = "Element Armory",
}: FeatureTableProps): React.ReactElement {
  return (
    <div className="ft-scroll-wrapper">
      <table className="ft-table">
        <thead>
          <tr>
            <th scope="col" className="ft-th ft-th--feature">
              Feature
            </th>
            <th scope="col" className="ft-th ft-th--status">
              {columnLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="ft-row">
              <td className="ft-td ft-td--feature">
                <span className="ft-feature-label">{row.feature}</span>
                {row.note != null && (
                  <span className="ft-feature-note">{row.note}</span>
                )}
              </td>
              <td className="ft-td ft-td--status">
                <StatusIcon status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
