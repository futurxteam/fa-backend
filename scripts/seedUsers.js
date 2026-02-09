import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const seedUsers = async () => {
    await connectDB();

    const users = [
        {
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin',
        },
        {
            name: 'Faculty User',
            email: 'faculty@example.com',
            password: 'password123',
            role: 'faculty',
        },
        {
            name: 'Student User',
            email: 'student@example.com',
            password: 'password123',
            role: 'student',
        },
    ];

    try {
        for (const userData of users) {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                const user = new User(userData);
                await user.save();
                console.log(`User created: ${userData.email} (${userData.role})`);
            } else {
                console.log(`User already exists: ${userData.email}`);
            }
        }
        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding users:', err.message);
        process.exit(1);
    }
};

seedUsers();
