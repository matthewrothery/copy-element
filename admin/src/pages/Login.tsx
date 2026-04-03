import './Login.css';
import { signInWithGoogle } from '@/lib/auth';
import { Button } from '@/components/Button/Button';
import { useState } from 'react';

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL ?? window.location.origin;

export function Login(): React.ReactElement {
  const [loading, setLoading] = useState(false);

  function handleGoogleSignIn(): void {
    setLoading(true);
    void signInWithGoogle(`${ADMIN_URL}/auth/callback`).catch(() => setLoading(false));
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__logo">
          <span>EA</span>
        </div>
        <h1 className="login__title">Element Armory Admin</h1>
        <p className="login__subtitle">Sign in to access the dashboard.</p>
        <Button onClick={handleGoogleSignIn} loading={loading} className="login__btn">
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
