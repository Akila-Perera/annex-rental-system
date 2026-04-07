import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      city: { type: String },
      address: { type: String },
    },
    price: {
      type: Number,
      required: true,
    },
    images: [{ type: String }],
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Property', propertySchema);
