const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' } 
});

module.exports = mongoose.model('Experience', experienceSchema);