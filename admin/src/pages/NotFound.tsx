import './NotFound.css';
import { Link } from 'react-router-dom';

export function NotFound(): React.ReactElement {
  return (
    <div className="not-found">
      <span className="not-found__code">404</span>
      <h1 className="not-found__title">Page not found</h1>
      <p className="not-found__body">The page you're looking for doesn't exist.</p>
      <Link className="not-found__link" to="/">Go to dashboard</Link>
    </div>
  );
}
