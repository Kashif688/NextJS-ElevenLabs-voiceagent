import connectDB from '../src/lib/mongodb';
import LeadModel from '../src/models/Lead';
import CallLogModel from '../src/models/CallLog';
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

async function cleanDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Database connected.');

    const deletedLeads = await LeadModel.deleteMany({});
    console.log(`Deleted ${deletedLeads.deletedCount} leads.`);

    const deletedCallLogs = await CallLogModel.deleteMany({});
    console.log(`Deleted ${deletedCallLogs.deletedCount} call logs.`);

    console.log('Database cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning database:', error);
    process.exit(1);
  }
}

cleanDatabase();
