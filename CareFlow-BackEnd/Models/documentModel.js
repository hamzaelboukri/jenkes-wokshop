import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient is required'],
    },
    consultation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consultation',
        required: false, // Peut être null pour documents indépendants
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Uploader is required'],
    },
    fileName: {
        type: String,
        required: [true, 'File name is required'],
    },
    originalFileName: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String,
        required: [true, 'File URL is required'],
    },
    fileSize: {
        type: Number,
        required: true, // En bytes
    },
    mimeType: {
        type: String,
        required: true,
        enum: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    },
    category: {
        type: String,
        required: true,
        enum: [
            'imaging', // Radiologie, IRM, Scanner
            'lab-report', // Rapports de laboratoire
            'prescription', // Ordonnances
            'medical-certificate', // Certificats médicaux
            'vaccination-record', // Carnets de vaccination
            'discharge-summary', // Comptes rendus d'hospitalisation
            'referral', // Lettres de référence
            'consent-form', // Formulaires de consentement
            'insurance', // Documents d'assurance
            'other'
        ],
    },
    description: {
        type: String,
        maxlength: 500,
    },
    tags: [{
        type: String,
        trim: true,
    }],
    metadata: {
        documentDate: Date, // Date du document (ex: date de l'examen)
        expiryDate: Date, // Date d'expiration (si applicable)
    },
    isConfidential: {
        type: Boolean,
        default: false,
    },
    accessLog: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        accessedAt: {
            type: Date,
            default: Date.now,
        },
        action: {
            type: String,
            enum: ['viewed', 'downloaded'],
        },
    }],
}, {
    timestamps: true,
});

// Index
documentSchema.index({ patient: 1, createdAt: -1 });
documentSchema.index({ consultation: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ uploadedBy: 1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;
