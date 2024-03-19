import { Schema, model } from "mongoose";

const productSchema = new Schema(
    {
        // strings
        title: { type: String, required: true, trim: true },
        desc: String,
        slug: { type: String, required: true }, // lowercase
        folderId: { type: String, required: true, unique: true },

        // numbers
        basePrice: { type: Number, required: true },
        discount: { type: Number, default: 0, min: 0, max: 100 },
        appliedPrice: { type: Number, required: true },
        stock: { type: Number, required: true, min: 0, default: 1 },
        rate: { type: Number, default: 0, min: 0, max: 5 },

        // objectIds
        addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updateBy: { type: Schema.Types.ObjectId, ref: 'User' },
        brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
        subCategoryId: { type: Schema.Types.ObjectId, ref: 'SubCategory', required: true },
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },

        // arrays
        Images: [
            {
                secure_url: { type: String, required: true },
                public_id: { type: String, required: true, unique: true }
        }],
        specs: {
            type: Map,
            of: [String | Number]
        },
    },
    { timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    },
)

productSchema.virtual('Reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'productId'
})


const Product = model('Product', productSchema);

export default Product