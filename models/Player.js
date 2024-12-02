const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  player_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  gold: { type: Number, default: 100 },
  inventory: { type: Array, default: [] },
  current_health: { type: Number, default: 100 },
  max_health: { type: Number, default: 100 },
  location: { type: String, default: "start" },
});

module.exports = mongoose.model("Player", playerSchema);
