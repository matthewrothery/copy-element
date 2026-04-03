import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getMe, getAdminStatus, type AdminUser } from '@/lib/auth';

interface AuthState {
  user: AdminUser | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, isAdmin: false, loading: true });

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [state, setState] = useState<AuthState>({ user: null, isAdmin: false, loading: true });

  useEffect(() => {
    void (async () => {
      const user = await getMe();
      if (!user) {
        setState({ user: null, isAdmin: false, loading: false });
        return;
      }
      const isAdmin = await getAdminStatus();
      setState({ user, isAdmin, loading: false });
    })();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
