import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: [{
        title:{type: String, required: true},
        quantity:{type: Number, required: true},
        price:{type: Number, required: true},
        product:{type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true}
    }],
    shippingAddress:{
        address:{type: String, required: true},
        city:{type: String, required: true},
        postalCode:{type: String, required: true},
        country:{type: String, required: true}
    },
    phoneNumbers:[{type: String, required: true}],

    shippingPrice:{type: Number, required: true}, // array subtotal
    coupon:{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon'},
    totalPrice:{type: Number, required: true}, // shipping price - coupon is exits , if not = shipping price

    paymentMethod:{type: String, enum:['Cash' ,'Stripe','Paymob'], required: true},
    orderStatus:{type: String , enum:['Pending', 'Paid', 'Delivered', 'Placed', 'Cancelled', 'Refunded', 'On Way'], required: true , default: 'Pending'},

    isPaid:{type: Boolean, required: true, default: false},
    paidAt:{type: String},
    
    isDelivered:{type: Boolean, required: true, default: false},
    deliveredAt:{type: String},
    deliveredBy:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    
    cancelledAt:{type: String},
    cancelledBy:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    payment_intent: String,

    refundRequest:{type: Boolean, default: false},

    refundedAt:{type: String},
    refundedBy:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    onWayAt:{type: String},
    onWayBy:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
},{timestamps: true});


const Order = mongoose.model('Order', orderSchema);

export default Order