import express from 'express';
import { 
  createReview, 
  getPropertyReviews, 
  markHelpful, 
  reportReview 
} from '../controllers/reviewController.js';
import { protect, student } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/property/:propertyId', getPropertyReviews);
router.post('/:reviewId/helpful', markHelpful);
router.post('/:reviewId/report', reportReview);

// Protected routes (students only)
router.post('/', protect, student, createReview);

export default router;