import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as couponController from "./coupon.controller.js"
import * as validator from "./coupon.validation.js"

import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";

const router = Router(); 

router.post('/', auth([systemRoles.SUPERADMIN, systemRoles.SELLER]),
    validationMiddleware(validator.addCouponSchema),
    expressAsyncHandler(couponController.addCoupon))

router.get('/', auth([systemRoles.SUPERADMIN]), 
    validationMiddleware(validator.getAllCouponsSchema),
    expressAsyncHandler(couponController.getAllCoupons))


router.get('/single/', auth([systemRoles.SUPERADMIN]), 
    validationMiddleware(validator.getCouponByCodeSchema),
    expressAsyncHandler(couponController.getCouponByCode))


router.delete('/:couponId', auth([systemRoles.SUPERADMIN, systemRoles.SELLER]), 
    validationMiddleware(validator.deleteCouponSchema),
    expressAsyncHandler(couponController.deleteCoupon))


router.put('/:couponId', auth([systemRoles.SUPERADMIN, systemRoles.SELLER]), 
    validationMiddleware(validator.updateCouponSchema),
    expressAsyncHandler(couponController.updateCoupon))


router.post('/validateCoupon', auth([systemRoles.USER]), 
    validationMiddleware(validator.validateCouponSchema),
    expressAsyncHandler(couponController.validateCoupon))


export default router;