import supabase from './supabase';
import { User, AuthSession } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, fullName: string, phone?: string) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || '',
          },
        },
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch user profile
      const userProfile = await this.getUserProfile(data.user?.id);

      return { data: { ...data, user: userProfile }, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  },

  // Sign out
  async signOut() {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } };
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear biometric data
      await AsyncStorage.removeItem('biometric_enabled');

      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  },

  // Get current session
  async getSession(): Promise<AuthSession | null> {
    if (!supabase) {
      return null;
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (!data.session) return null;

      const userProfile = await this.getUserProfile(data.session.user.id);

      return {
        user: userProfile,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at || 0,
        },
      };
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },

  // Get user profile from database
  async getUserProfile(userId: string): Promise<User | null> {
    if (!supabase) {
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  },

  // Authenticate with biometrics
  async biometricAuthenticate() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        throw new Error('Device does not support biometric authentication');
      }

      const biometrics = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
      });

      return { success: result.success, error: null };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return { success: false, error };
    }
  },

  // Enable biometric authentication
  async enableBiometric() {
    try {
      await AsyncStorage.setItem('biometric_enabled', 'true');
      return { error: null };
    } catch (error) {
      console.error('Enable biometric error:', error);
      return { error };
    }
  },

  // Disable biometric authentication
  async disableBiometric() {
    try {
      await AsyncStorage.removeItem('biometric_enabled');
      return { error: null };
    } catch (error) {
      console.error('Disable biometric error:', error);
      return { error };
    }
  },

  // Check if biometric is enabled
  async isBiometricEnabled() {
    try {
      const enabled = await AsyncStorage.getItem('biometric_enabled');
      return enabled === 'true';
    } catch (error) {
      console.error('Check biometric enabled error:', error);
      return false;
    }
  },

  // Refresh session
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Refresh session error:', error);
      return { data: null, error };
    }
  },

  // Reset password
  async resetPassword(email: string) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'fieldvisittracker://reset-password',
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  },
};

export default authService;
