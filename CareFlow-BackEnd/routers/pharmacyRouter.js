import express from 'express';
import pharmacyController from '../Controllers/pharmacyController.js';
import { verifyToken, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Pharmacies CRUD
router.post('/', verifyToken, authorize('admin'), pharmacyController.createPharmacy);
router.get('/', verifyToken, authorize('admin', 'pharmacien'), pharmacyController.getAllPharmacies);
router.get('/:id', verifyToken, authorize('admin', 'pharmacien'), pharmacyController.getPharmacyById);
router.put('/:id', verifyToken, authorize('admin'), pharmacyController.updatePharmacy);
router.delete('/:id', verifyToken, authorize('admin'), pharmacyController.deletePharmacy);

// prescriptions for pharmacy
router.get('/:id/prescriptions', verifyToken, authorize('pharmacien', 'admin'), pharmacyController.getPrescriptionsForPharmacy);

export default router;