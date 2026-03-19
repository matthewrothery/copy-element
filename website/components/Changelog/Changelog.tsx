import type { ChangelogEntry } from "@/lib/parseChangelog";
import "./Changelog.css";

type ChangelogProps = {
  entries: ChangelogEntry[];
};

export function Changelog({ entries }: ChangelogProps): React.ReactElement {
  return (
    <div className="changelog">
      {entries.map((entry) => (
        <div key={entry.version} className="changelog-entry">
          <div className="changelog-entry-meta">
            <span className="changelog-version">{entry.version}</span>
            {entry.date && <span className="changelog-date">{entry.date}</span>}
          </div>
          <div className="changelog-entry-body">
            {entry.sections.map((section) => (
              <div
                key={section.type}
                className={`changelog-section changelog-section--${section.type}`}
              >
                <span className="changelog-section-label">{section.type}</span>
                <ul className="changelog-items">
                  {section.items.map((item, i) => (
                    <li key={i} className="changelog-item">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
