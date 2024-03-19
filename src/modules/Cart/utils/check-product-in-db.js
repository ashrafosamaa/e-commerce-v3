import Product from '../../../../DB/models/product.model.js'
export async function checkProductAvailability(productId, quantity) {
    const product = await Product.findById(productId)
    if (!product || product.stock < quantity) return null
    return product
}