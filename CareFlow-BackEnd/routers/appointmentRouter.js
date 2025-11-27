import express from 'express';
import appointmentController from '../Controllers/appointmentController.js';
import { verifyToken, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, authorize('admin', 'medecin', 'infirmier', 'secretaire', 'patient'), appointmentController.createAppointment);
router.get('/', verifyToken, authorize('admin', 'secretaire'), appointmentController.getAllAppointments);
router.get('/my-appointments', verifyToken, authorize('patient'), appointmentController.getMyAppointments);
router.get('/availability', verifyToken, appointmentController.checkAvailability);
router.get('/doctor/:doctorId', verifyToken, authorize('admin', 'medecin', 'infirmier', 'secretaire'), appointmentController.getDoctorAppointments);
router.get('/:id', verifyToken, appointmentController.getAppointmentById);
router.put('/:id', verifyToken, authorize('admin', 'medecin', 'infirmier', 'secretaire'), appointmentController.updateAppointment);
router.patch('/:id/cancel', verifyToken, authorize('admin', 'medecin', 'infirmier', 'secretaire', 'patient'), appointmentController.cancelAppointment);
router.patch('/:id/complete', verifyToken, authorize('admin', 'medecin'), appointmentController.completeAppointment);

export default router;