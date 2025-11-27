import mongoose from 'mongoose';
import Prescription from '../Models/prescriptionModel.js';
import Consultation from '../Models/consultationModel.js';
import Pharmacy from '../Models/pharmacyModel.js';
// import notificationService from '../services/notificationService.js';

const prescriptionController = {
    createPrescription: async (req, res) => {
        try {
            // accept both names
            const consultationId = req.body.consultationId || req.body.consultation || null;
            const patientId = req.body.patientId;
            const items = req.body.items || req.body.medications || [];
            const notes = req.body.notes || '';
            const pharmacy = req.body.pharmacy || null;

            if (!patientId || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ success: false, message: 'patientId and items required' });
            }

            // validUntil: use provided value or default to 30 days from now
            const validUntil = req.body.validUntil ? new Date(req.body.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            const prescription = new Prescription({
                consultation: consultationId,
                patient: patientId,
                prescriber: req.user.userId || req.user.id,
                medications: items,
                notes,
                pharmacy,
                status: req.body.status || 'draft',
                validUntil,
            });

            await prescription.save();
            if (consultationId) await Consultation.findByIdAndUpdate(consultationId, { $push: { prescriptions: prescription._id } });

            return res.status(201).json({ success: true, message: 'Prescription created', prescription });
        } catch (error) {
            console.error('createPrescription error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    getAllPrescriptions: async (req, res) => {
        try {
            const { page = 1, limit = 20, status, patientId } = req.query;
            const filter = {};
            if (status) filter.status = status;
            if (patientId) filter.patient = patientId;

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const [prescriptions, total] = await Promise.all([
                Prescription.find(filter).populate('patient', 'firstName lastName').populate('prescriber', 'email').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
                Prescription.countDocuments(filter),
            ]);

            return res.status(200).json({ success: true, prescriptions, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), total } });
        } catch (error) {
            console.error('getAllPrescriptions error:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getPrescriptionById: async (req, res) => {
        try {
            const { id } = req.params;
            const prescription = await Prescription.findById(id).populate('patient prescriber pharmacy consultation');
            if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });
            return res.status(200).json({ success: true, prescription });
        } catch (error) {
            console.error('getPrescriptionById error:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getByPatient: async (req, res) => {
        try {
            const { patientId } = req.params;
            const prescriptions = await Prescription.find({ patient: patientId }).populate('prescriber pharmacy').sort({ createdAt: -1 });
            return res.status(200).json({ success: true, prescriptions });
        } catch (error) {
            console.error('getByPatient error:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getByPharmacy: async (req, res) => {
        try {
            const { pharmacyId } = req.params;
            const prescriptions = await Prescription.find({ pharmacy: pharmacyId }).populate('patient prescriber').sort({ createdAt: -1 });
            return res.status(200).json({ success: true, prescriptions });
        } catch (error) {
            console.error('getByPharmacy error:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    signPrescription: async (req, res) => {
        try {
            const { id } = req.params;
            const prescription = await Prescription.findById(id);
            if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });
            if (prescription.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft prescriptions can be signed' });

            prescription.status = 'signed';
            prescription.signedBy = req.user.userId;
            prescription.signedAt = new Date();
            await prescription.save();

            return res.status(200).json({ success: true, message: 'Prescription signed', prescription });
        } catch (error) {
            console.error('signPrescription error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    assignPharmacy: async (req, res) => {
        const session = await mongoose.startSession();
        try {
            const { id } = req.params;
            const { pharmacyId } = req.body;
            if (!pharmacyId) return res.status(400).json({ success: false, message: 'pharmacyId required' });

            await session.withTransaction(async () => {
                const prescription = await Prescription.findById(id).session(session);
                if (!prescription) throw { status: 404, message: 'Prescription not found' };
                if (prescription.status === 'dispensed') throw { status: 400, message: 'Cannot assign dispensed prescription' };

                const pharmacy = await Pharmacy.findById(pharmacyId).session(session);
                if (!pharmacy) throw { status: 404, message: 'Pharmacy not found' };

                prescription.pharmacy = pharmacyId;
                prescription.status = 'sent';
                prescription.sentAt = new Date();
                await prescription.save({ session });

            });

            const updated = await Prescription.findById(id).populate('pharmacy patient prescriber');
            return res.status(200).json({ success: true, message: 'Pharmacy assigned and prescription sent', prescription: updated });
        } catch (error) {
            if (error && error.status) return res.status(error.status).json({ success: false, message: error.message });
            console.error('assignPharmacy error:', error);
            return res.status(500).json({ success: false, message: error.message });
        } finally {
            session.endSession();
        }
    },

    dispensePrescription: async (req, res) => {
        const session = await mongoose.startSession();
        try {
            const { id } = req.params;
            await session.withTransaction(async () => {
                const prescription = await Prescription.findById(id).session(session);
                if (!prescription) throw { status: 404, message: 'Prescription not found' };
                if (prescription.status !== 'sent' && prescription.status !== 'signed') {
                    throw { status: 400, message: 'Prescription not ready for dispense' };
                }

                prescription.status = 'dispensed';
                prescription.dispensedBy = req.user.userId;
                prescription.dispensedAt = new Date();
                await prescription.save({ session });

                // optional: inventory decrement or pharmacy log
            });

            const updated = await Prescription.findById(id).populate('pharmacy patient');
            return res.status(200).json({ success: true, message: 'Prescription dispensed', prescription: updated });
        } catch (error) {
            if (error && error.status) return res.status(error.status).json({ success: false, message: error.message });
            console.error('dispensePrescription error:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        } finally {
            session.endSession();
        }
    },
};

export default prescriptionController;