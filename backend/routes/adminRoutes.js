import express from 'express';
import { 
  getModerationQueue,
  approveReview,
  rejectReview,
  flagReview,
  bulkModerate,
  getModerationStats
} from '../controllers/moderationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes are protected and require admin role
router.use(protect, admin);

// Moderation routes
router.get('/reviews', getModerationQueue);
router.get('/stats', getModerationStats);
router.put('/reviews/:reviewId/approve', approveReview);
router.put('/reviews/:reviewId/reject', rejectReview);
router.put('/reviews/:reviewId/flag', flagReview);
router.post('/reviews/bulk', bulkModerate);

export default router;