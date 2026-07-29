import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  category: string;
  description?: string;
  price: number;
  status: 'active' | 'inactive';
  imageUrl?: string;
  business: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'inactive'], required: true, default: 'active' },
    imageUrl: { type: String },
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  },
  { timestamps: true }
);

ProductSchema.index({ business: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ createdAt: -1 });

ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('id', false);

export default mongoose.model<IProduct>('Product', ProductSchema);
