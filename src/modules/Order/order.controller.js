import { APIFeatures } from "../../utils/api-features.js";
import { DateTime } from "luxon";
import { qrCodeGeneration } from "../../utils/qr-code.js";
import { applyCouponValidation } from "../../utils/coupon.validation.js"
import { checkProductAvailability } from "../Cart/utils/check-product-in-db.js";
import { confirmPaymentIntent, createCheckOutSession, createPaymentIntent, createStripeCoupon, refundPaymentIntent } from "../../payments/stripe.js";
import { generateOTP } from "../../utils/generate-unique-string.js";

import Product from "../../../DB/models/product.model.js";
import Cart from "../../../DB/models/cart.model.js"
import CouponUser from "../../../DB/models/coupon-user.model.js";
import Order from "../../../DB/models/order.model.js";
import createInvoice from "../../utils/pdf-kit.js";
import sendEmailService from "../services/send-email.service.js";

export const createOrder = async (req, res ,next) => {
    //destruct data from the user
    const {
        product, 
        quantity,
        couponCode,
        paymentMethod,
        phoneNumbers,
        address,
        city,
        postalCode,
        country
    } = req.body
    const {_id:user} = req.authUser
    // coupon code check
    let coupon = null
    if(couponCode){
        const isCouponValid = await applyCouponValidation(couponCode, user);
        if(isCouponValid.status) return next({message: isCouponValid.msg, cause: isCouponValid.status});
        coupon = isCouponValid;
    }
    // product check
    const isProductAvailable = await checkProductAvailability(product, quantity);
    if(!isProductAvailable) return next({message: 'Product is not available', cause: 400});
    // set orderitems
    let orderItems = [{
        title: isProductAvailable.title,
        quantity,
        price: isProductAvailable.appliedPrice,
        product: isProductAvailable._id
    }]
    // prices calculation
    let shippingPrice = orderItems[0].price * quantity;
    let totalPrice = shippingPrice;
    // coupon calculation
    if(coupon?.isFixed && !(coupon?.couponAmount <= shippingPrice))  return next({message: 'You cannot use this coupon', cause: 400});
    if(coupon?.isFixed){
        totalPrice = shippingPrice - coupon.couponAmount;
    }else if(coupon?.isPercentage){
        totalPrice = shippingPrice - (shippingPrice * coupon.couponAmount / 100);
    }
    // order status + paymentmethod
    let orderStatus;
    if(paymentMethod === 'Cash') orderStatus = 'Placed';
    // create order
    const order = new Order({
        user,
        orderItems,
        shippingAddress: {address, city, postalCode, country},
        phoneNumbers,
        shippingPrice,
        coupon: coupon?._id,
        totalPrice,
        paymentMethod,
        orderStatus
    });
    // save order
    await order.save();
    req.savedDocument = { model: Order, _id: order._id }
    // update product stock
    isProductAvailable.stock -= quantity;
    await isProductAvailable.save();
    // update coupon usage count
    if(coupon){
        await CouponUser.updateOne({couponId:coupon._id, userId:user}, {$inc: {usageCount: 1}});
    }
    // generate QR code
    const orderQR = await qrCodeGeneration([{orderId: order._id, user: order.user, totalPrice: order.totalPrice, orderStatus: order.orderStatus}]);
    // create invoice
    const orderCode = `${req.authUser.username}-${generateOTP(3)}`
    // order invoice
    const orderInvoice = {
        shipping:{
            name: req.authUser.username,
            address: order.shippingAddress.address,
            postalCode: order.shippingAddress.postalCode,
            city: order.shippingAddress.city,
            country: order.shippingAddress.country
        },
        orderCode,
        date: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        items: order.orderItems,
        subTotal: order.shippingPrice,
        coupon: coupon?.couponAmount,
        paidAmount: order.totalPrice,
        couponId: coupon?._id,
    }
    await createInvoice(orderInvoice, `${orderCode}.pdf`);
    // send email
    const sendEmail = await sendEmailService({
        to: req.authUser.email,
        subject: 'Order Confirmation',
        message: '<h1>Check your Invoice Confirmation below</h1>',
        attachments: [{path: `./Files/${orderCode}.pdf`}]
    })
    // send response
    res.status(201).json({message: 'Order created successfully', order, orderQR});
}

export const convertCartToOrder = async (req, res, next) => {
    //destruct data from the user
    const {
        couponCode,
        paymentMethod,
        phoneNumbers,
        address,
        city,
        postalCode,
        country
    } = req.body
    const {_id:user} = req.authUser
    // check that cart is found
    const userCart = await Cart.findOne({userId: user});
    if(!userCart) return next({message: 'Cart not found', cause: 404});
    // coupon code check
    let coupon = null
    if(couponCode){
        const isCouponValid = await applyCouponValidation(couponCode, user);
        if(isCouponValid.status) return next({message: isCouponValid.msg, cause: isCouponValid.status});
        coupon = isCouponValid;
    }
    // set orderitems
    let orderItems = userCart.products.map(cartItem=>{
        return{
            title: cartItem.title,
            quantity: cartItem.quantity,
            price: cartItem.basePrice,
            product: cartItem.productId
        }
    })
    // prices calculation
    let shippingPrice = userCart.subTotal;
    let totalPrice = shippingPrice;
    // coupon calculation
    if(coupon?.isFixed && !(coupon?.couponAmount <= shippingPrice))  return next({message: 'You cannot use this coupon', cause: 400});
    if(coupon?.isFixed){
        totalPrice = shippingPrice - coupon.couponAmount;
    }else if(coupon?.isPercentage){
        totalPrice = shippingPrice - (shippingPrice * coupon.couponAmount / 100);
    }
    // order status + paymentmethod
    let orderStatus;
    if(paymentMethod === 'Cash') orderStatus = 'Placed';
    // create order
    const order = new Order({
        user,
        orderItems,
        shippingAddress: {address, city, postalCode, country},
        phoneNumbers,
        shippingPrice,
        coupon: coupon?._id,
        totalPrice,
        paymentMethod,
        orderStatus
    });
    // save order
    await order.save();
    req.savedDocument = { model: Order, _id: order._id }
    // cart delete
    await Cart.findByIdAndDelete({_id: userCart._id});
    // update product stock
    for (const item of orderItems) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } });
    }
    // update coupon usage count
    if(coupon){
        await CouponUser.updateOne({couponId:coupon._id, userId: user}, {$inc: {usageCount: 1}});
    }
    // generate QR code
    const orderQR = await qrCodeGeneration([{orderId: order._id, user: order.user, totalPrice: order.totalPrice, orderStatus: order.orderStatus}]);
    // create invoice
    const orderCode = `${req.authUser.username}-${generateOTP(3)}`
    // order invoice
    const orderInvoice = {
        shipping:{
            name: req.authUser.username,
            address: order.shippingAddress.address,
            postalCode: order.shippingAddress.postalCode,
            city: order.shippingAddress.city,
            country: order.shippingAddress.country
        },
        orderCode,
        date: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        items: order.orderItems,
        subTotal: order.shippingPrice,
        coupon: coupon?.couponAmount,
        paidAmount: order.totalPrice,
        couponId: coupon?._id,
    }
    await createInvoice(orderInvoice, `${orderCode}.pdf`);
    // send email
    const sendEmail = await sendEmailService({
        to: req.authUser.email,
        subject: 'Order Confirmation',
        message: '<h1>Check your Invoice Confirmation below</h1>',
        attachments: [{path: `./Files/${orderCode}.pdf`}]
    })
    // send response
    res.status(201).json({message: 'Order created successfully', order, orderQR});
}

export const deliveryTakeOrder = async (req, res, next) => {
    // destruct data from the user
    const {orderId}= req.params;
    const orders = await Order.findOneAndUpdate({
        _id: orderId, 
        orderStatus: {$in: ['Paid','Placed']},
        refundRequest: false,
        isDelivered: false
    },{
        orderStatus: 'On Way',
        onWayBy: req.authUser._id,
        onWayAt: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    }, {new: true})
    // check that order is found
    if(!orders) return next({message: 'Order not found', cause: 404});
    // send response
    res.status(200).json({message: 'Order on way successfully', order: orders});
}

export const ordersForDelivery = async (req, res, next) => {
    // destruct data from the user
    const {page, size, sort} = req.query
    // check that order is found
    const features = new APIFeatures(req.query, Order.find({orderStatus: {$in: ['Paid','Placed']}}))
    .pagination({page, size})
    .sort()
    const orders = await features.mongooseQuery
    // send response
    res.status(200).json({message: 'Orders retrieved successfully', orders});
} 

export const delieverOrder = async (req, res, next) => {
    // destruct data from the user
    const {orderId}= req.params;
    const userId = req.authUser._id
    // check that order is found
    const updateOrder = await Order.findOneAndUpdate({
        _id: orderId,
        orderStatus: 'On Way',
        isDelivered: false,
        onWayBy: userId
    },{
        orderStatus: 'Delivered',
        deliveredAt: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        deliveredBy: req.authUser._id,
        isDelivered: true,
        onWayBy: null,
        onWayAt: null
    },{
        new: true
    })
    // check that order is found
    if(!updateOrder) return next({message: 'Order not found or cannot be delivered', cause: 404});
    // send response
    res.status(200).json({message: 'Order delivered successfully', order: updateOrder});
}

export const cancelCouponFromOrder = async (req, res, next)=> {
    // destruct data from the user
    const {_id} = req.authUser
    const {orderId}= req.params;
    // check that order is found
    const updateOrder = await Order.findById(orderId)
    // check that order is found
    if(!updateOrder) return next({message: 'Order not found', cause: 404});
    // check that order has coupon
    if(!updateOrder.coupon) return next({message: 'This order does not have coupon', cause: 400});
    // check that owner who try to cancel coupon
    if(updateOrder.user.toString() != _id.toString()) return next({message: 'You are not authorized to cancel this coupon', cause: 403});
    // check that order is pending or placed
    if(updateOrder.orderStatus != 'Pending' && updateOrder.orderStatus != 'Placed') {
        return next({message: 'You cannot update this order data', cause: 403});}
    // update order
    const oldCouponId = updateOrder.coupon;
    updateOrder.coupon = null;
    updateOrder.totalPrice = updateOrder.shippingPrice;
    // save order
    await updateOrder.save();
    // update coupon usage count
    await CouponUser.updateOne({couponId: oldCouponId, userId: _id}, {$inc: {usageCount: -1}});
    // send response
    res.status(200).json({message: 'Order cancelled successfully', order: updateOrder});
}

export const cancelOrder = async (req, res, next) => {
	// destruct data from the user
    const {_id} = req.authUser
    const {orderId}= req.params;
    // check that order is found
    const updateOrder = await Order.findById(orderId)
    // check that order is found
    if(!updateOrder) return next({message: 'Order not found', cause: 404});
    // check that owner who try to cancel
    if(updateOrder.user.toString() != _id.toString()) return next({message: 'You are not authorized to cancel this order', cause: 403});
    // check that order is pending or placed
    if(updateOrder.orderStatus != 'Pending' && updateOrder.orderStatus != 'Placed') {
        return next({message: 'You cannot cancel this order', cause: 403});}
    // update order
    updateOrder.orderStatus = 'Cancelled';
    updateOrder.cancelledAt = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss');
    updateOrder.cancelledBy = _id;
    // save order
    await updateOrder.save();
    // product stock update
    for (const item of updateOrder.orderItems) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
    }
    // update coupon usage count
    if(updateOrder.coupon){
        await CouponUser.updateOne({couponId:updateOrder.coupon, userId: _id}, {$inc: {usageCount: -1}});
    }
    // send response
    res.status(200).json({message: 'Order cancelled successfully', order: updateOrder});
}

export const getAllOrdersForAdmin = async (req, res, next) => {
    // destruct data from the user
    const {page, size, sort, ...search} = req.query
    // check that order is found
    const features = new APIFeatures(req.query, Order.find())
    .pagination({page, size})
    .sort()
    .search(search)
    const orders = await features.mongooseQuery
    // send response
    res.status(200).json({message: 'Orders retrieved successfully', orders});
}

export const getOrders = async (req, res, next) => {
    // destruct data from the user
    const {_id} = req.authUser
    // check that order is found
    const orders = await Order.find({user: _id});
    // check that order is found
    if(!orders.length) return next({message: 'Orders not found', cause: 404});
    // send response
    res.status(200).json({message: 'Orders retrieved successfully', orders});
}

export const getOrderById = async (req, res, next) => {
    // destruct data from the user
    const {_id} = req.authUser
    const {orderId}= req.params;
    // check that order is found
    const order = await Order.findOne({_id: orderId, user: _id});
    // check that order is found
    if(!order) return next({message: 'Order not found', cause: 404});
    // send response
    res.status(200).json({message: 'Order retrieved successfully', order});
}

export const stripePay = async (req, res, next)=> {
    // destruct data from the user
    const {_id} = req.authUser
    const {orderId}= req.params;
    // check that order is found
    const order = await Order.findOne({_id: orderId, user: _id, orderStatus: 'Pending'});
    if(!order) return next({message: 'Order not found', cause: 404});
    // check out data
    const paymnetObj = {
        customer_email: req.authUser.email,
        metadata: {orderId: order._id.toString()},
        discounts: [],
        success_url: `${req.protocol}://${req.headers.host}/sucess`,
        cancel_url: `${req.protocol}://${req.headers.host}/cancel`,
        line_items: order.orderItems.map(item=>{
            return{
                price_data:{
                    currency: 'EGP',
                    product_data:{
                        name: item.title
                    },
                    unit_amount: item.price * 100
                },
                quantity: item.quantity,
            }
        })
    }
    // coupon check
    if(order.coupon){
        const stripeCoupon = await createStripeCoupon({couponId: order.coupon})
        if(stripeCoupon.status) return next({message: stripeCoupon.message, cause: 400});
        paymnetObj.discounts.push({
            coupon: stripeCoupon.id
        })
    }
    // pay
    const checkOutSession = await createCheckOutSession(paymnetObj)
    const paymentIntent = await createPaymentIntent({amount: order.totalPrice, currency: 'EGP'})
    order.payment_intent = paymentIntent.id;
    await order.save()
    // send response
    res.status(200).json({message: 'Order paid successfully', data: checkOutSession, paymentIntent});
}

export const stripeWebhookLocal = async (req, res, next)=> {
    // destruct orderId 
    const orderId = req.body.data.object.metadata.orderId
    // check that order is found
    const confirmedOrder = await Order.findById(orderId)
    if(!confirmedOrder) return next({message: 'Order not found', cause: 404});
    // confirm payment
    await confirmPaymentIntent({paymentIntentId: confirmedOrder.payment_intent});
    // update order
    confirmedOrder.isPaid = true;
    confirmedOrder.paidAt = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss');
    confirmedOrder.orderStatus = 'Paid';
    // save order
    await confirmedOrder.save();
    res.status(200).json({message: 'Order paid successfully'});
} 

export const userNeedToRefundOrder = async (req, res, next)=> {
    // destruct data from the user
    const{orderId} = req.params;
    const {_id} = req.authUser
    // check that order is found
    const findOrder = await Order.findOne({_id: orderId, orderStatus: 'Paid', refundRequest: false, isDelivered: false});
    if(!findOrder) return next({message: 'Order not found or cannot be refunded', cause: 404});
    // check owner
    if(findOrder.user.toString() != _id.toString()) return next({message: 'You are not authorized to refund this order', cause: 403});
    // update order
    findOrder.refundRequest = true;
    // save order
    await findOrder.save();
    // send response
    res.status(200).json({message: 'Your request has been sent successfully', order: findOrder});
}

export const refundOrder = async (req, res, next) => {
    // destruct data from the user
    const{orderId} = req.params;
    // check that order is found
    const findOrder = await Order.findOne({_id: orderId, orderStatus: 'Paid', refundRequest: true});
    if(!findOrder) return next({message: 'Order not found or cannot be refunded', cause: 404});
    // refund the payment intent
    const refund = await refundPaymentIntent({paymentIntentId: findOrder.payment_intent});
    // update order
    findOrder.orderStatus = 'Refunded';
    findOrder.refundRequest = false;
    findOrder.refundedAt = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss');
    findOrder.refundedBy = req.authUser._id;
    findOrder.isPaid = false;
    // save order
    await findOrder.save();
    // send response
    res.status(200).json({message: 'Order refunded successfully', order: refund});
}


