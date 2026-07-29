import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendation extends Document {
  business: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  reason: string;
  impact: string;
  action: string;
  confidence: number;
  data: Record<string, any>;
  status: 'pending' | 'accepted' | 'dismissed' | 'completed';
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema = new Schema<IRecommendation>(
  {
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], required: true, default: 'medium' },
    category: { type: String, required: true, trim: true },
    reason: { type: String, required: true },
    impact: { type: String, required: true },
    action: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    data: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'dismissed', 'completed'], required: true, default: 'pending' },
    feedback: { type: String },
  },
  { timestamps: true }
);

RecommendationSchema.index({ business: 1 });
RecommendationSchema.index({ status: 1 });
RecommendationSchema.index({ createdAt: -1 });

RecommendationSchema.set('toJSON', { virtuals: true });
RecommendationSchema.set('id', false);

export default mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);
