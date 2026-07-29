import mongoose, { Schema, Document } from 'mongoose';

export interface IAIConversation extends Document {
  business: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  title: string;
  context: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AIConversationSchema = new Schema<IAIConversation>(
  {
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    context: { type: Schema.Types.Mixed, required: true },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

AIConversationSchema.index({ user: 1 });
AIConversationSchema.index({ createdAt: -1 });

AIConversationSchema.set('toJSON', { virtuals: true });
AIConversationSchema.set('id', false);

export default mongoose.model<IAIConversation>('AIConversation', AIConversationSchema);
