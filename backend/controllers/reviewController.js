import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Property from '../models/Annex.js';  // Changed from Property to Annex
import { calculatePropertyScore } from './qualityController.js';

// @desc    Create a new review (now allows reviews without booking)
// @route   POST /api/reviews
// @access  Private (Student only)
export const createReview = async (req, res) => {
  try {
    const { bookingId, propertyId, ratings, title, comment, pros, cons, photos } = req.body;
    const studentId = req.user._id;

    let property = null;
    let isVerified = false;
    let booking = null;

    // If bookingId is provided and not empty, validate it
    if (bookingId && bookingId !== '') {
      // Check if booking exists and belongs to student
      booking = await Booking.findOne({
        _id: bookingId,
        student: studentId,
        status: 'completed'
      });

      if (booking) {
        property = booking.property;
        isVerified = true;
        
        // Check if review already exists for this booking
        const existingReview = await Review.findOne({ booking: bookingId });
        if (existingReview) {
          return res.status(400).json({
            success: false,
            message: 'You have already reviewed this property from this booking'
          });
        }
      }
    }

    // If no booking or booking not found, use propertyId from request
    if (!property && propertyId) {
      property = propertyId;
      isVerified = false;
    }

    // If still no property, return error
    if (!property) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required to submit a review'
      });
    }

    // Create review
    const review = new Review({
      student: studentId,
      property: property,
      booking: bookingId || null,
      ratings,
      title,
      comment,
      pros: pros || [],
      cons: cons || [],
      photos: photos || [],
      isVerified: isVerified,
      status: 'pending'  // Always pending for admin approval
    });

    await review.save();

    // If there was a valid booking, mark it as reviewed
    if (booking) {
      booking.reviewed = true;
      await booking.save();
    }

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

    const reviews = await Review.find({ 
      property: propertyId, 
      status: 'approved' 
    })
    .populate('student', 'firstName lastName name email profilePicture')
    .sort(sortOption)
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Review.countDocuments({ 
      property: propertyId, 
      status: 'approved' 
    });

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

// @desc    Delete a review (user can delete their own)
// @route   DELETE /api/reviews/:reviewId
// @access  Private
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review OR is admin
    const isAdmin = userRole === 'admin';
    if (review.student.toString() !== userId.toString() && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    const propertyId = review.property;
    
    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    // Recalculate quality score for the property
    try {
      await calculatePropertyScore({ params: { propertyId } }, { json: () => {} });
    } catch (err) {
      console.error('Error recalculating quality score:', err);
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteReview:', error);
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