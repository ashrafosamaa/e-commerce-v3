import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as categoryController from "./category.controller.js"
import * as validator from "./category.validation.js"

import {auth} from "../../middlewares/auth.middleware.js"
import {multerMiddleHost} from "../../middlewares/multer.middleware.js"
import { systemRoles } from "../../utils/system-roles.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

const router = Router();

router.post('/', 
auth([systemRoles.SUPERADMIN]), multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'), validationMiddleware(validator.addCategorySchema),
expressAsyncHandler(categoryController.createCategory))


router.put('/:categoryId', multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'), validationMiddleware(validator.updateCategorySchema),
auth([systemRoles.SUPERADMIN]), 

expressAsyncHandler(categoryController.updateCategory))


router.get('/', validationMiddleware(validator.getCategoriesSeparatelySchema), 
    expressAsyncHandler(categoryController.getCategoriesSeparately))


router.get('/specific/:categoryId', validationMiddleware(validator.getCategorieByIdSchema), 
    expressAsyncHandler(categoryController.getCategorieById))


router.get('/sub/:categoryId', validationMiddleware(validator.getSubInCategorySchema), 
    expressAsyncHandler(categoryController.getSubInCategory))


router.get('/brands/:categoryId', validationMiddleware(validator.getSubInCategorySchema), 
    expressAsyncHandler(categoryController.getBrandsInCategory))


router.get('/products/:categoryId', validationMiddleware(validator.getSubInCategorySchema),
    expressAsyncHandler(categoryController.getProductsInCategory))


router.get('/withSubCategories', validationMiddleware(validator.getCategoriesSeparatelySchema), 
    expressAsyncHandler(categoryController.getCategoriesWithSub))


router.get('/withSubCategoriesWithBrands', validationMiddleware(validator.getCategoriesSeparatelySchema), 
    expressAsyncHandler(categoryController.getCategoriesWithSubWithBrand))


router.get('/tillProducts', validationMiddleware(validator.getCategoriesSeparatelySchema), 
    expressAsyncHandler(categoryController.getCategoriesTillProducts))


router.delete('/:categoryId', validationMiddleware(validator.deleteCategorySchema), 
    auth([systemRoles.SUPERADMIN]), expressAsyncHandler(categoryController.deleteCategory))


export default router;