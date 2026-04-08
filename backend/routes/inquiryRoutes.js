const express = require('express');
const router = express.Router();

const {
  createInquiry,
  getStudentInquiries,
  getOwnerInquiries,
  replyToInquiry,
} = require('../controllers/inquiryController');

const { protect, student, landlord } = require('../middleware/authMiddleware');

// Student: create inquiry or send message
router.post('/', protect, student, createInquiry);

// Student: list their inquiries
router.get('/student', protect, student, getStudentInquiries);

// Owner: list inquiries to their annexes
router.get('/owner', protect, landlord, getOwnerInquiries);

// Both student and owner: reply in a thread
router.post('/:id/reply', protect, replyToInquiry);

module.exports = router;
