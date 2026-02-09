import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// @route   POST api/admin/add-faculty
// @desc    Add a new faculty user
// @access  Private/Admin
export const addFaculty = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // 1. Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // 2. Create user with faculty role
        // Note: The User model has a pre-save hook to hash the password
        user = new User({
            name,
            email,
            password,
            role: 'faculty',
        });

        await user.save();

        res.status(201).json({
            msg: 'Faculty user created successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET api/admin/faculties
// @desc    Get all faculty users
// @access  Private/Admin
export const getFaculties = async (req, res) => {
    try {
        const faculties = await User.find({ role: 'faculty' }).select('-password');
        res.json(faculties);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
