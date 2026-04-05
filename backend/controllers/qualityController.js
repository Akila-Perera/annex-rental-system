import Review from '../models/Review.js';
import Property from '../models/Property.js';
import QualityScore from '../models/QualityScore.js';
import mongoose from 'mongoose';

// @desc    Calculate quality score for a property
// @route   POST /api/quality/calculate/:propertyId
// @access  Private/Admin
export const calculatePropertyScore = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Get all approved reviews for this property
    const reviews = await Review.find({ 
      property: propertyId, 
      status: 'approved' 
    });

    if (reviews.length === 0) {
      const qualityScore = await QualityScore.findOneAndUpdate(
        { property: propertyId },
        {
          overallScore: 0,
          totalReviews: 0,
          categoryScores: { cleanliness: 0, communication: 0, valueForMoney: 0, location: 0, amenities: 0 },
          lastCalculatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      return res.json({ success: true, message: 'No reviews yet', qualityScore });
    }

    // Calculate averages
    let totalOverall = 0;
    let totalClean = 0, totalComm = 0, totalValue = 0, totalLoc = 0, totalAmen = 0;

    reviews.forEach(review => {
      totalOverall += review.ratings.overall;
      totalClean += review.ratings.cleanliness;
      totalComm += review.ratings.communication;
      totalValue += review.ratings.valueForMoney;
      totalLoc += review.ratings.location;
      totalAmen += review.ratings.amenities;
    });

    const count = reviews.length;
    const overallScore = parseFloat((totalOverall / count).toFixed(1));
    const categoryScores = {
      cleanliness: parseFloat((totalClean / count).toFixed(1)),
      communication: parseFloat((totalComm / count).toFixed(1)),
      valueForMoney: parseFloat((totalValue / count).toFixed(1)),
      location: parseFloat((totalLoc / count).toFixed(1)),
      amenities: parseFloat((totalAmen / count).toFixed(1))
    };

    // Update quality score
    const qualityScore = await QualityScore.findOneAndUpdate(
      { property: propertyId },
      {
        overallScore,
        categoryScores,
        totalReviews: count,
        lastCalculatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Update property
    await Property.findByIdAndUpdate(propertyId, {
      averageRating: overallScore,
      totalReviews: count
    });

    res.json({ success: true, message: 'Quality score calculated', qualityScore });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get quality score for a property
// @route   GET /api/quality/property/:propertyId
// @access  Public
export const getPropertyQuality = async (req, res) => {
  try {
    const { propertyId } = req.params;

    let qualityScore = await QualityScore.findOne({ property: propertyId })
      .populate('property', 'title location price images');

    if (!qualityScore) {
      const mockReq = { params: { propertyId } };
      const mockRes = { json: (data) => { qualityScore = data.qualityScore; } };
      await calculatePropertyScore(mockReq, mockRes);
    }

    const recentReviews = await Review.find({ property: propertyId, status: 'approved' })
      .populate('student', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ success: true, qualityScore, recentReviews, hasReviews: (qualityScore?.totalReviews || 0) > 0 });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all properties with quality scores
// @route   GET /api/quality/properties
// @access  Public
export const getAllPropertiesQuality = async (req, res) => {
  try {
    const allProperties = await Property.find({}).populate('landlord', 'name email');
    const qualityScores = await QualityScore.find({});
    
    const qualityMap = {};
    qualityScores.forEach(qs => { qualityMap[qs.property.toString()] = qs; });

    const combined = allProperties.map(property => {
      const qs = qualityMap[property._id.toString()];
      return {
        _id: property._id,
        property: property,
        overallScore: qs?.overallScore || 0,
        categoryScores: qs?.categoryScores || { cleanliness: 0, communication: 0, valueForMoney: 0, location: 0, amenities: 0 },
        totalReviews: qs?.totalReviews || 0
      };
    });

    res.json({ success: true, properties: combined, total: combined.length });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get top rated properties
// @route   GET /api/quality/top-rated
// @access  Public
export const getTopRated = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topRated = await QualityScore.find({ totalReviews: { $gt: 0 } })
      .sort({ overallScore: -1 })
      .limit(Number(limit))
      .populate('property', 'title location price images');
    res.json({ success: true, topRated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Recalculate all scores
// @route   POST /api/quality/recalculate-all
// @access  Private/Admin
export const recalculateAllScores = async (req, res) => {
  try {
    const properties = await Property.find({});
    for (const property of properties) {
      await calculatePropertyScore({ params: { propertyId: property._id } }, { json: () => {} });
    }
    res.json({ success: true, message: `Recalculated all scores` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};