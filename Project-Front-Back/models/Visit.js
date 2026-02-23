const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    id: { type: String, default: "main_counter" },
    count: { type: Number, default: 0 }
});

module.exports = mongoose.model('Visit', visitSchema);