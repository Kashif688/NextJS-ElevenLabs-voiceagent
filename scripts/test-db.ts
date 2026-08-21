import connectDB from '../src/lib/mongodb';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });
}

async function run() {
  try {
    console.log("Connecting to MongoDB via connectDB()...");
    await connectDB();
    console.log("✅ Successfully connected to MongoDB!");

    const admin = mongoose.connection.db?.admin();
    if (admin) {
      const dbList = await admin.listDatabases();
      console.log("Available databases:");
      dbList.databases.forEach((db: { name: string }) => console.log(` - ${db.name}`));
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB. Error:", error);
    process.exit(1);
  }
}

run();
