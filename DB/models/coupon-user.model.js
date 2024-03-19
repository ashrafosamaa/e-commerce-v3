import mongoose from "mongoose";

const couponUsersSchema = new mongoose.Schema({
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    maxUsage: {
        type: Number,
        required: true,
        min: 1
    },
    usageCount: {
        type: Number,
        default: 0,
        min: 0
    },
},{timestamps: true});

couponUsersSchema.index({ couponId: 1, userId: 1 }, { unique: true });

const CouponUser = mongoose.model('CouponUsers', couponUsersSchema);

export default CouponUser