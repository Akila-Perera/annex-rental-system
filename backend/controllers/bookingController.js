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
      status: 'confirmed',
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
      message: 'Booking created successfully',
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
