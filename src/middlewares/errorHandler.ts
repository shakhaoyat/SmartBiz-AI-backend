import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e: any) => e.message).join(', ');
    res.status(400).json({ message });
    return;
  }

  if (err.code === 11000) {
    res.status(400).json({ message: 'Duplicate field value entered.' });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ message: 'Invalid ID format.' });
    return;
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
};
