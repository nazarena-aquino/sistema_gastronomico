import { Router } from 'express';
import { createPreference, handleWebhook, confirmPayment, getMPPublicKey } from '../controllers/payments.controller';
import { authMiddleware } from '../middleware/auth';
const router = Router();
router.post('/webhook', handleWebhook);
router.post('/create-preference', createPreference);
router.get('/mp-public-key', getMPPublicKey);
router.patch('/confirm/:order_id', authMiddleware, confirmPayment);
export default router;
