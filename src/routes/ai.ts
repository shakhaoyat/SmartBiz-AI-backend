import { Router } from 'express';
import { sendAdvisorMessage, getConversations, getConversation } from '../controllers/aiController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate as any);
router.post('/advisor', sendAdvisorMessage as any);
router.get('/conversations', getConversations as any);
router.get('/conversations/:id', getConversation as any);

export default router;
