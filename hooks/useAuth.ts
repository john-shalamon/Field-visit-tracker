import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import authService from '@/services/auth';
import { User, AuthSession } from '@/types';
import supabase from '@/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Cross-platform storage helper
const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Storage getItem error:', error);
    return null;
  }
};

const removeStorageItem = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Storage removeItem error:', error);
  }
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: string;
    department?: string;
    zone?: string;
    employeeId?: string;
  }) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  sendOtp: (phone: string) => Promise<any>;
  verifyOtp: (phone: string, token: string) => Promise<any>;
  signOut: () => Promise<void>;
  biometricAuth: () => Promise<any>;
  enableBiometric: (credentials?: { email: string; password: string }) => Promise<void>;
  disableBiometric: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuthState = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!supabase) {
          console.warn('Supabase not configured');
          setLoading(false);
          return;
        }
        console.log('Checking existing session...');
        const session = await authService.getSession();
        console.log('Session check result:', !!session?.user);
        if (session?.user) {
          console.log('User session found:', session.user.id);
          setUser(session.user);
        } else {
          console.log('No user session found');
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Set up auth state listener - SINGLE instance to prevent race conditions
  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase not available for auth listener');
      return;
    }

    console.log('Setting up auth state listener...');
    let subscription: any;
    
    const setupListener = async () => {
      // Check if OTP flow is active to prevent unwanted redirects
      const otpFlowActive = await getStorageItem('otp_flow_active');
      const isOtpFlowActive = otpFlowActive === 'true';
      
      console.log('Auth listener setup - OTP flow active:', isOtpFlowActive);
      
      const { data } = supabase!.auth.onAuthStateChange(async (_event: any, session: any) => {
        console.log('Auth state changed:', _event, '| User:', !!session?.user, '| OTP active:', isOtpFlowActive);
        
        // Skip processing if OTP flow is active to prevent redirects
        if (isOtpFlowActive && _event === 'INITIAL_SESSION') {
          console.log('Skipping auth state change during OTP flow');
          return;
        }
        
        if (session?.user) {
          console.log('User authenticated:', session.user.id);
          let userProfile = await authService.getUserProfile(session.user.id);
          if (!userProfile) {
            console.warn('User profile not found, using fallback');
            // Fallback: build a user from auth metadata
            userProfile = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
              phone: session.user.user_metadata?.phone || '',
              role: 'field_officer',
              is_active: true,
              created_at: session.user.created_at,
              updated_at: session.user.created_at,
            } as any;
          }
          setUser(userProfile);
        } else {
          console.log('User session cleared');
          setUser(null);
        }
      });
      
      subscription = data?.subscription;
    };

    setupListener().catch((error) => {
      console.error('Auth listener setup error:', error);
    });

    return () => {
      console.log('Cleaning up auth listener...');
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (data: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
      role?: string;
      department?: string;
      zone?: string;
      employeeId?: string;
    }) => {
      setLoading(true);
      try {
        const result = await authService.signUp(data);
        if (result.error) {
          const errorMsg = result.error instanceof Error ? result.error.message : String(result.error);
          throw new Error(errorMsg);
        }
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
      if (result.error) {
        const errorMsg = result.error instanceof Error ? result.error.message : String(result.error);
        throw new Error(errorMsg);
      }
      setUser(result.data?.user as User ?? null);
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    setLoading(true);
    try {
      const result = await authService.sendOtp(phone);
      if (result.error) {
        const errorMsg = result.error instanceof Error ? result.error.message : String(result.error);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    setLoading(true);
    try {
      const result = await authService.verifyOtp(phone, token);
      if (result.error) {
        const errorMsg = result.error instanceof Error ? result.error.message : String(result.error);
        throw new Error(errorMsg);
      }
      setUser(result.data?.user as User ?? null);
      return result;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authService.signOut();
      if (result.error) {
        const errorMsg = result.error instanceof Error ? result.error.message : String(result.error);
        throw new Error(errorMsg);
      }
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

  const enableBiometric = useCallback(async (credentials?: { email: string; password: string }) => {
    try {
      const result = await authService.enableBiometric(credentials);
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
    sendOtp,
    verifyOtp,
    signOut,
    biometricAuth,
    enableBiometric,
    disableBiometric,
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useAuthState();
  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
