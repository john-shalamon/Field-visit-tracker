import { Photo } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import * as FileSystem from 'expo-file-system';

const PHOTOS_STORAGE_KEY = 'local_photos';

// Local photo storage
class LocalPhotoStorage {
  static async getPhotos(): Promise<Photo[]> {
    try {
      const photosJson = await AsyncStorage.getItem(PHOTOS_STORAGE_KEY);
      return photosJson ? JSON.parse(photosJson) : [];
    } catch (error) {
      console.error('Error getting photos:', error);
      return [];
    }
  }

  static async savePhotos(photos: Photo[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(photos));
    } catch (error) {
      console.error('Error saving photos:', error);
      throw error;
    }
  }

  static async addPhoto(photo: Photo): Promise<void> {
    const photos = await this.getPhotos();
    photos.push(photo);
    await this.savePhotos(photos);
  }

  static async updatePhoto(photoId: string, updates: Partial<Photo>): Promise<void> {
    const photos = await this.getPhotos();
    const index = photos.findIndex(p => p.id === photoId);
    if (index !== -1) {
      photos[index] = { ...photos[index], ...updates };
      await this.savePhotos(photos);
    }
  }

  static async removePhoto(photoId: string): Promise<void> {
    const photos = await this.getPhotos();
    const filteredPhotos = photos.filter(p => p.id !== photoId);
    await this.savePhotos(filteredPhotos);
  }

  static async findPhotoById(photoId: string): Promise<Photo | null> {
    const photos = await this.getPhotos();
    return photos.find(p => p.id === photoId) || null;
  }
}

export const photosService = {
  // Upload photo locally (store in file system and save metadata)
  async uploadPhoto(
    visitId: string,
    inspectionId: string | null,
    localUri: string,
    caption?: string
  ) {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Create local storage directory if it doesn't exist
      const photosDir = `${FileSystem.documentDirectory}photos/`;
      await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });

      // Generate unique filename
      const fileName = `${visitId}_${inspectionId || 'general'}_${Date.now()}.jpg`;
      const localFilePath = `${photosDir}${fileName}`;

      // Copy file to local storage
      await FileSystem.copyAsync({
        from: localUri,
        to: localFilePath,
      });

      // Create photo record
      const photo: Photo = {
        id: uuidv4(),
        visit_id: visitId,
        inspection_id: inspectionId,
        file_path: localFilePath,
        file_name: fileName,
        file_size: fileInfo.size || 0,
        mime_type: 'image/jpeg',
        caption: caption || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save metadata
      await LocalPhotoStorage.addPhoto(photo);

      return { data: photo, error: null };
    } catch (error) {
      console.error('Upload photo error:', error);
      return { data: null, error };
    }
  },

  // Get photos for a visit
  async getVisitPhotos(visitId: string) {
    try {
      const photos = await LocalPhotoStorage.getPhotos();
      const visitPhotos = photos.filter(p => p.visit_id === visitId);
      return { data: visitPhotos, error: null };
    } catch (error) {
      console.error('Get visit photos error:', error);
      return { data: null, error };
    }
  },

  // Get photos for an inspection
  async getInspectionPhotos(inspectionId: string) {
    try {
      const photos = await LocalPhotoStorage.getPhotos();
      const inspectionPhotos = photos.filter(p => p.inspection_id === inspectionId);
      return { data: inspectionPhotos, error: null };
    } catch (error) {
      console.error('Get inspection photos error:', error);
      return { data: null, error };
    }
  },

  // Get a single photo
  async getPhoto(photoId: string) {
    try {
      const photo = await LocalPhotoStorage.findPhotoById(photoId);
      return { data: photo, error: photo ? null : { message: 'Photo not found' } };
    } catch (error) {
      console.error('Get photo error:', error);
      return { data: null, error };
    }
  },

  // Get photo local file path (for display)
  async getPhotoFilePath(filePath: string) {
    try {
      // For local storage, the file path is already the local path
      return { data: filePath, error: null };
    } catch (error) {
      console.error('Get photo file path error:', error);
      return { data: null, error };
    }
  },

  // Update photo caption
  async updatePhotoCaption(photoId: string, caption: string) {
    try {
      await LocalPhotoStorage.updatePhoto(photoId, {
        caption,
        updated_at: new Date().toISOString()
      });

      const photo = await LocalPhotoStorage.findPhotoById(photoId);
      return { data: photo, error: null };
    } catch (error) {
      console.error('Update photo caption error:', error);
      return { data: null, error };
    }
  },

  // Delete photo
  async deletePhoto(photoId: string, filePath: string) {
    try {
      // Delete physical file
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }

      // Delete metadata
      await LocalPhotoStorage.removePhoto(photoId);

      return { error: null };
    } catch (error) {
      console.error('Delete photo error:', error);
      return { error };
    }
  },

  // Get all photos (admin)
  async getAllPhotos() {
    try {
      const photos = await LocalPhotoStorage.getPhotos();
      return { data: photos, error: null };
    } catch (error) {
      console.error('Get all photos error:', error);
      return { data: null, error };
    }
  },

  // Clean up orphaned photo files
  async cleanupOrphanedPhotos() {
    try {
      const photosDir = `${FileSystem.documentDirectory}photos/`;
      const dirInfo = await FileSystem.getInfoAsync(photosDir);

      if (!dirInfo.exists) return { error: null };

      const files = await FileSystem.readDirectoryAsync(photosDir);
      const photos = await LocalPhotoStorage.getPhotos();
      const validFileNames = new Set(photos.map(p => p.file_name));

      let cleanedCount = 0;
      for (const file of files) {
        if (!validFileNames.has(file)) {
          await FileSystem.deleteAsync(`${photosDir}${file}`);
          cleanedCount++;
        }
      }

      return { data: { cleanedCount }, error: null };
    } catch (error) {
      console.error('Cleanup orphaned photos error:', error);
      return { data: null, error };
    }
  },
};

export default photosService;
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      return { data: photoData, error: null };
    } catch (error) {
      console.error('Upload photo error:', error);
      return { data: null, error };
    }
  },

  // Get photos for a visit
  async getVisitPhotos(visitId: string) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('visit_id', visitId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get visit photos error:', error);
      return { data: null, error };
    }
  },

  // Get photos for an inspection
  async getInspectionPhotos(inspectionId: string) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get inspection photos error:', error);
      return { data: null, error };
    }
  },

  // Get a single photo
  async getPhoto(photoId: string) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('id', photoId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get photo error:', error);
      return { data: null, error };
    }
  },

  // Get photo download URL
  async getPhotoDownloadUrl(filePath: string) {
    try {
      const { data } = supabase.storage
        .from('visit-photos')
        .getPublicUrl(filePath);

      return { data: data.publicUrl, error: null };
    } catch (error) {
      console.error('Get photo download URL error:', error);
      return { data: null, error };
    }
  },

  // Update photo caption
  async updatePhotoCaption(photoId: string, caption: string) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .update({ caption })
        .eq('id', photoId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Update photo caption error:', error);
      return { data: null, error };
    }
  },

  // Delete photo
  async deletePhoto(photoId: string, filePath: string) {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('visit-photos')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      return { error: null };
    } catch (error) {
      console.error('Delete photo error:', error);
      return { error };
    }
  },

  // Get all photos (admin)
  async getAllPhotos() {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get all photos error:', error);
      return { data: null, error };
    }
  },
};

export default photosService;
