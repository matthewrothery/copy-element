import './Topbar.css';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/Button/Button';

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps): React.ReactElement {
  const { user } = useAuth();

  function handleSignOut(): void {
    void signOut().then(() => {
      window.location.href = '/login';
    });
  }

  return (
    <header className="topbar">
      {onMenuClick && (
        <button className="topbar__menu-btn" onClick={onMenuClick} aria-label="Open navigation">
          ☰
        </button>
      )}
      <h1 className="topbar__title">{title}</h1>
      <div className="topbar__actions">
        {user && (
          <>
            <span className="topbar__user">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign out</Button>
          </>
        )}
      </div>
    </header>
  );
}
