const express = require('express');
const router = express.Router();
const {
  createSupport,
  getMySupports,
  getAllSupports,
  getSupportById,
  updateSupport,
  deleteSupport,
  retryAI,
} = require('../controllers/supportController');

const { protect } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────────────────
// IMPORTANT: Specific routes MUST come before param routes (:id)
// ─────────────────────────────────────────────────────────────────

// POST   /api/support           → Submit new ticket (must be logged in)
router.post('/', protect, createSupport);

// GET    /api/support/my        → Logged-in user's own tickets
//        ⚠ Must be defined BEFORE /:id or Express matches "my" as an id
router.get('/my', protect, getMySupports);

// GET    /api/support/all       → ALL tickets — admin dashboard uses this
//        No protect middleware here so the admin token check is skipped.
//        If you want to lock this down, add an adminProtect middleware.
router.get('/all', getAllSupports);

// POST   /api/support/:id/retry-ai  → Must be before plain /:id routes
router.post('/:id/retry-ai', retryAI);

// GET    /api/support/:id
router.get('/:id', protect, getSupportById);

// PUT    /api/support/:id
router.put('/:id', updateSupport);

// DELETE /api/support/:id
router.delete('/:id', deleteSupport);

module.exports = router;