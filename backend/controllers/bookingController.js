import Booking from '../models/Booking.js';
import Annex from '../models/Annex.js';

export const createBooking = async (req, res) => {
  try {
    const { propertyId, checkInDate, checkOutDate, notes } = req.body;

    if (!propertyId || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'propertyId, checkInDate and checkOutDate are required',
      });
    }

    // Here propertyId represents the annex being booked
    const annex = await Annex.findById(propertyId);
    if (!annex) {
      return res.status(404).json({
        success: false,
        message: 'Annex not found',
      });
    }

    const booking = await Booking.create({
      student: req.user._id,
      annex: propertyId,
      property: propertyId,
      checkInDate,
      checkOutDate,
      status: 'pending',
      reviewed: false,
      notes: notes || '',
    });

    // Populate annex and student details on the created booking document
    await booking.populate([
      { path: 'annex', select: 'title selectedAddress price imageUrl imageUrls ownerId' },
      { path: 'student', select: 'firstName lastName email phone' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking request sent successfully. Waiting for owner approval.',
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.user._id })
      .populate('annex', 'title selectedAddress price imageUrl imageUrls ownerId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyCompletedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      student: req.user._id,
      status: 'completed',
    })
      .populate('annex', 'title selectedAddress price imageUrl imageUrls ownerId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Landlord dashboard: bookings across all annexes owned by the logged-in user
export const getOwnerBookings = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'landlord') {
      return res.status(403).json({ success: false, message: 'Landlord access only' });
    }

    const annexes = await Annex.find({ ownerId: req.user._id }).select(
      '_id title selectedAddress price imageUrl imageUrls'
    );

    const annexIds = annexes.map((a) => a._id);

    if (annexIds.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalAnnexes: 0,
          totalBookings: 0,
          upcomingBookings: 0,
        },
        bookings: [],
        annexes: [],
      });
    }

    const bookings = await Booking.find({ annex: { $in: annexIds } })
      .populate('student', 'firstName lastName email phone')
      .populate('annex', 'title selectedAddress price imageUrl imageUrls')
      .sort({ checkInDate: 1 });

    const upcomingBookings = bookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'pending'
    ).length;

    const stats = {
      totalAnnexes: annexes.length,
      totalBookings: bookings.length,
      upcomingBookings,
    };

    res.json({ success: true, stats, bookings, annexes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get pending booking requests for owner
export const getPendingBookingRequests = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'landlord') {
      return res.status(403).json({ success: false, message: 'Landlord access only' });
    }

    const annexes = await Annex.find({ ownerId: req.user._id }).select('_id title selectedAddress');
    const annexIds = annexes.map((a) => a._id);

    if (annexIds.length === 0) {
      return res.json({
        success: true,
        pendingRequests: [],
      });
    }

    const pendingRequests = await Booking.find({ annex: { $in: annexIds }, status: 'pending' })
      .populate('student', 'firstName lastName email phone')
      .populate('annex', 'title selectedAddress price')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      pendingRequests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Respond to booking request (accept or reject)
export const respondToBookingRequest = async (req, res) => {
  try {
    const { bookingId, response } = req.body;

    if (!bookingId || !response || !['accepted', 'rejected'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'bookingId and response (accepted/rejected) are required',
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate('student', 'firstName lastName email')
      .populate('annex', 'title selectedAddress ownerId');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify that the logged-in user is the owner of the annex
    if (booking.annex.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this request' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking is no longer pending' });
    }

    // Update booking status
    const newStatus = response === 'accepted' ? 'confirmed' : 'cancelled';
    booking.status = newStatus;
    await booking.save();

    // Send message to student via Inquiry
    try {
      const Inquiry = require('../models/Inquiry.js').default || require('../models/Inquiry.js');
      let inquiry = await Inquiry.findOne({
        annex: booking.annex._id,
        student: booking.student._id,
      });

      if (!inquiry) {
        inquiry = await Inquiry.create({
          annex: booking.annex._id,
          student: booking.student._id,
          owner: req.user._id,
          messages: [],
        });
      }

      const messageText = response === 'accepted'
        ? `Your booking request for ${booking.annex.title} from ${new Date(booking.checkInDate).toLocaleDateString()} to ${new Date(booking.checkOutDate).toLocaleDateString()} has been ACCEPTED! Please proceed with payment.`
        : `Your booking request for ${booking.annex.title} from ${new Date(booking.checkInDate).toLocaleDateString()} to ${new Date(booking.checkOutDate).toLocaleDateString()} has been REJECTED.`;

      inquiry.messages.push({
        sender: req.user._id,
        senderRole: 'landlord',
        text: messageText,
      });

      await inquiry.save();
    } catch (inquiryError) {
      console.error('Error sending message:', inquiryError);
      // Don't fail the whole request if messaging fails
    }

    res.json({
      success: true,
      message: `Booking request ${response}.`,
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
