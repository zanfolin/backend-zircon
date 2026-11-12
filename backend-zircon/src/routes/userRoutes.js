import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole, requireAdmin } from '../middlewares/roleMiddleware.js';
import { uploadMiddleware } from '../middlewares/uploadMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { userSchemas } from '../validations/userSchemas.js';

const router = Router();

// Protected routes (all authenticated users)
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, validate(userSchemas.updateProfile), userController.updateProfile);
router.put('/avatar', authMiddleware, uploadMiddleware.single('avatar'), userController.uploadAvatar);
router.put('/password', authMiddleware, validate(userSchemas.changePassword), userController.changePassword);
router.delete('/account', authMiddleware, userController.deleteAccount);

// Admin routes
router.get('/', authMiddleware, requireAdmin, validate(userSchemas.adminListUsers), userController.adminListUsers);
router.get('/:id', authMiddleware, requireAdmin, userController.adminGetUser);
router.put('/:id', authMiddleware, requireAdmin, validate(userSchemas.adminUpdateUser), userController.adminUpdateUser);
router.delete('/:id', authMiddleware, requireAdmin, userController.adminDeleteUser);

export default router;