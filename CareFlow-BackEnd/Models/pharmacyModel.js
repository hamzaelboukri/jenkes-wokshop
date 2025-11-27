import mongoose from 'mongoose';

const pharmacySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Pharmacy name is required'],
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
    onCallPhone: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isPartner: {
        type: Boolean,
        default: true,
    },
    services: [{
        type: String,
        enum: ['delivery', 'consultation', 'vaccination', 'covid-test', 'blood-pressure-check'],
    }],
    manager: {
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
pharmacySchema.index({ name: 'text' });
pharmacySchema.index({ 'address.city': 1 });
pharmacySchema.index({ isActive: 1, isPartner: 1 });

const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);

export default Pharmacy;