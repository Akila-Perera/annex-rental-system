const express = require('express');
const router = express.Router();
const {
  createSupport,
  getAllSupports,
  getSupportById,
  updateSupport,
  deleteSupport,
} = require('../controllers/supportController');

// POST   /api/support       → Submit new support form
router.post('/', createSupport);

// GET    /api/support       → Get all support submissions
router.get('/', getAllSupports);

// GET    /api/support/:id   → Get one support by ID
router.get('/:id', getSupportById);

// PUT    /api/support/:id   → Update support by ID
router.put('/:id', updateSupport);

// DELETE /api/support/:id   → Delete support by ID
router.delete('/:id', deleteSupport);

module.exports = router;