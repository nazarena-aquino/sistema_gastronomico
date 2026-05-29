import { Router } from 'express';
import { login, verifyToken, changePassword, verifyWaiterPin } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.post('/login', login);
router.get('/verify', authMiddleware, verifyToken);
router.put('/change-password', authMiddleware, changePassword);
router.post('/waiter-pin', verifyWaiterPin);
export default router;
