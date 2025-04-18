import express from "express"
import userRouter from "./routes/user.routes.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import courseRouter from "./routes/course.routes.js"
import paymentRouter from "./routes/payment.routes.js"

export const app=express()

app.use(cors(
    {
        origin:process.env.ORIGIN,
        credentials:true
    }
))
app.use(cookieParser())
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({limit:"16kb"}))
app.use(express.static("public"))

app.use("/api/v1/auth",userRouter)
app.use("/api/v1/courses",courseRouter)
app.use("/api/v1/payment",paymentRouter)

//! this status(>=400) code will tell frontend to identify it as error and  catch this error
app.use((err, req, res, next) => {
    console.error(err); // Logs error for debugging
    res.status(err.statusCode || 500).json({ 
        success: false,
        message: err.message || "Internal Server Error"
    });
});
