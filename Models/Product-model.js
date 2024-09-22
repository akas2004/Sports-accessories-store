const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  discount: {
    type: Number,
    default: 0,
  },
  image: Buffer, // For storing image data
  bgcolor: String,
  panelcolor: String,
  textcolor: String,
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
  },
  sold: { type: Number, default: 0 },
});

// Register the model with the correct name
module.exports = mongoose.model("Product", ProductSchema);
