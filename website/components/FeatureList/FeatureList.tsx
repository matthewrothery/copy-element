import "./FeatureList.css";

export interface FeatureItem {
  feature: string;
  benefit: string;
}

interface FeatureListProps {
  items: FeatureItem[];
}

export function FeatureList({ items }: FeatureListProps): React.ReactElement {
  return (
    <ul className="feature-list">
      {items.map((item) => (
        <li key={item.feature} className="feature-list-item">
          <span className="feature-list-feature">{item.feature}</span>
          <span className="feature-list-connector">so you can</span>
          <span className="feature-list-benefit">{item.benefit}</span>
        </li>
      ))}
    </ul>
  );
}
