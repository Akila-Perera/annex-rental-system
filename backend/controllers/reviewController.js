import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';

// @desc    Create a new review (only for verified bookings)
// @route   POST /api/reviews
// @access  Private (Student only)
export const createReview = async (req, res) => {
  try {
    const { bookingId, ratings, title, comment, pros, cons, photos } = req.body;
    const studentId = req.user._id;

    // Check if booking exists and belongs to student
    const booking = await Booking.findOne({
      _id: bookingId,
      student: studentId,
      status: 'completed' // Only completed bookings can be reviewed
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not eligible for review'
      });
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this property'
      });
    }

    // Create review
    const review = new Review({
      student: studentId,
      property: booking.property,
      booking: bookingId,
      ratings,
      title,
      comment,
      pros: pros || [],
      cons: cons || [],
      photos: photos || [],
      isVerified: true, // Verified because it's from a completed booking
      status: 'pending' // Needs admin approval
    });

    await review.save();

    // Mark booking as reviewed
    booking.reviewed = true;
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and pending approval',
      review
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all reviews for a property (only approved)
// @route   GET /api/reviews/property/:propertyId
// @access  Public
export const getPropertyReviews = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    // Build sort object
    let sortOption = {};
    switch(sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'highest':
        sortOption = { 'ratings.overall': -1 };
        break;
      case 'lowest':
        sortOption = { 'ratings.overall': 1 };
        break;
      case 'helpful':
        sortOption = { helpfulCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Get reviews
    const reviews = await Review.find({ 
      property: propertyId, 
      status: 'approved' 
    })
    .populate('student', 'name profilePicture')
    .sort(sortOption)
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Get total count
    const total = await Review.countDocuments({ 
      property: propertyId, 
      status: 'approved' 
    });

    // Calculate average rating - FIXED: removed mongoose.Types.ObjectId
    const avgResult = await Review.aggregate([
      { $match: { property: new mongoose.Types.ObjectId(propertyId), status: 'approved' } },
      { $group: { _id: null, average: { $avg: '$ratings.overall' } } }
    ]);

    const averageRating = avgResult.length > 0 ? avgResult[0].average : 0;

    res.json({
      success: true,
      reviews,
      averageRating,
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

// @desc    Mark review as helpful
// @route   POST /api/reviews/:reviewId/helpful
// @access  Public
export const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    res.json({
      success: true,
      helpfulCount: review.helpfulCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Report a review
// @route   POST /api/reviews/:reviewId/report
// @access  Public
export const reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { reportedCount: 1 } },
      { new: true }
    );

    // Auto-flag if reported 3 or more times
    if (review.reportedCount >= 3) {
      review.status = 'flagged';
      await review.save();
    }

    res.json({
      success: true,
      message: 'Review reported successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};