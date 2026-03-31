import supabase from './supabase';
import { User, AuthSession } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

function normalizePhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  const cleaned = trimmed.replace(/[\s()-]/g, '');

  // Already in E.164-ish format.
  if (/^\+[1-9]\d{9,14}$/.test(cleaned)) {
    return cleaned;
  }

  // If user entered a local 10-digit number, default to India country code.
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // If user entered digits with country code but without '+', prepend it.
  if (/^[1-9]\d{9,14}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return cleaned;
}

// Cross-platform storage helper for web and native
const CrossPlatformStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },
};

// SecureStore doesn't work on web, fall back to AsyncStorage
const SecureStoreAdapter = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.getItemAsync(key);
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(key);
  },
};

export const authService = {
  // Sign up with email and password and create profile
  async signUp(payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: string;
    department?: string;
    zone?: string;
    employeeId?: string;
  }) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') };
    }
    try {
      const { email, password, fullName, phone, role, department, zone, employeeId } = payload;

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

      // if user created, also insert profile into users table
      if (data?.user?.id) {
        const profile = {
          id: data.user.id,
          email,
          full_name: fullName,
          phone: phone || '',
          role: role || 'field_officer',
          department: department || null,
          zone: zone || null,
          employee_id: employeeId || null,
          is_active: true,
        };
        const { error: profileError } = await supabase.from('users').upsert(profile);
        if (profileError) {
          console.warn('Failed to create user profile during signup', profileError);
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      return { data: null, error: new Error(errorMessage) };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') };
    }
    try {
      console.log('Starting sign in process for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful, user:', data.user?.id);

      // Fetch user profile, create fallback from auth data if not found
      let userProfile = await this.getUserProfile(data.user?.id);
      if (!userProfile && data.user) {
        console.log('User profile not found, creating from auth data');
        userProfile = {
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || email.split('@')[0],
          phone: data.user.user_metadata?.phone || '',
          role: 'field_officer',
          is_active: true,
          created_at: data.user.created_at,
          updated_at: data.user.created_at,
        } as User;
      }

      console.log('Sign in complete with profile:', !!userProfile);
      return { data: { user: userProfile, session: data.session }, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      return { data: null, error: new Error(errorMessage) };
    }
  },

  // Send OTP to phone for authentication
  async sendOtp(phone: string) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') };
    }
    try {
      const normalizedPhone = normalizePhoneNumber(phone);
      console.log('Sending OTP to phone:', normalizedPhone);
      
      // Mark OTP flow as active to prevent redirects
      await CrossPlatformStorage.setItem('otp_flow_active', 'true');
      
      // Use signInWithOtp with strict options to prevent redirects
      // shouldCreateUser: false - prevents auto-redirect to signup/OAuth
      // channel: 'sms' - explicitly requests SMS channel only
      const { data, error } = await supabase.auth.signInWithOtp({ 
        phone: normalizedPhone,
        options: {
          shouldCreateUser: false,
          channel: 'sms',
        }
      });
      
      if (error) {
        console.error('Supabase OTP error:', error);
        // Clear the OTP flow flag on error
        await CrossPlatformStorage.removeItem('otp_flow_active');
        throw error;
      }
      
      // Store OTP session info for verification
      await CrossPlatformStorage.setItem('otp_phone', normalizedPhone);
      if (data?.session) {
        await CrossPlatformStorage.setItem('otp_session', JSON.stringify(data.session));
      }
      
      // Clear the OTP flow flag - OTP sent successfully
      await CrossPlatformStorage.removeItem('otp_flow_active');
      
      console.log('OTP sent successfully to:', normalizedPhone, 'Session:', !!data?.session);
      return { data, error: null };
    } catch (error) {
      console.error('Send OTP error:', error);
      // Clear the OTP flow flag on error
      await CrossPlatformStorage.removeItem('otp_flow_active');
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      return { data: null, error: new Error(errorMessage) };
    }
  },

  // Verify received OTP and log the user in
  async verifyOtp(phone: string, token: string) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') };
    }
    try {
      const normalizedPhone = normalizePhoneNumber(phone);
      
      console.log('Verifying OTP for phone:', normalizedPhone);
      
      // Retrieve stored session info if available
      const storedSession = await CrossPlatformStorage.getItem('otp_session');
      console.log('Stored OTP session available:', !!storedSession);
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token,
        type: 'sms',
      });
      
      if (error) {
        console.error('Supabase OTP verification error:', error);
        throw error;
      }
      
      if (data?.user) {
        // Fetch or create user profile
        let userProfile = await this.getUserProfile(data.user.id);
        if (!userProfile && data.user) {
          // Create fallback profile if not found
          userProfile = {
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.user_metadata?.full_name || 'User',
            phone: normalizedPhone,
            role: 'field_officer',
            is_active: true,
            created_at: data.user.created_at,
            updated_at: new Date().toISOString(),
          } as any;
        }
        
        // Clean up OTP session data
        await CrossPlatformStorage.removeItem('otp_phone');
        await CrossPlatformStorage.removeItem('otp_session');
        await CrossPlatformStorage.removeItem('otp_flow_active');
        
        console.log('OTP verified successfully for phone:', normalizedPhone);
        return { data: { user: userProfile, session: data.session }, error: null };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Verify OTP error:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      return { data: null, error: new Error(errorMessage) };
    }
  },

  // Sign out
  async signOut() {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear biometric data
      await CrossPlatformStorage.removeItem('biometric_enabled');

      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      return { error: new Error(errorMessage) };
    }
  },

  // Get current session
  async getSession(): Promise<AuthSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured in getSession');
      return null;
    }
    try {
      console.log('Getting current session...');
      
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session retrieval error:', error);
        throw error;
      }

      if (!data.session) {
        console.log('No session found');
        return null;
      }

      console.log('Session found for user:', data.session.user.id);
      
      let userProfile = await this.getUserProfile(data.session.user.id);
      if (!userProfile) {
        console.log('User profile not found in getSession, using fallback');
        userProfile = {
          id: data.session.user.id,
          email: data.session.user.email || '',
          full_name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || '',
          phone: data.session.user.user_metadata?.phone || '',
          role: 'field_officer',
          is_active: true,
          created_at: data.session.user.created_at,
          updated_at: data.session.user.created_at,
        } as any;
      }

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
      console.warn('Supabase not configured in getUserProfile');
      return null;
    }
    try {
      console.log('Fetching user profile for ID:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching user profile:', error.message);
        return null;
      }

      console.log('User profile fetched successfully');
      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  },

  // Authenticate with biometrics and optionally sign in with stored credentials
  // Authenticate with biometrics and optionally sign in with stored credentials
  async biometricAuthenticate() {
    try {
      // Only available on native platforms
      if (Platform.OS === 'web') {
        return { success: false, error: new Error('Biometric authentication not supported on web') };
      }

      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        throw new Error('Device does not support biometric authentication');
      }

      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: true,
        promptMessage: 'Authenticate to login',
      });

      if (!result.success) {
        return { success: false, error: new Error('Biometric authentication failed') };
      }

      // retrieve stored credentials
      const email = await SecureStoreAdapter.getItemAsync('biometric_email');
      const password = await SecureStoreAdapter.getItemAsync('biometric_password');

      if (email && password) {
        const signInResult = await this.signIn(email, password);
        if (signInResult.error) throw signInResult.error;
        return { success: true, error: null, data: signInResult.data };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      return { success: false, error: new Error(errorMessage) };
    }
  },

  // Enable biometric authentication and optionally store credentials
  async enableBiometric(credentials?: { email: string; password: string }) {
    try {
      if (credentials) {
        await SecureStoreAdapter.setItemAsync('biometric_email', credentials.email);
        await SecureStoreAdapter.setItemAsync('biometric_password', credentials.password);
      }
      await CrossPlatformStorage.setItem('biometric_enabled', 'true');
      return { error: null };
    } catch (error) {
      console.error('Enable biometric error:', error);
      return { error };
    }
  },

  // Disable biometric authentication and clear stored credentials
  async disableBiometric() {
    try {
      await CrossPlatformStorage.removeItem('biometric_enabled');
      await SecureStoreAdapter.deleteItemAsync('biometric_email');
      await SecureStoreAdapter.deleteItemAsync('biometric_password');
      return { error: null };
    } catch (error) {
      console.error('Disable biometric error:', error);
      return { error };
    }
  },

  // Check if biometric is enabled
  async isBiometricEnabled() {
    try {
      const enabled = await CrossPlatformStorage.getItem('biometric_enabled');
      return enabled === 'true';
    } catch (error) {
      console.error('Check biometric enabled error:', error);
      return false;
    }
  },

  // Refresh session
  async refreshSession() {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') };
    }
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
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') };
    }
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
