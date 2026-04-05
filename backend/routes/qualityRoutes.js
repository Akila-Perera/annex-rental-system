import express from 'express';
import { 
  getPropertyQuality,
  getAllPropertiesQuality,
  getTopRated,
  calculatePropertyScore,
  recalculateAllScores
} from '../controllers/qualityController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/property/:propertyId', getPropertyQuality);
router.get('/properties', getAllPropertiesQuality);
router.get('/top-rated', getTopRated);

// Admin only routes
router.post('/calculate/:propertyId', protect, admin, calculatePropertyScore);
router.post('/recalculate-all', protect, admin, recalculateAllScores);

export default router;