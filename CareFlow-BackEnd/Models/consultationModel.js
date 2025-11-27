import mongoose from "mongoose";
import Appointment from "./appointmentModel.js";
import Patient from "./patientModel.js";
const consultationSchema = new mongoose.Schema({
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: false, // optional if created without appointment
    },
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
    consultationDate: {
        type: Date,
        required: [true, 'Consultation date is required'],
        default: Date.now,
    },
    vitals: {
        bloodPressure: {
            systolic: { type: Number, min: 0, max: 300 },
            diastolic: { type: Number, min: 0, max: 200 },
        },
        heartRate: { type: Number, min: 0, max: 300 },
        temperature: { type: Number, min: 30, max: 45 }, // en Celsius
        weight: { type: Number, min: 0, max: 500 }, // en kg
        height: { type: Number, min: 0, max: 300 }, // en cm
        respiratoryRate: { type: Number, min: 0, max: 100 }, // par minute
        oxygenSaturation: { type: Number, min: 0, max: 100 }, // en pourcentage
        bmi: { type: Number, min: 0, max: 100 },
    },
    presentIllness: {
        type: String,
        maxlength: 2000,
    },
    physicalExamination: {
        type: String,
        maxlength: 2000,
    },
    diagnoses: [{
        type: String,
        description: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['primary', 'secondary', 'tertiary'],
            default: 'primary',
        },
    }],
    procedures: [{
        code: String,
        description: {
            type: String,
            required: true,
        },
        performedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    treatmentPlan: {
        type: String,
        maxlength: 2000,
    },
    notes: {
        type: String,
        maxlength: 2000,
    },
    followUpDate: {
        type: Date,
    },
    followUpInstructions: {
        type: String,
        maxlength: 2000,
    },
    status: {
        type: String,
        enum: ['in-progress', 'completed', 'cancelled'],
        default: 'in-progress',
    },
}, {
    timestamps: true,
});

consultationSchema.pre('save', async function (next) {
    if (this.vitals.weight && this.vitals.height) {
        const heightInMeters = this.vitals.height / 100;
        this.vitals.bmi = this.vitals.weight / (heightInMeters * heightInMeters).toFixed(2);
    }
    next();
});

const Consultation = mongoose.model('Consultation', consultationSchema);
export default Consultation;
