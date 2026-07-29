import { Response, NextFunction } from 'express';
import multer from 'multer';
import csv from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import SalesDataset from '../models/SalesDataset';
import SalesRecord from '../models/SalesRecord';
import Business from '../models/Business';
import { AuthRequest } from '../middlewares/auth';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

export const uploadMiddleware = upload.single('file');

export const uploadData = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded.' });
      return;
    }
    const businessId = req.body.businessId;
    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ message: 'Business not found.' });
      return;
    }
    if (business.owner.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json') ? 'json' : 'csv';
    const dataset = new SalesDataset({
      name: req.file.originalname,
      business: businessId,
      uploadedBy: req.user?._id,
      fileType,
      originalName: req.file.originalname,
      size: req.file.size,
      status: 'processing',
    });
    await dataset.save();

    try {
      let records = [];
      if (fileType === 'csv') {
        const content = fs.readFileSync(filePath, 'utf-8');
        records = csv.parse(content, {
          columns: true,
          skip_empty_lines: true,
          relax_column_count: true,
        });
      } else {
        const content = fs.readFileSync(filePath, 'utf-8');
        records = JSON.parse(content);
      }

      const mappedRecords = records.map((record: any) => {
        const date = new Date(record.date || record.Date || record.DATE || Date.now());
        return {
          dataset: dataset._id,
          business: businessId,
          productName: record.productName || record['Product Name'] || record.product || 'Unknown',
          category: record.category || record['Category'] || 'General',
          quantity: parseInt(record.quantity || record['Quantity'] || 1, 10) || 1,
          unitPrice: parseFloat(record.unitPrice || record['Unit Price'] || record.price || 0) || 0,
          totalRevenue: parseFloat(record.totalRevenue || record['Total Revenue'] || record.amount || 0) || 0,
          date,
          customer: record.customer || record['Customer'] || '',
          location: record.location || record['Location'] || '',
        };
      });

      if (mappedRecords.length > 0) {
        await SalesRecord.insertMany(mappedRecords);
      }

      dataset.recordCount = mappedRecords.length;
      dataset.status = 'completed';
      await dataset.save();
      fs.unlinkSync(filePath);
    } catch (parseError) {
      dataset.status = 'failed';
      dataset.errorMessage = 'Failed to parse file. Please check the format.';
      await dataset.save();
      fs.unlinkSync(filePath);
      res.status(400).json({ message: dataset.errorMessage });
      return;
    }

    res.status(201).json(dataset);
  } catch (error) {
    next(error);
  }
};

export const getDatasets = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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
    const datasets = await SalesDataset.find({ business: businessId }).sort({ createdAt: -1 });
    res.json(datasets);
  } catch (error) {
    next(error);
  }
};

export const deleteDataset = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dataset = await SalesDataset.findById(req.params.id).populate('business', 'owner');
    if (!dataset) {
      res.status(404).json({ message: 'Dataset not found.' });
      return;
    }
    const ownerId = (dataset.business as any)?.owner?.toString();
    if (ownerId !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    await SalesRecord.deleteMany({ dataset: dataset._id });
    await dataset.deleteOne();
    res.json({ message: 'Dataset deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
