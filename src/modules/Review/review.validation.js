import Joi from "joi";

export const addReviewSchema = {
    body: Joi.object({
        rating: Joi.number().integer().min(1).max(5).required(),
        comment: Joi.string().optional()
    }),
    params: Joi.object({
        productId: Joi.string().required().length(24).hex()
    })
}

export const allProductReviewsSchema = {
    query:Joi.object({
        page: Joi.number().integer().min(1).optional(),
        size: Joi.number().integer().min(1).optional(),
        sort: Joi.string().optional()
    })
}

export const deleteReviewSchema = {
    params: Joi.object({
        reviewId: Joi.string().hex().length(24).required(),
    }),
};