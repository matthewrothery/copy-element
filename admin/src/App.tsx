import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout/Layout';
import { Spinner } from '@/components/Spinner/Spinner';
import { Login } from '@/pages/Login';
import { AuthCallback } from '@/pages/AuthCallback';
import { Overview } from '@/pages/Overview';
import { Funnel } from '@/pages/Funnel';
import { Conversion } from '@/pages/Conversion';
import { Analytics } from '@/pages/Analytics';
import { Users } from '@/pages/Users';
import { Revenue } from '@/pages/Revenue';
import { Errors } from '@/pages/Errors';
import { Retention } from '@/pages/Retention';
import { UsageMetrics } from '@/pages/UsageMetrics';
import { Complimentary } from '@/pages/Complimentary';
import { BlogGenerator } from '@/pages/BlogGenerator';
import { NotFound } from '@/pages/NotFound';
import './styles/tokens.css';
import './styles/base.css';

function RequireAdmin(): React.ReactElement {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
        <p style={{ color: 'var(--danger-text)' }}>Access denied. This account is not an admin.</p>
        <a href="/login" style={{ color: 'var(--accent)' }}>Sign out and try again</a>
      </div>
    );
  }

  return <Layout><Outlet /></Layout>;
}

export function App(): React.ReactElement {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<RequireAdmin />}>
            <Route index element={<Overview />} />
            <Route path="funnel" element={<Funnel />} />
            <Route path="conversion" element={<Conversion />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="users" element={<Users />} />
            <Route path="revenue" element={<Revenue />} />
            <Route path="errors" element={<Errors />} />
            <Route path="retention" element={<Retention />} />
            <Route path="usage" element={<UsageMetrics />} />
            <Route path="complimentary" element={<Complimentary />} />
            <Route path="blog" element={<BlogGenerator />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
