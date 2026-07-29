import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Business from '../models/Business';
import { AuthRequest } from '../middlewares/auth';

const generateToken = (userId: string): string => {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  return jwt.sign({ userId, exp }, process.env.JWT_SECRET as string);
};

export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ message: 'Please provide email, password, and name.' });
      return;
    }
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'User already exists with this email.' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ email, password: hashedPassword, name });
    await user.save();

    const business = new Business({
      name: `${name}'s Business`,
      owner: user._id,
    });
    await business.save();

    const token = generateToken(user._id.toString());
    res.status(201).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
      businessId: business._id,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password.' });
      return;
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(400).json({ message: 'Invalid email or password.' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid email or password.' });
      return;
    }
    const token = generateToken(user._id.toString());
    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, name, googleId } = req.body;
    if (!email || !googleId) {
      res.status(400).json({ message: 'Email and googleId are required.' });
      return;
    }
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        await user.save();
      } else {
        const newUser = new User({ email, name, googleId });
        await newUser.save();
        user = newUser;
      }
    }
    const token = generateToken(user._id.toString());
    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    _id: req.user?._id,
    email: req.user?.email,
    name: req.user?.name,
    role: req.user?.role,
    avatar: req.user?.avatar,
  });
};
