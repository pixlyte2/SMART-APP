const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema({
  url: String,
  transcript: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("History", HistorySchema);
