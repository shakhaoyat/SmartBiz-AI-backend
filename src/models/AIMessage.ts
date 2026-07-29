import mongoose, { Schema, Document } from 'mongoose';

export interface IAIMessage extends Document {
  conversation: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Record<string, any>[];
  toolResults?: Record<string, any>[];
  metadata: Record<string, any>;
}

const AIMessageSchema = new Schema<IAIMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'AIConversation', required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    toolCalls: [{ type: Schema.Types.Mixed }],
    toolResults: [{ type: Schema.Types.Mixed }],
    metadata: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

AIMessageSchema.index({ conversation: 1 });
AIMessageSchema.index({ createdAt: -1 });

AIMessageSchema.set('toJSON', { virtuals: true });
AIMessageSchema.set('id', false);

export default mongoose.model<IAIMessage>('AIMessage', AIMessageSchema);
