import { Router } from "express";

import expressAsyncHandler from "express-async-handler";

import * as reviewController from "./review.controller.js"
import * as validator from "./review.validation.js"

import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";


const router = Router();

router.post('/:productId', auth([systemRoles.USER]), validationMiddleware(validator.addReviewSchema),
    expressAsyncHandler(reviewController.addReview))


router.get('/', auth([systemRoles.SUPERADMIN]), validationMiddleware(validator.allProductReviewsSchema), expressAsyncHandler(reviewController.allProductReviews))


router.delete('/:reviewId', auth([systemRoles.USER]), validationMiddleware(validator.deleteReviewSchema),
    expressAsyncHandler(reviewController.deleteReview))



export default router;