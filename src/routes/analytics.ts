import { Router } from 'express';
import { getAnalytics, generateAIReport } from '../controllers/analyticsController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate as any);
router.get('/', getAnalytics as any);
router.post('/generate-ai-report', generateAIReport as any);

export default router;
