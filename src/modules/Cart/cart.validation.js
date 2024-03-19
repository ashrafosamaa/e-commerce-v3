import Joi from 'joi';

export const addProductToCartSchema = {
    body: Joi.object({
        productId: Joi.string().hex().length(24).required(),
        quantity: Joi.number().integer().min(1).required()
})
}

export const removeProductFromCartSchema = {
    params: Joi.object({
        productId: Joi.string().hex().length(24).required(),
    }),
};

export const deleteCartSchema = {
    params: Joi.object({
        cartId: Joi.string().hex().length(24).required(),
    }),
};
