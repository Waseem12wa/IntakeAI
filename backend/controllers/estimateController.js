const PendingEstimate = require('../models/PendingEstimate');
const N8nProjectQuote = require('../models/N8nProjectQuote');

// Get all pending estimates for admin dashboard
const getPendingEstimates = async (req, res) => {
  try {
    const estimates = await PendingEstimate.find({ status: 'pending' }).populate('jobId');
    
    res.json({
      success: true,
      estimates: estimates
    });
  } catch (error) {
    console.error('Error fetching pending estimates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending estimates'
    });
  }
};

// Get all approved estimates for admin dashboard
const getApprovedEstimates = async (req, res) => {
  try {
    const estimates = await PendingEstimate.find({ 
      status: { $in: ['approved', 'edited'] } 
    }).populate('jobId').sort({ reviewedAt: -1 });
    
    res.json({
      success: true,
      estimates: estimates
    });
  } catch (error) {
    console.error('Error fetching approved estimates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approved estimates'
    });
  }
};

// Get single pending estimate with full details
const getPendingEstimateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const estimate = await PendingEstimate.findById(id).populate('jobId');
    
    if (!estimate) {
      return res.status(404).json({
        success: false,
        error: 'Estimate not found'
      });
    }
    
    res.json({
      success: true,
      estimate: estimate
    });
  } catch (error) {
    console.error('Error fetching pending estimate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending estimate'
    });
  }
};

// Admin approves estimate
const approveEstimate = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes, calculatedPrice, priceBreakdown } = req.body;

    // Validate required fields
    if (!calculatedPrice) {
      return res.status(400).json({
        success: false,
        error: 'Calculated price is required'
      });
    }

    // Prepare update data
    const updateData = {
      status: 'approved',
      adminNotes: adminNotes || '',
      calculatedPrice: calculatedPrice,
      priceBreakdown: priceBreakdown || {},
      reviewedAt: new Date(),
      adminId: 'admin' // You can change this to actual admin ID
    };

    // Update the estimate
    const estimate = await PendingEstimate.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('jobId');

    if (!estimate) {
      return res.status(404).json({
        success: false,
        error: 'Estimate not found'
      });
    }

    console.log('✅ Estimate approved successfully:', {
      id: estimate._id,
      status: estimate.status,
      calculatedPrice: estimate.calculatedPrice,
      jobTitle: estimate.jobId?.title
    });

    // Also update N8nProjectQuote if this is an n8n quote
    try {
      // Find corresponding N8nProjectQuote by userId with pending_approval status
      // This handles the case where the admin approved via the PendingEstimate system
      const n8nQuote = await N8nProjectQuote.findOne({
        userId: estimate.userId,
        status: 'pending_approval'
      }).sort({ createdAt: -1 }); // Get most recent pending quote

      if (n8nQuote) {
        console.log('🔄 Found corresponding N8nProjectQuote, updating...', {
          quoteId: n8nQuote._id,
          fileName: n8nQuote.fileName
        });

        // Update the N8nProjectQuote with approved status and price
        n8nQuote.status = 'approved';
        n8nQuote.adminNotes = adminNotes || '';
        n8nQuote.totalPrice = parseFloat(calculatedPrice);
        n8nQuote.adminId = 'admin';
        n8nQuote.reviewedAt = new Date();
        n8nQuote.priceBreakdown = {
          estimatedWorkHours: parseFloat(priceBreakdown?.estimatedWorkHours || 0),
          hourlyRate: parseFloat(priceBreakdown?.hourlyRate || 0),
          complexityFactor: parseFloat(priceBreakdown?.complexityFactor || 1),
          adminFee: parseFloat(priceBreakdown?.adminFee || 0),
          commission: parseFloat(priceBreakdown?.commission || 0),
          surcharges: parseFloat(priceBreakdown?.surcharges || 0),
          discounts: parseFloat(priceBreakdown?.discounts || 0)
        };
        
        await n8nQuote.save();
        
        console.log('✅ N8nProjectQuote updated successfully');
      }
    } catch (n8nError) {
      console.error('⚠️ Error updating N8nProjectQuote:', n8nError);
      // Don't fail the entire approval if N8nProjectQuote update fails
    }

    res.json({
      success: true,
      message: 'Estimate approved successfully',
      estimate: {
        _id: estimate._id,
        status: estimate.status,
        calculatedPrice: estimate.calculatedPrice,
        adminNotes: estimate.adminNotes,
        reviewedAt: estimate.reviewedAt,
        jobId: estimate.jobId
      }
    });
  } catch (error) {
    console.error('Error approving estimate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve estimate'
    });
  }
};

// Admin edits estimate
const editEstimate = async (req, res) => {
  try {
    const { id } = req.params;
    const { editedEstimate, adminNotes } = req.body;

    if (!editedEstimate) {
      return res.status(400).json({
        success: false,
        error: 'Edited estimate is required'
      });
    }

    const estimate = await PendingEstimate.findByIdAndUpdate(
      id,
      {
        status: 'edited',
        editedEstimate: editedEstimate,
        adminNotes: adminNotes || '',
        reviewedAt: new Date(),
        adminId: 'admin' // You can change this to actual admin ID
      },
      { new: true }
    ).populate('jobId');

    if (!estimate) {
      return res.status(404).json({
        success: false,
        error: 'Estimate not found'
      });
    }

    console.log('✅ Estimate edited successfully:', {
      id: estimate._id,
      status: estimate.status,
      jobTitle: estimate.jobId?.title
    });

    res.json({
      success: true,
      message: 'Estimate edited successfully',
      estimate: {
        _id: estimate._id,
        status: estimate.status,
        editedEstimate: estimate.editedEstimate,
        adminNotes: estimate.adminNotes,
        reviewedAt: estimate.reviewedAt,
        jobId: estimate.jobId
      }
    });
  } catch (error) {
    console.error('Error editing estimate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to edit estimate'
    });
  }
};

// Create pending estimate (when user submits for review)
const createPendingEstimate = async (req, res) => {
  try {
    const { jobId, originalEstimate, aiAnalysis } = req.body;

    // Validate required fields
    if (!jobId || !originalEstimate) {
      return res.status(400).json({
        success: false,
        error: 'Job ID and original estimate are required'
      });
    }

    const pendingEstimate = new PendingEstimate({
      jobId,
      originalEstimate,
      aiAnalysis: aiAnalysis || {}
    });

    await pendingEstimate.save();

    res.json({
      success: true,
      message: 'Estimate sent for admin review',
      estimateId: pendingEstimate._id
    });
  } catch (error) {
    console.error('Error creating pending estimate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create pending estimate'
    });
  }
};

// Check if estimate is approved (for user polling)
const checkEstimateStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log('🔍 Checking estimate status for jobId:', jobId);

    // Build query with userId filter if authenticated
    const query = { jobId };
    if (req.user && req.user.id) {
      query.userId = req.user.id;
    } else {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // First check if there's any estimate for this job at all
    const allEstimates = await PendingEstimate.find(query).populate('jobId');
    console.log('📋 All estimates found for this job:', allEstimates.map(est => ({
      id: est._id,
      status: est.status,
      createdAt: est.createdAt,
      reviewedAt: est.reviewedAt
    })));

    // Find the most recent estimate for this job and user
    const latestEstimate = await PendingEstimate.findOne(query).sort({ createdAt: -1 });
    
    if (!latestEstimate) {
      // If not found with exact jobId, check if it's an n8n quote
      const n8nEstimate = await PendingEstimate.findOne({ 
        jobId: { $regex: `^n8n-${jobId}` } 
      }).sort({ createdAt: -1 });
      
      if (n8nEstimate) {
        // Only return approved if status is explicitly 'approved' or 'edited'
        if (n8nEstimate.status === 'approved' || n8nEstimate.status === 'edited') {
          console.log('🎉 Returning approved n8n estimate:', {
            status: n8nEstimate.status,
            finalEstimate: n8nEstimate.status === 'edited' ? n8nEstimate.editedEstimate : n8nEstimate.originalEstimate,
            reviewedAt: n8nEstimate.reviewedAt
          });

          return res.json({
            success: true,
            approved: true,
            estimate: {
              finalEstimate: n8nEstimate.status === 'edited' ? n8nEstimate.editedEstimate : n8nEstimate.originalEstimate,
              adminNotes: n8nEstimate.adminNotes,
              reviewedAt: n8nEstimate.reviewedAt,
              status: n8nEstimate.status
            }
          });
        } else {
          console.log('⏳ n8n Estimate is still pending, status:', n8nEstimate.status);
          return res.json({
            success: true,
            approved: false,
            message: `Estimate is still ${n8nEstimate.status}`
          });
        }
      }
      
      console.log('❌ No estimate found for this job');
      return res.json({
        success: true,
        approved: false,
        message: 'No estimate found for this job'
      });
    }

    console.log('📋 Latest estimate:', {
      id: latestEstimate._id,
      status: latestEstimate.status,
      createdAt: latestEstimate.createdAt,
      reviewedAt: latestEstimate.reviewedAt
    });

    // Only return approved if status is explicitly 'approved' or 'edited'
    if (latestEstimate.status === 'approved' || latestEstimate.status === 'edited') {
      console.log('🎉 Returning approved estimate:', {
        status: latestEstimate.status,
        finalEstimate: latestEstimate.status === 'edited' ? latestEstimate.editedEstimate : latestEstimate.originalEstimate,
        reviewedAt: latestEstimate.reviewedAt
      });

      return res.json({
        success: true,
        approved: true,
        estimate: {
          finalEstimate: latestEstimate.calculatedPrice || latestEstimate.status === 'edited' ? latestEstimate.editedEstimate : latestEstimate.originalEstimate,
          calculatedPrice: latestEstimate.calculatedPrice,
          adminNotes: latestEstimate.adminNotes,
          reviewedAt: latestEstimate.reviewedAt,
          status: latestEstimate.status
        }
      });
    } else {
      console.log('⏳ Estimate is still pending, status:', latestEstimate.status);
      return res.json({
        success: true,
        approved: false,
        message: `Estimate is still ${latestEstimate.status}`
      });
    }

  } catch (error) {
    console.error('💥 Error checking estimate status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check estimate status'
    });
  }
};

// Get approved estimate for a specific job
const getApprovedEstimate = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Build query with userId filter if authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // First try to find by exact jobId and userId
    let estimate = await PendingEstimate.findOne({
      jobId: jobId,
      userId: req.user.id,
      status: { $in: ['approved', 'edited'] }
    }).populate('jobId');
    
    // If not found, check if it's an n8n quote
    if (!estimate) {
      estimate = await PendingEstimate.findOne({
        jobId: { $regex: `^n8n-${jobId}` },
        userId: req.user.id,
        status: { $in: ['approved', 'edited'] }
      }).populate('jobId');
    }
    
    if (!estimate) {
      return res.status(404).json({
        success: false,
        error: 'No approved estimate found for this job'
      });
    }
    
    res.json({
      success: true,
      estimate: {
        _id: estimate._id,
        status: estimate.status,
        originalEstimate: estimate.originalEstimate,
        editedEstimate: estimate.editedEstimate,
        calculatedPrice: estimate.calculatedPrice,
        finalEstimate: estimate.calculatedPrice || estimate.originalEstimate,
        adminNotes: estimate.adminNotes,
        reviewedAt: estimate.reviewedAt,
        jobId: estimate.jobId,
        createdAt: estimate.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching approved estimate:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getPendingEstimates,
  getApprovedEstimates,
  getPendingEstimateById,
  approveEstimate,
  editEstimate,
  createPendingEstimate,
  checkEstimateStatus,
  getApprovedEstimate
};