const mongoose = require('mongoose');

const annexSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    tags: [{ type: String }], 
    
    // Add the gender preference
    preferredGender: { 
        type: String, 
        enum: ['Male', 'Female', 'Any'], // Only allows these 3 exact words
        default: 'Any'
    },
    
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