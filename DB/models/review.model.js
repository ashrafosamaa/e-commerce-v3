import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        enum: [1, 2, 3, 4, 5]
    },
    comment: {
        type: String,
    }
}, {
    timestamps: true
})


const Review = mongoose.model('Review', reviewSchema);

export default Review