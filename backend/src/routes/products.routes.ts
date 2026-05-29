import { Router } from 'express';
import multer from 'multer';
import {
  getProducts, getAllProducts, getProductById, createProduct, updateProduct,
  deleteProduct, toggleProductAvailability, uploadProductImage,
  getCategories, getAllCategories, createCategory, updateCategory, deleteCategory,
  updateStock, getLowStockProducts, getStockMovements,
  getModifierGroups, createModifierGroup, deleteModifierGroup,
} from '../controllers/products.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Público
router.get('/', getProducts);
router.get('/categories/public', getCategories);
router.get('/:id', getProductById);

// Admin
router.get('/admin/all', authMiddleware, getAllProducts);
router.get('/admin/categories', authMiddleware, getAllCategories);
router.get('/admin/low-stock', authMiddleware, getLowStockProducts);
router.get('/admin/stock-movements', authMiddleware, getStockMovements);
router.post('/admin/categories', authMiddleware, createCategory);
router.put('/admin/categories/:id', authMiddleware, updateCategory);
router.delete('/admin/categories/:id', authMiddleware, deleteCategory);
router.post('/admin/upload-image', authMiddleware, upload.single('image'), uploadProductImage);
router.post('/admin', authMiddleware, createProduct);
router.put('/admin/:id', authMiddleware, updateProduct);
router.delete('/admin/:id', authMiddleware, deleteProduct);
router.patch('/admin/:id/toggle', authMiddleware, toggleProductAvailability);
router.patch('/admin/:id/stock', authMiddleware, updateStock);
router.get('/admin/:id/modifiers', authMiddleware, getModifierGroups);
router.post('/admin/:product_id/modifiers', authMiddleware, createModifierGroup);
router.delete('/admin/modifiers/:id', authMiddleware, deleteModifierGroup);

export default router;
