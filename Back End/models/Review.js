const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    reviewerName: String,
    message: String,
    rating: Number,
    isApproved: { type: Boolean, default: false },
    showOnHome: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);    