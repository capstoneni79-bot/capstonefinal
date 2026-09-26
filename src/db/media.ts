import { db } from './index.ts';
import { mediaFiles } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export interface MediaItemRecord {
  id: string;
  fileName: string;
  filePath?: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
  category: string;
  altText?: string;
  uploadedBy?: string;
  createdAt: string;
}

export async function getAllMedia(category?: string): Promise<MediaItemRecord[]> {
  try {
    let query = db.select().from(mediaFiles).orderBy(desc(mediaFiles.createdAt));
    const rows = await query;
    let list = rows.map(r => ({
      id: r.id,
      fileName: r.fileName,
      filePath: r.filePath || undefined,
      fileUrl: r.fileUrl,
      mimeType: r.mimeType || undefined,
      fileSize: r.fileSize || undefined,
      category: r.category,
      altText: r.altText || undefined,
      uploadedBy: r.uploadedBy || undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));

    if (category && category !== 'ALL') {
      list = list.filter(m => m.category.toUpperCase() === category.toUpperCase());
    }

    return list;
  } catch (err) {
    console.error('Database query error in getAllMedia:', err);
    return [];
  }
}

export async function insertMedia(media: Partial<MediaItemRecord>): Promise<MediaItemRecord> {
  try {
    const id = media.id || `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const values = {
      id,
      fileName: media.fileName || 'uploaded-asset',
      filePath: media.filePath || null,
      fileUrl: media.fileUrl || '',
      mimeType: media.mimeType || null,
      fileSize: media.fileSize || null,
      category: (media.category || 'OTHER').toUpperCase(),
      altText: media.altText || null,
      uploadedBy: media.uploadedBy || null,
    };

    const result = await db.insert(mediaFiles).values(values).returning();
    const r = result[0];
    return {
      id: r.id,
      fileName: r.fileName,
      filePath: r.filePath || undefined,
      fileUrl: r.fileUrl,
      mimeType: r.mimeType || undefined,
      fileSize: r.fileSize || undefined,
      category: r.category,
      altText: r.altText || undefined,
      uploadedBy: r.uploadedBy || undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    };
  } catch (err) {
    console.error('Database query error in insertMedia:', err);
    throw new Error('Failed to save media record to database.');
  }
}

export async function deleteMediaById(id: string): Promise<boolean> {
  try {
    await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    return true;
  } catch (err) {
    console.error('Database error in deleteMediaById:', err);
    return false;
  }
}
