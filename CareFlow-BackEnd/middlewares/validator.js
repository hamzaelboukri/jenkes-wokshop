import Joi from 'joi';

export const registerSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required(),
    email: Joi.string()
        .email({ tlds: { allow: ['com', 'net', 'org', 'ma'] } })
        .min(5)
        .max(60)
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
    password: Joi.string()
        .min(8)
        .max(128)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'any.required': 'Password is required',
        }),
    role: Joi.string()
        .valid('patient', 'medecin', 'infirmier', 'secretaire', 'admin', 'pharmacien', 'labo')
        .optional()
        .messages({
            'any.only': 'Role must be one of: patient, medecin, infirmier, secretaire',
        }),
});

export const loginSchema = Joi.object({
    email: Joi.string()
        .email({ tlds: { allow: ['com', 'net', 'org', 'ma'] } })
        .min(5)
        .max(60)
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Password is required',
        }),
});

export const verifyCodeSchema = Joi.object({
    email: Joi.string()
        .email({ tlds: { allow: ['com', 'net', 'org', 'ma'] } })
        .required(),
    code: Joi.string()
        .length(6)
        .pattern(/^[0-9]+$/)
        .required()
        .messages({
            'string.length': 'Verification code must be 6 digits',
            'string.pattern.base': 'Verification code must contain only numbers',
            'any.required': 'Verification code is required',
        }),
});

export const createUserSchema = Joi.object({
    email: Joi.string()
        .email({ tlds: { allow: ['com', 'net', 'org', 'ma'] } })
        .required(),
    password: Joi.string()
        .min(8)
        .max(128)
        .required(),
    role: Joi.string()
        .valid('patient', 'medecin', 'infirmier', 'secretaire', 'admin')
        .required(),
    profile: Joi.object({
        firstName: Joi.string().max(50).optional(),
        lastName: Joi.string().max(50).optional(),
        phone: Joi.string().max(20).optional(),
        address: Joi.string().max(200).optional(),
        dateOfBirth: Joi.date().optional(),
        gender: Joi.string().valid('male', 'female', 'other').optional(),
    }).optional(),
});

export const updateUserSchema = Joi.object({
    email: Joi.string()
        .email({ tlds: { allow: ['com', 'net', 'org', 'ma'] } })
        .optional(),
    password: Joi.string()
        .min(8)
        .max(128)
        .optional(),
    role: Joi.string()
        .valid('patient', 'medecin', 'infirmier', 'secretaire', 'admin')
        .optional(),
    profile: Joi.object({
        firstName: Joi.string().max(50).optional(),
        lastName: Joi.string().max(50).optional(),
        phone: Joi.string().max(20).optional(),
        address: Joi.string().max(200).optional(),
        dateOfBirth: Joi.date().optional(),
        gender: Joi.string().valid('male', 'female', 'other').optional(),
    }).optional(),
    isActive: Joi.boolean().optional(),
    verified: Joi.boolean().optional(),
}).min(1);

// -----------------------------------------------------------------
export const createPatientSchema = Joi.object({
    userId: Joi.string().required().messages({
        'any.required': 'User ID is required',
    }),
    firstName: Joi.string().trim().max(50).required().messages({
        'any.required': 'First name is required',
    }),
    lastName: Joi.string().trim().max(50).required().messages({
        'any.required': 'Last name is required',
    }),
    dateOfBirth: Joi.date().max('now').required().messages({
        'any.required': 'Date of birth is required',
        'date.max': 'Date of birth cannot be in the future',
    }),
    gender: Joi.string().valid('male', 'female', 'other').required().messages({
        'any.required': 'Gender is required',
    }),
    phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).required().messages({
        'any.required': 'Phone number is required',
        'string.pattern.base': 'Please provide a valid phone number',
    }),
    address: Joi.object({
        street: Joi.string().max(200).optional(),
        city: Joi.string().max(100).optional(),
        zipCode: Joi.string().max(20).optional(),
        country: Joi.string().max(100).optional(),
    }).optional(),
    emergencyContact: Joi.object({
        name: Joi.string().max(100).optional(),
        relationship: Joi.string().max(50).optional(),
        phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional(),
    }).optional(),
    medicalInfo: Joi.object({
        bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
        allergies: Joi.array().items(Joi.string().max(100)).optional(),
        chronicDiseases: Joi.array().items(Joi.string().max(100)).optional(),
        currentMedications: Joi.array().items(
            Joi.object({
                name: Joi.string().max(100).required(),
                dosage: Joi.string().max(50).optional(),
                frequency: Joi.string().max(50).optional(),
            })
        ).optional(),
        medicalHistory: Joi.array().items(
            Joi.object({
                condition: Joi.string().max(200).required(),
                diagnosedDate: Joi.date().optional(),
                notes: Joi.string().max(500).optional(),
            })
        ).optional(),
    }).optional(),
    insurance: Joi.object({
        provider: Joi.string().max(100).optional(),
        policyNumber: Joi.string().max(100).optional(),
        validUntil: Joi.date().optional(),
    }).optional(),
    preferences: Joi.object({
        preferredLanguage: Joi.string().valid('fr', 'ar', 'en').optional(),
        emailNotifications: Joi.boolean().optional(),
        smsNotifications: Joi.boolean().optional(),
    }).optional(),
    consent: Joi.object({
        dataSharing: Joi.boolean().optional(),
        treatmentConsent: Joi.boolean().optional(),
        consentDate: Joi.date().optional(),
    }).optional(),
});

export const updatePatientSchema = Joi.object({
    firstName: Joi.string().trim().max(50).optional(),
    lastName: Joi.string().trim().max(50).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional(),
    address: Joi.object({
        street: Joi.string().max(200).optional(),
        city: Joi.string().max(100).optional(),
        zipCode: Joi.string().max(20).optional(),
        country: Joi.string().max(100).optional(),
    }).optional(),
    emergencyContact: Joi.object({
        name: Joi.string().max(100).optional(),
        relationship: Joi.string().max(50).optional(),
        phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional(),
    }).optional(),
    medicalInfo: Joi.object({
        bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
        allergies: Joi.array().items(Joi.string().max(100)).optional(),
        chronicDiseases: Joi.array().items(Joi.string().max(100)).optional(),
        currentMedications: Joi.array().items(
            Joi.object({
                name: Joi.string().max(100).required(),
                dosage: Joi.string().max(50).optional(),
                frequency: Joi.string().max(50).optional(),
            })
        ).optional(),
        medicalHistory: Joi.array().items(
            Joi.object({
                condition: Joi.string().max(200).required(),
                diagnosedDate: Joi.date().optional(),
                notes: Joi.string().max(500).optional(),
            })
        ).optional(),
    }).optional(),
    insurance: Joi.object({
        provider: Joi.string().max(100).optional(),
        policyNumber: Joi.string().max(100).optional(),
        validUntil: Joi.date().optional(),
    }).optional(),
    preferences: Joi.object({
        preferredLanguage: Joi.string().valid('fr', 'ar', 'en').optional(),
        emailNotifications: Joi.boolean().optional(),
        smsNotifications: Joi.boolean().optional(),
    }).optional(),
    consent: Joi.object({
        dataSharing: Joi.boolean().optional(),
        treatmentConsent: Joi.boolean().optional(),
        consentDate: Joi.date().optional(),
    }).optional(),
}).min(1);

export const createAppointmentSchema = Joi.object({
    patientId: Joi.string().required().messages({
        'any.required': 'Patient ID is required',
    }),
    doctorId: Joi.string().required().messages({
        'any.required': 'Doctor ID is required',
    }),
    appointmentDate: Joi.date().min('now').required().messages({
        'any.required': 'Appointment date is required',
        'date.min': 'Appointment date cannot be in the past',
    }),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
        'any.required': 'Start time is required',
        'string.pattern.base': 'Start time must be in HH:MM format (e.g., 09:00)',
    }),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
        'any.required': 'End time is required',
        'string.pattern.base': 'End time must be in HH:MM format (e.g., 09:30)',
    }),
    reason: Joi.string().max(500).required().messages({
        'any.required': 'Reason for appointment is required',
    }),
    type: Joi.string().valid('consultation', 'follow-up', 'emergency', 'checkup', 'vaccination', 'other').optional(),
    notes: Joi.string().max(1000).optional(),
});

export const updateAppointmentSchema = Joi.object({
    appointmentDate: Joi.date().optional(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    reason: Joi.string().max(500).optional(),
    type: Joi.string().valid('consultation', 'follow-up', 'emergency', 'checkup', 'vaccination', 'other').optional(),
    status: Joi.string().valid('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show').optional(),
    notes: Joi.string().max(1000).optional(),
    diagnosis: Joi.string().max(1000).optional(),
    prescription: Joi.string().max(2000).optional(),
}).min(1);

export default { registerSchema, loginSchema, verifyCodeSchema, createUserSchema, updateUserSchema, createPatientSchema, updatePatientSchema, createAppointmentSchema, updateAppointmentSchema }