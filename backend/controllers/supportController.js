const Support = require('../models/SupportModel');

// Create new support request
const createSupport = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, description } = req.body;

    const newSupport = new Support({
      firstName,
      lastName,
      email,
      phoneNumber,
      description,
    });

    await newSupport.save();

    res.status(201).json({
      message: 'Support request submitted successfully!',
      data: newSupport,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all support requests
const getAllSupports = async (req, res) => {
  try {
    const supports = await Support.find().sort({ createdAt: -1 });
    res.status(200).json({ data: supports });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single support by ID
const getSupportById = async (req, res) => {
  try {
    const support = await Support.findById(req.params.id);
    if (!support) return res.status(404).json({ message: 'Not found' });
    res.status(200).json({ data: support });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update support request
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

// Delete support request
const deleteSupport = async (req, res) => {
  try {
    const deleted = await Support.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createSupport, getAllSupports, getSupportById, updateSupport, deleteSupport };