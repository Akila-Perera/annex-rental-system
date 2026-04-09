const express = require('express');
const { 
  createReview, 
  getPropertyReviews, 
  markHelpful, 
  reportReview,
  deleteReview 
} = require('../controllers/reviewController.js');
const { protect, student } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Public routes
router.get('/property/:propertyId', getPropertyReviews);
router.post('/:reviewId/helpful', markHelpful);
router.post('/:reviewId/report', reportReview);

// Protected routes (students only)
router.post('/', protect, student, createReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;