import { Course } from "../models/Course.model.js"
import { User } from "../models/User.model.js"
import { apiError } from "../utilities/apiError.js"
import { apiResponse } from "../utilities/apiResponse.js"
import { asyncHandler } from "../utilities/asyncHandler.js"
import {instance} from "../utilities/razorpay.js"
import crypto from "crypto"
import { sendVerificationMail } from "../utilities/sendVerificationMail.js"
import mongoose from "mongoose"

// *to buy single or multiple course
export const createOrder=asyncHandler(async(req,res)=>{
    // *frontend will send an array of courseId that user wants to purchase
    const {courses}=req.body
    const userId=req.authPayload._id
    const user=await User.findById(userId)
    if(!user){
        throw new apiError(400,"user not found")
    }
    if(!courses){
        throw new apiError(400,"please provide course")
    }
    if(courses.length===0){
        throw new apiError(400,"please provide course")
    }
    let totalAmount=0
    for(const courseId of courses){
        const course=await Course.findById(courseId)
        if(!course){
            throw new apiError(400,"course not found")
        }
        console.log(courses,user.courses);
        const isPurchased=user.courses.some((c) => c.toString() === courseId)
        if(isPurchased){
            throw new apiError(400,"course already purchased")
        }
        totalAmount=totalAmount+course.price
    }
    const options={
        amount:totalAmount*100,
        currency:"INR",
        receipt:Math.floor(Math.random()*Date.now()*100).toString(),
        // notes:{
        //     userId,
        //     courses:JSON.stringify(courses) //*could not send array in notes so converted array to string using stringify
        // }
    }
    try {
        const response=await instance.orders.create(options)
        res.status(200).json(new apiResponse(200,response,"order created"))
    } catch (error) {
        throw new apiError(500,error?.error?.description || "could not create order")
    }
})

// *verify signature and enroll student into course
export const verifySignature=asyncHandler(async(req,res)=>{
    const razorpay_payment_id=req.body["razorpay_payment_id"]
    const razorpay_order_id=req.body["razorpay_order_id"]
    const razorpay_signature=req.body["razorpay_signature"]
    const userId=req.authPayload._id
    const {courses}=req.body //*converted string back to array
    // console.log("data we are receiving",req.body,userId);
    

    if(!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !userId || !courses){
        throw new apiError(400,"payment failed: missing details")
    }
    const user=await User.findById(userId)
    if(!user){
        throw new apiError(400,"user not found")
    }

    const generatedSignature = crypto.createHmac("sha256",process.env.RAZORPAY_SECRET).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex")
    
    if (generatedSignature !== razorpay_signature) {
            throw new apiError(400,"payment verification failed")
    }
    
    let enrolledCourses=""
    for(const courseId of courses){
        const course=await Course.findByIdAndUpdate(courseId,{$push:{studentsEnrolled:userId}},{new:true})
        if(!course){
            throw new apiError(400,"course not found")
        }
        enrolledCourses=enrolledCourses+course.title+", "
        const updatedUser= await User.findByIdAndUpdate(userId,{$push:{courses:courseId}})
        if(!updatedUser){
            throw new apiError(400,"user not found")
        }
    }
    const mailRes= await sendVerificationMail(user.email,"Course Purchased",`You have been enrolled in ${enrolledCourses}`) 
    return res.status(200).json(new apiResponse(200,{},"payment verified"))

})

// *send mail on successful payment 
export const sendPaymentConfirmationMail=asyncHandler(async(req,res)=>{
    const user=await User.findById(req.authPayload._id)
    const {amount,orderId,paymentId}=req.body
    const mailRes=await sendVerificationMail(user.email,"Payment Success",`your payment of ${amount} was successful and for reference paymentId:${paymentId} orderId:${orderId}`)
    if(!mailRes){
        throw new apiError(500,"unable to send mail")
    }
    res.status(200).json(new apiResponse(200,{},"mail send successfully"))
})


// *to buy single course
// export const createOrder=asyncHandler(async(req,res)=>{
//     const {courseId}=req.body
//     const userId=req.authPayload._id
//     if(!courseId || !userId){
//         throw new apiError(400,"please provide both courseId and userId")
//     }
//     const course=await Course.findById(courseId)
//     if(!course){
//         throw new apiError(400,"course does not exists")
//     }
//     const user=await User.findById(userId)
//     if(!user){
//         throw new apiError(400,"user with userId does not exist")
//     }
//     const newUserId=await new mongoose.Types.ObjectId(userId)
//     if(course.studentsEnrolled.includes(newUserId)){
//         throw new apiError(400,"course already purchased")
//     }
//     const options={
//         amount:course.price,
//         currency:"INR",
//         receipt:Math.floor(Math.random()*Date.now()*100).toString(),
//         notes:{
//             courseId,
//             userId
//         }
//     }
//     const response=await instance.orders.create(options)
//     res.status(200).json(new apiResponse(200,response,"order created successfully"))

// })

// export const verifySignature=asyncHandler(async(req,res)=>{
//     const webHookSecret=process.env.WEB_HOOK_SECRET
//     const signature=req.headers["x-razorpay-signature"]
//     if(!signature){
//         throw new apiError(400,"signature is not present in header")
//     }
    
//     const shasum=crypto.createHmac("sha256",webHookSecret)
//     shasum.update(JSON.stringify(req.body))
//     const digest=shasum.digest("hex")
//     if(signature!==digest){
//         throw new apiError(400,"incorrect signature")
//     }
//     const payment = req.body.payload.payment.entity
//     if(payment.status!=="captured"){
//         throw new apiError(400,"payment failed")
//     }
//     const {courseId,userId}=req.body.payload.payment.entity.notes
//     if (!courseId || !userId) {
//         throw new apiError(400, "Missing courseId or userId in webhook payload");
//     }
    
//     const course=await Course.findByIdAndUpdate(
//         courseId,
//         {$push:{studentsEnrolled:userId}},
//         {new:true}
//     )
//     const user=await User.findByIdAndUpdate(userId,
//         {$push:{courses:courseId}},
//         {new:true}
//     )
//     if(!user || !course){
//         throw new apiError(400,"user or course not found")
//     }
//     await sendVerificationMail(user.email,"congratulations",`${user.firstName} is enrolled in ${course.title}`)

//     res.status(200).json(new apiResponse(200,{userId,courseId},"student enrolled in course successfully"))
// })