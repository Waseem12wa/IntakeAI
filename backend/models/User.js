// User model for MongoDB
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  hashedPassword: { type: String, required: true },
  profileData: {
    fullName: String,
    contactNumber: String,
    profilePicture: String
  },
  registrationDate: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

module.exports = mongoose.model('User', UserSchema);
