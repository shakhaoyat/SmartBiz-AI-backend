import { Router } from 'express';
import { getStats, getAllUsers, getAllBusinesses, deleteUser } from '../controllers/adminController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate as any, authorize('admin') as any);
router.get('/stats', getStats as any);
router.get('/users', getAllUsers as any);
router.get('/businesses', getAllBusinesses as any);
router.delete('/users/:id', deleteUser as any);

export default router;
