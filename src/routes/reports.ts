import { Router } from 'express';
import { generateReport, getReports, getReport, deleteReport } from '../controllers/reportController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate as any);
router.post('/generate', generateReport as any);
router.get('/', getReports as any);
router.get('/:id', getReport as any);
router.delete('/:id', deleteReport as any);

export default router;
