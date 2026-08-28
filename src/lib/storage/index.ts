import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "product-files";

export interface StorageProvider {
  generateUploadUrl(
    path: string,
    options?: { content_type?: string; expires_in?: number }
  ): Promise<{ upload_url: string; path: string }>;

  generateDownloadUrl(
    path: string,
    options?: { expires_in?: number }
  ): Promise<{ download_url: string }>;

  deleteFile(path: string): Promise<void>;
}

export const supabaseStorage: StorageProvider = {
  async generateUploadUrl(path, options) {
    const supabase = createAdminClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(path, {
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to create upload URL: ${error.message}`);
    }

    return {
      upload_url: data.signedUrl,
      path: data.path,
    };
  },

  async generateDownloadUrl(path, options) {
    const supabase = createAdminClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, options?.expires_in ?? 600); // Default 10 minutes

    if (error) {
      throw new Error(`Failed to create download URL: ${error.message}`);
    }

    return { download_url: data.signedUrl };
  },

  async deleteFile(path) {
    const supabase = createAdminClient();

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  },
};
