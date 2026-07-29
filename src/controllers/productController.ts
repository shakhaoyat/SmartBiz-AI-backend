import { Response, NextFunction } from 'express';
import Product from '../models/Product';
import Business from '../models/Business';
import { AuthRequest } from '../middlewares/auth';

export const getProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const businessId = req.query.businessId as string;
    let query = {};
    if (businessId) {
      const business = await Business.findById(businessId);
      if (!business) {
        res.status(404).json({ message: 'Business not found.' });
        return;
      }
      if ((business.owner as any).toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
        res.status(403).json({ message: 'Access denied.' });
        return;
      }
      query = { business: businessId };
    } else {
      // Get all businesses owned by user
      const businesses = await Business.find({ owner: req.user?._id });
      query = { business: { $in: businesses.map(b => b._id) } };
    }
    const products = await Product.find(query).populate('business', 'name type').sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).populate('business', 'name type owner');
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }
    if ((product.business as any).owner.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, category, description, price, status, imageUrl, business } = req.body;
    const businessDoc = await Business.findById(business);
    if (!businessDoc) {
      res.status(404).json({ message: 'Business not found.' });
      return;
    }
    if ((businessDoc.owner as any).toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    const product = new Product({ name, category, description, price, status, imageUrl, business });
    await product.save();
    await product.populate('business', 'name type');
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).populate('business', 'name type owner');
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }
    if ((product.business as any).owner.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    Object.assign(product, req.body);
    await product.save();
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).populate('business', 'name type owner');
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }
    if ((product.business as any).owner.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    await product.deleteOne();
    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
