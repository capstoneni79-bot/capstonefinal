import { db } from './index.ts';
import { users } from './schema.ts';
import { eq, or } from 'drizzle-orm';
import { UserAccount } from '../types.ts';
import { INITIAL_ACCOUNTS } from '../data/initialData.ts';

export function mapDbToUser(row: any): UserAccount {
  return {
    id: String(row.uid || row.id),
    username: row.email ? row.email.split('@')[0] : `user-${row.id}`,
    name: row.name || 'User',
    email: row.email,
    role: (row.role || 'focal') as any,
    assignedBarangay: row.assignedBarangay || undefined,
    barangay_id: row.assignedBarangay ? `brgy-${row.assignedBarangay.toLowerCase().replace(/\s+/g, '-')}` : undefined,
    phone: row.phone || '',
    password: row.password || '',
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
  };
}

export async function getAllUsers(): Promise<UserAccount[]> {
  try {
    let rows = await db.select().from(users);
    if (rows.length === 0) {
      // Seed the default system accounts into the real database once
      for (const acc of INITIAL_ACCOUNTS) {
        try {
          await db.insert(users).values({
            uid: acc.id,
            email: acc.email,
            name: acc.name,
            role: acc.role,
            assignedBarangay: acc.assignedBarangay || null,
            phone: acc.phone || null,
            password: acc.password || 'password123',
          }).onConflictDoNothing();
        } catch {
          // ignore seeding conflict
        }
      }
      rows = await db.select().from(users);
    }
    return rows.map(mapDbToUser);
  } catch (err) {
    console.error('Database query failed for getAllUsers:', err);
    return [];
  }
}

export async function getUserByUsernameOrEmail(identifier: string): Promise<UserAccount | null> {
  try {
    const rows = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.uid, identifier)))
      .limit(1);

    if (rows.length > 0) {
      return mapDbToUser(rows[0]);
    }
    // Also check if identifier matches prefix of email
    const all = await getAllUsers();
    return all.find(u => u.username === identifier || u.email.toLowerCase() === identifier.toLowerCase()) || null;
  } catch (err) {
    console.error('Database query error for getUserByUsernameOrEmail:', err);
    return null;
  }
}

export async function upsertUser(user: Partial<UserAccount>): Promise<UserAccount> {
  try {
    const uid = user.id || `usr-${Date.now()}`;
    const email = user.email || `${user.username || 'user'}@hinunangan.da.gov.ph`;
    
    const values = {
      uid,
      email,
      name: user.name || user.fullName || user.username || 'User',
      role: user.role || 'focal',
      assignedBarangay: user.assignedBarangay || null,
      phone: user.phone || null,
      password: user.password || 'password123',
    };

    const result = await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.uid,
        set: values,
      })
      .returning();

    return mapDbToUser(result[0]);
  } catch (err) {
    console.error('Database query failed for upsertUser:', err);
    throw new Error('Failed to save user account to database.');
  }
}

export async function deleteUserByUid(uid: string): Promise<boolean> {
  try {
    await db.delete(users).where(eq(users.uid, uid));
    return true;
  } catch (err) {
    console.error('Database error in deleteUserByUid:', err);
    throw new Error('Failed to delete user account from database.');
  }
}
