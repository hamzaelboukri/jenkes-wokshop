import mongoose from 'mongoose';
import Patient from '../Models/patientModel.js';
import User from '../Models/userModel.js';
import { createPatientSchema, updatePatientSchema } from '../middlewares/validator.js';

const patientController = {
    createPatient: async (req, res) => {
        try {
            const { error } = createPatientSchema.validate(req.body, { abortEarly: false });
            if (error) {
                const msgs = error.details.map(d => d.message);
                return res.status(400).json({ success: false, message: msgs.join(', ') });
            }

            const { userId, ...patientData } = req.body;

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ success: false, message: 'Invalid userId' });
            }

            // Vérifier si le patient existe déjà
            const existingPatient = await Patient.findOne({ user: userId });
            if (existingPatient) {
                return res.status(409).json({
                    success: false,
                    message: 'Patient record already exists for this user',
                });
            }

            const newPatient = new Patient({
                user: userId,
                ...patientData,
            });

            await newPatient.save();

            const populatedPatient = await Patient.findById(newPatient._id).populate('user', 'email role verified');

            return res.status(201).json({
                success: true,
                message: 'Patient record created successfully',
                patient: populatedPatient,
            });
        } catch (error) {
            console.error('CreatePatient error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    getAllPatients: async (req, res) => {
        try {
            const { page = 1, limit = 10, search, bloodType } = req.query;

            const filter = {};

            if (search) {
                filter.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                ];
            }

            if (bloodType) {
                filter['medicalInfo.bloodType'] = bloodType;
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const patients = await Patient.find(filter)
                .populate('user', 'email verified isActive')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 });

            const total = await Patient.countDocuments(filter);

            return res.status(200).json({
                success: true,
                patients,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalPatients: total,
                    limit: parseInt(limit),
                },
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getPatientById: async (req, res) => {
        try {
            const { id } = req.params;

            const patient = await Patient.findById(id).populate('user', 'email role verified isActive');

            if (!patient) {
                return res.status(404).json({ success: false, message: 'Patient not found' });
            }

            return res.status(200).json({
                success: true,
                patient,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getMyPatientRecord: async (req, res) => {
        try {
            const patient = await Patient.findOne({ user: req.user.userId }).populate('user', 'email verified');

            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient record not found. Please complete your profile.',
                });
            }

            return res.status(200).json({
                success: true,
                patient,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    updatePatient: async (req, res) => {
        try {
            const { id } = req.params;

            const { error } = updatePatientSchema.validate(req.body, { abortEarly: false });
            if (error) {
                const msgs = error.details.map(d => d.message);
                return res.status(400).json({ success: false, message: msgs.join(', ') });
            }

            const patient = await Patient.findById(id);
            if (!patient) {
                return res.status(404).json({ success: false, message: 'Patient not found' });
            }

            // Vérifier les permissions
            if (req.user.role === 'patient' && patient.user.toString() !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only update your own patient record',
                });
            }

            const updatedPatient = await Patient.findByIdAndUpdate(
                id,
                req.body,
                { new: true, runValidators: true }
            ).populate('user', 'email verified');

            return res.status(200).json({
                success: true,
                message: 'Patient record updated successfully',
                patient: updatedPatient,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    deletePatient: async (req, res) => {
        try {
            const { id } = req.params;

            const patient = await Patient.findById(id);
            if (!patient) {
                return res.status(404).json({ success: false, message: 'Patient not found' });
            }

            await Patient.findByIdAndDelete(id);

            return res.status(200).json({
                success: true,
                message: 'Patient record deleted successfully',
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },
};

export default patientController;