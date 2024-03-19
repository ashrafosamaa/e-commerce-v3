import Joi from "joi";

export const createOrderSchema = {
    body: Joi.object({
        product: Joi.string().hex().length(24).required(),
        quantity: Joi.number().integer().min(1).required(),
        couponCode: Joi.string().optional().min(3).max(10).alphanum(),
        paymentMethod: Joi.string().valid('Cash', 'Stripe', 'Paymob').required(),
        phoneNumbers: Joi.array().items(Joi.string().length(11).required()).required(),
        address: Joi.string().required(),
        city: Joi.string().required(),
        postalCode: Joi.string().required(),
        country: Joi.string().required(),
    }),
};

export const convertCartToOrderSchema = {
    body: Joi.object({
        couponCode: Joi.string().optional().min(3).max(10).alphanum(),
        paymentMethod: Joi.string().valid('Cash', 'Stripe', 'Paymob').required(),
        phoneNumbers: Joi.array().items(Joi.string().length(11).required()).required(),
        address: Joi.string().required(),
        city: Joi.string().required(),
        postalCode: Joi.string().required(),
        country: Joi.string().required(),
    }),
};

export const deliveryTakeOrderSchema = {
    params: Joi.object({
        orderId: Joi.string().hex().length(24).required(),
    }),
};

export const ordersForDeliverySchema= {
    query: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        size: Joi.number().integer().min(1).optional(),
        sort: Joi.string().optional(),
    }),
};

export const getAllOrdersForAdminSchema= {
    query: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        size: Joi.number().integer().min(1).optional(),
        sort: Joi.string().optional(),
    }).unknown(true),
};

export const getOrderByIdSchema= {
    params: Joi.object({
        orderId: Joi.string().hex().length(24).required()
    })
};