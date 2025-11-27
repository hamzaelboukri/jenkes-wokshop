import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
    consultation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consultation',
        required: [true, 'Consultation is required'],
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient is required'],
    },
    prescriber: {                                  // <-- ajouté
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    pharmacy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: false,
    },
    medications: [{
        name: {
            type: String,
            required: [true, 'Medication name is required'],
        },
        genericName: String,
        dosage: {
            type: String,
            required: [true, 'Dosage is required'],
        },
        unit: {
            type: String,
            required: true,
            enum: ['mg', 'g', 'ml', 'mcg', 'units', 'drops', '%'],
        },
        route: {
            type: String,
            required: true,
            enum: ['oral', 'topical', 'intravenous', 'intramuscular', 'subcutaneous', 'rectal', 'inhalation', 'ophthalmic', 'otic', 'nasal'],
        },
        frequency: {
            type: String,
            required: [true, 'Frequency is required'],
        },
        duration: {
            value: {
                type: Number,
                required: true,
            },
            unit: {
                type: String,
                required: true,
                enum: ['days', 'weeks', 'months'],
            },
        },
        instructions: {
            type: String,
            maxlength: 500,
        },
        quantity: {
            type: Number,
            required: true,
        },
        refills: {
            type: Number,
            default: 0,
            min: 0,
            max: 12,
        },
    }],
    status: {
        type: String,
        enum: ['draft', 'signed', 'sent', 'dispensed', 'cancelled', 'expired'],
        default: 'draft',
    },
    signedAt: {
        type: Date,
    },
    validUntil: {
        type: Date,
        required: true,
    },
    dispensedAt: {
        type: Date,
    },
    dispensedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Pharmacien
    },
    notes: {
        type: String,
        maxlength: 1000,
    },
    cancellationReason: {
        type: String,
    },
}, {
    timestamps: true,
});


prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });
prescriptionSchema.index({ pharmacy: 1, status: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ validUntil: 1 });

prescriptionSchema.methods.isExpired = function () {
    return this.validUntil < new Date();
};

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;