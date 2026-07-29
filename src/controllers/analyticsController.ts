import { Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import SalesRecord from '../models/SalesRecord';
import Business from '../models/Business';
import AnalyticsReport from '../models/AnalyticsReport';
import { AuthRequest } from '../middlewares/auth';

export const getAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const businessId = req.query.businessId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ message: 'Business not found.' });
      return;
    }
    if ((business.owner as any).toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    const records = await SalesRecord.find({
      business: businessId,
      date: { $gte: startDate, $lte: endDate },
    });

    const totalRevenue = records.reduce((sum, r) => sum + r.totalRevenue, 0);
    const totalOrders = records.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const productMap = new Map<string, { revenue: number; quantity: number }>();
    records.forEach(r => {
      const existing = productMap.get(r.productName) || { revenue: 0, quantity: 0 };
      productMap.set(r.productName, { revenue: existing.revenue + r.totalRevenue, quantity: existing.quantity + r.quantity });
    });
    const topProducts = Array.from(productMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const categoryMap = new Map<string, number>();
    records.forEach(r => {
      categoryMap.set(r.category, (categoryMap.get(r.category) || 0) + r.totalRevenue);
    });
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

    const dayMap = new Map<string, number>();
    records.forEach(r => {
      const day = new Date(r.date).toISOString().split('T')[0];
      dayMap.set(day, (dayMap.get(day) || 0) + r.totalRevenue);
    });
    const revenueOverTime = Array.from(dayMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      topProducts,
      categoryBreakdown,
      revenueOverTime,
    });
  } catch (error) {
    next(error);
  }
};

export const generateAIReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ message: 'GEMINI_API_KEY is not configured.' });
      return;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.AI_MODEL || 'gemini-2.0-flash' });

    const { businessId } = req.body;
    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ message: 'Business not found.' });
      return;
    }
    if ((business.owner as any).toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    const records = await SalesRecord.find({ business: businessId }).limit(500);
    const totalRevenue = records.reduce((s, r) => s + r.totalRevenue, 0);
    const totalOrders = records.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const productMap = new Map<string, { revenue: number; quantity: number }>();
    records.forEach(r => {
      const existing = productMap.get(r.productName) || { revenue: 0, quantity: 0 };
      productMap.set(r.productName, { revenue: existing.revenue + r.totalRevenue, quantity: existing.quantity + r.quantity });
    });
    const topProducts = Array.from(productMap.entries()).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10).map(([name, stats]) => ({ name, ...stats }));
    const lowProducts = [...productMap.entries()].sort((a, b) => a[1].revenue - b[1].revenue).slice(0, 5).map(([name, stats]) => ({ name, ...stats }));

    const prompt = `You are a business analytics AI. Analyze the following sales data and provide insights.

Business: ${business.name}
Type: ${business.type}
Industry: ${business.industry}
Total Records: ${totalOrders}
Total Revenue: $${totalRevenue.toFixed(2)}
Average Order Value: $${avgOrderValue.toFixed(2)}

Top Products:
${JSON.stringify(topProducts)}

Low-Performing Products:
${JSON.stringify(lowProducts)}

Generate a structured analysis as JSON with these fields:
{
  "summary": "Executive summary in 2-3 sentences",
  "kpis": { "totalRevenue": ${totalRevenue}, "totalOrders": ${totalOrders}, "avgOrderValue": ${avgOrderValue} },
  "trends": ["trend1", "trend2"],
  "risks": ["risk1", "risk2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "recommendation": ["rec1", "rec2"]
}

Only return valid JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    let aiResult: any = {};
    try {
      aiResult = JSON.parse(content);
    } catch {
      aiResult = { summary: content };
    }

    const report = new AnalyticsReport({
      title: `AI Analysis - ${business.name}`,
      business: businessId,
      generatedBy: req.user?._id,
      type: 'ai-analysis',
      summary: aiResult.summary || 'AI report generated.',
      kpis: aiResult.kpis || { totalRevenue, totalOrders, avgOrderValue },
      trends: aiResult.trends || [],
      risks: aiResult.risks || [],
      opportunities: aiResult.opportunities || [],
      recommendations: aiResult.recommendation || [],
      data: { topProducts, lowProducts, totalRevenue, totalOrders },
    });

    await report.save();
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};
