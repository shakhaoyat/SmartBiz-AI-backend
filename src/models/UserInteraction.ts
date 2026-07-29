import mongoose, { Schema, Document } from 'mongoose';

export interface IUserInteraction extends Document {
  user: mongoose.Types.ObjectId;
  business?: mongoose.Types.ObjectId;
  action: 'view' | 'accept' | 'dismiss' | 'complete' | 'upload' | 'generate';
  details: Record<string, any>;
  createdAt: Date;
}

const UserInteractionSchema = new Schema<IUserInteraction>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    business: { type: Schema.Types.ObjectId, ref: 'Business' },
    action: { type: String, enum: ['view', 'accept', 'dismiss', 'complete', 'upload', 'generate'], required: true },
    details: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

UserInteractionSchema.index({ user: 1 });
UserInteractionSchema.index({ action: 1 });
UserInteractionSchema.index({ createdAt: -1 });

UserInteractionSchema.set('toJSON', { virtuals: true });
UserInteractionSchema.set('id', false);

export default mongoose.model<IUserInteraction>('UserInteraction', UserInteractionSchema);
