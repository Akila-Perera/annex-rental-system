const Support = require('../models/SupportModel');
const { generateSupportResponse } = require('../services/aiService');

// ─────────────────────────────────────────────
// Create new support request + AI auto-reply
// Requires: authenticated user (student or landlord)
// ─────────────────────────────────────────────
const createSupport = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'You must be logged in to submit a support request.' });
    }

    const { firstName, lastName, email, phoneNumber, description } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber || !description) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // 1. Save ticket immediately
    const newSupport = new Support({
      userId,
      firstName,
      lastName,
      email,
      phoneNumber,
      description,
      aiStatus: 'pending',
    });
    await newSupport.save();

    // 2. Respond to frontend immediately
    res.status(201).json({
      message: 'Support request submitted! Our AI is preparing your response — check your profile shortly.',
      data: newSupport,
    });

    // 3. Run AI in background
    try {
      await Support.findByIdAndUpdate(newSupport._id, { aiStatus: 'processing' });

      const aiResponse = await generateSupportResponse({
        firstName,
        lastName,
        email,
        description,
      });

      await Support.findByIdAndUpdate(newSupport._id, {
        aiResponse,
        aiStatus: 'sent',
        resolvedAt: new Date(),
      });

      console.log(`✅ AI response saved for userId: ${userId}`);
    } catch (aiError) {
      console.error('❌ AI error:', aiError.message);
      await Support.findByIdAndUpdate(newSupport._id, { aiStatus: 'failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// Get support tickets for the LOGGED-IN user only
// ─────────────────────────────────────────────
const getMySupports = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const supports = await Support.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ data: supports });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// Get ALL support requests (admin use)
// Called from /api/support/all — no auth required
// so the admin dashboard can always fetch data.
// ─────────────────────────────────────────────
const getAllSupports = async (req, res) => {
  try {
    const supports = await Support.find()
      .populate('userId', 'firstName lastName email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ data: supports });
  } catch (error) {
    console.error('getAllSupports error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// Get single support by ID
// ─────────────────────────────────────────────
const getSupportById = async (req, res) => {
  try {
    const support = await Support.findById(req.params.id);
    if (!support) return res.status(404).json({ message: 'Not found' });
    res.status(200).json({ data: support });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// Update support request
// ─────────────────────────────────────────────
const updateSupport = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, description } = req.body;
    const updated = await Support.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, phoneNumber, description },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.status(200).json({ message: 'Updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// Delete support request
// ─────────────────────────────────────────────
const deleteSupport = async (req, res) => {
  try {
    const deleted = await Support.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// Retry AI for failed tickets (admin use)
// ─────────────────────────────────────────────
const retryAI = async (req, res) => {
  try {
    const support = await Support.findById(req.params.id);
    if (!support) return res.status(404).json({ message: 'Not found' });

    const aiResponse = await generateSupportResponse({
      firstName:   support.firstName,
      lastName:    support.lastName,
      email:       support.email,
      description: support.description,
    });

    const updated = await Support.findByIdAndUpdate(
      support._id,
      {
        aiResponse,
        aiStatus:   'sent',
        resolvedAt: new Date(),
      },
      { new: true }
    );

    res.status(200).json({ message: 'AI response saved successfully', data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Retry failed', error: error.message });
  }
};

module.exports = {
  createSupport,
  getMySupports,
  getAllSupports,
  getSupportById,
  updateSupport,
  deleteSupport,
  retryAI,
};