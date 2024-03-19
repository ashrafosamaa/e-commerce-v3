import Cart from "../../../DB/models/cart.model.js"
import Product from "../../../DB/models/product.model.js"

export const getCart = async (req, res) => {
    // destruct data from the user
    const { _id } = req.authUser
    // check that cart is found
    const userCart = await Cart.findOne({ userId: _id })
    if (!userCart) return res.status(404).json({ msg: "Cart not found" })
    // send response
    res.status(200).json({ msg: "Cart fetched successfully", data: userCart })
}

export const addProductToCart = async (req, res) => {
    // destruct data from the user
    const { _id } = req.authUser
    const { productId, quantity } = req.body
    // check that product is found
    const product = await Product.findById(productId)
    if(!product) return res.status(404).json({ msg: "Product not found" })
    if(product.stock < quantity) return res.status(400).json({ msg: "Product out of stock" })
    // check that quantity is valid
    if(quantity < 0) return res.status(400).json({ msg: "Quantity must be greater than 0" })
    // check that cart is not found
    const userCart = await Cart.findOne({ userId: _id })
    if (!userCart) {
        const cart = {
            userId: _id,
            products: [
                {
                    productId,
                    quantity,
                    basePrice: product.appliedPrice,
                    finalPrice: product.appliedPrice * quantity,
                    title: product.title
                }
            ],
            subTotal: product.appliedPrice * quantity
        }
        const newCart = await Cart.create(cart)
        req.savedDocument = { model: Cart, _id: newCart._id }
        return res.status(201).json({ msg: "Product added to cart successfully", data: newCart })
    }
    // add new product to cart
    let isProductsExists = false
    let subTotal = 0
    for (const product of userCart.products) {
        if(product.productId == productId){
            product.quantity = quantity
            product.finalPrice = product.basePrice * quantity
            isProductsExists = true
        }
    }
    // add new product to cart
    if(!isProductsExists){
        userCart.products.push({
            productId,
            quantity,
            basePrice: product.appliedPrice,
            finalPrice: product.appliedPrice * quantity,
            title: product.title
        })
    }
    for (const product of userCart.products) {
        subTotal += product.finalPrice
    }
    userCart.subTotal = subTotal
    await userCart.save()
    return res.status(201).json({ msg: "Product added to cart successfully", data: userCart })
}

export const removeProductFromCart = async (req, res, next)=> {
    // destruct data from the user
    const { _id } = req.authUser
    const { productId } = req.params
    // check that cart is found
    const userCart = await Cart.findOne({ userId: _id, 'products.productId': productId })
    if(!userCart) return res.status(404).json({ msg: "Product not found" })
    // remove product from cart
    userCart.products = userCart.products.filter(product => product.productId != productId)
    // update cost of cart
    let subTotal = 0
    for (const product of userCart.products) {
        subTotal += product.finalPrice
    }
    userCart.subTotal = subTotal
    const newCart = await userCart.save()
    // check that cart is empty
    if(newCart.products.length == 0) await newCart.deleteOne()
    return res.status(200).json({ msg: "Product removed from cart successfully", data: userCart })
}

export const deleteCart = async (req, res, next)=> {
    // destruct data from the user
    const { _id } = req.authUser
    const { cartId } = req.params
    // check that cart is found
    const userCart = await Cart.findOne({_id: cartId, userId: _id})
    if(!userCart) return res.status(404).json({ msg: "Cart not found" })
    // delete cart
    await userCart.deleteOne()
    return res.status(200).json({ msg: "Cart deleted successfully" })
} 