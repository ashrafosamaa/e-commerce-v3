import { Schema, model } from "mongoose"

const categorySchema = new Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, required: true, unique: true, trim: true },
        Image: {
            secure_url: { type: String, required: true },
            public_id: { type: String, required: true, unique: true }
        },
        folderId: { type: String, required: true, unique: true },
        addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // superAdmin
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // superAdmin
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    })

categorySchema.virtual('subCategories', {
    ref: 'SubCategory',
    localField: '_id',
    foreignField: 'categoryId'
})

categorySchema.virtual('Brands', {
    ref: 'Brand',
    localField: '_id',
    foreignField: 'categoryId'
})

categorySchema.virtual('Products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'categoryId'
})

const Category = model('Category', categorySchema)

export default Category