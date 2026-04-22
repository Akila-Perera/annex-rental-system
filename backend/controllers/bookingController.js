import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Annex from '../models/Annex.js';

const parsePositiveInt = (value, fallback = 0) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
};

const getAnnexCapacity = (annex) => {
  const roomCount = parsePositiveInt(annex.roomCount, 1);
  const studentsPerRoom = parsePositiveInt(annex.studentsPerRoom, 1);
  return roomCount * studentsPerRoom;
};

const getOverlappingConfirmedBookingsFilter = (annexId, checkInDate, checkOutDate) => ({
  annex: annexId,
  status: 'confirmed',
  checkInDate: { $lt: checkOutDate },
  checkOutDate: { $gt: checkInDate },
});

const getCurrentConfirmedBookingsFilter = (annexId) => {
  const now = new Date();
  return {
    annex: annexId,
    status: 'confirmed',
    checkInDate: { $lte: now },
    checkOutDate: { $gt: now },
  };
};

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

    const requestedCheckIn = new Date(checkInDate);
    const requestedCheckOut = new Date(checkOutDate);

    if (Number.isNaN(requestedCheckIn.getTime()) || Number.isNaN(requestedCheckOut.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'checkInDate and checkOutDate must be valid dates',
      });
    }

    if (requestedCheckOut <= requestedCheckIn) {
      return res.status(400).json({
        success: false,
        message: 'checkOutDate must be after checkInDate',
      });
    }

    const totalCapacity = getAnnexCapacity(annex);
    const occupiedSlots = await Booking.countDocuments(
      getOverlappingConfirmedBookingsFilter(propertyId, requestedCheckIn, requestedCheckOut)
    );

    if (occupiedSlots >= totalCapacity) {
      return res.status(409).json({
        success: false,
        message: 'Room is full. This annex has reached maximum capacity.',
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

    if (response === 'accepted') {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const bookingForUpdate = await Booking.findById(bookingId).session(session);

          if (!bookingForUpdate) {
            const notFoundError = new Error('Booking not found');
            notFoundError.statusCode = 404;
            throw notFoundError;
          }

          const annex = await Annex.findById(bookingForUpdate.annex).session(session);
          if (!annex) {
            const annexError = new Error('Annex not found');
            annexError.statusCode = 404;
            throw annexError;
          }

          const totalCapacity = getAnnexCapacity(annex);
          const occupiedSlots = await Booking.countDocuments(
            getOverlappingConfirmedBookingsFilter(
              annex._id,
              bookingForUpdate.checkInDate,
              bookingForUpdate.checkOutDate
            )
          ).session(session);

          if (occupiedSlots >= totalCapacity) {
            const capacityError = new Error('Room is full. This annex has reached maximum capacity.');
            capacityError.statusCode = 409;
            throw capacityError;
          }

          await Annex.updateOne(
            { _id: annex._id },
            { $inc: { bookingVersion: 1 } },
            { session }
          );

          bookingForUpdate.status = 'confirmed';
          await bookingForUpdate.save({ session });

          try {
            const Inquiry = require('../models/Inquiry.js').default || require('../models/Inquiry.js');
            let inquiry = await Inquiry.findOne({
              annex: annex._id,
              student: bookingForUpdate.student,
            }).session(session);

            if (!inquiry) {
              [inquiry] = await Inquiry.create([
                {
                  annex: annex._id,
                  student: bookingForUpdate.student,
                  owner: req.user._id,
                  messages: [],
                },
              ], { session });
            }

            inquiry.messages.push({
              sender: req.user._id,
              senderRole: 'landlord',
              text: `Your booking request for ${annex.title} from ${new Date(bookingForUpdate.checkInDate).toLocaleDateString()} to ${new Date(bookingForUpdate.checkOutDate).toLocaleDateString()} has been ACCEPTED! Please proceed with payment.`,
            });

            await inquiry.save({ session });
          } catch (inquiryError) {
            console.error('Error sending message:', inquiryError);
          }
        });
      } catch (error) {
        if (error.statusCode) {
          return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        throw error;
      } finally {
        await session.endSession();
      }

      const updatedBooking = await Booking.findById(bookingId)
        .populate('student', 'firstName lastName email')
        .populate('annex', 'title selectedAddress ownerId');

      return res.json({
        success: true,
        message: `Booking request ${response}.`,
        booking: updatedBooking,
      });
    }

    booking.status = 'cancelled';
    await booking.save();

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

      inquiry.messages.push({
        sender: req.user._id,
        senderRole: 'landlord',
        text: `Your booking request for ${booking.annex.title} from ${new Date(booking.checkInDate).toLocaleDateString()} to ${new Date(booking.checkOutDate).toLocaleDateString()} has been REJECTED.`,
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
