import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient is required'],
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Doctor is required'],
    },
    appointmentDate: {
        type: Date,
        required: [true, 'Appointment date is required'],
    },
    startTime: {
        type: String, // Format: "09:00"
        required: [true, 'Start time is required'],
    },
    endTime: {
        type: String, // Format: "09:30"
        required: [true, 'End time is required'],
    },
    duration: {
        type: Number, // En minutes
        default: 30,
    },
    reason: {
        type: String,
        required: [true, 'Reason for appointment is required'],
        maxlength: 500,
    },
    type: {
        type: String,
        enum: ['consultation', 'follow-up', 'emergency', 'checkup', 'vaccination', 'other'],
        default: 'consultation',
    },
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled',
    },
    notes: {
        type: String,
        maxlength: 1000,
    },
    prescription: {
        type: String,
    },
    diagnosis: {
        type: String,
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    cancellationReason: {
        type: String,
    },
    cancelledAt: {
        type: Date,
    },
    reminderSent: {
        type: Boolean,
        default: false,
    },
    reminderSentAt: {
        type: Date,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

// Index pour améliorer les performances
appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1, startTime: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1 });

// Méthode statique pour vérifier les conflits
appointmentSchema.statics.checkConflict = async function(doctorId, appointmentDate, startTime, endTime, excludeId = null) {
    const query = {
        doctor: doctorId,
        appointmentDate: new Date(appointmentDate),
        status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
        $or: [
            {
                $and: [
                    { startTime: { $lte: startTime } },
                    { endTime: { $gt: startTime } }
                ]
            },
            {
                $and: [
                    { startTime: { $lt: endTime } },
                    { endTime: { $gte: endTime } }
                ]
            },
            {
                $and: [
                    { startTime: { $gte: startTime } },
                    { endTime: { $lte: endTime } }
                ]
            }
        ]
    };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    const conflict = await this.findOne(query);
    return !!conflict;
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;