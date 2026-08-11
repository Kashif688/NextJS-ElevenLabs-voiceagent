import mongoose, { Schema, Document } from 'mongoose';

export interface ICallLog extends Document {
  leadId: mongoose.Types.ObjectId;
  callStatus: string;
  elevenlabsConversationId?: string;
  callSummary?: string;
  recordingUrl?: string;
  callErrorReason?: string;
  callOutcome?: string;
  rawWebhookPayload?: any;
  createdAt: Date;
  updatedAt: Date;
}

const CallLogSchema: Schema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    callStatus: { type: String, required: true },
    elevenlabsConversationId: { type: String },
    callSummary: { type: String },
    recordingUrl: { type: String },
    callErrorReason: { type: String },
    callOutcome: { type: String },
    rawWebhookPayload: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const CallLogModel = mongoose.models.CallLog || mongoose.model<ICallLog>('CallLog', CallLogSchema);
export default CallLogModel as mongoose.Model<ICallLog>;
