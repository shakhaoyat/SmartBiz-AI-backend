import { Router } from 'express';
import { getRecommendations, updateRecommendationStatus, generateRecommendations } from '../controllers/recommendationController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate as any);
router.get('/', getRecommendations as any);
router.patch('/:id', updateRecommendationStatus as any);
router.post('/generate', generateRecommendations as any);

export default router;
