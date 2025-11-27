import mongoose from 'mongoose';
import Consultation from '../Models/consultationModel.js';
import Appointment from '../Models/appointmentModel.js';
import Patient from '../Models/patientModel.js';
import Prescription from '../Models/prescriptionModel.js';

const consultationController = {
    createConsultation: async (req, res) => {
        try {
            const { appointmentId, patientId, doctorId, vitals = [], diagnosis, procedures = [], notes } = req.body;


            if (!patientId || !doctorId) {
                return res.status(400).json({ success: false, message: 'patientId and doctorId are required' });
            }

            const consultation = new Consultation({
                appointment: appointmentId || null,
                patient: patientId,
                doctor: doctorId,
                vitals,
                diagnosis,
                procedures,
                notes,
                createdBy: req.user.id,
            });

            await consultation.save();

            if (appointmentId) {
                await Appointment.findByIdAndUpdate(appointmentId, { $set: { consultation: consultation._id } }).exec();
            }

            const populated = await Consultation.findById(consultation._id)
                .populate('patient', 'firstName lastName')
                .populate('doctor', 'email profile');

            return res.status(201).json({ success: true, consultation: populated });

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    getAllConsultations: async (req, res) => {
        try {
            const { page = 1, limit = 20, patientId, doctorId } = req.query;
            const filter = {};
            if (patientId) filter.patient = patientId;
            if (doctorId) filter.doctor = doctorId;

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const [consultations, total] = await Promise.all([
                Consultation.find(filter)
                    .populate('patient', 'firstName lastName')
                    .populate('doctor', 'email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                Consultation.countDocuments(filter),
            ]);

            return res.status(200).json({
                success: true,
                consultations,
                pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), total },
            });
        } catch (error) {
            console.error('getAllConsultations error:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getConsultationById: async (req, res) => {
        try {
            const { id } = req.params;
            const consultation = await Consultation.findById(id)
                .populate('patient', 'firstName lastName')
                .populate('doctor', 'email profile')
                .populate('prescriptions')
                .populate('labOrders')
                .populate('documents');

            if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });
            return res.status(200).json({ success: true, consultation });
        } catch (error) {
            console.error('getConsultationById error:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getConsultationsByPatient: async (req, res) => {
        try {
            const { patientId } = req.params;
            const consultations = await Consultation.find({ patient: patientId })
                .populate('doctor', 'email profile')
                .sort({ createdAt: -1 });
            return res.status(200).json({ success: true, consultations });
        } catch (error) {
            console.error('getConsultationsByPatient error:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    updateConsultation: async (req, res) => {
        try {
            const { id } = req.params;
            const update = req.body;
            const updated = await Consultation.findByIdAndUpdate(id, update, { new: true })
                .populate('patient', 'firstName lastName')
                .populate('doctor', 'email');
            if (!updated) return res.status(404).json({ success: false, message: 'Consultation not found' });
            return res.status(200).json({ success: true, consultation: updated });
        } catch (error) {
            console.error('updateConsultation error:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    deleteConsultation: async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await Consultation.findByIdAndDelete(id);
            if (!deleted) return res.status(404).json({ success: false, message: 'Consultation not found' });
            return res.status(200).json({ success: true, message: 'Consultation deleted' });
        } catch (error) {
            console.error('deleteConsultation error:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },
};

export default consultationController;