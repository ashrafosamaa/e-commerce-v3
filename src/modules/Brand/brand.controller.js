import { APIFeatures } from "../../utils/api-features.js";

import slugify from "slugify";

import SubCategory from "../../../DB/models/sub-category.model.js";
import Brand from "../../../DB/models/brand.model.js";
import Product from "../../../DB/models/product.model.js";
import cloudinaryConnection from "../../utils/cloudinary.js";
import generateUniqueString from "../../utils/generate-unique-string.js";

export const addBrand = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {name} = req.body
    const {categoryId, subCategoryId} = req.query
    // check that subCategory is found
    const subCategory = await SubCategory.findById(subCategoryId).populate('categoryId', 'folderId')
    if (!subCategory){
        return res.status(404).json({
            msg: "Sub Category not found"
        })
    }
    // check that category is found
    if(subCategory.categoryId._id != categoryId){
        return res.status(404).json({
            msg: "Category not found"
        })
    }
    // check if name duplicate in same subCategory
    const isBrandDuplicate = await Brand.findOne({ name, subCategoryId })
    if(isBrandDuplicate){
        return res.status(409).json({
            msg: "Name is already exists in same Sub Category, Please try another name"
        })
    }
    // slug
    const slug = slugify(name, '-')
    //ulpoad logo of brand
    if(!req.file){
        return res.status(400).json({
            msg: "Logo is required"
        })
    }
    const folderId = generateUniqueString(4)
    const {secure_url,public_id} = await cloudinaryConnection().uploader.upload(req.file.path,{
        folder: `${process.env.MAIN_FOLDER}/Categories/${subCategory.categoryId.folderId}/SubCategories/${subCategory.folderId}/Brands/${folderId}`
    })
    req.folder = `${process.env.MAIN_FOLDER}/Categories/${subCategory.categoryId.folderId}/SubCategories/${subCategory.folderId}/Brands/${folderId}`
    const brandObject ={
        name, 
        slug,
        Image: {secure_url, public_id},
        folderId,
        subCategoryId,
        categoryId,
        addedBy: _id
    }
    const newBrand = await Brand.create(brandObject)
    req.savedDocument = {model: Brand, _id: newBrand._id}
    if(!newBrand){
        await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${subCategory.categoryId.folderId}/SubCategories/${subCategory.folderId}/Brands/${folderId}`)
        await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${subCategory.categoryId.folderId}/SubCategories/${subCategory.folderId}/Brands/${folderId}`)
        return res.status(500).json({
            msg: "Something went wrong, Please try again"
        })
    }
    res.status(201).json({
        msg: "Brand added successfully",
        newBrand
    })
}

export const updateBrand = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {brandId} = req.params
    const {name, oldPublicId} = req.body
    // check that brand is found
    const brand = await Brand.findById(brandId)
    .populate([{path: 'categoryId', select: 'foderId'},
                {path: 'subCategoryId', select: 'foderId'}])
    if(!brand){
        return res.status(404).json({
            msg: "Brand not found"
        })
    }
    // check that user is owner
    if( req.authUser.role != systemRoles.SUPERADMIN &&
        brand.addedBy.toString() != _id.toString()){
        return res.status(403).json({
            msg: "You are not allowed to update this brand"
        })
    }
    // check if name duplicate
    if(name){
        const subCategoryId = brand.subCategoryId
        const isBrandDuplicate = await Brand.findOne({ name, subCategoryId })
        if(isBrandDuplicate){
            return res.status(409).json({
                msg: "Name is already exists in same Sub Category, Please try another name"
            })
        }
        brand.name = name
        // slug
        brand.slug = slugify(name, '-')
    }
    // upload logo
    if(oldPublicId){
        if(!req.file){
            return res.status(400).json({
                msg: "Logo is required"
            })
        }
        if(brand.Image.public_id != oldPublicId){
            return res.status(400).json({
                msg: "Not correct old image"
            })
        }
        const newPublicId = oldPublicId.split(`${brand.folderId}/`)[1]
        const {secure_url, public_id} = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${process.env.MAIN_FOLDER}/Categories/${brand.categoryId.folderId}/SubCategories/${brand.subCategoryId.folderId}/Brands/${brand.folderId}`,
            public_id: newPublicId
        })
        brand.Image.secure_url = secure_url
        req.folder = `${process.env.MAIN_FOLDER}/Categories/${brand.categoryId.folderId}/SubCategories/${brand.subCategoryId.folderId}/Brands/${brand.folderId}`
    }
    brand.updatedBy = _id
    await brand.save()
    res.status(200).json({ success: true, message: 'Brand updated successfully'})
}

export const getBrandSeparately = async (req, res, next)=> {
    const {page, size, sort} = req.query
    const features = new APIFeatures(req.query, Brand.find())
    .pagination({page, size})
    .sort()
    const brand = await features.mongooseQuery
    res.status(200).json({ msg: "Brands fetched successfully", data: brand })
}

export const getBrandById = async (req, res, next)=> {
    const {brandId} = req.params
    const brand = await Brand.findById(brandId)
    res.status(200).json({ msg: "Brand fetched successfully", data: brand })
}

export const getProductsInBrand = async (req, res, next)=> {
    const {page, size, sort} = req.query
    const {brandId} = req.params
    const features = new APIFeatures(req.query, Product.find({brandId}))
    .pagination({page, size})
    .sort()
    const brand = await features.mongooseQuery
    res.status(200).json({ msg: "Products fetched successfully", data: brand })
}

export const getBrandWithProducts = async (req, res, next)=> {
    const {page, size, sort} = req.query
    const features = new APIFeatures(req.query, Brand.find().populate([ { path: 'Products'} ]))
    .pagination({page, size})
    .sort()
    const brand = await features.mongooseQuery
    res.status(200).json({ msg: "Brands fetched successfully", data: brand })
}

export const deleteBrand = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {brandId} = req.params
    // check that brand is found and delete
    const deleteBrand = await Brand.findById(brandId).populate([
        {path: 'categoryId', select: 'folderId'}, 
        {path: 'subCategoryId', select: 'folderId'}])
    if(!deleteBrand){
        return res.status(404).json({
            msg: "Brand not found"
        })
    }
    // check that user is owner
    if(deleteBrand.addedBy.toString() != _id.toString() ){
        return res.status(403).json({
            msg: "You are not allowed to delete this brand"
        })
    }
    await deleteBrand.deleteOne()
    // delete related Products
    const products = await Product.deleteMany({brandId})
    if(products.deletedCount <= 0){
        console.log("No related Products to this Brand");
    }
    // delete images
    await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${deleteBrand.categoryId.folderId}/SubCategories/${deleteBrand.subCategoryId.folderId}/Brands/${deleteBrand.folderId}`)
    await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${deleteBrand.categoryId.folderId}/SubCategories/${deleteBrand.subCategoryId.folderId}/Brands/${deleteBrand.folderId}`)
    // send response
    res.status(200).json({message: 'Brand deleted successfully'})
}