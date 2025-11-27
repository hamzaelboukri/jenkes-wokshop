import express from 'express';
import userController from '../Controllers/userController.js';
import { verifyToken, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', verifyToken, authorize('admin'), userController.createUser);
router.get('/', verifyToken, authorize('admin', 'secretaire'), userController.getAllUsers);
router.get('/:id', verifyToken, authorize('admin', 'medecin', 'infirmier', 'secretaire'), userController.getUserById);
router.put('/:id', verifyToken, authorize('admin'), userController.updateUser);
router.patch('/:id/suspend', verifyToken, authorize('admin'), userController.suspendUser);
router.patch('/:id/reactivate', verifyToken, authorize('admin'), userController.reactivateUser);
router.delete('/:id', verifyToken, authorize('admin'), userController.deleteUser);

export default router;