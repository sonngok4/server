const mongoose = require("mongoose");

const ratingSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true
    },
    images: [{
        public_id: String,
        url: String
    }],
    verifiedPurchase: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

// Đảm bảo một user chỉ có thể đánh giá một sản phẩm một lần
ratingSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);
module.exports = Rating;
