import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, getAdminStatus } from '@/lib/auth';
import { Spinner } from '@/components/Spinner/Spinner';
import './AuthCallback.css';

export function AuthCallback(): React.ReactElement {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const user = await getMe();
      if (!user) {
        navigate('/login');
        return;
      }
      const isAdmin = await getAdminStatus();
      if (!isAdmin) {
        setError('Your account does not have admin access.');
        return;
      }
      navigate('/');
    })();
  }, [navigate]);

  if (error) {
    return (
      <div className="auth-callback">
        <div className="auth-callback__card">
          <p className="auth-callback__error">{error}</p>
          <a href="/login">Back to sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-callback">
      <div className="auth-callback__card">
        <Spinner size="lg" />
        <p className="auth-callback__message">Signing you in…</p>
      </div>
    </div>
  );
}
