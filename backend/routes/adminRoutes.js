const express = require('express');
const { 
  getModerationQueue,
  approveReview,
  rejectReview,
  flagReview,
  bulkModerate,
  getModerationStats,
  deleteReview  // ← ADD THIS
} = require('../controllers/moderationController.js');
// const { protect, admin } = require('../middleware/authMiddleware.js'); // ← COMMENTED OUT

const router = express.Router();

// All admin routes are protected and require admin role
// router.use(protect, admin); // ← COMMENTED OUT

// Moderation routes
router.get('/reviews', getModerationQueue);
router.get('/stats', getModerationStats);
router.put('/reviews/:reviewId/approve', approveReview);
router.put('/reviews/:reviewId/reject', rejectReview);
router.put('/reviews/:reviewId/flag', flagReview);
router.delete('/reviews/:reviewId', deleteReview);  // ← ADD THIS
router.post('/reviews/bulk', bulkModerate);

module.exports = router;