import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate as any);
router.get('/', getProducts as any);
router.get('/:id', getProduct as any);
router.post('/', createProduct as any);
router.patch('/:id', updateProduct as any);
router.delete('/:id', deleteProduct as any);

export default router;
