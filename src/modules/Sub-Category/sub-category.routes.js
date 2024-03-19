import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as SubCategoryController from "./sub-category.controller.js"
import * as validator from "./sub-category.validation.js"

import {auth} from "../../middlewares/auth.middleware.js"
import {multerMiddleHost} from "../../middlewares/multer.middleware.js"
import { systemRoles } from "../../utils/system-roles.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

const router = Router();

router.post('/:categoryId', 
auth([systemRoles.SUPERADMIN]), 
multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'), validationMiddleware(validator.addSubCategorySchema),
expressAsyncHandler(SubCategoryController.addSubCategory))


router.put('/', 
auth([systemRoles.SUPERADMIN]), 
multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'), validationMiddleware(validator.updateSubCategorySchema),
expressAsyncHandler(SubCategoryController.updateSubCategory))


router.get('/', validationMiddleware(validator.getSubCategoriesSchema), 
    expressAsyncHandler(SubCategoryController.getSubCategoriesSeparately))


router.get('/specific/:subCategoryId', validationMiddleware(validator.getSubCategoryByIdSchema), 
    expressAsyncHandler(SubCategoryController.getSubCategoryById))


router.get('/brands/:subCategoryId', validationMiddleware(validator.getBrandsInSubCategorySchema), 
    expressAsyncHandler(SubCategoryController.getBrandsInSubCategory))


router.get('/products/:subCategoryId', validationMiddleware(validator.getBrandsInSubCategorySchema), 
    expressAsyncHandler(SubCategoryController.getProductsInSubCategory))


router.get('/withBrands', validationMiddleware(validator.getSubCategoriesSchema), 
    expressAsyncHandler(SubCategoryController.getSubCategoriesWithBrand))


router.get('/tillProducts', validationMiddleware(validator.getSubCategoriesSchema), 
    expressAsyncHandler(SubCategoryController.getSubCategoriesTillProducts))


router.delete('/:subCategoryId', auth([systemRoles.SUPERADMIN]), validationMiddleware(validator.deleteSubCategorySchema),
    expressAsyncHandler(SubCategoryController.deleteSubCategory))


export default router;