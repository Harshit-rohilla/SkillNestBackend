import { apiError } from "../utilities/apiError.js";
import { asyncHandler } from "../utilities/asyncHandler.js";
import jwt from "jsonwebtoken"
// import { User } from "../models/user.model";

// verify access token middleware
export const authenticate=asyncHandler(async(req,res,next)=>{
    const token=req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ","")
    if(!token){
        throw new apiError(401,"unauthorized request")
    }
    
    try {
        const payload= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        req.authPayload=payload
        next()
    } catch (error) {
        // console.log(error);
        throw new apiError(401,"token expired")
    }
    // const user=await User.findById(payload._id)
    // if(!user){
    //     throw new apiError(400,"user with given accessToken does not exist")
    // }
    

})

// check student middleware
export const isStudent=asyncHandler(async(req,res,next)=>{
    const {accountType}=req.authPayload
    if(accountType!=="student"){
        throw new apiError(401,"not authorized for student section")
    }
    next()
})

// check instructor middleware
export const isInstructor=asyncHandler(async(req,res,next)=>{
    const {accountType}=req.authPayload
    if(accountType!=="instructor"){
        throw new apiError(401,"not authorized for instructor section")
    }
    next()
})