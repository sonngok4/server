const express = require('express');
const router = express.Router();
const Rating = require('../models/rating');
const Product = require('../models/product');
const authenticateToken = require('../middlewares/auth');
const { sendSuccess, sendError } = require('../utils/responseUtils');

// Create or update rating
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;

        // Validate input
        if (!productId || !rating || rating < 1 || rating > 5) {
            return sendError(res, 'Invalid input', 400);
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return sendError(res, 'Product not found', 404);
        }

        // Find existing rating or create new one
        let userRating = await Rating.findOne({
            userId: req.user,
            productId: productId
        });

        if (userRating) {
            // Update existing rating
            userRating.rating = rating;
            userRating.comment = comment;
            userRating = await userRating.save();
        } else {
            // Create new rating
            userRating = new Rating({
                userId: req.user,
                productId,
                rating,
                comment
            });
            await userRating.save();

            // Add reference to product
            await Product.findByIdAndUpdate(productId, {
                $push: { ratings: userRating._id }
            });
        }

        return sendSuccess(res, userRating, 'Rating created/updated successfully', 200);
    } catch (error) {
        return sendError(res, { error: `Error in creating/updating rating : ${error.message}` }, 500);
    }
});

// Get ratings for a product
router.get('/products/:productId', async (req, res) => {
    try {
        const ratings = await Rating.find({ productId: req.params.productId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });
        return sendSuccess(res, ratings, 'Ratings fetched successfully', 200);
    } catch (error) {
        return sendError(res, { error: `Error in fetching ratings : ${error.message}` }, 500);
    }
});

// Update rating
router.put('/ratings/:id', authenticateToken, async (req, res) => {
    try {
        const rating = await Rating.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!rating) {
            return sendError(res, 'Rating not found', 404);
        }

        const { rating: newRating, comment } = req.body;
        rating.rating = newRating;
        rating.comment = comment;

        await rating.save();
        return sendSuccess(res, rating, 'Rating updated successfully', 200);
    } catch (error) {
        return sendError(res, { error: `Error in updating rating : ${error.message}` }, 500);
    }
});

// Delete rating
router.delete('/ratings/:id', authenticateToken, async (req, res) => {
    try {
        const rating = await Rating.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!rating) {
            return sendError(res, 'Rating not found', 404);
        }

        // Remove rating from product's ratings array
        await Product.findByIdAndUpdate(rating.productId, {
            $pull: { ratings: rating._id }
        });

        return sendSuccess(res, {}, 'Rating deleted successfully', 200);
    } catch (error) {
        return sendError(res, { error: `Error in deleting rating : ${error.message}` }, 500);
    }
});

module.exports = router;