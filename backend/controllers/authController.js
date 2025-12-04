const User = require('../models/User');
const bcrypt = require('bcrypt');

// Register user
exports.registerUser = async (req, res) => {
	try {
		const { email, password, fullName, contactNumber } = req.body;
		if (!email || !password || !fullName) {
			return res.status(400).json({ error: 'All required fields must be filled.' });
		}
		if (password.length < 6) {
			return res.status(400).json({ error: 'Password must be at least 6 characters.' });
		}
		const existing = await User.findOne({ email });
		if (existing) {
			return res.status(400).json({ error: 'Email already registered.' });
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		const user = new User({
			email,
			hashedPassword,
			profileData: { fullName, contactNumber },
			registrationDate: new Date(),
		});
		await user.save();
		
		// For demo: return success with a simple token (add JWT/session in production)
		const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');
		res.status(201).json({ 
			message: 'Registration successful.',
			token,
			user: { 
				email: user.email, 
				fullName: user.profileData.fullName,
				id: user._id
			}
		});
	} catch (err) {
		res.status(500).json({ error: 'Server error.' });
	}
};

// Login user
exports.loginUser = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ error: 'Email and password required.' });
		}
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ error: 'Invalid credentials.' });
		}
		const match = await bcrypt.compare(password, user.hashedPassword);
		if (!match) {
			return res.status(400).json({ error: 'Invalid credentials.' });
		}
		// For demo: return success with a simple token (add JWT/session in production)
		const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');
		res.json({ 
			message: 'Login successful.', 
			token,
			user: { 
				email: user.email, 
				fullName: user.profileData.fullName,
				id: user._id
			} 
		});
	} catch (err) {
		res.status(500).json({ error: 'Server error.' });
	}
};
