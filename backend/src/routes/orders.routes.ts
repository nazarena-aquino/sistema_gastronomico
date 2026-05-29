import { Router } from 'express';
import {
  createOrder, getOrders, getOrderById, getOrderByNumber,
  getActiveOrdersByTable, updateOrderStatus, updateItemStatus,
  markOrderPrinted, getDashboardStats, getSalesReport,
} from '../controllers/orders.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.post('/', createOrder);
router.get('/track/:orderNumber', getOrderByNumber);
router.get('/', authMiddleware, getOrders);
router.get('/dashboard/stats', authMiddleware, getDashboardStats);
router.get('/reports/sales', authMiddleware, getSalesReport);
router.get('/table/:table_id/active', authMiddleware, getActiveOrdersByTable);
router.get('/:id', authMiddleware, getOrderById);
router.patch('/:id/status', authMiddleware, updateOrderStatus);
router.patch('/:id/print', authMiddleware, markOrderPrinted);
router.patch('/items/:id/status', authMiddleware, updateItemStatus);
export default router;
