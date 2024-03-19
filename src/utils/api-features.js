import { paginationFunction } from "./pagination.js"

export class APIFeatures {
    constructor(query, mongooseQuery) {
        this.query = query 
        this.mongooseQuery = mongooseQuery
    }
    pagination({ page, size }) {
    //  Get all products paginated 
        const { limit, skip } = paginationFunction({ page, size })  
        this.mongooseQuery = this.mongooseQuery.limit(limit).skip(skip)
        return this
    }
    sort(sortBy) {
        if (!sortBy) {
            this.mongooseQuery = this.mongooseQuery.sort({ updatedAt: -1 })
            return this
        }
        const formula = sortBy.replace(/desc/g, -1).replace(/asc/g, 1).replace(/ /g, ':') 
        const [key, value] = formula.split(':')
        this.mongooseQuery = this.mongooseQuery.sort({ [key]: +value })
        return this
    }
    search(search) {
    //  Search on product with any field
        const queryFiler = {}
        if (search.title) queryFiler.title = { $regex: search.title, $options: 'i' }
        if (search.desc) queryFiler.desc = { $regex: search.desc, $options: 'i' }
        if (search.stock) queryFiler.stock = { $in: search.stock }
        if (search.basePrice) queryFiler.basePrice = { $in: search.basePrice }
        if (search.discount) queryFiler.discount = { $ne: 0 }
        if (search.priceFrom && !search.priceTo) queryFiler.appliedPrice = { $gte: search.priceFrom }
        if (search.priceTo && !search.priceFrom) queryFiler.appliedPrice = { $lte: search.priceTo }
        if (search.priceTo && search.priceFrom) queryFiler.appliedPrice = { $gte: search.priceFrom, $lte: search.priceTo }
    //  return all products for 2 specific brands using ( in operator)
        if (search.brand1 && !search.brand2) queryFiler.brandId = { $in: search.brand1 }
        if (search.brand2 && !search.brand1) queryFiler.brandId = { $in: search.brand2 }
        if (search.brand1 && search.brand2) queryFiler.brandId = { $in:[search.brand1, search.brand2] }
        if (search.refundRequest) queryFiler.refundRequest = {$in: search.refundRequest}
        this.mongooseQuery = this.mongooseQuery.find(queryFiler)
        return this
    }
    filter(filters) {
        const queryFilter = JSON.parse(
            JSON.stringify(filters).replace(
                /gt|gte|lt|lte|in|nin|eq|ne|regex/g,
                (operator) => `$${operator}`,
            ),
        )
        this.mongooseQuery.find(queryFilter)
        return this
    }
}