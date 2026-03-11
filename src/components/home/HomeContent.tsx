'use client';

import { useAuth } from '@/context/AuthContext';
import MarketingHome from './MarketingHome';
import AuthenticatedHome from './AuthenticatedHome';

export default function HomeContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#F8FAFC]"></div>;
  }

  return user ? <AuthenticatedHome /> : <MarketingHome />;
}
