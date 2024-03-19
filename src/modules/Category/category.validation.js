import Joi from "joi";

export const addCategorySchema = {
    body:Joi.object({
        name:Joi.string().required().min(3).max(20).alphanum(),
    })
}

export const updateCategorySchema = {
    body:Joi.object({
        name: Joi.string().optional().min(3).max(20).alphanum(),
        oldPublicId: Joi.string().optional()
    }),
    query:Joi.object({
        categoryId: Joi.string().length(24).hex().required()
    })
}

export const getCategoriesSeparatelySchema = { 
    query:Joi.object({
        page: Joi.number().integer().min(1).optional(),
        size: Joi.number().integer().min(1).optional(),
        sort: Joi.string().optional()
    })
}

export const getCategorieByIdSchema = {
    params:Joi.object({
        categoryId: Joi.string().length(24).hex().required()
    })
}

export const getSubInCategorySchema = {
    query:Joi.object({
        page: Joi.number().integer().min(1).optional(),
        size: Joi.number().integer().min(1).optional(),
        sort: Joi.string().optional()
    }),
    params:Joi.object({
        categoryId: Joi.string().length(24).hex().required()
    })
}


export const deleteCategorySchema = {
    params:Joi.object({
        categoryId: Joi.string().length(24).hex().required()
    })
}