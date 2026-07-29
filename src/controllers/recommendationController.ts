import { Response, NextFunction } from 'express';
import Recommendation from '../models/Recommendation';
import Business from '../models/Business';
import SalesRecord from '../models/SalesRecord';
import Product from '../models/Product';
import { AuthRequest } from '../middlewares/auth';

export const getRecommendations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const businessId = req.query.businessId as string;
    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ message: 'Business not found.' });
      return;
    }
    if (business.owner.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    const recommendations = await Recommendation.find({ business: businessId }).sort({ createdAt: -1 });
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
};

export const updateRecommendationStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, feedback } = req.body;
    const recommendation = await Recommendation.findById(req.params.id).populate('business', 'owner');
    if (!recommendation) {
      res.status(404).json({ message: 'Recommendation not found.' });
      return;
    }
    if ((recommendation.business as any).owner.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    recommendation.status = status || recommendation.status;
    if (feedback) recommendation.feedback = feedback;
    await recommendation.save();
    res.json(recommendation);
  } catch (error) {
    next(error);
  }
};

export const generateRecommendations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { businessId } = req.body;
    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ message: 'Business not found.' });
      return;
    }
    if (business.owner.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    const records = await SalesRecord.find({ business: businessId }).limit(200);
    const products = await Product.find({ business: businessId });

    const recs = [
      {
        title: 'Focus on top-performing products',
        priority: 'high',
        category: 'Revenue',
        reason: 'Your top products generate the majority of your revenue.',
        impact: 'Increase revenue by 15-20%',
        action: 'Allocate more marketing budget to top products.',
        confidence: 0.9,
      },
      {
        title: 'Review low-performing products',
        priority: 'medium',
        category: 'Efficiency',
        reason: 'Some products have significantly lower sales.',
        impact: 'Reduce costs by 10%',
        action: 'Consider bundling or discontinuing low-performing products.',
        confidence: 0.7,
      },
    ];

    const createdRecs = [];
    for (const rec of recs) {
      const existing = await Recommendation.findOne({ business: businessId, title: rec.title });
      if (!existing) {
        const newRec = new Recommendation({ business: businessId, user: req.user?._id, ...rec });
        await newRec.save();
        createdRecs.push(newRec);
      }
    }

    res.status(201).json(createdRecs);
  } catch (error) {
    next(error);
  }
};
