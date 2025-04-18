import {asyncHandler} from "../utilities/asyncHandler.js"
import { User } from "../models/user.model.js"
import {apiError} from "../utilities/apiError.js"
import {apiResponse} from "../utilities/apiResponse.js"
import {OTP} from "../models/OTP.model.js"
import crypto from "crypto"
import { Profile } from "../models/Profile.model.js"
import {sendVerificationMail} from "../utilities/sendVerificationMail.js"
import { uploadOnCloudinary } from "../utilities/cloudinary.js"

// generate both the token
const generateBothTokens=async function(user){
    try {
        const accessToken=await user.generateAccessToken()
        // const refreshToken=await user.generateRefreshToken()
        return {accessToken}
    } catch (error) {
        // console.log("error while generating tokens", error?.message || error)
    }
}




// send otp controller
export const otpVerification=asyncHandler(async(req,res)=>{
    const {email}=req.body
    if(!email){
        throw new apiError(400,"please provide email")
    }
    const user=await User.findOne({email})
    if(user){
        throw new apiError(409,`user with ${email} already exists`)
    }
    
    const otp=Math.floor(Math.random()*9000+1000).toString()
    const otpEmail=await OTP.findOne({email})

    if(otpEmail){
        otpEmail.otp=otp
        otpEmail.createdAt=Date.now()
        await otpEmail.save({validateBeforeSave:false})
    }
    else{
            await OTP.create({
            email:email,
            otp:otp
        })
    }
    // console.log("otp send from backend",otp);
    const mailRes=await sendVerificationMail(email,"Your OTP will expire in 5 minutes",otp)
    if(!mailRes){
        throw new apiError(500,"unable to send otp")
    }
    res.status(200).json(new apiResponse(200,otp,"otp send successfully"))

})

// register user controller
export const registerUser=asyncHandler(async(req,res)=>{
    const {firstName,lastName,email,currentPassword,confirmPassword,contactNumber,accountType,otp}=req.body
    if(!firstName || !lastName || !email || !currentPassword || !confirmPassword || !contactNumber || !accountType || !otp){
        throw new apiError(400,"please provide all the required details")
    }
    if(currentPassword!==confirmPassword){
        throw new apiError(400,"password does not match")
    }
    const isUserExist=await User.findOne({email})
    if(isUserExist){
        throw new apiError(400,"user with the email already exist")
    }
    // console.log("otp received in backend",otp);
    
    const storedOtp=await OTP.findOne({email})
    if(storedOtp?.otp!==otp){
        throw new apiError(400,"invalid otp")
    }
    const data={firstName,lastName,email,password:confirmPassword,contactNumber,accountType,
        userImage:`https://api.dicebear.com/9.x/initials/svg?seed=${firstName[0]}${lastName[0]}`}
    const user=await User.create(data)
    await OTP.findByIdAndDelete(storedOtp._id)
    res.status(200).json(new apiResponse(200,user,"user registered successfully"))

})

// login user controller
export const loginUser=asyncHandler(async(req,res)=>{
    const {email,password,accountType}=req.body
    if(!email || !password || !accountType){
        throw new apiError(400,"please provide all the required details")
    }
    const user=await User.findOne({email})
    if(!user){
        throw new apiError(404,"user not found")
    }
    const passwordCheck=await user.isPasswordCorrect(password)
    if(!passwordCheck){
        throw new apiError(400,"incorrect password")
    }
    if(user.accountType!==accountType){
        throw new apiError(400,"incorrect account type")
    }
    const populatedUser=await User.findOne({email}).select("-_id -password -courses -passwordToken -passwordTokenExpiresIn").populate("profile")

    const {accessToken}=await generateBothTokens(user)
    const option={httpOnly:process.env.OPTION === "production",secure: process.env.OPTION === "production",
        sameSite: "none",}
    res
    .status(200)
    .cookie("accessToken",accessToken,option)
    .json(new apiResponse(200,populatedUser,"user loggedIn successfully"))


})

// reset password link controller
export const resetPasswordLink=asyncHandler(async(req,res)=>{
    const {email}=req.body
    const user=await User.findOne({email})
    if(!user){
        throw new apiError(400,"user not found")
    }
    const token=crypto.randomUUID()
    const link=`http://localhost:5173/create-password/${token}`
    const time=Date.now()+60*5*1000
    const response=await sendVerificationMail(email,"Reset password link",link)
    if(!response){
        throw new apiError(500,"error occurred while sending mail")
    }
    user.passwordToken=token
    user.passwordTokenExpiresIn=time
    await user.save({validateBeforeSave:false})
    res.status(200).json(new apiResponse(200,{},"reset-password link send successfully"))
})

// reset password controller
export const resetPassword=asyncHandler(async(req,res)=>{
    const {newPassword,confirmNewPassword,token}=req.body
    if(newPassword!==confirmNewPassword){
        throw new apiError(400,"password does not match")
    }
    const user=await User.findOne({passwordToken:token})
    if(!user){
        throw new apiError(400,"invalid reset-password token")
    }
    if(user.passwordTokenExpiresIn.getTime()<=Date.now()){
        throw new apiError(400,"reset-password token expired")
    }
    user.password=confirmNewPassword
    user.passwordToken=undefined
    user.passwordTokenExpiresIn=undefined
    await user.save({validateBeforeSave:false})
    res.status(200).json(new apiResponse(200,{},"password reset successfully"))
})

// update or create profile controller
export const updateProfile=asyncHandler(async(req,res)=>{
    const{gender,dob,about,firstName,lastName,contactNumber,}=req.body
    const user=await User.findById(req.authPayload._id)
    if(!user){
        throw new apiError(400,"user not found when updating profile")
    }
    // *updating user info
    if(firstName){user.firstName=firstName}
    if(lastName){user.lastName=lastName}
    if(contactNumber){user.contactNumber=contactNumber}
    // *updated profile info
    const updatedField={}
    if(gender){updatedField.gender=gender}
    if(dob){updatedField.dob=dob}
    if(about){updatedField.about=about}
    if(user.profile){
        
    const profile=await Profile.findByIdAndUpdate(user.profile._id,updatedField,{new:true})
    // *if profile exists update info
        if(!profile){
            throw new apiError(500,"error while updating profile")
        }
        } else{
            // *if profile does not exists create one
        if(gender||dob||about){
            const createdProfile=await Profile.create(updatedField)
            user.profile=createdProfile._id
            }
    }
    await user.save({validateBeforeSave:false})
    const populatedUser=await User.findById(user._id).select("-_id -password -courses -courseProgress -passwordToken -passwordTokenExpiresIn").populate("profile")
    res.status(200).json(new apiResponse(200,populatedUser,"profile updated successfully"))
})

// delete a user
// in this controller we also have to remove subsection, section, course, courseProgress,ratingAndReview, video uploaded on cloudinary
export const deleteUser=asyncHandler(async(req,res)=>{
    const userId=req.authPayload._id
    const user=await User.findById(userId)
    if(!user){
        throw new apiError(400,"incorrect id in payload")
    }
    const {accountType}=req.authPayload
    if(accountType==="student"){
        if(user.profile){
            await Profile.findByIdAndDelete(user.profile)
        }
        await User.findByIdAndDelete(userId)
        res.status(200).json(new apiResponse(200,{},"account deleted successfully"))
    }
    else if(accountType==="instructor"){
        if(user.profile){
            await Profile.findByIdAndDelete(user.profile)
        }
        const option={httpOnly:process.env.OPTION === "production",secure: process.env.OPTION === "production",
            sameSite: "none",}
        await User.findByIdAndDelete(userId)
        res.status(200).clearCookie("accessToken",option).json(new apiResponse(200,{},"account deleted successfully"))
    }
})

// get user details controller
export const getUserDetails=asyncHandler(async(req,res)=>{
    const userId=req.authPayload._id
    const userDetails= await User.findById(userId).select("-password -passwordTokenExpiresIn -passwordToken")
    if(!userDetails){
        throw new apiError(400,"invalid userId")
    }
    res.status(200).json(new apiResponse(200,userDetails,"user details send successfully"))
})

// update user image controller
export const updateUserImage=asyncHandler(async(req,res)=>{
    const imageLocalPath=req?.file?.path
    if(!imageLocalPath){
        throw new apiError(400,"please provide image")
    }
    const imageUrl=await uploadOnCloudinary(imageLocalPath)
    if(!imageUrl){
        throw new apiError(500,"failed to upload image on cloudinary")
    }
    const userId= req.authPayload._id
    const user=await User.findByIdAndUpdate(userId,
        {userImage:imageUrl},
        {new:true}
    ).select("-_id -password -courses -courseProgress -passwordToken -passwordTokenExpiresIn").populate("profile")
    if(!user){
        throw new apiError(400,"invalid userId")
    }
    res.status(200).json(new apiResponse(200,user,"image updated successfully"))
})

// send form data via email
export const sendFormData=asyncHandler(async(req,res)=>{
    console.log(req.body)
    const {firstName,lastName,email,message}=req.body
    if(!req.body){
        throw new apiError(400,"please provide data")
    }
    const response=await sendVerificationMail("harshitrohilla105@gmail.com",`${firstName+lastName} sent a message`,`${message} from ${email}`)
    if(!response){
        throw new apiError(500,"unable to send mail")
    }
    res.status(200).json(new apiResponse(200,{},"Message received"))
})

// verifying session and sending some data
export const verifySession=asyncHandler(async(req,res)=>{
    const accountType=req.authPayload.accountType
    res.status(200).json(new apiResponse(200,{accountType},"Authenticated"))
})

// logout controller
export const logout= asyncHandler((async(req,res)=>{
    const option={httpOnly:process.env.OPTION === "production",secure: process.env.OPTION === "production",
        sameSite: "none",}
    res.status(200).clearCookie("accessToken",option).json(new apiResponse(200,{},"user logged out successfully"))
}))

// rest password without token
export const resetAuthenticatedPassword=asyncHandler(async(req,res)=>{
    const {newPassword,confirmNewPassword}=req.body
    if(newPassword!==confirmNewPassword){
        throw new apiError(400,"password does not match")
    }
    const user=await User.findOne({email:req.authPayload.email})
    if(!user){
        throw new apiError(400,"invalid user")
    }
    user.password=confirmNewPassword
    await user.save({validateBeforeSave:false})
    res.status(200).json(new apiResponse(200,{},"password reset successfully"))
})