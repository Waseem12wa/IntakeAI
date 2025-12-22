require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intakeai');
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ email: 'admin@intake.ai' });
        if (admin) {
            console.log('Admin user found:');
            console.log('ID:', admin._id);
            console.log('Email:', admin.email);
            console.log('Role:', admin.role);
            console.log('Hashed Password:', admin.hashedPassword);
        } else {
            console.log('Admin user NOT found.');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error checking admin:', error);
    }
};

checkAdmin();
