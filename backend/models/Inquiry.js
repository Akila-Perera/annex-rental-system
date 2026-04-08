const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['student', 'landlord'], required: true },
    text: { type: String, required: true, trim: true },
    readBy: [{ type: String, enum: ['student', 'landlord'] }],
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const inquirySchema = new mongoose.Schema(
  {
    annex: { type: mongoose.Schema.Types.ObjectId, ref: 'Annex', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
