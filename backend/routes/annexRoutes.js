const express = require('express');
const router = express.Router();
// Import your new function
const { searchAnnexes, createAnnex, getDistanceToAnnex } = require('../controllers/annexController');

router.get('/search', searchAnnexes);
router.post('/', createAnnex);

// NEW ROUTE: Get distance to a specific annex
// GET /api/annexes/:id/distance
router.get('/:id/distance', getDistanceToAnnex);

module.exports = router;