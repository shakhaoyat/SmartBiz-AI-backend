import { Response, NextFunction } from 'express';
import AnalyticsReport from '../models/AnalyticsReport';
import Business from '../models/Business';
import { AuthRequest } from '../middlewares/auth';

export const generateReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { businessId, type, title } = req.body;
    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ message: 'Business not found.' });
      return;
    }
    if ((business.owner as any).toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    const report = new AnalyticsReport({
      title: title || `${type} Report`,
      business: businessId,
      generatedBy: req.user?._id,
      type: type || 'sales',
      summary: 'Report generated synchronously. For AI-generated reports, use the AI feature.',
      kpis: {},
      trends: [],
      risks: [],
      opportunities: [],
      recommendations: [],
      data: {},
    });
    await report.save();
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const businessId = req.query.businessId as string;
    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ message: 'Business not found.' });
      return;
    }
    if ((business.owner as any).toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    const reports = await AnalyticsReport.find({ business: businessId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

export const getReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const report = await AnalyticsReport.findById(req.params.id).populate('generatedBy', 'name email');
    if (!report) {
      res.status(404).json({ message: 'Report not found.' });
      return;
    }
    if (report.business.toString() !== req.query.businessId && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const deleteReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const report = await AnalyticsReport.findById(req.params.id);
    if (!report) {
      res.status(404).json({ message: 'Report not found.' });
      return;
    }
    const business = await Business.findById(report.business);
    if (business?.owner.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    await report.deleteOne();
    res.json({ message: 'Report deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
