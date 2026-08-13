import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConfigured } from '@/lib/mongodb';
import { autoMigrateSchema } from '@/lib/autoMigrateSchema';
import ProductModel from '@/lib/models/Product';
import OrderModel from '@/lib/models/Order';
import UserModel from '@/lib/models/User';

export async function GET() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'Unconfigured';

  try {
    if (!isMongoConfigured()) {
      return NextResponse.json(
        {
          connected: false,
          mongoUri: mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
          error: 'MongoDB credentials are missing or unconfigured in environment variables.',
        },
        { status: 500 }
      );
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        {
          connected: false,
          mongoUri: mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
          error: 'Could not connect to MongoDB Atlas.',
        },
        { status: 500 }
      );
    }

    // Trigger auto-migration & seeding
    const migrationResult = await autoMigrateSchema();

    // Query exact collection counts concurrently
    const [productsCount, ordersCount, usersCount] = await Promise.all([
      ProductModel.countDocuments(),
      OrderModel.countDocuments(),
      UserModel.countDocuments(),
    ]);

    return NextResponse.json({
      connected: true,
      mongoUri: mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
      autoMigration: migrationResult,
      collections: {
        products: productsCount,
        orders: ordersCount,
        users: usersCount,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'MongoDB connectivity error';
    return NextResponse.json(
      {
        connected: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
