import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';

const STORAGE_BUCKET = 'ml-models';
const MODEL_NAME = 'strand-recommender-v1';

/**
 * Service for managing ML model storage in Supabase Storage
 */
export class ModelStorageService {
  /**
   * Ensure the storage bucket exists (creates if it doesn't)
   */
  private async ensureBucketExists(): Promise<boolean> {
    try {
      // Check if bucket exists by trying to list it
      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list('', {
        limit: 1
      });

      if (error) {
        // Bucket doesn't exist, create it
        logger.info('Storage bucket does not exist, creating...');
        // Note: Bucket creation requires admin privileges
        // This should be done via Supabase dashboard or migration
        logger.warn('Bucket creation requires admin privileges. Please create the bucket manually in Supabase dashboard.');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error checking bucket existence:', error);
      return false;
    }
  }

  /**
   * Upload model to Supabase Storage
   * @param modelJson Model architecture JSON
   * @param weightsData Model weights as ArrayBuffer
   * @returns Success status and public URL
   */
  async uploadModel(modelJson: object, weightsData: ArrayBuffer): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Ensure bucket exists
      const bucketExists = await this.ensureBucketExists();
      if (!bucketExists) {
        return { success: false, error: 'Storage bucket does not exist. Please create it in Supabase dashboard.' };
      }

      // Convert model JSON to string
      const modelJsonString = JSON.stringify(modelJson);
      const modelJsonBlob = new Blob([modelJsonString], { type: 'application/json' });

      // Upload model.json
      const { data: jsonData, error: jsonError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(`${MODEL_NAME}/model.json`, modelJsonBlob, {
          contentType: 'application/json',
          upsert: true
        });

      if (jsonError) {
        logger.error('Error uploading model.json:', jsonError);
        return { success: false, error: `Failed to upload model.json: ${jsonError.message}` };
      }

      // Upload weights.bin
      const weightsBlob = new Blob([weightsData], { type: 'application/octet-stream' });
      const { data: weightsDataResult, error: weightsError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(`${MODEL_NAME}/weights.bin`, weightsBlob, {
          contentType: 'application/octet-stream',
          upsert: true
        });

      if (weightsError) {
        logger.error('Error uploading weights.bin:', weightsError);
        // Try to clean up model.json if weights upload fails
        await supabase.storage.from(STORAGE_BUCKET).remove([`${MODEL_NAME}/model.json`]);
        return { success: false, error: `Failed to upload weights.bin: ${weightsError.message}` };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(`${MODEL_NAME}/model.json`);

      logger.info('Model uploaded successfully to Supabase Storage');
      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      logger.error('Error uploading model to Supabase Storage:', error);
      return { success: false, error: `Upload failed: ${(error as Error).message}` };
    }
  }

  /**
   * Download model from Supabase Storage
   * @returns Model JSON and weights data, or null if not found
   */
  async downloadModel(): Promise<{ modelJson: object; weightsData: ArrayBuffer } | null> {
    try {
      // Ensure bucket exists
      const bucketExists = await this.ensureBucketExists();
      if (!bucketExists) {
        logger.warn('Storage bucket does not exist');
        return null;
      }

      // Download model.json
      const { data: jsonData, error: jsonError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(`${MODEL_NAME}/model.json`);

      if (jsonError || !jsonData) {
        logger.warn('Model not found in Supabase Storage:', jsonError?.message);
        return null;
      }

      // Download weights.bin
      const { data: weightsData, error: weightsError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(`${MODEL_NAME}/weights.bin`);

      if (weightsError || !weightsData) {
        logger.warn('Model weights not found in Supabase Storage:', weightsError?.message);
        return null;
      }

      // Convert model.json blob to object
      const modelJsonString = await jsonData.text();
      const modelJson = JSON.parse(modelJsonString);

      // Convert weights blob to ArrayBuffer
      const weightsArrayBuffer = await weightsData.arrayBuffer();

      logger.info('Model downloaded successfully from Supabase Storage');
      return { modelJson, weightsData: weightsArrayBuffer };
    } catch (error) {
      logger.error('Error downloading model from Supabase Storage:', error);
      return null;
    }
  }

  /**
   * Check if model exists in Supabase Storage
   * @returns True if model exists
   */
  async modelExists(): Promise<boolean> {
    try {
      logger.info(`Checking if model exists in bucket: ${STORAGE_BUCKET}, path: ${MODEL_NAME}`);
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(MODEL_NAME, {
          limit: 10
        });

      if (error) {
        logger.error('Error listing model files:', error);
        logger.error('Error details:', error.message);
        return false;
      }

      // Check if both model.json and weights.bin exist
      const files = data || [];
      logger.info(`Found ${files.length} files in model directory:`, files.map(f => f.name));
      
      const hasModelJson = files.some(f => f.name === 'model.json');
      const hasWeights = files.some(f => f.name === 'weights.bin');
      
      logger.info(`Model files check - model.json: ${hasModelJson}, weights.bin: ${hasWeights}`);

      return hasModelJson && hasWeights;
    } catch (error) {
      logger.error('Error checking model existence:', error);
      return false;
    }
  }

  /**
   * Get public URL for model.json (for TensorFlow.js loadLayersModel)
   * @returns Public URL or null
   */
  async getModelUrl(): Promise<string | null> {
    try {
      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(`${MODEL_NAME}/model.json`);

      return data.publicUrl;
    } catch (error) {
      logger.error('Error getting model URL:', error);
      return null;
    }
  }

  /**
   * Delete model from Supabase Storage
   * @returns Success status
   */
  async deleteModel(): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([`${MODEL_NAME}/model.json`, `${MODEL_NAME}/weights.bin`]);

      if (error) {
        logger.error('Error deleting model:', error);
        return false;
      }

      logger.info('Model deleted successfully from Supabase Storage');
      return true;
    } catch (error) {
      logger.error('Error deleting model:', error);
      return false;
    }
  }
}

export const modelStorageService = new ModelStorageService();

