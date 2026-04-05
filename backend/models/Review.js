import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true // One review per booking
  },
  ratings: {
    overall: { type: Number, required: true, min: 1, max: 5 },
    cleanliness: { type: Number, required: true, min: 1, max: 5 },
    communication: { type: Number, required: true, min: 1, max: 5 },
    valueForMoney: { type: Number, required: true, min: 1, max: 5 },
    location: { type: Number, required: true, min: 1, max: 5 },
    amenities: { type: Number, required: true, min: 1, max: 5 }
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  pros: [{
    type: String,
    trim: true
  }],
  cons: [{
    type: String,
    trim: true
  }],
  photos: [{
    type: String
  }],
  landlordResponse: {
    comment: String,
    respondedAt: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  reportedCount: {
    type: Number,
    default: 0
  },
  moderationNotes: {
    type: String,
    default: ''
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date
}, {
  timestamps: true
});

// Index for faster queries
reviewSchema.index({ property: 1, status: 1, createdAt: -1 });
reviewSchema.index({ student: 1, createdAt: -1 });

export default mongoose.model('Review', reviewSchema);