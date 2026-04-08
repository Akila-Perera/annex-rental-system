import Review from '../models/Review.js';
import Property from '../models/Annex.js';  // Changed from Property to Annex
import User from '../models/UserModel.js';  // Changed from User to UserModel
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
      .populate({
        path: 'property',
        select: 'title location landlord',
        populate: {
          path: 'landlord',
          select: 'name email'
        }
      })
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
    const { moderationNotes } = req.body;

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update review status
    review.status = 'approved';
    review.moderationNotes = moderationNotes || 'Approved by admin';
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();

    await review.save();

    // Update property's total reviews count
    await Property.findByIdAndUpdate(
      review.property,
      { $inc: { totalReviews: 1 } }
    );

    // ✅ Auto-update quality score after approval
    await calculatePropertyScore({ params: { propertyId: review.property } }, { json: () => {} });

    res.json({
      success: true,
      message: 'Review approved and quality score updated',
      review
    });

  } catch (error) {
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

    // Update review status
    review.status = 'rejected';
    review.moderationNotes = moderationNotes;
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();

    await review.save();

    res.json({
      success: true,
      message: 'Review rejected successfully',
      review
    });

  } catch (error) {
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

    // Update review status
    review.status = 'flagged';
    review.moderationNotes = moderationNotes || 'Flagged by admin';
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();

    await review.save();

    res.json({
      success: true,
      message: 'Review flagged successfully',
      review
    });

  } catch (error) {
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
        moderationNotes: moderationNotes || `Bulk ${action}`,
        moderatedBy: req.user._id,
        moderatedAt: new Date()
      }
    );

    // If approving, update property counts and quality scores
    if (action === 'approve') {
      const reviews = await Review.find({ _id: { $in: reviewIds } });
      const propertyIds = [...new Set(reviews.map(r => r.property.toString()))];
      
      for (const propertyId of propertyIds) {
        const count = await Review.countDocuments({ 
          property: propertyId, 
          status: 'approved' 
        });
        await Property.findByIdAndUpdate(propertyId, { totalReviews: count });
        
        // ✅ Auto-update quality score for each property
        await calculatePropertyScore({ params: { propertyId } }, { json: () => {} });
      }
    }

    res.json({
      success: true,
      message: `Successfully ${action}d ${result.modifiedCount} reviews`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
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
      
      // Today's activity
      todayReviews: await Review.countDocuments({
        createdAt: { $gte: new Date().setHours(0,0,0,0) }
      }),
      
      // Most active reviewers
      topReviewers: await Review.aggregate([
        { $group: { _id: '$student', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $project: { 'user.name': 1, count: 1 } }
      ]),
      
      // Reviews by rating
      ratingDistribution: await Review.aggregate([
        { $match: { status: 'approved' } },
        { $group: {
            _id: { $floor: '$ratings.overall' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};