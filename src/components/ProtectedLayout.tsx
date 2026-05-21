import { useEffect, useState } from 'react';
import { fetchCurrentUser } from '../lib/api';
import type { User } from '../types/auth';
import LoginPage from '../pages/LoginPage';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  onUserLoaded: (user: User | null) => void;
}

export default function ProtectedLayout({ children, onUserLoaded }: ProtectedLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      onUserLoaded(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, [onUserLoaded]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-ink-200 border-t-ink-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ink-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
