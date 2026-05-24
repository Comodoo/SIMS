'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not logged in, redirect to login
        router.push('/login');
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Logged in but wrong role, redirect to their own dashboard
        // This prevents cross-role access (e.g. student trying to access /admin)
        console.warn(`Unauthorized access attempt: ${user.role} tried to access ${allowedRoles.join(', ')} area`);
        router.push(`/${user.role}`);
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router]);

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, return null while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // If wrong role, return null while redirecting
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  // All checks passed, render the content
  return <>{children}</>;
}
