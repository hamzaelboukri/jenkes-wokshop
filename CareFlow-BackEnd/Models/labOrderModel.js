import mongoose from 'mongoose';

const labOrderSchema = new mongoose.Schema({
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
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Doctor is required'],
    },
    laboratory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Laboratory',
        required: false, // Peut être assigné plus tard
    },
    tests: [{
        code: String, // LOINC code
        name: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ['hematology', 'biochemistry', 'microbiology', 'immunology', 'pathology', 'genetics', 'toxicology', 'other'],
        },
        specimenType: {
            type: String,
            enum: ['blood', 'urine', 'stool', 'saliva', 'tissue', 'swab', 'other'],
        },
        instructions: String,
    }],
    priority: {
        type: String,
        enum: ['routine', 'urgent', 'stat'], // stat = immédiat
        default: 'routine',
    },
    clinicalInfo: {
        type: String,
        maxlength: 1000,
    },
    status: {
        type: String,
        enum: ['ordered', 'sample-collected', 'in-progress', 'completed', 'cancelled', 'validated'],
        default: 'ordered',
    },
    orderedAt: {
        type: Date,
        default: Date.now,
    },
    sampleCollectedAt: {
        type: Date,
    },
    completedAt: {
        type: Date,
    },
    validatedAt: {
        type: Date,
    },
    validatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Responsable labo
    },
    results: [{
        testName: String,
        value: String,
        unit: String,
        referenceRange: String,
        flag: {
            type: String,
            enum: ['normal', 'low', 'high', 'critical', 'abnormal'],
            default: 'normal',
        },
        notes: String,
    }],
    reportUrl: {
        type: String, // URL S3 du rapport PDF
    },
    reportUploadedAt: {
        type: Date,
    },
    notes: {
        type: String,
        maxlength: 2000,
    },
    cancellationReason: {
        type: String,
    },
}, {
    timestamps: true,
});

// Index
labOrderSchema.index({ patient: 1, orderedAt: -1 });
labOrderSchema.index({ doctor: 1, orderedAt: -1 });
labOrderSchema.index({ laboratory: 1, status: 1 });
labOrderSchema.index({ status: 1 });
labOrderSchema.index({ priority: 1 });

const LabOrder = mongoose.model('LabOrder', labOrderSchema);

export default LabOrder;