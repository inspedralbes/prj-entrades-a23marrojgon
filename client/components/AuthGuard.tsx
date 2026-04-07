'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-cyan">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin"></div>
          <p className="uppercase tracking-[0.3em] text-xs animate-pulse">Sincronitzant dades...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // El redirect lo maneja el useEffect
  }

  return <>{children}</>;
}
