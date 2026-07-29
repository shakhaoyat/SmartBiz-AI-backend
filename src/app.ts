import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import businessRoutes from './routes/business';
import productRoutes from './routes/products';
import dataRoutes from './routes/data';
import analyticsRoutes from './routes/analytics';
import reportsRoutes from './routes/reports';
import aiRoutes from './routes/ai';
import recommendationRoutes from './routes/recommendations';
import adminRoutes from './routes/admin';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api', limiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});
app.use('/api/ai', aiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/products', productRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use(errorHandler);

export default app;
