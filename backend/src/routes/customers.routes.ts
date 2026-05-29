// customers.routes.ts
import { Router as CRouter } from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customers.controller';
import { authMiddleware } from '../middleware/auth';
const customersRouter = CRouter();
customersRouter.get('/', authMiddleware, getCustomers);
customersRouter.get('/:id', authMiddleware, getCustomerById);
customersRouter.post('/', authMiddleware, createCustomer);
customersRouter.put('/:id', authMiddleware, updateCustomer);
customersRouter.delete('/:id', authMiddleware, deleteCustomer);
export default customersRouter;
