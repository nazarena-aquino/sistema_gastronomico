import { Router } from 'express';
import { createReservation, getReservations, updateReservationStatus, deleteReservation } from '../controllers/reservations.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', createReservation);
router.get('/', authMiddleware, getReservations);
router.patch('/:id/status', authMiddleware, updateReservationStatus);
router.delete('/:id', authMiddleware, deleteReservation);

export default router;
