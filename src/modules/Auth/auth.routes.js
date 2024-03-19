import { Router } from "express";
import { systemRoles } from "../../utils/system-roles.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import * as authController from './auth.controller.js'
import * as validator from "./auth.validation.js"

import expressAsyncHandler from "express-async-handler";

const router = Router();

router.post('/', validationMiddleware(validator.signUpSchema), 
    expressAsyncHandler(authController.signUp))


router.post('/login', validationMiddleware(validator.loginSchema), 
    expressAsyncHandler(authController.singIn))


router.get('/verify-email', validationMiddleware(validator.verifyEmail), 
    expressAsyncHandler(authController.verifyEmail))

    
router.get('/account/:userId', auth([systemRoles.USER, systemRoles.SELLER, 
    systemRoles.SUPERADMIN, systemRoles.DELIVERY]), 
    validationMiddleware(validator.getProfile), expressAsyncHandler(authController.getAccountData))


router.put('/update/:userId', auth([systemRoles.USER, systemRoles.SELLER, 
    systemRoles.SUPERADMIN, systemRoles.DELIVERY]), 
    validationMiddleware(validator.updateProfile), expressAsyncHandler(authController.updateProfileData))


router.patch('/:userId', auth([systemRoles.USER, systemRoles.SELLER, 
    systemRoles.SUPERADMIN, systemRoles.DELIVERY]), 
    validationMiddleware(validator.updatePassword), expressAsyncHandler(authController.updatePassword))


router.put('/forget', validationMiddleware(validator.forgetPassword), 
    expressAsyncHandler(authController.forgetPassword))


router.put('/reset/:token', validationMiddleware(validator.resetPassword), 
    expressAsyncHandler(authController.resetPassword))


router.delete('/:userId', auth([systemRoles.USER, systemRoles.SELLER, systemRoles.DELIVERY]), 
    validationMiddleware(validator.deleteProfile), expressAsyncHandler(authController.deleteAccount))


router.patch('/soft-delete/:userId', auth([systemRoles.USER, systemRoles.SELLER, systemRoles.DELIVERY]),
    validationMiddleware(validator.softDeleteProfile), expressAsyncHandler(authController.softDelete))


router.patch('/log-out/:userId', auth([systemRoles.USER, systemRoles.SELLER, 
    systemRoles.SUPERADMIN, systemRoles.DELIVERY]),
    validationMiddleware(validator.logOut), expressAsyncHandler(authController.logout))


router.post('/loginWithGmail', validationMiddleware(validator.loginWithGmail),
    expressAsyncHandler(authController.loginWithGmail))


router.post('/signUpWithGmail', validationMiddleware(validator.signUpWithGmail),
    expressAsyncHandler(authController.signUpWithGmail))


export default router;