import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
    },
    address: {
        street: String,
        city: String,
        zipCode: String,
        country: { type: String, default: 'Morocco' },
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
    },
    medicalInfo: {
        bloodType: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        },
        allergies: [{
            type: String,
        }],
        chronicDiseases: [{
            type: String,
        }],
        currentMedications: [{
            name: String,
            dosage: String,
            frequency: String,
        }],
        medicalHistory: [{
            condition: String,
            diagnosedDate: Date,
            notes: String,
        }],
    },
    insurance: {
        provider: String,
        policyNumber: String,
        validUntil: Date,
    },
    preferences: {
        preferredLanguage: {
            type: String,
            default: 'fr',
        },
        emailNotifications: {
            type: Boolean,
            default: true,
        },
        smsNotifications: {
            type: Boolean,
            default: true,
        },
    },
    consent: {
        dataSharing: {
            type: Boolean,
            default: false,
        },
        treatmentConsent: {
            type: Boolean,
            default: false,
        },
        consentDate: Date,
    },
}, {
    timestamps: true,
});

// Index pour recherche rapide
patientSchema.index({ firstName: 'text', lastName: 'text' });
patientSchema.index({ phone: 1 });

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;