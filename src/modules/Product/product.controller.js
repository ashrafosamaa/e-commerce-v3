import { systemRoles } from "../../utils/system-roles.js";
import { APIFeatures } from "../../utils/api-features.js";

import slugify from "slugify";

import Brand from "../../../DB/models/brand.model.js";
import Product from "../../../DB/models/product.model.js";
import cloudinaryConnection from "../../utils/cloudinary.js";
import generateUniqueString from "../../utils/generate-unique-string.js";

export const addProduct = async (req, res, next)=> {
    // destruct data from user
    const { title, desc, stock, basePrice, discount, specs } = req.body
    const { brandId, categoryId, subCategoryId } = req.query
    const addedBy = req.authUser._id
    // check that brand is found
    const brand = await Brand.findById(brandId)
    if(!brand){
        return res.status(404).json({
            msg: "Brand not found"
        })
    }
    // check that category and sub-category are exist
    if(brand.categoryId != categoryId){
        return res.status(404).json({
            msg: "Category not found"
        })
    }
    if(brand.subCategoryId != subCategoryId){
        return res.status(404).json({
            msg: "SubCategory not found"
        })
    }
    // who can add product
    if(brand.addedBy.toString() != addedBy.toString()){
        return res.status(403).json({
            msg: "You are not allowed to product to this brand"
        })
    }
    // slug
    const slug = slugify(title, {lower: true, replacement: '-'})
    // price calculation
    const appliedPrice = basePrice - (basePrice * ((discount || 0) /100))
    // images 
    if(!req.files?.length){
        return res.status(400).json({
            msg: "Images are required"
        })
    }
    const folderId = generateUniqueString(4)
    let Images = []
    const folder = brand.Image.public_id.split(`${brand.folderId}/`)[0]
    for (const file of req.files) {
        const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(file.path, {
            folder: folder + `${brand.folderId}` + `/Products/${folderId}`
        })
        Images.push({ secure_url, public_id })
    }
    req.folder = folder + `${brand.folderId}` + `/Products/${folderId}`
    // product
    const product = {
        title, desc, slug, folderId, basePrice, discount, appliedPrice,
        stock, addedBy, brandId, subCategoryId, categoryId, Images, specs: JSON.parse(specs)
    }
    const newProduct = await Product.create(product)
    req.savedDocument = { model: Product, _id: newProduct._id }
    // send response
    res.status(201).json({ message: 'Product created successfully', data: newProduct })
}

export const updateProduct = async (req, res, next)=> {
    // destruct data from the user
    const { _id } = req.authUser
    const { title, desc, basePrice, discount, stock, specs, oldPublicId } = req.body
    const { productId } = req.params
    // check that product is found 
    const product = await Product.findById(productId)
    if(!product){
        return res.status(404).json({
            msg: "Product not found"
        })
    }
    // check who can update product
    if (
        req.authUser.role !== systemRoles.SUPERADMIN &&
        product.addedBy.toString() !== _id.toString()
    ){ return next({ message: 'You are not allowed to add product to this brand' })}
    // title, desc, specs
    if(title){
        product.title = title
        product.slug = slugify(title, {lower: true, replacement: '-'})
    }
    if(desc) product.desc = desc
    if(stock) product.stock = stock
    if(specs) product.specs = JSON.parse(specs)
    // prices calculation
    const appliedPrice = basePrice || product.basePrice 
     - ((basePrice || product.basePrice) * ((discount || product.discount) /100))
    product.appliedPrice = appliedPrice
    if (discount) product.discount = discount
    if (basePrice) product.basePrice = basePrice
    if(oldPublicId){
        if(!req.file){
            return res.status(400).json({msg: "Image is required to be uploaded"})
        }
        const newPublicId = oldPublicId.split(`${product.folderId}/`)[1]
        const { secure_url } = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${oldPublicId.split(`${product.folderId}/`)[0]}${product.folderId}`,
            public_id: newPublicId
        })
        product.Images.map(img => {
            if (img.public_id === oldPublicId) img.secure_url = secure_url
        })
        req.folder = `${oldPublicId.split(`${product.folderId}/`)[0]}${product.folderId}`
    }
    const updatedProduct = await product.save()
    res.status(200).json({ success: true, message: 'Product updated successfully', data: updatedProduct })
}

export const getAllProducts = async (req, res, next)=> {
    const {page, size, sort} = req.query
    const features = new APIFeatures(req.query, Product.find())
    .pagination({ page, size })
    .sort(sort)
    const products = await features.mongooseQuery
    res.status(200).json({ msg: "Products fetched successfully", data: products })
}

export const getSpecProduct = async (req, res, next)=> {
    const { productId } = req.params
    const product = await Product.findById({_id: productId})
    if(!product){
        return res.status(404).json({
            msg: "Product not found"
        })
    }
    res.status(200).json({ msg: "Products fetched successfully", data: product })
}

export const searchProduct = async (req, res, next)=> {
    const {page, size, sort, ...search} = req.query
    const features = new APIFeatures(req.query, Product.find())
    .pagination({ page, size })
    .sort()
    .search(search)
    const products = await features.mongooseQuery
    res.status(200).json({ msg: "Products fetched successfully", data: products })
}

export const filterProduct = async (req, res, next)=> {
    const {page, size, sort, ...search} = req.query
    const features = new APIFeatures(req.query, Product.find())
    .pagination({ page, size })
    .sort()
    .filter(search)
    const products = await features.mongooseQuery
    res.status(200).json({ msg: "Products fetched successfully", data: products })
}

export const deleteProduct = async (req, res, next)=> {
    // destruct data from the user
    const { _id } = req.authUser
    const { productId } = req.params
    // check that product is found 
    const product = await Product.findById(productId)
    if(!product){
        return res.status(404).json({
            msg: "Product not found"
        })
    }
    // check who can update product
    if (
        req.authUser.role !== systemRoles.SUPERADMIN &&
        product.addedBy.toString() !== _id.toString()
    ) return next({ message: 'You are not allowed to add product to this brand' })
    // delete product
    await product.deleteOne()
    // delete images
    const deletePhotos = `${product.Images[0].public_id.split(`${product.folderId}/`)[0]}${product.folderId}`
    await cloudinaryConnection().api.delete_resources_by_prefix(deletePhotos)
    await cloudinaryConnection().api.delete_folder(deletePhotos)
    // send response
    res.status(200).json({ success: true, message: 'Product deleted successfully' })
}
