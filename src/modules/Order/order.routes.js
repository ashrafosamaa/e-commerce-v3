import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as orderController from "./order.controller.js"
import * as validator from "./order.validation.js"

import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";


const router = Router();

router.post('/', auth([systemRoles.USER]), validationMiddleware(validator.createOrderSchema),
expressAsyncHandler(orderController.createOrder))

router.post('/cartToOrder', auth([systemRoles.USER]), validationMiddleware(validator.convertCartToOrderSchema),
expressAsyncHandler(orderController.convertCartToOrder))

router.put('/take-order/:orderId', auth([systemRoles.DELIVERY]), validationMiddleware(validator.deliveryTakeOrderSchema),
expressAsyncHandler(orderController.deliveryTakeOrder))

router.put('/deliver/:orderId', auth([systemRoles.DELIVERY]), validationMiddleware(validator.deliveryTakeOrderSchema),
expressAsyncHandler(orderController.delieverOrder))

router.get('/deliver', auth([systemRoles.DELIVERY]), validationMiddleware(validator.ordersForDeliverySchema),
expressAsyncHandler(orderController.ordersForDelivery))

router.get('/all-orders', auth([systemRoles.USER]), 
expressAsyncHandler(orderController.getOrders))

router.get('/admin-orders', auth([systemRoles.SUPERADMIN]), validationMiddleware(validator.getAllOrdersForAdminSchema),
expressAsyncHandler(orderController.getAllOrdersForAdmin))

router.get('/order-by-id/:orderId', auth([systemRoles.USER]), validationMiddleware(validator.getOrderByIdSchema),
expressAsyncHandler(orderController.getOrderById))

router.put('/cancel-coupon/:orderId', auth([systemRoles.USER]), validationMiddleware(validator.getOrderByIdSchema),
expressAsyncHandler(orderController.cancelCouponFromOrder))

router.post('/cancel-order/:orderId', auth([systemRoles.USER]), validationMiddleware(validator.getOrderByIdSchema),
expressAsyncHandler(orderController.cancelOrder))

router.post('/stripe-pay/:orderId', auth([systemRoles.USER]), validationMiddleware(validator.getOrderByIdSchema),
expressAsyncHandler(orderController.stripePay))

router.post('/webhook', 
expressAsyncHandler(orderController.stripeWebhookLocal))

router.patch('/user-refund/:orderId', auth([systemRoles.USER]), validationMiddleware(validator.getOrderByIdSchema),
expressAsyncHandler(orderController.userNeedToRefundOrder))

router.put('/admin-refund/:orderId', auth([systemRoles.SUPERADMIN]), validationMiddleware(validator.getOrderByIdSchema),
expressAsyncHandler(orderController.refundOrder))




export default router; 