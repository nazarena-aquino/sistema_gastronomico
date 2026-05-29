import { Router } from 'express';
import { getTables, getTableById, createTable, updateTable, updateTablePosition, updateTableStatus, deleteTable } from '../controllers/tables.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.get('/', getTables);
router.get('/:id', getTableById);
router.post('/', authMiddleware, createTable);
router.put('/:id', authMiddleware, updateTable);
router.patch('/:id/position', authMiddleware, updateTablePosition);
router.patch('/:id/status', authMiddleware, updateTableStatus);
router.delete('/:id', authMiddleware, deleteTable);
export default router;
