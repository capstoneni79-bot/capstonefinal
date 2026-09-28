import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export interface LandingUploadResult {
  filePath: string;
  fileUrl: string;
  fileSize: number;
}

export async function uploadLandingCmsAsset(
  fileName: string,
  mimeType: string,
  base64Payload: string,
  category: string
): Promise<LandingUploadResult> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Server-side Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const match = base64Payload.match(/^data:[^;]+;base64,(.*)$/s);
  const encoded = match ? match[1] : base64Payload;
  const file = Buffer.from(encoded, 'base64');
  if (file.length === 0 || file.length > 15 * 1024 * 1024) {
    throw new Error('The uploaded image is empty or exceeds the 15 MB limit.');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const bucket = process.env.SUPABASE_LANDING_MEDIA_BUCKET || 'landing-page-media';
  const buckets = await supabase.storage.listBuckets();
  if (buckets.error) throw new Error(`Unable to inspect Supabase Storage buckets: ${buckets.error.message}`);

  if (!buckets.data.some(item => item.name === bucket)) {
    const created = await supabase.storage.createBucket(bucket, { public: true });
    if (created.error) throw new Error(`Unable to create the ${bucket} Storage bucket: ${created.error.message}`);
  }

  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'asset';
  const safeCategory = category.toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'other';
  const filePath = `${safeCategory}/${randomUUID()}-${safeFileName}`;
  const uploaded = await supabase.storage.from(bucket).upload(filePath, file, {
    contentType: mimeType || 'application/octet-stream',
    cacheControl: '3600',
    upsert: false,
  });
  if (uploaded.error) throw new Error(`Supabase Storage upload failed: ${uploaded.error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return { filePath, fileUrl: data.publicUrl, fileSize: file.length };
}

export async function deleteLandingCmsAsset(filePath: string): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return;
  const bucket = process.env.SUPABASE_LANDING_MEDIA_BUCKET || 'landing-page-media';
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await supabase.storage.from(bucket).remove([filePath]);
  if (result.error) console.error('Failed to clean up Supabase Storage object:', result.error.message);
}