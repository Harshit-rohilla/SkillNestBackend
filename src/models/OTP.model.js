import mongoose from "mongoose";
import { sendVerificationMail } from "../utilities/sendVerificationMail.js";

const OTPSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:5*60
    }
})

// OTPSchema.pre("save",async function(next){
//     await sendVerificationMail(this.email,"OTP",`your otp is ${this.otp} and will expire in 5 minutes`)
//     next()
// })

export const OTP=mongoose.model("OTP",OTPSchema)