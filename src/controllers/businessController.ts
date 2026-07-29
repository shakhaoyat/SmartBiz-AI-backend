import { Response, NextFunction } from 'express';
import Business from '../models/Business';
import { AuthRequest } from '../middlewares/auth';

export const getBusinesses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    let query = {};
    if (req.user?.role === 'admin') {
      query = {};
    } else {
      query = { owner: userId };
    }
    const businesses = await Business.find(query).populate('owner', 'name email');
    res.json(businesses);
  } catch (error) {
    next(error);
  }
};

export const getBusiness = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const business = await Business.findById(req.params.id).populate('owner', 'name email');
    if (!business) {
      res.status(404).json({ message: 'Business not found.' });
      return;
    }
    if ((business.owner as any).toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    res.json(business);
  } catch (error) {
    next(error);
  }
};

export const createBusiness = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, type, industry, description, location, goals, targetCustomers } = req.body;
    const business = new Business({
      name,
      type,
      industry,
      description,
      location,
      goals,
      targetCustomers,
      owner: req.user?._id,
    });
    await business.save();
    await business.populate('owner', 'name email');
    res.status(201).json(business);
  } catch (error) {
    next(error);
  }
};

export const updateBusiness = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      res.status(404).json({ message: 'Business not found.' });
      return;
    }
    if ((business.owner as any).toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    Object.assign(business, req.body);
    await business.save();
    res.json(business);
  } catch (error) {
    next(error);
  }
};

export const deleteBusiness = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      res.status(404).json({ message: 'Business not found.' });
      return;
    }
    if ((business.owner as any).toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    await business.deleteOne();
    res.json({ message: 'Business deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
