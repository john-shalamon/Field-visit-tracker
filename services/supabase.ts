import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Initialize Supabase client
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Check if Supabase is properly configured
const isSupabaseConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' && SUPABASE_URL.startsWith('http');

declare global {
  var __fieldVisitSupabase__: SupabaseClient | null | undefined;
}

// Cross-platform storage for Expo web and native
const supabaseStorage = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },
};

const authLock = async <T>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>
): Promise<T> => {
  return fn();
};

const createSupabase = (): SupabaseClient =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: supabaseStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // Avoid web LockManager contention during fast refresh / overlapping auth calls.
      lock: authLock,
      storageKey: 'field-visit-tracker-auth',
    },
  });

export const supabase = (() => {
  if (!isSupabaseConfigured) return null;
  if (!globalThis.__fieldVisitSupabase__) {
    globalThis.__fieldVisitSupabase__ = createSupabase();
  }
  return globalThis.__fieldVisitSupabase__;
})();

export default supabase;
