import db_connection from "../DB/connection.js"
import { globalResponse } from "./middlewares/global-response.middleware.js"
import { rollbackSavedDocument } from "./middlewares/rollback-saved-document.middleware.js"
import { rollbackUploadedFiles } from "./middlewares/rollback-uploaded-files.middleware.js"
import { cronToCancelOrders, cronToChangeExpiredCoupons } from "./utils/crons.js"
import cors from 'cors'

import * as routers from "./modules/index.routes.js"

export const initiateApp = (app, express)=> {
    const port = process.env.PORT

    app.use(express.json())

    db_connection()
    
    app.use(cors())
    app.use('/user', routers.userRouter)
    app.use('/auth', routers.authRouter)
    app.use('/category', routers.categoryRouter)
    app.use('/sub-category', routers.subCategoryRouter)
    app.use('/brand', routers.brandRouter)
    app.use('/product', routers.productRouter)
    app.use('/cart', routers.cartRouter)
    app.use('/coupon', routers.couponRouter)
    app.use('/order', routers.orderRouter)
    app.use('/review', routers.reviewRouter)
    
    app.use('*', (req, res, next)=> {
        return next({message: "Page not found", cause: 404})
    })

    app.use(globalResponse, rollbackUploadedFiles, rollbackSavedDocument)
    cronToChangeExpiredCoupons()
    cronToCancelOrders()

    app.listen(port, ()=> console.log(`server is running on port ${port}`))

}