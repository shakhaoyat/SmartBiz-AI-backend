import { Router } from 'express';
import { getBusinesses, getBusiness, createBusiness, updateBusiness, deleteBusiness } from '../controllers/businessController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate as any);
router.get('/', getBusinesses as any);
router.get('/:id', getBusiness as any);
router.post('/', createBusiness as any);
router.patch('/:id', updateBusiness as any);
router.delete('/:id', deleteBusiness as any);

export default router;
