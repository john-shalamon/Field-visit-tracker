import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import authService from '@/services/auth';
import { User, AuthSession } from '@/types';
import supabase from '@/services/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  biometricAuth: () => Promise<any>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const session = await authService.getSession();
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  // Set up auth state listener
  useEffect(() => {
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userProfile = await authService.getUserProfile(session.user.id);
        setUser(userProfile);
      } else {
        setUser(null);
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, phone?: string) => {
      setLoading(true);
      try {
        const result = await authService.signUp(email, password, fullName, phone);
        if (result.error) throw result.error;
        return result;
      } catch (error) {
        console.error('Sign up error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authService.signIn(email, password);
      if (result.error) throw result.error;
      setUser(result.data?.user);
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authService.signOut();
      if (result.error) throw result.error;
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const biometricAuth = useCallback(async () => {
    try {
      const result = await authService.biometricAuthenticate();
      if (!result.success) throw result.error;
      return result;
    } catch (error) {
      console.error('Biometric auth error:', error);
      throw error;
    }
  }, []);

  const enableBiometric = useCallback(async () => {
    try {
      const result = await authService.enableBiometric();
      if (result.error) throw result.error;
    } catch (error) {
      console.error('Enable biometric error:', error);
      throw error;
    }
  }, []);

  const disableBiometric = useCallback(async () => {
    try {
      const result = await authService.disableBiometric();
      if (result.error) throw result.error;
    } catch (error) {
      console.error('Disable biometric error:', error);
      throw error;
    }
  }, []);

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    biometricAuth,
    enableBiometric,
    disableBiometric,
  };
};

export default useAuth;
