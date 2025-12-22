require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intakeai');
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@intake.ai';
        const adminPassword = 'admin1234';

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin user exists. RESETTING password and role...');
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            existingAdmin.role = 'admin';
            existingAdmin.hashedPassword = hashedPassword;
            await existingAdmin.save();
            console.log('Admin password and role updated successfully.');
        } else {
            console.log('Creating new admin user...');
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const newAdmin = new User({
                email: adminEmail,
                hashedPassword: hashedPassword,
                role: 'admin',
                profileData: {
                    fullName: 'System Administrator',
                    contactNumber: '000-000-0000'
                }
            });
            await newAdmin.save();
            console.log('Admin user created successfully.');
        }

        mongoose.disconnect();
        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
