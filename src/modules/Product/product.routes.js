import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as productController from "./product.controller.js"
import * as validator from "./product.validation.js"

import { auth } from "../../middlewares/auth.middleware.js";
import {multerMiddleHost} from "../../middlewares/multer.middleware.js"
import { systemRoles } from "../../utils/system-roles.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

const router = Router();

router.post('/', auth([systemRoles.SELLER]), multerMiddleHost({
    extensions: allowedExtensions.image
}).array('images', 3), validationMiddleware(validator.addProductSchema),
expressAsyncHandler(productController.addProduct))


router.put('/:productId', auth([systemRoles.SELLER, systemRoles.SUPERADMIN]), multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'), validationMiddleware(validator.updateProductSchema),
expressAsyncHandler(productController.updateProduct))


router.get('/', validationMiddleware(validator.getAllProductsSchema),
    expressAsyncHandler(productController.getAllProducts))


router.get('/search', validationMiddleware(validator.searchProductSchema), 
    expressAsyncHandler(productController.searchProduct))


router.get('/filter', validationMiddleware(validator.searchProductSchema), 
expressAsyncHandler(productController.filterProduct))


router.get('/byId/:productId', validationMiddleware(validator.getSpecProductSchema),
    expressAsyncHandler(productController.getSpecProduct))


router.delete('/:productId', auth([systemRoles.SELLER, systemRoles.SUPERADMIN]), 
    validationMiddleware(validator.getSpecProductSchema), 
    expressAsyncHandler(productController.deleteProduct))


export default router;