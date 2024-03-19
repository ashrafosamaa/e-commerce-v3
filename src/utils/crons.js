import { scheduleJob } from "node-schedule"
import {DateTime} from 'luxon'

import CouponUser from "../../DB/models/coupon-user.model.js"
import Product from "../../DB/models/product.model.js"
import Coupon from "../../DB/models/coupon.model.js"
import Order from "../../DB/models/order.model.js"

export function cronToChangeExpiredCoupons(){
    scheduleJob('0 0 0 * * *', async ()=> { 
        console.log('hi every day at 00:00:00 am check coupons')
        const coupons = await Coupon.find({couponStatus: 'valid'})
        if(!coupons.length) return console.log('No coupons to expire')
        for (const coupon of coupons) {
            if(DateTime.fromISO(coupon.toDate) < DateTime.now()){
                console.log(`Coupon: ${coupon._id} expired.`);
                coupon.couponStatus = 'expired'
            }
            await coupon.save()
        }
    })
}

export function cronToCancelOrders(){
    scheduleJob('0 0 0 * * *', async ()=> {
        console.log('hi every day at 00:00:00 am check orders')
        const orders = await Order.find({orderStatus: 'Pending'})
        if(!orders.length) return console.log('No orders to cancel')
        for (const order of orders) {
            const createdAtStr = JSON.stringify(order.createdAt);
            const splitCreatedAtstr = createdAtStr.split('.')[0] + '"'
            const cleanSplitCreatedAtstr = splitCreatedAtstr.replace(/"/gi, '');
            const orderCreatedAt = DateTime.fromISO(cleanSplitCreatedAtstr)
            // cancel order after one day from adding it
            if(orderCreatedAt <= DateTime.now().minus({seconds: 1})){
                console.log(`Order: ${order._id} cancelled.`);
                order.orderStatus = 'Cancelled'
                for (const item of order.orderItems) {
                    await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
                }
                order.orderItems = null
                if(order.coupon){
                    await CouponUser.updateOne({couponId:order.coupon, userId: order.user}, {$inc: {usageCount: -1}});
                }
                order.coupon = null
            }
            await order.save();
        }
    })
}
