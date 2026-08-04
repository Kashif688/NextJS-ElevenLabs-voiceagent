import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  context?: string;
  callType: 'manual' | 'auto';
  callDelayMinutes?: number;
  status: string;
  callStatus: string;
  elevenlabsConversationId?: string;
  callSummary?: string;
  recordingUrl?: string;
  callErrorReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String },
    company: { type: String },
    context: { type: String },
    callType: { type: String, enum: ['manual', 'auto'], default: 'manual' },
    callDelayMinutes: { type: Number },
    status: { type: String, default: 'new' },
    callStatus: { type: String, default: 'pending' },
    elevenlabsConversationId: { type: String },
    callSummary: { type: String },
    recordingUrl: { type: String },
    callErrorReason: { type: String },
  },
  { timestamps: true }
);

const LeadModel = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
export default LeadModel as mongoose.Model<ILead>;
