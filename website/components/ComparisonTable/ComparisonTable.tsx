import type { FeatureStatus } from "@/data/comparisons/types";
import type { ComparisonTableProps } from "./types";
import "./ComparisonTable.css";

function StatusIcon({ status }: { status: FeatureStatus }): React.ReactElement {
  if (status === "yes") {
    return (
      <span className="ct-status ct-status--yes" aria-label="Yes">
        ✓
      </span>
    );
  }
  if (status === "no") {
    return (
      <span className="ct-status ct-status--no" aria-label="No">
        ✗
      </span>
    );
  }
  return (
    <span className="ct-status ct-status--partial" aria-label="Partial">
      ◐
    </span>
  );
}

export function ComparisonTable({
  ours,
  theirs,
  rows,
}: ComparisonTableProps): React.ReactElement {
  return (
    <div className="ct-scroll-wrapper">
      <table className="ct-table">
        <thead>
          <tr>
            <th scope="col" className="ct-th ct-th--feature">
              Feature
            </th>
            <th scope="col" className="ct-th ct-th--ours">
              {ours.name}
            </th>
            <th scope="col" className="ct-th ct-th--theirs">
              {theirs.name}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="ct-row">
              <td scope="row" className="ct-td ct-td--feature">
                <span className="ct-feature-label">{row.feature}</span>
                {row.note != null && (
                  <span className="ct-feature-note">{row.note}</span>
                )}
              </td>
              <td className="ct-td ct-td--ours">
                <StatusIcon status={row.ours} />
              </td>
              <td className="ct-td ct-td--theirs">
                <StatusIcon status={row.theirs} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
