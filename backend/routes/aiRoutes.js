import express from 'express';
import { enhanceReview } from '../controllers/aiController.js';
// import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/enhance-review', enhanceReview);  // Removed 'protect'

export default router;