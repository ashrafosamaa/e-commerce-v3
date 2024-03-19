import e from "express";
import Joi from "joi";

export const addSubCategorySchema = {
    body:Joi.object({
        name: Joi.string().required().min(3).max(50).trim(),
    }),
    params:Joi.object({
        categoryId: Joi.string().length(24).hex().required(),
    })
}

export const updateSubCategorySchema = {
    body:Joi.object({
        name: Joi.string().optional().min(3).max(50).trim(),
        oldPublicId: Joi.string().optional()
    }),
    query:Joi.object({
        subCategoryId: Joi.string().length(24).hex().required(),
        categoryId: Joi.string().length(24).hex().required(),
    })
}

export const getSubCategoriesSchema = {
    query:Joi.object({
        page: Joi.number().integer().min(1).optional(),
        size: Joi.number().integer().min(1).optional(),
        sort: Joi.string().optional()
    })
}

export const getSubCategoryByIdSchema = {
    params: Joi.object({
        subCategoryId: Joi.string().length(24).hex().required()
    })
}

export const getBrandsInSubCategorySchema = {
    query:Joi.object({
        page: Joi.number().integer().min(1).optional(),
        size: Joi.number().integer().min(1).optional(),
        sort: Joi.string().optional()
    }),
    params:Joi.object({
        subCategoryId: Joi.string().length(24).hex().required()
    })
}

export const deleteSubCategorySchema = {
    params:Joi.object({
        subCategoryId: Joi.string().length(24).hex().required()
    })
}
