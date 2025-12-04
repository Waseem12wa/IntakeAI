const EmployeeProfile = require('../models/EmployeeProfile');
const EmployerProfile = require('../models/EmployerProfile');
const User = require('../models/User');

// Create Employee Profile
exports.createEmployeeProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      location,
      title,
      experience,
      skills,
      bio,
      jobType,
      remote,
      linkedin,
      portfolio,
      salary
    } = req.body;

    // Check if profile already exists for this user
    const existingProfile = await EmployeeProfile.findOne({ email });
    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already exists for this email' });
    }

    // Create new employee profile
    const employeeProfile = new EmployeeProfile({
      userId: req.user.id, // Assuming you have user authentication middleware
      firstName,
      lastName,
      email,
      phone,
      location,
      title,
      experience,
      skills,
      bio,
      jobType,
      remote,
      linkedin,
      portfolio,
      salary
    });

    await employeeProfile.save();

    res.status(201).json({
      success: true,
      message: 'Employee profile created successfully',
      data: employeeProfile
    });
  } catch (error) {
    console.error('Error creating employee profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating employee profile',
      error: error.message
    });
  }
};

// Create Employer Profile
exports.createEmployerProfile = async (req, res) => {
  try {
    const {
      companyName,
      contactName,
      email,
      phone,
      website,
      industry,
      companySize,
      location,
      companyType,
      hiringNeeds,
      description,
      benefits
    } = req.body;

    // Check if profile already exists for this email
    const existingProfile = await EmployerProfile.findOne({ email });
    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already exists for this email' });
    }

    // Create new employer profile
    const employerProfile = new EmployerProfile({
      userId: req.user.id, // Assuming you have user authentication middleware
      companyName,
      contactName,
      email,
      phone,
      website,
      industry,
      companySize,
      location,
      companyType,
      hiringNeeds,
      description,
      benefits
    });

    await employerProfile.save();

    res.status(201).json({
      success: true,
      message: 'Employer profile created successfully',
      data: employerProfile
    });
  } catch (error) {
    console.error('Error creating employer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating employer profile',
      error: error.message
    });
  }
};

// Get Employee Profile
exports.getEmployeeProfile = async (req, res) => {
  try {
    const profile = await EmployeeProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee profile',
      error: error.message
    });
  }
};

// Get Employer Profile
exports.getEmployerProfile = async (req, res) => {
  try {
    const profile = await EmployerProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Employer profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching employer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employer profile',
      error: error.message
    });
  }
};

// Update Employee Profile
exports.updateEmployeeProfile = async (req, res) => {
  try {
    const updatedProfile = await EmployeeProfile.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error updating employee profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employee profile',
      error: error.message
    });
  }
};

// Update Employer Profile
exports.updateEmployerProfile = async (req, res) => {
  try {
    const updatedProfile = await EmployerProfile.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: 'Employer profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employer profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error updating employer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employer profile',
      error: error.message
    });
  }
};

// Get all employee profiles (for employers to browse)
exports.getAllEmployeeProfiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, skills, location, experience } = req.query;
    
    let query = { isActive: true };
    
    // Add filters
    if (skills) {
      query.skills = { $regex: skills, $options: 'i' };
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (experience) {
      query.experience = experience;
    }

    const profiles = await EmployeeProfile.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await EmployeeProfile.countDocuments(query);

    res.status(200).json({
      success: true,
      data: profiles,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalProfiles: count
    });
  } catch (error) {
    console.error('Error fetching employee profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee profiles',
      error: error.message
    });
  }
};

// Get all employer profiles (for employees to browse)
exports.getAllEmployerProfiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, industry, location, companySize } = req.query;
    
    let query = { isActive: true };
    
    // Add filters
    if (industry) {
      query.industry = industry;
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (companySize) {
      query.companySize = companySize;
    }

    const profiles = await EmployerProfile.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await EmployerProfile.countDocuments(query);

    res.status(200).json({
      success: true,
      data: profiles,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalProfiles: count
    });
  } catch (error) {
    console.error('Error fetching employer profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employer profiles',
      error: error.message
    });
  }
};
