import { User, AuthSession } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import * as SecureStore from 'expo-secure-store';
import { LocalStorage } from './localStorage';

// Secure store adapter for biometric credentials
const SecureStoreAdapter = {
  async getItemAsync(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting secure item:', error);
      return null;
    }
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error setting secure item:', error);
      throw error;
    }
  },
  async deleteItemAsync(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error deleting secure item:', error);
      throw error;
    }
  },
};

// Simple password hashing (for demo purposes - in production use proper hashing)
const hashPassword = (password: string): string => {
  // Simple hash for demo - in production use bcrypt or similar
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

const STORAGE_KEYS = {
  USERS: 'local_users',
  CURRENT_USER: 'current_user',
  BIOMETRIC_ENABLED: 'biometric_enabled',
};

// Local user storage
class LocalUserStorage {
  static async getUsers(): Promise<User[]> {
    try {
      const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  static async saveUsers(users: User[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  }

  static async addUser(user: User): Promise<void> {
    const users = await this.getUsers();
    users.push(user);
    await this.saveUsers(users);
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(user => user.email === email) || null;
  }

  static async findUserById(id: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(user => user.id === id) || null;
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const users = await this.getUsers();
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      await this.saveUsers(users);
    }
  }
}

// Session management
class LocalSessionManager {
  static async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async setCurrentUser(user: User | null): Promise<void> {
    try {
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (error) {
      console.error('Error setting current user:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    await this.setCurrentUser(null);
  }
}

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
    try {
      const { email, password, fullName, phone, role, department, zone, employeeId } = payload;

      // Check if user already exists
      const existingUser = await LocalUserStorage.findUserByEmail(email);
      if (existingUser) {
        return { data: null, error: new Error('User already exists with this email') };
      }

      // Create new user
      const newUser: User = {
        id: uuidv4(),
        email,
        full_name: fullName,
        phone: phone || '',
        role: (role as any) || 'field_officer',
        department: department || undefined,
        zone: zone || undefined,
        employee_id: employeeId || undefined,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Store password hash separately (in production, use proper security)
      const passwordHash = hashPassword(password);
      await AsyncStorage.setItem(`password_${newUser.id}`, passwordHash);

      // Save user
      await LocalUserStorage.addUser(newUser);

      // Auto sign in
      await LocalSessionManager.setCurrentUser(newUser);

      return { data: { user: newUser, session: { user: newUser } }, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      return { data: null, error: new Error(errorMessage) };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      console.log('Starting local sign in process for:', email);

      // Find user by email
      const user = await LocalUserStorage.findUserByEmail(email);
      if (!user) {
        return { data: null, error: new Error('Invalid email or password') };
      }

      // Check password
      const storedHash = await AsyncStorage.getItem(`password_${user.id}`);
      const inputHash = hashPassword(password);

      if (storedHash !== inputHash) {
        return { data: null, error: new Error('Invalid email or password') };
      }

      // Set current user
      await LocalSessionManager.setCurrentUser(user);

      console.log('Local sign in successful for user:', user.id);
      return { data: { user, session: { user } }, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      return { data: null, error: new Error(errorMessage) };
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    return await LocalSessionManager.getCurrentUser();
  },

  // Sign out
  async signOut(): Promise<void> {
    await LocalSessionManager.signOut();
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<User | null> {
    return await LocalUserStorage.findUserById(userId);
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    await LocalUserStorage.updateUser(userId, { ...updates, updated_at: new Date().toISOString() });
  },

  // Biometric authentication
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await LocalStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return enabled === 'true';
    } catch {
      return false;
    }
  },

  async enableBiometric(credentials?: { email: string; password: string }) {
    try {
      // Check if biometric authentication is available
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isAvailable || !isEnrolled) {
        return { error: new Error('Biometric authentication not available or not enrolled') };
      }

      // If credentials provided, store them securely
      if (credentials) {
        await SecureStoreAdapter.setItemAsync('biometric_email', credentials.email);
        await SecureStoreAdapter.setItemAsync('biometric_password', credentials.password);
      }

      // Mark biometric as enabled
      await LocalStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
      return { error: null };
    } catch (error) {
      console.error('Enable biometric error:', error);
      return { error };
    }
  },

  async disableBiometric() {
    try {
      await LocalStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      await SecureStoreAdapter.deleteItemAsync('biometric_email');
      await SecureStoreAdapter.deleteItemAsync('biometric_password');
      return { error: null };
    } catch (error) {
      console.error('Disable biometric error:', error);
      return { error };
    }
  },

  async authenticateWithBiometric(): Promise<{ data: { user: User; session: { user: User } } | null; error: any }> {
    try {
      // Get stored credentials
      const email = await SecureStoreAdapter.getItemAsync('biometric_email');
      const password = await SecureStoreAdapter.getItemAsync('biometric_password');

      if (!email || !password) {
        return { data: null, error: new Error('No biometric credentials stored') };
      }

      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to sign in',
        fallbackLabel: 'Use password',
      });

      if (!result.success) {
        return { data: null, error: new Error('Biometric authentication failed') };
      }

      // Sign in with stored credentials
      return await this.signIn(email, password);
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return { data: null, error };
    }
  },

  // Send OTP (placeholder for local implementation)
  async sendOtp(phone: string): Promise<{ error: any }> {
    console.log('OTP sent to:', phone);
    // In a real implementation, this would send an SMS
    return { error: null };
  },

  // Verify OTP (placeholder for local implementation)
  async verifyOtp(phone: string, otp: string): Promise<{ data: any; error: any }> {
    console.log('OTP verified for:', phone, otp);
    // In a real implementation, this would verify the OTP
    const user = await LocalUserStorage.findUserByEmail(phone); // Using phone as email for demo
    if (user) {
      await LocalSessionManager.setCurrentUser(user);
      return { data: { user, session: { user } }, error: null };
    }
    return { data: null, error: new Error('Invalid OTP') };
  },
};

export default authService;
