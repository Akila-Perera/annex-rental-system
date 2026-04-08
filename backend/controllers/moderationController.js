import Review from '../models/Review.js';
import Annex from '../models/Annex.js';
import User from '../models/UserModel.js';
import { calculatePropertyScore } from './qualityController.js';

// @desc    Get all reviews for moderation (admin only)
// @route   GET /api/admin/reviews
// @access  Private/Admin
export const getModerationQueue = async (req, res) => {
  try {
    const { 
      status = 'pending', 
      page = 1, 
      limit = 20,
      sort = 'newest'
    } = req.query;

    // Build query
    const query = {};
    if (status !== 'all') {
      query.status = status;
    }

    // Build sort
    let sortOption = {};
    switch(sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'most-reported':
        sortOption = { reportedCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Get reviews with populated fields
    const reviews = await Review.find(query)
      .populate('student', 'name email')
      .populate('property', 'title location')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const total = await Review.countDocuments(query);

    // Get counts for dashboard stats
    const stats = {
      pending: await Review.countDocuments({ status: 'pending' }),
      approved: await Review.countDocuments({ status: 'approved' }),
      rejected: await Review.countDocuments({ status: 'rejected' }),
      flagged: await Review.countDocuments({ status: 'flagged' }),
      total: await Review.countDocuments()
    };

    res.json({
      success: true,
      reviews,
      stats,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error in getModerationQueue:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve a review
// @route   PUT /api/admin/reviews/:reviewId/approve
// @access  Private/Admin
export const approveReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    console.log('Approving review:', reviewId);

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Simply update the status
    review.status = 'approved';
    await review.save();

    console.log('Review approved successfully');

    res.json({
      success: true,
      message: 'Review approved successfully',
      review
    });

  } catch (error) {
    console.error('Error in approveReview:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject a review
// @route   PUT /api/admin/reviews/:reviewId/reject
// @access  Private/Admin
export const rejectReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { moderationNotes } = req.body;

    if (!moderationNotes) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = 'rejected';
    review.moderationNotes = moderationNotes;
    await review.save();

    res.json({
      success: true,
      message: 'Review rejected successfully',
      review
    });

  } catch (error) {
    console.error('Error in rejectReview:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Flag a review (for inappropriate content)
// @route   PUT /api/admin/reviews/:reviewId/flag
// @access  Private/Admin
export const flagReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { moderationNotes } = req.body;

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = 'flagged';
    review.moderationNotes = moderationNotes || 'Flagged by admin';
    await review.save();

    res.json({
      success: true,
      message: 'Review flagged successfully',
      review
    });

  } catch (error) {
    console.error('Error in flagReview:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Bulk moderate reviews
// @route   POST /api/admin/reviews/bulk
// @access  Private/Admin
export const bulkModerate = async (req, res) => {
  try {
    const { reviewIds, action, moderationNotes } = req.body;

    if (!reviewIds || !reviewIds.length) {
      return res.status(400).json({
        success: false,
        message: 'No reviews selected'
      });
    }

    let newStatus;
    switch(action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'flag':
        newStatus = 'flagged';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    // Update all selected reviews
    const result = await Review.updateMany(
      { _id: { $in: reviewIds } },
      {
        status: newStatus,
        moderationNotes: moderationNotes || `Bulk ${action}`
      }
    );

    res.json({
      success: true,
      message: `Successfully ${action}d ${result.modifiedCount} reviews`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error in bulkModerate:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get moderation statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getModerationStats = async (req, res) => {
  try {
    const stats = {
      totalReviews: await Review.countDocuments(),
      pendingReviews: await Review.countDocuments({ status: 'pending' }),
      approvedReviews: await Review.countDocuments({ status: 'approved' }),
      rejectedReviews: await Review.countDocuments({ status: 'rejected' }),
      flaggedReviews: await Review.countDocuments({ status: 'flagged' }),
      
      todayReviews: await Review.countDocuments({
        createdAt: { $gte: new Date().setHours(0,0,0,0) }
      })
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};