import jwt from 'jsonwebtoken';
import User from '../Models/userModel.js';
import { registerSchema, loginSchema, verifyCodeSchema } from '../middlewares/validator.js';
import { doHash, doHashValidation, hmacProcess } from '../utils/hashing.js';
import tronsport from '../middlewares/sendMail.js';

const authController = {
    register: async (req, res) => {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Le corps de la requête doit être un objet JSON (Content-Type: application/json).',
            });
        }

        const { error } = registerSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const msgs = error.details.map(d => d.message);
            return res.status(400).json({ success: false, message: msgs.join(', ') });
        }

        const { name, email, password, role } = req.body;

        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(401).json({
                    success: false,
                    message: 'Email already exists',
                });
            }

            const hashedPassword = await doHash(password, 12);

            // Définir le rôle (patient par défaut)
            const userRole = role || 'patient';

            const newUser = new User({
                name,
                email,
                password: hashedPassword,
                role: userRole,
            });

            const result = await newUser.save();
            result.password = undefined;

            return res.status(201).json({
                success: true,
                message: 'User registered successfully',
                result,
            });
        } catch (err) {
            console.error(err);
            const msg = process.env.NODE_ENV === 'production' ? 'Server error' : (err.message || String(err));
            return res.status(500).json({ success: false, message: msg });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;
        try {
            const { error } = loginSchema.validate({ email, password });
            if (error) {
                const msgs = error.details.map(d => d.message);
                return res.status(400).json({ success: false, message: msgs.join(', ') });
            }

            const existingUser = await User.findOne({ email }).select('+password');
            if (!existingUser) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            // Vérifier si le compte est actif
            if (!existingUser.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Account suspended. Contact administrator.'
                });
            }

            const result = await doHashValidation(password, existingUser.password);
            if (!result) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const token = jwt.sign({
                userId: existingUser._id,
                email: existingUser.email,
                verified: existingUser.verified,
                role: existingUser.role,
            },
                process.env.TOKEN_SECRET, {
                expiresIn: '8h',
            });

            res.cookie('Authorization', 'Bearer' + token, {
                expires: new Date(Date.now() + 8 * 3600000),
                httpOnly: process.env.NODE_ENV === 'production',
                secure: process.env.NODE_ENV === 'production'
            }).json({
                success: true,
                token,
                message: 'User logged in successfully',
                user: {
                    id: existingUser._id,
                    email: existingUser.email,
                    role: existingUser.role,
                    verified: existingUser.verified,
                },
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    logout: async (req, res) => {
        res.clearCookie('Authorization').status(200).json({
            success: true,
            message: 'User logged out successfully'
        });
    },

    sendVerificationCode: async (req, res) => {
        const { email } = req.body;
        try {
            const existingUser = await User.findOne({ email });
            if (!existingUser) {
                return res.status(404).json({ success: false, message: 'User does not exist!' });
            }
            if (existingUser.verified) {
                return res.status(400).json({ success: false, message: 'User already verified!' });
            }

            const codeValue = Math.floor(100000 + Math.random() * 900000).toString();

            let info = await tronsport.sendMail({
                from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
                to: existingUser.email,
                subject: 'Verification Code - CareFlow',
                html: `
                    <h2>Email Verification</h2>
                    <p>Your verification code is: <strong>${codeValue}</strong></p>
                    <p>This code will expire in 15 minutes.</p>
                    <p>If you didn't request this code, please ignore this email.</p>
                `
            });

            if (info.accepted[0] === existingUser.email) {
                const hashedValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
                existingUser.verificationCode = hashedValue;
                existingUser.verificationCodeValidation = Date.now();
                await existingUser.save();
                return res.status(200).json({
                    success: true,
                    message: 'Verification code sent to your email'
                });
            }
            return res.status(500).json({ success: false, message: 'Error sending email' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    verifyEmail: async (req, res) => {
        const { email, code } = req.body;
        try {
            const { error } = verifyCodeSchema.validate({ email, code });
            if (error) {
                const msgs = error.details.map(d => d.message);
                return res.status(400).json({ success: false, message: msgs.join(', ') });
            }

            const existingUser = await User.findOne({ email }).select('+verificationCode +verificationCodeValidation');
            if (!existingUser) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (existingUser.verified) {
                return res.status(400).json({ success: false, message: 'User already verified' });
            }

            if (!existingUser.verificationCode) {
                return res.status(400).json({ success: false, message: 'No verification code found. Please request a new one.' });
            }

            // Vérifier l'expiration (15 minutes)
            const expirationTime = 15 * 60 * 1000;
            if (Date.now() - existingUser.verificationCodeValidation > expirationTime) {
                return res.status(400).json({
                    success: false,
                    message: 'Verification code expired. Please request a new one.'
                });
            }

            const hashedCode = hmacProcess(code, process.env.HMAC_VERIFICATION_CODE_SECRET);

            if (hashedCode === existingUser.verificationCode) {
                existingUser.verified = true;
                existingUser.verificationCode = undefined;
                existingUser.verificationCodeValidation = undefined;
                await existingUser.save();

                return res.status(200).json({
                    success: true,
                    message: 'Email verified successfully'
                });
            }

            return res.status(400).json({ success: false, message: 'Invalid verification code' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Obtenir le profil de l'utilisateur connecté
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            return res.status(200).json({
                success: true,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    verified: user.verified,
                    isActive: user.isActive,
                    profile: user.profile,
                    createdAt: user.createdAt,
                },
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },
};

export default authController;