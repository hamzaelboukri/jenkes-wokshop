import Appointment from '../Models/appointmentModel.js';
import Patient from '../Models/patientModel.js';
import User from '../Models/userModel.js';
import { createAppointmentSchema, updateAppointmentSchema } from '../middlewares/validator.js';

const appointmentController = {
    createAppointment: async (req, res) => {
        try {
            const { error } = createAppointmentSchema.validate(req.body, { abortEarly: false });
            if (error) {
                const msgs = error.details.map(d => d.message);
                return res.status(400).json({ success: false, message: msgs.join(', ') });
            }

            const { patientId, doctorId, appointmentDate, startTime, endTime, reason, type, notes } = req.body;

            const patient = await Patient.findById(patientId);
            if (!patient) {
                return res.status(404).json({ success: false, message: 'Patient not found' });
            }

            const doctor = await User.findById(doctorId);
            if (!doctor) {
                return res.status(404).json({ success: false, message: 'Doctor not found' });
            }

            if (doctor.role !== 'medecin' && doctor.role !== 'admin') {
                return res.status(400).json({
                    success: false,
                    message: 'Selected user is not a doctor',
                });
            }

            const appointmentDateTime = new Date(appointmentDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (appointmentDateTime < today) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot schedule appointments in the past',
                });
            }

            const hasConflict = await Appointment.checkConflict(doctorId, appointmentDate, startTime, endTime);

            if (hasConflict) {
                return res.status(409).json({
                    success: false,
                    message: 'Time slot not available. The doctor already has an appointment at this time.',
                });
            }

            const start = startTime.split(':');
            const end = endTime.split(':');
            const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
            const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
            const duration = endMinutes - startMinutes;

            const newAppointment = new Appointment({
                patient: patientId,
                doctor: doctorId,
                appointmentDate,
                startTime,
                endTime,
                duration,
                reason,
                type: type || 'consultation',
                notes,
                createdBy: req.user.userId,
            });

            await newAppointment.save();

            const populatedAppointment = await Appointment.findById(newAppointment._id)
                .populate('patient', 'firstName lastName phone')
                .populate('doctor', 'email profile')
                .populate('createdBy', 'email role');

            return res.status(201).json({
                success: true,
                message: 'Appointment created successfully',
                appointment: populatedAppointment,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getAllAppointments: async (req, res) => {
        try {
            const { page = 1, limit = 10, status, doctorId, patientId, date } = req.query;

            const filter = {};

            if (status) filter.status = status;
            if (doctorId) filter.doctor = doctorId;
            if (patientId) filter.patient = patientId;
            if (date) {
                const searchDate = new Date(date);
                filter.appointmentDate = {
                    $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
                    $lt: new Date(searchDate.setHours(23, 59, 59, 999)),
                };
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const appointments = await Appointment.find(filter)
                .populate('patient', 'firstName lastName phone')
                .populate('doctor', 'email profile')
                .populate('createdBy', 'email role')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ appointmentDate: 1, startTime: 1 });

            const total = await Appointment.countDocuments(filter);

            return res.status(200).json({
                success: true,
                appointments,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalAppointments: total,
                    limit: parseInt(limit),
                },
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getMyAppointments: async (req, res) => {
        try {
            const { status, upcoming } = req.query;

            const patient = await Patient.findOne({ user: req.user.userId });
            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient record not found',
                });
            }

            const filter = { patient: patient._id };

            if (status) {
                filter.status = status;
            }

            if (upcoming === 'true') {
                filter.appointmentDate = { $gte: new Date() };
            }

            const appointments = await Appointment.find(filter)
                .populate('doctor', 'email profile')
                .sort({ appointmentDate: 1, startTime: 1 });

            return res.status(200).json({
                success: true,
                appointments,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getDoctorAppointments: async (req, res) => {
        try {
            const { doctorId } = req.params;
            const { date, status } = req.query;

            const filter = { doctor: doctorId };

            if (status) {
                filter.status = status;
            }

            if (date) {
                const searchDate = new Date(date);
                filter.appointmentDate = {
                    $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
                    $lt: new Date(searchDate.setHours(23, 59, 59, 999)),
                };
            }

            const appointments = await Appointment.find(filter)
                .populate('patient', 'firstName lastName phone')
                .sort({ appointmentDate: 1, startTime: 1 });

            return res.status(200).json({
                success: true,
                appointments,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    checkAvailability: async (req, res) => {
        try {
            const { doctorId, date } = req.query;

            if (!doctorId || !date) {
                return res.status(400).json({
                    success: false,
                    message: 'Doctor ID and date are required',
                });
            }

            const searchDate = new Date(date);
            const appointments = await Appointment.find({
                doctor: doctorId,
                appointmentDate: {
                    $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
                    $lt: new Date(searchDate.setHours(23, 59, 59, 999)),
                },
                status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
            }).select('startTime endTime');

            const workingHours = {
                start: '08:00',
                end: '18:00',
            };

            const bookedSlots = appointments.map(apt => ({
                start: apt.startTime,
                end: apt.endTime,
            }));

            return res.status(200).json({
                success: true,
                date: date,
                workingHours,
                bookedSlots,
                message: 'Available time slots exclude booked appointments',
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getAppointmentById: async (req, res) => {
        try {
            const { id } = req.params;

            const appointment = await Appointment.findById(id)
                .populate('patient', 'firstName lastName phone medicalInfo')
                .populate('doctor', 'email profile')
                .populate('createdBy', 'email role')
                .populate('cancelledBy', 'email role');

            if (!appointment) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }

            return res.status(200).json({
                success: true,
                appointment,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    updateAppointment: async (req, res) => {
        try {
            const { id } = req.params;

            const { error } = updateAppointmentSchema.validate(req.body, { abortEarly: false });
            if (error) {
                const msgs = error.details.map(d => d.message);
                return res.status(400).json({ success: false, message: msgs.join(', ') });
            }

            const appointment = await Appointment.findById(id);
            if (!appointment) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }

            // Si on change la date/heure, vérifier les conflits
            if (req.body.appointmentDate || req.body.startTime || req.body.endTime) {
                const newDate = req.body.appointmentDate || appointment.appointmentDate;
                const newStartTime = req.body.startTime || appointment.startTime;
                const newEndTime = req.body.endTime || appointment.endTime;

                const hasConflict = await Appointment.checkConflict(
                    appointment.doctor,
                    newDate,
                    newStartTime,
                    newEndTime,
                    id
                );

                if (hasConflict) {
                    return res.status(409).json({
                        success: false,
                        message: 'Time slot not available',
                    });
                }
            }

            const updatedAppointment = await Appointment.findByIdAndUpdate(
                id,
                req.body,
                { new: true, runValidators: true }
            ).populate('patient', 'firstName lastName phone')
                .populate('doctor', 'email profile');

            return res.status(200).json({
                success: true,
                message: 'Appointment updated successfully',
                appointment: updatedAppointment,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    cancelAppointment: async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const appointment = await Appointment.findById(id);
            if (!appointment) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }

            if (appointment.status === 'cancelled') {
                return res.status(400).json({
                    success: false,
                    message: 'Appointment is already cancelled',
                });
            }

            if (appointment.status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel a completed appointment',
                });
            }

            appointment.status = 'cancelled';
            appointment.cancelledBy = req.user.userId;
            appointment.cancellationReason = reason;
            appointment.cancelledAt = new Date();

            await appointment.save();

            return res.status(200).json({
                success: true,
                message: 'Appointment cancelled successfully',
                appointment,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    completeAppointment: async (req, res) => {
        try {
            const { id } = req.params;
            const { diagnosis, prescription, notes } = req.body;

            const appointment = await Appointment.findById(id);
            if (!appointment) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }

            appointment.status = 'completed';
            if (diagnosis) appointment.diagnosis = diagnosis;
            if (prescription) appointment.prescription = prescription;
            if (notes) appointment.notes = notes;

            await appointment.save();

            return res.status(200).json({
                success: true,
                message: 'Appointment marked as completed',
                appointment,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },
};

export default appointmentController;