import mongoose from "mongoose"; 

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

export default mongoose.model("Booking", bookingSchema);