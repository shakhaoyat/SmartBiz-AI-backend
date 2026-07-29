import { Router } from 'express';
import { uploadMiddleware, uploadData, getDatasets, deleteDataset } from '../controllers/dataController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate as any);
router.post('/upload', uploadMiddleware, uploadData as any);
router.get('/', getDatasets as any);
router.delete('/:id', deleteDataset as any);

export default router;
