import User from '../Models/userModel.js';
import { doHash } from '../utils/hashing.js';
import { createUserSchema, updateUserSchema } from '../middlewares/validator.js';

const userController = {
    createUser: async (req, res) => {
        try {
            const { error } = createUserSchema.validate(req.body, { abortEarly: false });
            if (error) {
                const msgs = error.details.map(d => d.message);
                return res.status(400).json({ success: false, message: msgs.join(', ') });
            }

            const { email, password, role, profile } = req.body;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists',
                });
            }

            const hashedPassword = await doHash(password, 12);

            const newUser = new User({
                email,
                password: hashedPassword,
                role: role || 'patient',
                profile: profile || {},
                verified: true, // Admin créé = auto-vérifié
            });

            await newUser.save();
            newUser.password = undefined;

            return res.status(201).json({
                success: true,
                message: 'User created successfully',
                user: newUser,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const { role, isActive, verified, page = 1, limit = 10, search } = req.query;

            const filter = {};
            if (role) filter.role = role;
            if (isActive !== undefined) filter.isActive = isActive === 'true';
            if (verified !== undefined) filter.verified = verified === 'true';
            if (search) {
                filter.$or = [
                    { email: { $regex: search, $options: 'i' } },
                    { 'profile.firstName': { $regex: search, $options: 'i' } },
                    { 'profile.lastName': { $regex: search, $options: 'i' } },
                ];
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const users = await User.find(filter)
                .select('-password')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 });

            const total = await User.countDocuments(filter);

            return res.status(200).json({
                success: true,
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalUsers: total,
                    limit: parseInt(limit),
                },
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getUserById: async (req, res) => {
        try {
            const { id } = req.params;

            const user = await User.findById(id).select('-password');
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            return res.status(200).json({
                success: true,
                user,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { error } = updateUserSchema.validate(req.body, { abortEarly: false });
            
            if (error) {
                const msgs = error.details.map(d => d.message);
                return res.status(400).json({ success: false, message: msgs.join(', ') });
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Empêcher la modification du rôle admin par un non-admin
            if (req.body.role && req.user.role !== 'admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only admins can change user roles' 
                });
            }

            const updateData = { ...req.body };
            
            // Si le mot de passe est fourni, le hasher
            if (updateData.password) {
                updateData.password = await doHash(updateData.password, 12);
            }

            const updatedUser = await User.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select('-password');

            return res.status(200).json({
                success: true,
                message: 'User updated successfully',
                user: updatedUser,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    suspendUser: async (req, res) => {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (user.role === 'admin' && req.user.userId !== user._id.toString()) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Cannot suspend another admin account' 
                });
            }

            user.isActive = false;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'User suspended successfully',
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    reactivateUser: async (req, res) => {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            user.isActive = true;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'User reactivated successfully',
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (user.role === 'admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Cannot delete admin accounts' 
                });
            }

            await User.findByIdAndDelete(id);

            return res.status(200).json({
                success: true,
                message: 'User deleted successfully',
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    },
};

export default userController;