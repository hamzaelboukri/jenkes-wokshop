import express from 'express';
import consultationController from '../Controllers/consultationController.js';
import { verifyToken, authorize } from '../middlewares/authMiddleware.js';


const router = express.Router();


router.post('/', verifyToken, authorize('medecin', 'admin'), consultationController.createConsultation);
router.get('/', verifyToken, authorize('medecin', 'admin', 'secretaire'), consultationController.getAllConsultations);
router.get('/:id', verifyToken, authorize('medecin', 'admin', 'patient', 'labo'), consultationController.getConsultationById);
router.get('/patient/:patientId', verifyToken, authorize('medecin', 'admin', 'patient'), consultationController.getConsultationsByPatient);
// router.get('/appointment/:appointmentId', verifyToken, authorize('medecin', 'admin'), consultationController.getByAppointment);
router.put('/:id', verifyToken, authorize('medecin', 'admin'), consultationController.updateConsultation);
router.delete('/:id', verifyToken, authorize('admin'), consultationController.deleteConsultation);


export default router;