import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User } from '../types';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, acceptTerms?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const clearSession = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = await authApi.getCurrentUser();
    setUser(currentUser);
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // The API client transparently refreshes an expired access token using
        // the rotating refresh cookie, so this also restores long sessions.
        await refreshUser();
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [clearSession, refreshUser]);

  const login = async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true);
    try {
      const loggedInUser = await authApi.login(email, password, rememberMe);
      setUser(loggedInUser);
      setIsAuthenticated(true);
      toast({
        description: `Welcome back, ${loggedInUser.name}!`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, acceptTerms = true) => {
    setIsLoading(true);
    try {
      const newUser = await authApi.register(name, email, password, acceptTerms);
      setUser(newUser);
      setIsAuthenticated(true);
      toast({
        description: `Welcome to Odyssey, ${newUser.name}!`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Error logging out', error);
    } finally {
      clearSession();
      toast({ description: 'You have been logged out' });
    }
  };

  const logoutAll = async () => {
    await authApi.logoutAll();
    clearSession();
    toast({ description: 'You have been signed out on all devices' });
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    setIsAuthenticated(true);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    logoutAll,
    updateUser,
    refreshUser,
    clearSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
