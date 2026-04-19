const mongoose = require('mongoose');

const annexSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    imageUrl: { type: String },
    imageUrls: [{ type: String }],
    selectedAddress: { type: String },
    features: [{ type: String }],
    rulesAndConditions: [{ type: String }],
    tags: [{ type: String }], 
    
    // Add the gender preference
    preferredGender: { 
        type: String, 
        enum: ['Male', 'Female', 'Any'], // Only allows these 3 exact words
        default: 'Any'
    },
    roomCount: { type: String, default: '1' },
    studentsPerRoom: { type: String, default: '1' },
    
    location: {
        type: {
            type: String,
            enum: ['Point'], 
            required: true
        },
        coordinates: {
            type: [Number], 
            required: true
        }
    }
}, { timestamps: true });

annexSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Annex', annexSchema);