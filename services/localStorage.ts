import AsyncStorage from '@react-native-async-storage/async-storage';

// Generic local storage service
export class LocalStorage {
  // Store a string value
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error storing item:', error);
      throw error;
    }
  }

  // Get a string value
  static async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error retrieving item:', error);
      throw error;
    }
  }

  // Remove an item
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item:', error);
      throw error;
    }
  }

  // Store an object (JSON serialized)
  static async setObject<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error storing object:', error);
      throw error;
    }
  }

  // Get an object (JSON parsed)
  static async getObject<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving object:', error);
      throw error;
    }
  }

  // Store an array
  static async setArray<T>(key: string, value: T[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      console.log(`💾 Storing array at key "${key}": ${value.length} items, ~${jsonValue.length} bytes`);
      await AsyncStorage.setItem(key, jsonValue);
      console.log(`✓ Array stored successfully`);
    } catch (error) {
      console.error(`❌ Error storing array at "${key}":`, error);
      throw error;
    }
  }

  // Get an array
  static async getArray<T>(key: string): Promise<T[] | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue === null) {
        console.log(`⚠️ No data found at key "${key}"`);
        return null;
      }
      const parsed = JSON.parse(jsonValue) as T[];
      console.log(`✓ Retrieved array from "${key}": ${parsed.length} items`);
      return parsed;
    } catch (error) {
      console.error(`❌ Error retrieving array from "${key}":`, error);
      return null;
    }
  }

  // Clear all stored data
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Get all keys
  static async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      throw error;
    }
  }

  // Multi-get items
  static async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.error('Error multi-getting items:', error);
      throw error;
    }
  }

  // Multi-set items
  static async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Error multi-setting items:', error);
      throw error;
    }
  }

  // Multi-remove items
  static async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error multi-removing items:', error);
      throw error;
    }
  }
}

// Specific storage keys
export const STORAGE_KEYS = {
  VISITS: 'visits',
  USER_PREFERENCES: 'user_preferences',
  OFFLINE_QUEUE: 'offline_queue',
  LAST_SYNC: 'last_sync',
} as const;

// Visit-specific storage functions
export class VisitStorage {
  // Store visits locally
  static async saveVisits(visits: any[]): Promise<void> {
    await LocalStorage.setArray(STORAGE_KEYS.VISITS, visits);
  }

  // Get stored visits
  static async getVisits(): Promise<any[] | null> {
    return await LocalStorage.getArray(STORAGE_KEYS.VISITS);
  }

  // Add a single visit
  static async addVisit(visit: any): Promise<void> {
    try {
      const visits = await this.getVisits() || [];
      visits.unshift(visit); // Add to beginning
      await this.saveVisits(visits);
      console.log(`✓ Visit stored (ID: ${visit.id}, user: ${visit.user_id}, status: ${visit.status}). Total: ${visits.length}`);
    } catch (error) {
      console.error('Error adding visit:', error);
      throw error;
    }
  }

  // Update a visit
  static async updateVisit(visitId: string, updates: any): Promise<void> {
    try {
      const visits = await this.getVisits() || [];
      const index = visits.findIndex(v => v.id === visitId);
      if (index !== -1) {
        visits[index] = { ...visits[index], ...updates };
        await this.saveVisits(visits);
        console.log(`✓ Visit updated (ID: ${visitId}, new status: ${updates.status || visits[index].status})`);
      } else {
        console.warn(`⚠️ Visit not found for update (ID: ${visitId})`);
      }
    } catch (error) {
      console.error('Error updating visit:', error);
      throw error;
    }
  }

  // Remove a visit
  static async removeVisit(visitId: string): Promise<void> {
    const visits = await this.getVisits() || [];
    const filtered = visits.filter(v => v.id !== visitId);
    await this.saveVisits(filtered);
  }

  // Clear all visits
  static async clearVisits(): Promise<void> {
    await LocalStorage.removeItem(STORAGE_KEYS.VISITS);
  }

  // Get user preferences
  static async getUserPreferences(): Promise<any | null> {
    return await LocalStorage.getObject(STORAGE_KEYS.USER_PREFERENCES);
  }

  // Set user preferences
  static async setUserPreferences(prefs: any): Promise<void> {
    await LocalStorage.setObject(STORAGE_KEYS.USER_PREFERENCES, prefs);
  }
}

// Offline queue for sync
export class OfflineQueue {
  // Add operation to queue
  static async addToQueue(operation: {
    type: 'create' | 'update' | 'delete';
    data: any;
    timestamp: number;
  }): Promise<void> {
    const queue = await LocalStorage.getArray(STORAGE_KEYS.OFFLINE_QUEUE) || [];
    queue.push(operation);
    await LocalStorage.setArray(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  }

  // Get offline queue
  static async getQueue(): Promise<any[] | null> {
    return await LocalStorage.getArray(STORAGE_KEYS.OFFLINE_QUEUE);
  }

  // Clear queue after sync
  static async clearQueue(): Promise<void> {
    await LocalStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  }

  // Get queue length
  static async getQueueLength(): Promise<number> {
    const queue = await this.getQueue();
    return queue?.length || 0;
  }
}

// Sync status
export class SyncStatus {
  // Set last sync timestamp
  static async setLastSync(timestamp: number): Promise<void> {
    await LocalStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
  }

  // Get last sync timestamp
  static async getLastSync(): Promise<number | null> {
    const timestamp = await LocalStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? parseInt(timestamp) : null;
  }
}