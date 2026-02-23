const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: String,
    description: String,
    descriptionEn: String,
    link: String,
    category: String,
    isVisible: { type: Boolean, default: true },
    showOnHome: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);