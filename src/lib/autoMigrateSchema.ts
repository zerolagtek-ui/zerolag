import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';

let isSchemaMigrated = false;

export async function autoMigrateSchema(): Promise<{ success: boolean; message?: string }> {
  if (isSchemaMigrated) {
    return { success: true, message: 'Schema initialization already completed in current server lifecycle.' };
  }

  if (!isMongoConfigured()) {
    return { success: false, message: 'MongoDB credentials unconfigured.' };
  }

  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return { success: false, message: 'Could not connect to MongoDB.' };
    }

    const adminEmail = 'zerolagtek@gmail.com';
    await UserModel.findOneAndUpdate(
      { email: adminEmail },
      {
        $setOnInsert: {
          email: adminEmail,
          password_hash: 'admin123',
          name: 'ZeroLag Admin',
          role: 'admin',
          is_admin: true,
          is_verified: true,
          created_at: new Date()
        }
      },
      { returnDocument: 'after', upsert: true }
    );

    console.log('[MongoDB Auto Migration]: Admin user seeded/verified successfully.');
    isSchemaMigrated = true;
    return { success: true, message: 'MongoDB initialization completed successfully.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown auto-migration error';
    console.error('[MongoDB Auto Migration Error]:', msg);
    return { success: false, message: msg };
  }
}
