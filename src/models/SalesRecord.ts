import mongoose, { Schema, Document, IndexOptions } from 'mongoose';

export interface ISalesRecord extends Document {
  dataset: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalRevenue: number;
  date: Date;
  customer?: string;
  location?: string;
}

const SalesRecordSchema = new Schema<ISalesRecord>(
  {
    dataset: { type: Schema.Types.ObjectId, ref: 'SalesDataset', required: true },
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    productName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalRevenue: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    customer: { type: String },
    location: { type: String },
  },
  { timestamps: true }
);

SalesRecordSchema.index({ dataset: 1 });
SalesRecordSchema.index({ business: 1 });
SalesRecordSchema.index({ date: -1 });

SalesRecordSchema.set('toJSON', { virtuals: true });
SalesRecordSchema.set('id', false);

export default mongoose.model<ISalesRecord>('SalesRecord', SalesRecordSchema);
