import express from 'express';
import {
	createBooking,
	getMyBookings,
	getMyCompletedBookings,
	getOwnerBookings,
	getPendingBookingRequests,
	respondToBookingRequest,
} from '../controllers/bookingController.js';
import { protect, student } from '../middleware/authMiddleware.js';

const router = express.Router();

// Landlord dashboard
router.get('/owner/dashboard', protect, getOwnerBookings);
router.get('/owner/pending-requests', protect, getPendingBookingRequests);
router.post('/respond-request', protect, respondToBookingRequest);

// Student bookings
router.post('/', protect, student, createBooking);
router.get('/', protect, student, getMyBookings);
router.get('/completed', protect, student, getMyCompletedBookings);

export default router;
