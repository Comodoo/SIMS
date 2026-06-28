'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { mutate as gqlMutate } from '@/lib/graphql';

const REVOKE_ALL_MUT = `
  mutation LogoutRevoke($userId: ID) {
    revokeAllSessions(userId: $userId) { success }
  }
`;

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  is_active: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setState({
          user: parsedUser,
          token: savedToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback((token: string, user: AuthUser) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  }, []);

  const logout = useCallback(() => {
    // Capture before clearing so we can pass them to the backend
    const savedToken = localStorage.getItem('authToken');
    const savedUser  = localStorage.getItem('currentUser');

    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');

    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Fire-and-forget: revoke the session on the backend
    if (savedToken && savedUser) {
      try {
        const u = JSON.parse(savedUser);
        gqlMutate(REVOKE_ALL_MUT, { userId: u.id }, savedToken).catch(() => {});
      } catch { /* ignore parse errors */ }
    }
  }, []);

  const updateUser = useCallback((user: AuthUser) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setState(prev => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
