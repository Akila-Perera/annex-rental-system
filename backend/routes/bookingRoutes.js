import express from 'express';
import {
	createBooking,
	getMyBookings,
	getMyCompletedBookings,
	getOwnerBookings,
} from '../controllers/bookingController.js';
import { protect, student } from '../middleware/authMiddleware.js';

const router = express.Router();

// Landlord dashboard
router.get('/owner/dashboard', protect, getOwnerBookings);

// Student bookings
router.post('/', protect, student, createBooking);
router.get('/', protect, student, getMyBookings);
router.get('/completed', protect, student, getMyCompletedBookings);

export default router;
