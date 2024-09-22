const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  fullname: String,
  email: String,
  password: String,
  contact: Number,
  cart: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        default: 1,
      }
    },
  ],
  orders: {
    type: Array,
    default: [],
  },
  picture: String,
});

module.exports = mongoose.model("User", UserSchema);
