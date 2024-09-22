const mongoose = require('mongoose') ;

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
        }
    ],
    totalAmount: { type: Number, required: true },
    platformFee: { type: Number, default: 20 },
    paymentMethod: { type: String, required: true },  // Add this field
    address: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        zip: { type: String, required: true },
    },
    status: { type: String, default: 'Pending' },  // Status could be 'Confirmed' or 'Pending Payment'
    createdAt: { type: Date, default: Date.now },
});
