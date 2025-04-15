const mongoose = require("mongoose");
const { productSchema } = require("./product");

const userSchema = mongoose.Schema({
    name: {
        required: true,
        type: String,
        trim: true,
    },
    email: {
        required: true,
        type: String,
        trim: true,
    },
    password: {
        required: true,
        type: String,
    },

    address: {
        type: String,
        default: "",
    },
    //you can add seller part here
    type: {
        type: String,
        default: "user",
    },
    imageUrl: {
        type: String,
        default: "",
    },
    // cart
    cart: [
        {
            product: productSchema,
            quantity: {
                type: Number,
                required: true,
            },
        },
    ],

    wishList: [
        {
            product: productSchema,
        },
    ],

    searchHistory: [
        {
            type: String,
        },
    ],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
