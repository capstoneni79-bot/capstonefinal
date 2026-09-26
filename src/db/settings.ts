import { db } from './index.ts';
import { systemSettings } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getSystemSetting<T = any>(key: string, defaultValue?: T): Promise<T | null> {
  try {
    const rows = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
    if (rows.length > 0 && rows[0].value !== null) {
      return rows[0].value as T;
    }
    return defaultValue ?? null;
  } catch (err) {
    console.error(`Database query error in getSystemSetting(${key}):`, err);
    return defaultValue ?? null;
  }
}

export async function setSystemSetting<T = any>(key: string, value: T): Promise<T> {
  try {
    await db
      .insert(systemSettings)
      .values({
        key,
        value: value as any,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: value as any,
          updatedAt: new Date(),
        },
      });
    return value;
  } catch (err) {
    console.error(`Database query error in setSystemSetting(${key}):`, err);
    throw new Error(`Failed to persist system setting for ${key}.`);
  }
}
