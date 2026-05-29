import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './products.routes';
import orderRoutes from './orders.routes';
import paymentRoutes from './payments.routes';
import tableRoutes from './tables.routes';
import customerRoutes from './customers.routes';
import discountRoutes from './discounts.routes';
import configRoutes from './config.routes';
import reservationRoutes from './reservations.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/tables', tableRoutes);
router.use('/customers', customerRoutes);
router.use('/discounts', discountRoutes);
router.use('/config', configRoutes);
router.use('/reservations', reservationRoutes);
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default router;
