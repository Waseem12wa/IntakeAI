const Job = require('../models/Job');
const EmployerProfile = require('../models/EmployerProfile');
const EmployeeProfile = require('../models/EmployeeProfile');

// Create a new job posting
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      email,
      location,
      type,
      salary,
      description,
      requirements,
      skills,
      benefits,
      remote,
      experience
    } = req.body;


    // Get userId from authenticated request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to post a job'
      });
    }

    // Create job with userId
    const job = new Job({
      userId: req.user.id,
      title,
      company,
      email,
      location,
      type,
      salary,
      description,
      requirements,
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : []),
      benefits,
      remote,
      experience,
      isActive: true
    });

    await job.save();

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: job
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating job posting',
      error: error.message
    });
  }
};

// Get all jobs with filters
exports.getAllJobs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      location, 
      type, 
      remote, 
      experience,
      skills 
    } = req.query;

    // Filter by userId - users only see their own jobs
    let query = { isActive: true };
    
    if (req.user && req.user.id) {
      query.userId = req.user.id;
    } else {
      // If not authenticated, return empty results
      return res.status(200).json({
        success: true,
        data: [],
        totalPages: 0,
        currentPage: parseInt(page),
        totalJobs: 0
      });
    }

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add other filters
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (type) {
      query.type = type;
    }
    if (remote) {
      query.remote = remote;
    }
    if (experience) {
      query.experience = experience;
    }
    if (skills) {
      query.skills = { $in: skills.split(',').map(skill => new RegExp(skill.trim(), 'i')) };
    }

    const jobs = await Job.find(query)
      .populate('employerId', 'companyName industry companySize')
      .sort({ postedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobs,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalJobs: count
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
};

// Get job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employerId', 'companyName industry companySize description benefits')
      .populate('applications.employeeId', 'firstName lastName title skills');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Verify user owns this job (unless admin)
    if (req.user && req.user.id) {
      if (job.userId.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this job'
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job',
      error: error.message
    });
  }
};

// Apply for a job
exports.applyForJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const employeeId = req.user.id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user has employee profile
    const employeeProfile = await EmployeeProfile.findOne({ userId: employeeId });
    if (!employeeProfile) {
      return res.status(400).json({
        success: false,
        message: 'Employee profile not found. Please create your profile first.'
      });
    }

    // Check if already applied
    const alreadyApplied = job.applications.some(
      app => app.employeeId.toString() === employeeProfile._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Add application
    job.applications.push({
      employeeId: employeeProfile._id,
      status: 'Pending'
    });

    await job.save();

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying for job',
      error: error.message
    });
  }
};

// Get jobs posted by employer (now using userId directly)
exports.getEmployerJobs = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get jobs by userId directly
    const jobs = await Job.find({ userId: req.user.id })
      .populate('applications.employeeId', 'firstName lastName title skills email')
      .sort({ postedAt: -1 });

    res.status(200).json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employer jobs',
      error: error.message
    });
  }
};

// Update application status (for employers)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { jobId, applicationId, status } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Verify employer owns this job
    const employerProfile = await EmployerProfile.findOne({ userId: req.user.id });
    if (job.employerId.toString() !== employerProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this application'
      });
    }

    // Update application status
    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    await job.save();

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully'
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
};

// Get applications for employee
exports.getEmployeeApplications = async (req, res) => {
  try {
    const employeeProfile = await EmployeeProfile.findOne({ userId: req.user.id });
    if (!employeeProfile) {
      return res.status(400).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const jobs = await Job.find({
      'applications.employeeId': employeeProfile._id
    }).populate('employerId', 'companyName industry');

    const applications = jobs.map(job => {
      const application = job.applications.find(
        app => app.employeeId.toString() === employeeProfile._id.toString()
      );
      return {
        job: {
          _id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          postedAt: job.postedAt
        },
        application: application
      };
    });

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching employee applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};
