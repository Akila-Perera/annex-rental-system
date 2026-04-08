const express = require('express');
const { 
  getPropertyQuality,
  getAllPropertiesQuality,
  getTopRated,
  calculatePropertyScore,
  recalculateAllScores
} = require('../controllers/qualityController.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Public routes
router.get('/property/:propertyId', getPropertyQuality);
router.get('/properties', getAllPropertiesQuality);
router.get('/top-rated', getTopRated);

// Admin only routes
router.post('/calculate/:propertyId', protect, admin, calculatePropertyScore);
router.post('/recalculate-all', protect, admin, recalculateAllScores);

module.exports = router;