import { Response, NextFunction } from 'express';
import User from '../models/User';
import Business from '../models/Business';
import { AuthRequest } from '../middlewares/auth';

export const getStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBusinesses = await Business.countDocuments();
    const stats = { totalUsers, totalBusinesses };
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getAllBusinesses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const businesses = await Business.find().populate('owner', 'name email').sort({ createdAt: -1 });
    res.json(businesses);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    await user.deleteOne();
    res.json({ message: 'User deleted.' });
  } catch (error) {
    next(error);
  }
};
