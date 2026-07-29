import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsReport extends Document {
  title: string;
  business: mongoose.Types.ObjectId;
  generatedBy: mongoose.Types.ObjectId;
  type: 'sales' | 'performance' | 'risk';
  summary: string;
  kpis: Record<string, any>;
  trends: Record<string, any>[];
  risks: Record<string, any>[];
  opportunities: Record<string, any>[];
  recommendations: string[];
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsReportSchema = new Schema<IAnalyticsReport>(
  {
    title: { type: String, required: true, trim: true },
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['sales', 'performance', 'risk'], required: true },
    summary: { type: String, required: true },
    kpis: { type: Schema.Types.Mixed, required: true },
    trends: [{ type: Schema.Types.Mixed }],
    risks: [{ type: Schema.Types.Mixed }],
    opportunities: [{ type: Schema.Types.Mixed }],
    recommendations: [{ type: String }],
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

AnalyticsReportSchema.index({ business: 1 });
AnalyticsReportSchema.index({ createdAt: -1 });

AnalyticsReportSchema.set('toJSON', { virtuals: true });
AnalyticsReportSchema.set('id', false);

export default mongoose.model<IAnalyticsReport>('AnalyticsReport', AnalyticsReportSchema);
