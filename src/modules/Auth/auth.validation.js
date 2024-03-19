import Joi from "joi";

export const signUpSchema = {
    body:Joi.object({ 
        username:Joi.string().min(3).max(10).required().trim(), 
        email:Joi.string().email().required(), 
        password:Joi.string().min(6).max(11).required(), 
        phoneNumbers:Joi.array().required().items(
            Joi.string().length(11).required().trim()
        ), 
        addresses:Joi.array().required().items(
            Joi.string().required().trim()
        ), 
        age: Joi.number().required().max(100).min(18),
        role: Joi.string().valid('user', 'seller', 'super-admin', 'delivery').default('user'),
    })
}

export const loginSchema = {
    body:Joi.object({
        email:Joi.string().email().required(), 
        password:Joi.string().min(6).max(11).required(), 
    })
}

export const verifyEmail = {
    query:Joi.object({
        token:Joi.string().required(), 
    })
}

export const getProfile = {
    params: Joi.object({
        userId: Joi.string().length(24).hex().required()
    })
}

export const updateProfile = {
    body:Joi.object({
        username:Joi.string().min(3).max(10).trim(),
        email:Joi.string().email(),
        phoneNumbers:Joi.array().items(
            Joi.string().length(11).trim()
        ), 
        addresses:Joi.array().items(
            Joi.string().trim()
        ), 
        age:Joi.number().max(80).min(18),
        role: Joi.string().valid('user', 'seller', 'super-admin', 'delivery').default('user'),
    }),
    params: Joi.object({
        userId: Joi.string().length(24).hex().required()
    })
}

export const updatePassword = {
    body:Joi.object({
        password: Joi.string().min(6).max(11).required(),
        oldPassword: Joi.string().min(6).max(11).required(),
    }),
    params: Joi.object({
        userId: Joi.string().length(24).hex().required()
    })
}

export const forgetPassword = {
    body:Joi.object({
        email:Joi.string().email().required(),
    }),
}

export const resetPassword = {
    body:Joi.object({
        newPassword: Joi.string().min(6).max(11).required(),
    }),
    params: Joi.object({
        token: Joi.string().required()
    })
}

export const deleteProfile = {
    params: Joi.object({
        userId: Joi.string().length(24).hex().required()
    })
}

export const softDeleteProfile = {
    params: Joi.object({
        userId: Joi.string().length(24).hex().required()
    })
}

export const logOut = {
    params: Joi.object({
        userId: Joi.string().length(24).hex().required()
    })
}

export const loginWithGmail = {
    body:Joi.object({
        idToken: Joi.string().required(),
    }),
}

export const signUpWithGmail = {
    body:Joi.object({
        idToken: Joi.string().required(),
    }),
}
