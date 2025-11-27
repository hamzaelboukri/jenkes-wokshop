import express from 'express';
import labOrderController from '../Controllers/labOrderController.js';
import { verifyToken, authorize } from '../middlewares/authMiddleware.js';
import multer from 'multer';

const router = express.Router();

// file upload limits (Max 20MB) - accept PDF/CSV/JPEG/PNG
const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'text/csv', 'image/jpeg', 'image/png'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// Lab orders
router.post('/', verifyToken, authorize('medecin', 'admin'), labOrderController.createLabOrder);
router.get('/', verifyToken, authorize('labo', 'medecin', 'admin'), labOrderController.getAllLabOrders);
router.get('/:id', verifyToken, authorize('labo', 'medecin', 'patient', 'admin'), labOrderController.getLabOrderById);

// upload results (multipart/form-data)
router.post('/:id/upload-result', verifyToken, authorize('labo'), upload.single('file'), labOrderController.uploadResult);

// list/download results
router.get('/:id/results', verifyToken, authorize('labo', 'medecin', 'patient', 'admin'), labOrderController.getResultsForOrder);
router.get('/results/:resultId/download', verifyToken, authorize('labo', 'medecin', 'patient', 'admin'), labOrderController.downloadResultPresign);

export default router;