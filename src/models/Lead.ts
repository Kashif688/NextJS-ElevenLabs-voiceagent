import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  context?: string;
  bookTopic?: string;
  writingStage?: string;
  batchId?: string;
  batchName?: string;
  source?: string;
  callType: 'manual' | 'auto';
  callDelayMinutes?: number;
  status: string;
  callStatus: string;
  elevenlabsConversationId?: string;
  callSummary?: string;
  recordingUrl?: string;
  callErrorReason?: string;
  preferredCallbackTime?: string;
  followUpStatus?: string;
  lastCallOutcome?: string;
  lastCallSummary?: string;
  lastConversationId?: string;
  followUpNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, default: '' },
    phoneNumber: { type: String, required: true },
    email: { type: String },
    company: { type: String },
    context: { type: String },
    bookTopic: { type: String },
    writingStage: { type: String },
    batchId: { type: String },
    batchName: { type: String },
    source: { type: String, default: 'manual' },
    callType: { type: String, enum: ['manual', 'auto'], default: 'manual' },
    callDelayMinutes: { type: Number },
    status: { type: String, default: 'new' },
    callStatus: { type: String, default: 'pending' },
    elevenlabsConversationId: { type: String },
    callSummary: { type: String },
    recordingUrl: { type: String },
    callErrorReason: { type: String },
    preferredCallbackTime: { type: String },
    followUpStatus: { type: String, default: 'none' },
    lastCallOutcome: { type: String },
    lastCallSummary: { type: String },
    lastConversationId: { type: String },
    followUpNotes: { type: String },
  },
  { timestamps: true }
);

const LeadModel = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
export default LeadModel as mongoose.Model<ILead>;
