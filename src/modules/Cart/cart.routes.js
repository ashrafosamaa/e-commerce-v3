import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as cartController from "./cart.controller.js"
import * as validator from "./cart.validation.js"

import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

const router = Router();

router.get('/', auth([systemRoles.USER]), expressAsyncHandler(cartController.getCart))


router.post('/', auth([systemRoles.USER]), validationMiddleware(validator.addProductToCartSchema), 
    expressAsyncHandler(cartController.addProductToCart))


router.put('/:productId', auth([systemRoles.USER]), validationMiddleware(validator.removeProductFromCartSchema),
    expressAsyncHandler(cartController.removeProductFromCart))


router.delete('/:cartId', auth([systemRoles.USER]), validationMiddleware(validator.deleteCartSchema), 
    expressAsyncHandler(cartController.deleteCart))


export default router;