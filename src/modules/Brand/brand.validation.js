import Joi from "joi";

export const addBrandSchema = {
    body: Joi.object({
        name: Joi.string().required().trim(),
    }),
    query: Joi.object({
        categoryId: Joi.string().length(24).hex().required(),
        subCategoryId: Joi.string().length(24).hex().required(),
    })
}

export const updateBrandSchema = {
    body: Joi.object({
        name: Joi.string().trim().optional(),
        oldPublicId: Joi.string().optional()
    }),
    params: Joi.object({
        brandId: Joi.string().length(24).hex().required(),
    })
}

export const getBrandSeparatelySchema = {
    query: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        size: Joi.number().integer().min(1).optional(),
        sort: Joi.string().optional()
    })
}

export const getBrandByIdSchema = {
    params: Joi.object({
        brandId: Joi.string().length(24).hex().required(),
    }),
}

export const getProductsInBrandSchema = {
    query: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        size: Joi.number().integer().min(1).optional(),
        sort: Joi.string().optional()
    }),
    params: Joi.object({
        brandId: Joi.string().length(24).hex().required(),
    }),
}