import express from 'express';
import patientController from '../Controllers/patientController.js';
import { verifyToken, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();


router.post('/', verifyToken, authorize('admin', 'medecin', 'infirmier', 'secretaire'), patientController.createPatient);
router.get('/', verifyToken, authorize('admin', 'medecin', 'infirmier', 'secretaire'), patientController.getAllPatients);
router.get('/me', verifyToken, authorize('patient'), patientController.getMyPatientRecord);
router.get('/:id', verifyToken, authorize('admin', 'medecin', 'infirmier', 'secretaire'), patientController.getPatientById);
router.put('/:id', verifyToken, authorize('admin', 'medecin', 'infirmier', 'secretaire', 'patient'), patientController.updatePatient);
router.delete('/:id', verifyToken, authorize('admin'), patientController.deletePatient);

export default router;