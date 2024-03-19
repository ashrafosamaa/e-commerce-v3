import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as brandController from "./brand.controller.js"
import * as validator from "./brand.validation.js"

import {auth} from "../../middlewares/auth.middleware.js"
import {multerMiddleHost} from "../../middlewares/multer.middleware.js"
import { systemRoles } from "../../utils/system-roles.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

const router = Router();

router.post('/', auth([systemRoles.SELLER, systemRoles.SUPERADMIN]), multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'), validationMiddleware(validator.addBrandSchema),
expressAsyncHandler(brandController.addBrand))


router.put('/:brandId', auth([systemRoles.SELLER, systemRoles.SUPERADMIN]), multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'), validationMiddleware(validator.updateBrandSchema),
expressAsyncHandler(brandController.updateBrand))


router.get('/', validationMiddleware(validator.getBrandSeparatelySchema), 
    expressAsyncHandler(brandController.getBrandSeparately))


router.get('/specific/:brandId', validationMiddleware(validator.getBrandByIdSchema), 
    expressAsyncHandler(brandController.getBrandById))


router.get('/products/:brandId', validationMiddleware(validator.getProductsInBrandSchema),
    expressAsyncHandler(brandController.getProductsInBrand))


router.get('/tillProducts', validationMiddleware(validator.getBrandSeparatelySchema), 
    expressAsyncHandler(brandController.getBrandWithProducts))


router.delete('/:brandId', auth([systemRoles.SELLER, systemRoles.SUPERADMIN]),
    validationMiddleware(validator.getBrandByIdSchema), 
    expressAsyncHandler(brandController.deleteBrand))


export default router;