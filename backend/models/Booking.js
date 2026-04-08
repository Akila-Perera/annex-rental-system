const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  status: { type: String, default: 'completed' },
  reviewed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Booking', bookingSchema);
