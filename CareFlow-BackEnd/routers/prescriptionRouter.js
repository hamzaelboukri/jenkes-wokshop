import express from 'express';
import prescriptionController from '../Controllers/prescriptionController.js';
import { verifyToken, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Prescriptions lifecycle
router.post('/', verifyToken, authorize('medecin'), prescriptionController.createPrescription);
router.get('/', verifyToken, authorize('medecin', 'pharmacien', 'admin'), prescriptionController.getAllPrescriptions);
router.get('/:id', verifyToken, authorize('medecin', 'pharmacien', 'patient', 'admin'), prescriptionController.getPrescriptionById);

// patient / pharmacy views
router.get('/patient/:patientId', verifyToken, authorize('patient', 'medecin', 'admin'), prescriptionController.getByPatient);
router.get('/pharmacy/:pharmacyId', verifyToken, authorize('pharmacien', 'admin'), prescriptionController.getByPharmacy);

// actions: sign, assign, send, dispense
router.put('/:id/sign', verifyToken, authorize('medecin'), prescriptionController.signPrescription);
router.post('/:id/assign-pharmacy', verifyToken, authorize('medecin', 'secretaire', 'admin'), prescriptionController.assignPharmacy);
// router.post('/:id/send', verifyToken, authorize('medecin', 'secretaire', 'admin'), prescriptionController.sendPrescription);
router.post('/:id/dispense', verifyToken, authorize('pharmacien'), prescriptionController.dispensePrescription);

export default router;