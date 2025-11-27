import express from 'express';
import authController from '../Controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();


router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/send-verification-code', authController.sendVerificationCode);
router.post('/verify-email', authController.verifyEmail);
router.post('/logout', verifyToken, authController.logout);
router.get('/profile', verifyToken, authController.getProfile);
export default router;