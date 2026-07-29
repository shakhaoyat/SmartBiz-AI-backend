import mongoose, { Schema, Document } from 'mongoose';

export interface IBusiness extends Document {
  name: string;
  type: string;
  industry: string;
  description?: string;
  location?: string;
  goals?: string;
  targetCustomers?: string;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    industry: { type: String, required: true, trim: true },
    description: { type: String },
    location: { type: String },
    goals: { type: String },
    targetCustomers: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

BusinessSchema.index({ owner: 1 });
BusinessSchema.index({ createdAt: -1 });

BusinessSchema.set('toJSON', { virtuals: true });
BusinessSchema.set('id', false);

export default mongoose.model<IBusiness>('Business', BusinessSchema);
