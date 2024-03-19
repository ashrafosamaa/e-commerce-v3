import Joi from "joi";

export const addCouponSchema = {
    body:Joi.object({
        couponCode: Joi.string().required().min(3).max(10).alphanum(),
        couponAmount: Joi.number().required().min(1),
        isFixed: Joi.boolean(),
        isPercentage: Joi.boolean(),
        fromDate: Joi.date().greater(Date.now()-(24*60*60*1000)).required(),
        toDate: Joi.date().greater(Joi.ref('fromDate')).required(),
        users: Joi.array().items(
            Joi.object({
                userId: Joi.string().required().length(24).hex(),
                maxUsage: Joi.number().required().min(1)
        }))
    })
}

export const getAllCouponsSchema = {
    query: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        size: Joi.number().integer().min(1).optional(),
    })
}

export const getCouponByCodeSchema = {
    query: Joi.object({
        couponCode: Joi.string().required().min(3).max(10).alphanum(),
    })
}

export const deleteCouponSchema = {
    params: Joi.object({
        couponId: Joi.string().required().length(24).hex()
    })
}

export const updateCouponSchema = {
    body:Joi.object({
        couponCode: Joi.string().optional().min(3).max(10).alphanum(),
        couponAmount: Joi.number().optional().min(1),
        isFixed: Joi.boolean().optional(),
        isPercentage: Joi.boolean().optional(),
        fromDate: Joi.date().greater(Date.now()-(24*60*60*1000)).optional(),
        toDate: Joi.date().greater(Joi.ref('fromDate')).optional(),
        users: Joi.array().optional().items(
            Joi.object({
                userId: Joi.string().optional().length(24).hex(),
                maxUsage: Joi.number().optional().min(1)
        }))
    }),
    params: Joi.object({
        couponId: Joi.string().required().length(24).hex()
    })
}

export const validateCouponSchema = {
    body:Joi.object({
        code: Joi.string().required().min(3).max(10).alphanum(),
    })
}
