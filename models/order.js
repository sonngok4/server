const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: [1, 'Quantity must be at least 1'],
                validate: {
                    validator: Number.isInteger,
                    message: '{VALUE} is not an integer value'
                }
            },
            totalPrice: {
                type: Number,
                required: true,
            },
        },
    ],

    totalAmount: {
        type: Number,
        required: true,
    },

    shippingAddress: {
        type: String,
        required: true,
        default: ''
    },
    note: {
        type: String,
        default: ''
    },

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },

    paymentMethod: {
        type: String,
        required: true,
    },

    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
