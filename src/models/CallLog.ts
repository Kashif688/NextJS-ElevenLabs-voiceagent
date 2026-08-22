import mongoose, { Schema, Document } from 'mongoose';

export interface ICallLog extends Document {
  leadId: mongoose.Types.ObjectId;
  batchId?: string;
  callStatus: string;
  callDurationSecs?: number;
  elevenlabsConversationId?: string;
  callSummary?: string;
  recordingUrl?: string;
  callErrorReason?: string;
  callOutcome?: string;
  lastCompletedStage?: string;
  followUpRequired?: boolean;
  preferredCallbackTime?: string;
  bookTopic?: string;
  writingStage?: string;
  servicesDiscussed?: string;
  followUpContext?: string;
  confirmedEmail?: string;
  confirmedPhone?: string;
  callAnalysis?: any;
  rawWebhookPayload?: any;
  createdAt: Date;
  updatedAt: Date;
}

const CallLogSchema: Schema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    batchId: { type: String },
    callStatus: { type: String, required: true },
    callDurationSecs: { type: Number, default: 0 },
    elevenlabsConversationId: { type: String },
    callSummary: { type: String },
    recordingUrl: { type: String },
    callErrorReason: { type: String },
    callOutcome: { type: String },
    lastCompletedStage: { type: String },
    followUpRequired: { type: Boolean, default: false },
    preferredCallbackTime: { type: String },
    bookTopic: { type: String },
    writingStage: { type: String },
    servicesDiscussed: { type: String },
    followUpContext: { type: String },
    confirmedEmail: { type: String },
    confirmedPhone: { type: String },
    callAnalysis: { type: Schema.Types.Mixed },
    rawWebhookPayload: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const CallLogModel = mongoose.models.CallLog || mongoose.model<ICallLog>('CallLog', CallLogSchema);
export default CallLogModel as mongoose.Model<ICallLog>;
