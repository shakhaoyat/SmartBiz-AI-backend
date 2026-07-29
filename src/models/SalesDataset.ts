import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesDataset extends Document {
  name: string;
  business: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  fileType: 'csv' | 'json';
  originalName: string;
  size: number;
  recordCount?: number;
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SalesDatasetSchema = new Schema<ISalesDataset>(
  {
    name: { type: String, required: true, trim: true },
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileType: { type: String, enum: ['csv', 'json'], required: true },
    originalName: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    recordCount: { type: Number },
    status: { type: String, enum: ['processing', 'completed', 'failed'], required: true, default: 'processing' },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

SalesDatasetSchema.index({ business: 1 });
SalesDatasetSchema.index({ createdAt: -1 });

SalesDatasetSchema.set('toJSON', { virtuals: true });
SalesDatasetSchema.set('id', false);

export default mongoose.model<ISalesDataset>('SalesDataset', SalesDatasetSchema);
