import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        unique: [true, 'Email already exists'],
        minlenght: [5, 'Email must be at least 5 characters long'],
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        trim: true,
        select: false,
    },
    role: {
        type: String,
        enum: ['patient', 'medecin', 'infirmier', 'secretaire', 'admin', 'pharmacien', 'labo'],
        default: 'patient',
        required: true,
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        select: false,
    },
    verificationCodeValidation: {
        type: String,
        select: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    forgotPasswordCode: {
        type: String,
        select: false,
    },
    forgotPasswordCodeValidation: {
        type: Number,
        select: false,
    },
    profile: {
        firstName: String,
        lastName: String,
        phone: String,
        address: String,
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
        },
    },
}, {
    timestamps: true
});
export default mongoose.model('User', userSchema);