import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
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

  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      } catch (error) {
        // Session is invalid or expired
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user, token } = await authApi.login(email, password);
      // Remove localStorage token storage
      setUser(user);
      setIsAuthenticated(true);
      toast({
        description: `Welcome back, ${user.name}!`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        description: error.message || 'Login failed',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const newUser = await authApi.register(name, email, password);
      setUser(newUser);
      setIsAuthenticated(true);
      toast({
        description: `Welcome to Odyssey, ${name}!`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        description: error.message || 'Registration failed',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      // Clear any remaining auth state
      setUser(null);
      setIsAuthenticated(false);
      toast({
        description: 'You have been logged out',
      });
    } catch (error) {
      console.error("Error logging out", error);
      // Still clear local state even if server logout fails
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
