import Joi from "joi";

export const addProductSchema = {
    body: Joi.object({
        title: Joi.string().required().trim().min(3).max(255),
        desc: Joi.string(),
        stock: Joi.number().min(0).required().default(1),
        basePrice: Joi.number().required(),
        discount: Joi.number().min(0).max(100).default(0),
        specs: Joi.object().pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number())).required(),
    }),
    query: Joi.object({
        brandId: Joi.string().length(24).hex().required(),
        subCategoryId: Joi.string().length(24).hex().required(),
        categoryId: Joi.string().length(24).hex().required(),
    }),
}

export const updateProductSchema = {
    body: Joi.object({
        title: Joi.string().trim().min(3).max(255).optional(),
        desc: Joi.string().optional(),
        stock: Joi.number().min(0).optional(),
        basePrice: Joi.number().min(0).optional(),
        discount: Joi.number().min(0).max(100).optional(),
        specs: Joi.object().pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number())).optional(),
        oldPublicId: Joi.string().optional()
    }),
    params: Joi.object({
        productId: Joi.string().length(24).hex().required(),
    })
}

export const getAllProductsSchema = {
    query: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        size: Joi.number().integer().min(1).optional(),
        sort: Joi.string().optional()
    })
};

export const getSpecProductSchema = {
    params: Joi.object({
        productId: Joi.string().hex().length(24).required()
    })
};

export const searchProductSchema = {
    query: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        size: Joi.number().integer().min(1).optional(),
        sort: Joi.string().optional(),
    }).unknown(true),
};