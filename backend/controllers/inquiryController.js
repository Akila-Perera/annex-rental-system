const Inquiry = require('../models/Inquiry');
const Annex = require('../models/Annex');

// Student sends a new inquiry or adds to existing thread
const createInquiry = async (req, res) => {
  try {
    const { annexId, message } = req.body;

    if (!annexId || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'annexId and message are required' });
    }

    const annex = await Annex.findById(annexId);
    if (!annex) {
      return res.status(404).json({ success: false, message: 'Annex not found' });
    }

    const ownerId = annex.ownerId;

    let thread = await Inquiry.findOne({
      annex: annexId,
      student: req.user._id,
      owner: ownerId,
    });

    const newMessage = {
      sender: req.user._id,
      senderRole: 'student',
      text: message.trim(),
      readBy: ['student'],
    };

    if (thread) {
      thread.messages.push(newMessage);
      await thread.save();
    } else {
      thread = await Inquiry.create({
        annex: annexId,
        student: req.user._id,
        owner: ownerId,
        messages: [newMessage],
      });
    }

    await thread.populate([
      { path: 'annex', select: 'title selectedAddress price imageUrl imageUrls' },
      { path: 'student', select: 'firstName lastName email' },
      { path: 'owner', select: 'firstName lastName email' },
    ]);

    return res.status(201).json({ success: true, inquiry: thread });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Student view of all their inquiries
const getStudentInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ student: req.user._id })
      .populate('annex', 'title selectedAddress price imageUrl imageUrls')
      .populate('owner', 'firstName lastName email')
      .sort({ updatedAt: -1 });

    return res.json({ success: true, inquiries });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Owner view of all inquiries to their annexes
const getOwnerInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ owner: req.user._id })
      .populate('annex', 'title selectedAddress price imageUrl imageUrls')
      .populate('student', 'firstName lastName email')
      .sort({ updatedAt: -1 });

    return res.json({ success: true, inquiries });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Either student or owner replies within a thread
const replyToInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const thread = await Inquiry.findById(id);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    const isStudent = String(thread.student) === String(req.user._id);
    const isOwner = String(thread.owner) === String(req.user._id);

    if (!isStudent && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized for this inquiry' });
    }

    const senderRole = isOwner ? 'landlord' : 'student';

    thread.messages.push({
      sender: req.user._id,
      senderRole,
      text: message.trim(),
      readBy: [senderRole],
    });

    await thread.save();

    await thread.populate([
      { path: 'annex', select: 'title selectedAddress price imageUrl imageUrls' },
      { path: 'student', select: 'firstName lastName email' },
      { path: 'owner', select: 'firstName lastName email' },
    ]);

    return res.json({ success: true, inquiry: thread });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createInquiry,
  getStudentInquiries,
  getOwnerInquiries,
  replyToInquiry,
};
