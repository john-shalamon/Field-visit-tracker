import supabase from './supabase';
import { Photo } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import * as FileSystem from 'expo-file-system';

export const photosService = {
  // Upload photo to Supabase Storage
  async uploadPhoto(
    visitId: string,
    inspectionId: string | null,
    localUri: string,
    caption?: string
  ) {
    try {
      // Read file from local filesystem
      const fileBase64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Generate unique filename
      const fileName = `${visitId}/${inspectionId || 'general'}_${Date.now()}.jpg`;
      const filePath = `photos/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('visit-photos')
        .upload(filePath, Buffer.from(fileBase64, 'base64'), {
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      const fileSize = fileInfo.size || 0;

      // Create photo record in database
      const { data: photoData, error: dbError } = await supabase
        .from('photos')
        .insert([
          {
            id: uuidv4(),
            visit_id: visitId,
            inspection_id: inspectionId,
            file_path: filePath,
            file_name: fileName,
            file_size: fileSize,
            mime_type: 'image/jpeg',
            caption: caption || '',
          },
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
