import Stripe from "stripe";
import Coupon from "../../DB/models/coupon.model.js";

export const createCheckOutSession = async({
    customer_email,
    metadata,
    discounts,
    line_items,
    success_url,
    cancel_url
}) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const paymentData = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email,
        metadata,
        line_items,
        discounts,
        success_url,
        cancel_url
    })
    return paymentData
}

export const createStripeCoupon = async ({couponId})=> {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const findCoupon = await Coupon.findById(couponId)
    if(!findCoupon) {
        return {status: false, message: "Coupon not found"}
    }
    let couponObj = {}
    if(findCoupon.isFixed){
        couponObj = {
            name: findCoupon.couponCode,
            amount_off: findCoupon.couponAmount * 100,
            currency: "EGP"
        }
    }
    if(findCoupon.isPercentage){
        couponObj = {
            name: findCoupon.couponCode,
            percent_off: findCoupon.couponAmount,
            currency: "EGP"
        }
    }
    const stripeCoupon = await stripe.coupons.create(couponObj)
    return stripeCoupon
}

export const createStripePaymentMethod = async ({token})=> {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: {token}
    })
    return paymentMethod
}

export const createPaymentIntent = async ({amount, currency}) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentMethod = await createStripePaymentMethod({token: 'tok_visa'});
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency,
        automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
        },
        payment_method: paymentMethod.id,
    });
    return paymentIntent;
}

export const retrievePaymentIntent = async ({paymentIntentId}) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
}

export const confirmPaymentIntent = async ({paymentIntentId}) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentDetails = await retrievePaymentIntent ({paymentIntentId});
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentDetails.payment_method
    });
    return paymentIntent;
}

export const refundPaymentIntent = async ({paymentIntentId}) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
    });
    return refund;
}