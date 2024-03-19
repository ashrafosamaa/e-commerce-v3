import { APIFeatures } from "../../utils/api-features.js"
import { systemRoles } from "../../utils/system-roles.js"
import { applyCouponValidation } from "../../utils/coupon.validation.js"

import CouponUser from "../../../DB/models/coupon-user.model.js"
import Coupon from "../../../DB/models/coupon.model.js"
import User from "../../../DB/models/user.model.js"

export const addCoupon = async (req, res, next) => {
    // destruct data from the user
    const { _id } = req.authUser
    const { couponCode, couponAmount, isFixed, isPercentage, fromDate, toDate, users } = req.body
    // check that coupon code is duplicated
    const coupon = await Coupon.findOne({ couponCode })
    if (coupon) return res.status(409).json({ msg: "Coupon code already exists" })
    // check that coupon amount is valid
    if(isFixed == isPercentage) return res.status(400).json({ msg: "Coupon amount must be either fixed or percentage" })
    // is Percentage check
    if(isPercentage && couponAmount > 100) return res.status(400).json({ msg: "Coupon amount must be less than 100" })
    // create new document in database
    const newCoupon = await Coupon.create({
        couponCode,
        couponAmount,
        isFixed,
        isPercentage,
        fromDate,
        toDate,
        addedBy: _id
    })
    req.savedDocument = { model: Coupon, _id: newCoupon._id }
    // check that user is exist
    const userIds = []
    for (const user of users) {
        userIds.push(user.userId)
    }
    const isUserExist = await User.find({_id: {$in:userIds}})
    if( isUserExist.length != users.length) return next({message: "User not found", cause: 404})
    // create coupon-users
    const couponUsers = await CouponUser.create(
        users.map(ele => ({...ele, couponId: newCoupon._id}))
    )
    req.savedDocument = { model: CouponUser, _id: couponUsers._id }
    // send response
    res.status(201).json({ msg: "Coupon added successfully", data: newCoupon, couponUsers })
} 

export const getAllCoupons = async (req, res, next) => {
    // destruct data from the user
    const {page, size} = req.query
    // get all coupons
    const features = new APIFeatures(req.query, CouponUser.find().populate({path: "couponId"}))
    .pagination({ page, size })
    .sort()
    const coupons = await features.mongooseQuery
    // send response
    res.status(200).json({ msg: "Coupons fetched successfully", data: coupons })
}

export const getCouponByCode = async (req, res, next) => {
    // destruct data from the user
    const { couponCode } = req.query
    // get coupon
    const coupon = await Coupon.findOne({ couponCode })
    if(!coupon) return res.status(404).json({ msg: "Coupon not found" })
    // send response
    res.status(200).json({ msg: "Coupon fetched successfully", data: coupon })
}

export const deleteCoupon = async (req, res, next) => {
    // destruct data from the user
    const { _id } = req.authUser
    const { couponId } = req.params
    // check that coupon is found
    const coupon = await Coupon.findById({_id: couponId})
    if(!coupon) return res.status(404).json({ msg: "Coupon not found" })
    // check who can delete coupon
    if( req.authUser.role !== systemRoles.SUPERADMIN &&
        coupon.addedBy.toString() !== _id.toString()) return next({message: "You are not allowed to delete this coupon", cause: 403})
    // delete coupon
    await coupon.deleteOne()
    await CouponUser.deleteMany({couponId})
    // send response
    return res.status(200).json({ msg: "Coupon deleted successfully" })
}

export const updateCoupon = async (req, res, next)=> {
    // destruct data from the user
    const { _id } = req.authUser
    const { couponId } = req.params
    const { couponCode, couponAmount, isFixed, isPercentage, fromDate, toDate, users } = req.body
    // check that coupon is found
    const coupon = await Coupon.findById({_id: couponId})
    if(!coupon) return res.status(404).json({ msg: "Coupon not found" })
        // check who can update coupon
    if(req.authUser.role !== systemRoles.SUPERADMIN &&
        coupon.addedBy.toString() !== _id.toString()) return next({message: "You are not allowed to update this coupon", cause: 403})
    // update coupon
    if(couponCode){
        // check that coupon code is duplicated
        if(couponCode != coupon.couponCode){
            const couponCodeCheck = await Coupon.findOne({ couponCode })
            if (couponCodeCheck) return res.status(409).json({ msg: "Coupon code already exists" })
        }
        coupon.couponCode = couponCode
    }
    if(couponAmount) coupon.couponAmount = couponAmount
    if(fromDate) coupon.fromDate = fromDate
    if(toDate) coupon.toDate = toDate
    if(isFixed) coupon.isFixed = isFixed
    if(isPercentage) coupon.isPercentage = isPercentage
    coupon.updatedBy = _id
    // check that coupon amount is valid
    if(isFixed == isPercentage) return res.status(400).json({ msg: "Coupon amount must be either fixed or percentage" })
    // is Percentage check
    if(isPercentage == true && couponAmount > 100) return res.status(400).json({ msg: "Coupon amount must be less than 100" })
    await coupon.save()
    // asigned users
    if(users){
        await CouponUser.deleteMany({couponId})
        const userIds = []
        for (const user of users) {
            userIds.push(user.userId)
        }
        const isUserExist = await User.find({_id: {$in:userIds}})
        if( isUserExist.length != users.length) return next({message: "User not found", cause: 404})
        // create coupon-users
        const couponUsers = await CouponUser.create(
            users.map(ele => ({...ele, couponId: coupon._id}))
        )
        req.savedDocument = { model: CouponUser, _id: couponUsers._id }
        // send response
        res.status(202).json({ msg: "Coupon updated successfully", data: coupon, couponUsers })
    }
    res.status(202).json({ msg: "Coupon updated successfully", data: coupon })
}

export const validateCoupon = async (req,res,next)=>{
    // destruct data from the user
    const {code} = req.body
    const {_id : userId} = req.authUser
    // check that coupon is found
    // applyCouponValidation
    const isCouponValid = await applyCouponValidation(code , userId)
    if(isCouponValid.status){
        return next({message:isCouponValid.msg , cause:isCouponValid.status})
    }
    // send response
    res.json({message:'Coupon is valid', coupon:isCouponValid})
}