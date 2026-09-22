import { Router } from 'express';
import { opportunityController } from '../controllers/opportunityController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole, requireAdmin } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { opportunitySchemas } from '../validations/opportunitySchemas.js';

const router = Router();

// Public routes
router.get('/', validate(opportunitySchemas.list), opportunityController.list);
router.get('/sectors', opportunityController.getSectors);

// Protected routes - Empresa and Admin (specific routes before :id)
router.get('/my', authMiddleware, requireRole('EMPRESA', 'ADMIN'), validate(opportunitySchemas.list), opportunityController.listMyOpportunities);

router.get('/:id', opportunityController.getById);

// Protected routes - Empresa and Admin
router.post('/', authMiddleware, requireRole('EMPRESA', 'ADMIN'), validate(opportunitySchemas.create), opportunityController.create);
router.put('/:id', authMiddleware, requireRole('EMPRESA', 'ADMIN'), validate(opportunitySchemas.update), opportunityController.update);
router.delete('/:id', authMiddleware, requireRole('EMPRESA', 'ADMIN'), opportunityController.delete);

// Admin routes
router.get('/admin/all', authMiddleware, requireAdmin, validate(opportunitySchemas.list), opportunityController.adminListAll);
router.put('/admin/:id/status', authMiddleware, requireAdmin, validate(opportunitySchemas.adminUpdateStatus), opportunityController.adminUpdateStatus);

export default router;