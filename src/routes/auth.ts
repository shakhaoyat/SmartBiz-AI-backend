import { Router } from 'express';
import { register, login, googleAuth, getMe } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/register', register as any);
router.post('/login', login as any);
router.post('/google', googleAuth as any);
router.get('/me', authenticate as any, getMe as any);

export default router;
