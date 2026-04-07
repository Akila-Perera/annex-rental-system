const express = require('express');
const router = express.Router();
// Import your new function
const { searchAnnexes, createAnnex, getOwnerAnnexes, getAnnexById, updateAnnex, deleteAnnex, getDistanceToAnnex } = require('../controllers/annexController');
const upload = require('../middleware/upload');

router.get('/search', searchAnnexes);
router.get('/owner/:ownerId', getOwnerAnnexes);
router.get('/:id', getAnnexById);
router.put('/:id', updateAnnex);
router.delete('/:id', deleteAnnex);
router.post('/', upload.array('images', 5), createAnnex);

// NEW ROUTE: Get distance to a specific annex
// GET /api/annexes/:id/distance
router.get('/:id/distance', getDistanceToAnnex);

module.exports = router;