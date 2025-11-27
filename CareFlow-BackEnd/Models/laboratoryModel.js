import mongoose from 'mongoose';

const laboratorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Laboratory name is required'],
        trim: true,
    },
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        unique: true,
    },
    address: {
        street: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        zipCode: String,
        country: {
            type: String,
            default: 'Morocco',
        },
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
    },
    workingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String },
    },
    specializations: [{
        type: String,
        enum: [
            'hematology',
            'biochemistry',
            'microbiology',
            'immunology',
            'pathology',
            'genetics',
            'toxicology',
            'radiology'
        ],
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    isPartner: {
        type: Boolean,
        default: true,
    },
    accreditations: [{
        name: String,
        issuedBy: String,
        validUntil: Date,
    }],
    director: {
        name: String,
        phone: String,
        email: String,
    },
    notes: {
        type: String,
        maxlength: 1000,
    },
}, {
    timestamps: true,
});

// Index
laboratorySchema.index({ name: 'text' });
laboratorySchema.index({ 'address.city': 1 });
laboratorySchema.index({ isActive: 1, isPartner: 1 });
laboratorySchema.index({ specializations: 1 });

const Laboratory = mongoose.model('Laboratory', laboratorySchema);

export default Laboratory;