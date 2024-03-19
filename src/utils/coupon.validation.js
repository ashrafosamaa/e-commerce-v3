import { DateTime } from 'luxon'

import Coupon from '../../DB/models/coupon.model.js'
import CouponUsers from '../../DB/models/coupon-user.model.js'

export async function applyCouponValidation(couponCode, userId){
    // couponCodeCheck
    const coupon  = await Coupon.findOne({couponCode})
    if(!coupon) return { msg: 'Coupon Code is invalid' , status:400}
    // couponStatus Check
    if(
        coupon.couponStatus == 'expired' || 
        DateTime.fromISO(coupon.toDate) < DateTime.now()
    ) return { msg: 'This coupon has been expired' , status:400}
    // start date check
    if(
        DateTime.now() < DateTime.fromISO(coupon.fromDate) 
    ) return { msg: 'This coupon is not started yet' , status:400}
    // user cases
    const isUserAssgined = await CouponUsers.findOne({couponId:coupon._id , userId})
    if(!isUserAssgined) return { msg: 'This coupon is not assgined to you' , status:400}
    // maxUsage Check
    if(isUserAssgined.maxUsage <= isUserAssgined.usageCount)  return { msg: 'You have exceed the usage count for this coupon' , status:400}
    // return coupon
    return coupon
}
