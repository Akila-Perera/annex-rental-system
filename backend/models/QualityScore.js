import mongoose from 'mongoose';

const qualityScoreSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    unique: true
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  categoryScores: {
    cleanliness: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    valueForMoney: { type: Number, default: 0 },
    location: { type: Number, default: 0 },
    amenities: { type: Number, default: 0 }
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  distribution: {
    fiveStar: { type: Number, default: 0 },
    fourStar: { type: Number, default: 0 },
    threeStar: { type: Number, default: 0 },
    twoStar: { type: Number, default: 0 },
    oneStar: { type: Number, default: 0 }
  },
  percentages: {
    fiveStar: { type: Number, default: 0 },
    fourStar: { type: Number, default: 0 },
    threeStar: { type: Number, default: 0 },
    twoStar: { type: Number, default: 0 },
    oneStar: { type: Number, default: 0 }
  },
  recommendationRate: {
    type: Number,
    default: 0 // Percentage who would recommend
  },
  lastCalculatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('QualityScore', qualityScoreSchema);