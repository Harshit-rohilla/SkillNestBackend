import { Router } from "express";
import {otpVerification,getUserDetails,loginUser,updateUserImage,registerUser,resetPassword,resetPasswordLink,updateProfile,deleteUser, sendFormData, verifySession,logout,resetAuthenticatedPassword} from "../controllers/user.controller.js"
import {authenticate} from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = Router()
userRouter.route("/send-otp").post(otpVerification)
userRouter.route("/signup").post(registerUser)
userRouter.route("/login").post(loginUser)
userRouter.route("/forgot-password-link").post(resetPasswordLink)
userRouter.route("/forgot-password").post(resetPassword)
userRouter.route("/update-profile").post(authenticate,updateProfile)
userRouter.route("/delete-user").delete(authenticate,deleteUser)
userRouter.route("/user-details").get(authenticate,getUserDetails)
userRouter.route("/update-user-image").put(upload.single("profilePicture"),authenticate,updateUserImage)
userRouter.route("/receive-message").post(sendFormData)
userRouter.route("/verify-session").get(authenticate,verifySession)
userRouter.route("/logout").post(logout)
userRouter.route("/reset-auth-password").post(authenticate,resetAuthenticatedPassword)


export default userRouter