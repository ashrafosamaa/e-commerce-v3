import Review from "../../../DB/models/review.model.js";
import Product from "../../../DB/models/product.model.js";
import Order from "../../../DB/models/order.model.js";
import { APIFeatures } from "../../utils/api-features.js";


export const addReview = async (req, res, next) => {
    // destruct data from the user
    const { rating, comment } = req.body;
    const { productId } = req.params;
    const { _id } = req.authUser; 
    // check that product is found
    const isProductAvailableToReview = await Order.findOne({
        user: _id,
        'orderItems.product': productId,
        orderStatus: "Delivered",
        isDelivered: true
    });
    if (!isProductAvailableToReview) {
        return res.status(404).json({ message: "You cannot review this product, buy it first" });
    } 
    // review object
    const reviewObj = {
        rating,
        comment,
        userId: _id,
        productId
    }
    // create review
    const reviewDb = await Review.create(reviewObj);
    if(!reviewDb){
        return res.status(404).json({ message: "Fail to add review" });
    }
    // update product
    const product = await Product.findById(productId);
    const reviews = await Review.find({ productId });
    let ratesSum = 0
    for (const review of reviews) {
        ratesSum += review.rating;
    }
    product.rate = ratesSum / reviews.length;
    await product.save();
    // send response
    res.status(201).json({ message: "Review added successfully", review: reviewDb, product });
}

export const allProductReviews = async (req, res, next) => {
    // destruct data from the user
    const {page, size, sort} = req.query
    // check that order is found
    const features = new APIFeatures(req.query, Product.find().populate('Reviews'))
    .pagination({page, size})
    .sort()
    const products = await features.mongooseQuery
    // send response
    res.status(200).json({ products });
}

export const deleteReview = async (req, res, next) => {
    // destruct data from the user
    const { _id } = req.authUser;
    const { reviewId } = req.params;
    // check that review is found
    const review = await Review.findById(reviewId);
    if(!review){
        return res.status(404).json({ message: "Review not found" });
    }
    // check who can delete review
    if(review.userId.toString() !== _id.toString()){
        return res.status(403).json({ message: "You are not allowed to delete this review" });
    }
    const productId = review.productId;
    const reviewRate = review.rating * -1
    const product = await Product.findById(productId);
    const reviews = await Review.find({ productId });
    let sumRating = 0
    for (const review of reviews) {
        sumRating += review.rating;
    }
    sumRating = sumRating + reviewRate
    product.rate = sumRating / (reviews.length - 1);
    // delete review
    await review.deleteOne();
    // update product
    await product.save();
    // send response
    res.status(200).json({ message: "Review deleted successfully" });
}