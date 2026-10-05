'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppNav } from '@/components/app-nav';
import { LockScreen } from '@/components/lock-screen';

const publicPaths = ['/login'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLocked } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated && !publicPaths.includes(pathname)) {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router]);

  if (publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
