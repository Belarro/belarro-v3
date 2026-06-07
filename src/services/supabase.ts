import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'belarro-v3-photos';

export async function uploadCropPhoto(
  cropId: string,
  fileBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  try {
    const filename = `crops/${cropId}-${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    console.error('Photo upload error:', error);
    throw error;
  }
}

export async function deleteCropPhoto(photoUrl: string): Promise<void> {
  try {
    // Extract filename from public URL
    const filename = photoUrl.split(`${STORAGE_BUCKET}/`)[1];
    if (!filename) return;

    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([filename]);

    if (error) {
      console.error('Photo deletion error:', error);
      // Don't throw - just log. Photo may already be deleted.
    }
  } catch (error) {
    console.error('Photo deletion error:', error);
  }
}
