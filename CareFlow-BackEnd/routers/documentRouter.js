import express from 'express';
import documentController from '../Controllers/documentController.js';
import { verifyToken, authorize } from '../middlewares/authMiddleware.js';
import multer from 'multer';

const router = express.Router();

// multer config (20MB max) and strict mime
const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// Documents: upload, list, presign, delete
router.post('/upload', verifyToken, upload.single('file'), documentController.uploadDocument);
router.get('/patient/:patientId', verifyToken, authorize('medecin', 'patient', 'admin', 'labo'), documentController.listByPatient);
router.get('/:id/presign', verifyToken, authorize('medecin', 'patient', 'admin', 'labo'), documentController.getPresignedUrl);
router.delete('/:id', verifyToken, authorize('admin', 'medecin'), documentController.deleteDocument);

export default router;