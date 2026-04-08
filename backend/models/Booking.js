const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // For annex-based bookings, this stores the annex id
    annex: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Annex',
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
    notes: {
      type: String,
      trim: true,
    },
    reviewed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Booking', bookingSchema);

=======
const bookingSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  status: { type: String, default: 'completed' },
  reviewed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Booking', bookingSchema);
>>>>>>> cf0a25443f4c1957d5487c0df6821c0a9ccc9661
